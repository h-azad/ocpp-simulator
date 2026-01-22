import { ChargerState, createInitialState } from './ChargerState';
import { IProtocolAdapter } from './IProtocolAdapter';

export class Charger {
    public state: ChargerState;
    private adapter: IProtocolAdapter;
    private onStateChange: ((state: ChargerState) => void) | null = null;


    constructor(chargerId: string, adapter: IProtocolAdapter) {
        this.adapter = adapter;
        this.state = createInitialState(chargerId);

        // Listen to adapter events if necessary
        this.adapter.onMessage((msg) => {
            console.log(`[Charger ${chargerId}] Adapter message:`, msg);
        });

        // Register Request Handler for incoming Remote Actions
        this.adapter.onRequestHandler(async (action, payload) => {
            console.log(`[Charger ${chargerId}] Handling Remote Action: ${action}`, payload);
            try {
                switch (action) {
                    case 'RemoteStartTransaction':
                        // Async trigger start charging (Simulate user plug-in + auth)
                        await this.handleRemoteStart(payload.idTag || payload.idToken?.idToken, payload.connectorId || 1);
                        return { status: 'Accepted' };
                    case 'RemoteStopTransaction':
                        await this.handleRemoteStop(payload.transactionId);
                        return { status: 'Accepted' };
                    case 'Reset':
                        await this.handleReset(payload.type);
                        return { status: 'Accepted' };
                    case 'UnlockConnector':
                        return { status: 'Unlocked' };
                    default:
                        throw new Error('NotImplemented');
                }
            } catch (err: any) {
                console.error(`[Charger ${chargerId}] Error handling ${action}:`, err);
                return { status: 'Rejected' };
            }
        });
    }

    get version(): string {
        return this.adapter.version;
    }

    setOnStateChange(listener: (state: ChargerState) => void) {
        this.onStateChange = listener;
    }

    private notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.state);
        }
    }

    async connect(csmsUrl?: string) {
        const urlToUse = csmsUrl || this.state.csmsUrl;
        if (!urlToUse) {
            throw new Error('CSMS URL is required for connection');
        }

        console.log(`[Charger ${this.state.chargerId}] Connecting to ${urlToUse}...`);
        await this.adapter.connect(urlToUse, this.state.chargerId);

        this.state.isConnected = true;
        this.state.csmsUrl = urlToUse;
        this.notifyStateChange();
    }

    async disconnect() {
        await this.adapter.disconnect();
        this.state.isConnected = false;
        this.notifyStateChange();
    }

    async boot(vendor: string = 'SimVendor', model: string = 'SimModel') {
        if (!this.state.isConnected) throw new Error('Not connected');
        const response = await this.adapter.sendBootNotification(model, vendor);
        this.state.heartbeatInterval = response.interval;
        this.state.booted = response.status === 'Accepted';
        console.log(`[Charger ${this.state.chargerId}] Booted: ${response.status}`);
        this.notifyStateChange();
        return response;
    }

    async heartbeat() {
        if (!this.state.isConnected) throw new Error('Not connected');
        await this.adapter.sendHeartbeat();
    }

    // Wrapper actions that update state + call adapter
    async startCharging(connectorId: number, idTag: string) {
        const connector = this.state.connectors[connectorId];
        if (!connector) throw new Error(`Connector ${connectorId} not found`);

        if (connector.status !== 'Available') {
            console.warn(`Connector ${connectorId} is not Available (current: ${connector.status})`);
            // Force proceed for simulation
        }

        // 1. Authorize
        const auth = await this.adapter.authorize(idTag);
        if (auth.idTagInfo.status !== 'Accepted') {
            throw new Error(`Authorization failed: ${auth.idTagInfo.status}`);
        }

        // 2. Status -> Preparing
        connector.status = 'Preparing';
        await this.adapter.sendStatusNotification(connectorId, 'Preparing');

        // 3. Start Transaction
        const response = await this.adapter.startTransaction(connectorId, idTag, connector.meterValue);

        if (response.idTagInfo.status === 'Accepted') {
            connector.currentTransactionId = response.transactionId;
            connector.status = 'Charging';
            await this.adapter.sendStatusNotification(connectorId, 'Charging');
        } else {
            connector.status = 'Available';
            await this.adapter.sendStatusNotification(connectorId, 'Available');
            throw new Error(`StartTransaction rejected: ${response.idTagInfo.status}`);
        }
    }

    async stopCharging(connectorId: number, idTag: string) {
        const connector = this.state.connectors[connectorId];
        if (!connector) throw new Error(`Connector ${connectorId} not found`);
        if (connector.status !== 'Charging' || !connector.currentTransactionId) {
            throw new Error('Connector is not charging');
        }

        const transactionId = connector.currentTransactionId;

        // 1. Stop Transaction
        await this.adapter.stopTransaction(transactionId, connector.meterValue, idTag);

        // 2. Status -> Available
        connector.status = 'Available';
        connector.currentTransactionId = undefined;
        await this.adapter.sendStatusNotification(connectorId, 'Available');
    }

    // --- Remote Action Handlers ---

    private async handleRemoteStart(idTag: string, connectorId: number) {
        console.log('Remote Start Requested');
        // Simulate slight delay then start
        setTimeout(() => {
            this.startCharging(connectorId, idTag).catch(e => console.error('Remote Start Failed', e));
        }, 1000);
    }

    private async handleRemoteStop(transactionId: number | string) {
        console.log('Remote Stop Requested for tx', transactionId);
        // Find connector with this tx
        // Note: OCPP 2.0.1 uses string transaction IDs, 1.6 uses numbers.
        // We need weak comparison or normalization.
        const connectorIdString = Object.keys(this.state.connectors).find(cid => {
            return this.state.connectors[Number(cid)].currentTransactionId == transactionId;
        });

        if (connectorIdString) {
            setTimeout(() => {
                this.stopCharging(Number(connectorIdString), 'RemoteStop').catch(e => console.error('Remote Stop Failed', e));
            }, 1000);
        } else {
            console.warn('Transaction not found for RemoteStop');
        }
    }

    private async handleReset(type: 'Soft' | 'Hard') {
        console.log(`Received ${type} Reset.`);
        // Simulate reboot
        setTimeout(async () => {
            await this.disconnect();
            this.state.booted = false;
            this.notifyStateChange();
            setTimeout(async () => {
                await this.connect();
                await this.boot();
            }, 2000);
        }, 1000);
    }
}
