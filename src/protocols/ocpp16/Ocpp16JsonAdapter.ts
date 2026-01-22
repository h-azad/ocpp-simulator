import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IProtocolAdapter } from '../../core/IProtocolAdapter';
import {
    BootNotificationRequest, BootNotificationResponse,
    HeartbeatRequest, HeartbeatResponse,
    AuthorizeRequest, AuthorizeResponse,
    StartTransactionRequest, StartTransactionResponse,
    StopTransactionRequest, StopTransactionResponse,
    StatusNotificationRequest, StatusNotificationResponse,
    MeterValuesRequest, MeterValuesResponse,
    FirmwareStatusNotificationRequest, FirmwareStatusNotificationResponse,
    DiagnosticsStatusNotificationRequest, DiagnosticsStatusNotificationResponse
} from './messages';

export class Ocpp16JsonAdapter implements IProtocolAdapter {
    version = 'ocpp1.6';
    private ws: WebSocket | null = null;
    private messageHandlers: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
    private externalMessageHandler: ((message: any, direction: 'in' | 'out') => void) | null = null;
    private requestHandler: ((action: string, payload: any) => Promise<any>) | null = null;

    async connect(csmsUrl: string, chargerId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Append chargerId to URL if required (OCPP standard usually implies /chargerId suffix)
            const url = csmsUrl.endsWith('/') ? `${csmsUrl}${chargerId}` : `${csmsUrl}/${chargerId}`;

            this.ws = new WebSocket(url, 'ocpp1.6');

            this.ws.on('open', () => {
                console.log('WebSocket connected');
                resolve();
            });

            this.ws.on('error', (err) => {
                console.error('WebSocket error:', err);
                reject(err);
            });

            this.ws.on('message', (data) => this.handleIncomingMessage(data));

            this.ws.on('close', () => {
                console.log('WebSocket closed');
            });
        });
    }

    async disconnect(): Promise<void> {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    onMessage(handler: (message: any, direction: 'in' | 'out') => void): void {
        this.externalMessageHandler = handler;
    }

    onRequestHandler(handler: (action: string, payload: any) => Promise<any>): void {
        this.requestHandler = handler;
    }

    // --- Core Operations ---

    async sendBootNotification(model: string, vendor: string): Promise<{ interval: number; status: string }> {
        const request: BootNotificationRequest = {
            chargePointVendor: vendor,
            chargePointModel: model,
        };
        const response = await this.callAction<BootNotificationResponse>('BootNotification', request);
        return {
            interval: response.interval,
            status: response.status,
        };
    }

    async sendHeartbeat(): Promise<Date> {
        const request: HeartbeatRequest = {};
        const response = await this.callAction<HeartbeatResponse>('Heartbeat', request);
        return new Date(response.currentTime);
    }

    async authorize(idTag: string): Promise<{ idTagInfo: { status: string } }> {
        const request: AuthorizeRequest = { idTag };
        const response = await this.callAction<AuthorizeResponse>('Authorize', request);
        return { idTagInfo: { status: response.idTagInfo.status } };
    }

    async startTransaction(connectorId: number, idTag: string, meterStart: number): Promise<{ transactionId: number; idTagInfo: { status: string } }> {
        const request: StartTransactionRequest = {
            connectorId,
            idTag,
            meterStart,
            timestamp: new Date().toISOString(),
        };
        const response = await this.callAction<StartTransactionResponse>('StartTransaction', request);
        return {
            transactionId: response.transactionId,
            idTagInfo: { status: response.idTagInfo.status },
        };
    }

    async stopTransaction(transactionId: number, meterStop: number, idTag?: string): Promise<{ idTagInfo: { status: string } }> {
        const request: StopTransactionRequest = {
            transactionId,
            meterStop,
            timestamp: new Date().toISOString(),
            ...(idTag && { idTag }),
        };
        // Note: StopTransaction response definition in OCPP 1.6 usually contains idTagInfo, but it's optional in some contexts or schemas.
        // Our schema defines it as optional.
        const response = await this.callAction<StopTransactionResponse>('StopTransaction', request);
        return {
            idTagInfo: { status: response.idTagInfo?.status ?? 'Accepted' }, // Default to accepted if missing
        };
    }

    async sendStatusNotification(connectorId: number, status: string, errorCode: string = 'NoError'): Promise<void> {
        const request: StatusNotificationRequest = {
            connectorId,
            status: status as any,
            errorCode: errorCode as any,
        };
        await this.callAction<StatusNotificationResponse>('StatusNotification', request);
    }

    async sendMeterValues(connectorId: number, transactionId: number, meterValue: number): Promise<void> {
        const request: MeterValuesRequest = {
            connectorId,
            transactionId,
            meterValue: [{
                timestamp: new Date().toISOString(),
                sampledValue: [{ value: meterValue.toString() }]
            }]
        };
        await this.callAction<MeterValuesResponse>('MeterValues', request);
    }

    async sendFirmwareStatusNotification(status: 'Downloaded' | 'DownloadFailed' | 'Downloading' | 'Idle' | 'InstallationFailed' | 'Installing' | 'Installed'): Promise<void> {
        const request: FirmwareStatusNotificationRequest = { status };
        await this.callAction<FirmwareStatusNotificationResponse>('FirmwareStatusNotification', request);
    }

    async sendDiagnosticsStatusNotification(status: 'Idle' | 'Uploaded' | 'UploadFailed' | 'Uploading'): Promise<void> {
        const request: DiagnosticsStatusNotificationRequest = { status };
        await this.callAction<DiagnosticsStatusNotificationResponse>('DiagnosticsStatusNotification', request);
    }

    // --- Internal Helper ---

    private async callAction<T>(action: string, payload: any): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }

        const messageId = uuidv4();
        const message = [2, messageId, action, payload];
        const encoded = JSON.stringify(message);

        return new Promise((resolve, reject) => {
            // Store handler
            this.messageHandlers.set(messageId, { resolve, reject });

            this.ws!.send(encoded, (err) => {
                if (err) {
                    this.messageHandlers.delete(messageId);
                    reject(err);
                } else {
                    // Log outgoing message
                    if (this.externalMessageHandler) {
                        this.externalMessageHandler(message, 'out');
                    }
                }
            });

            // Timeout safety (30s)
            setTimeout(() => {
                if (this.messageHandlers.has(messageId)) {
                    this.messageHandlers.delete(messageId);
                    reject(new Error(`Timeout waiting for response to ${action} [${messageId}]`));
                }
            }, 30000);
        });
    }

    private handleIncomingMessage(data: WebSocket.Data) {
        try {
            const text = data.toString();
            const message = JSON.parse(text);
            // Basic check: [TypeId, MessageId, ...]
            if (!Array.isArray(message)) return;

            const [typeId, messageId] = message;

            // LogALL incoming messages
            if (this.externalMessageHandler) {
                this.externalMessageHandler(message, 'in');
            }

            if (typeId === 3) {
                // CALLRESULT: [3, MessageId, Payload]
                const handler = this.messageHandlers.get(messageId);
                if (handler) {
                    handler.resolve(message[2]);
                    this.messageHandlers.delete(messageId);
                }
            } else if (typeId === 4) {
                // CALLERROR: [4, MessageId, ErrorCode, ErrorDescription, ErrorDetails]
                const handler = this.messageHandlers.get(messageId);
                if (handler) {
                    handler.reject(new Error(`OCPP Error: ${message[2]} - ${message[3]}`));
                    this.messageHandlers.delete(messageId);
                }
            } else if (typeId === 2) {
                // CALL: [2, MessageId, Action, Payload]
                const [_, msgId, action, payload] = message;
                if (this.requestHandler) {
                    this.requestHandler(action, payload)
                        .then(responsePayload => {
                            const response = [3, msgId, responsePayload];
                            this.ws?.send(JSON.stringify(response));
                            if (this.externalMessageHandler) this.externalMessageHandler(response, 'out');
                        })
                        .catch(err => {
                            const error = [4, msgId, 'InternalError', err.message, {}];
                            this.ws?.send(JSON.stringify(error));
                            if (this.externalMessageHandler) this.externalMessageHandler(error, 'out');
                        });
                } else {
                    // No handler -> NotSupported
                    const error = [4, msgId, 'NotSupported', 'No handler registered', {}];
                    this.ws?.send(JSON.stringify(error));
                }
            }
        } catch (err) {
            console.error('Failed to process message', err);
        }
    }
}
