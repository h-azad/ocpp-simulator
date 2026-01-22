import { Charger } from '../core/Charger';
import { Ocpp16JsonAdapter } from '../protocols/ocpp16/Ocpp16JsonAdapter';
import { Ocpp201Adapter } from '../protocols/ocpp201/Ocpp201Adapter';

export class SimulatorManager {
    private chargers: Map<string, Charger> = new Map();
    private listeners: ((event: any) => void)[] = [];

    constructor() { }

    createCharger(chargerId: string, csmsUrl: string, version: string = 'ocpp1.6'): Charger {
        if (this.chargers.has(chargerId)) {
            throw new Error(`Charger ${chargerId} already exists`);
        }

        let adapter;
        if (version === 'ocpp1.6') {
            adapter = new Ocpp16JsonAdapter();
        } else if (version === 'ocpp2.0.1') {
            adapter = new Ocpp201Adapter();
        } else {
            throw new Error(`Unsupported version: ${version}`);
        }

        const charger = new Charger(chargerId, adapter);

        // Hook into adapter logs/messages to broadcast to UI
        adapter.onMessage((msg, direction) => {
            this.broadcast({ type: 'log', chargerId, message: msg, direction });
        });

        // Hook into state changes
        charger.setOnStateChange((state) => {
            this.broadcast({ type: 'charger_updated', chargerId, status: state.isConnected ? 'Connected' : 'Disconnected' });
        });

        this.chargers.set(chargerId, charger);
        this.broadcast({ type: 'charger_created', chargerId, version, csmsUrl });
        return charger;
    }

    getCharger(chargerId: string): Charger | undefined {
        return this.chargers.get(chargerId);
    }

    getAllChargers() {
        return Array.from(this.chargers.values()).map(c => ({
            chargerId: c.state.chargerId,
            status: c.state.isConnected ? 'Connected' : 'Disconnected',
            version: c.version,
        }));
    }

    // UI Event Subscription
    subscribe(listener: (event: any) => void) {
        this.listeners.push(listener);
    }

    unsubscribe(listener: (event: any) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private broadcast(event: any) {
        this.listeners.forEach(l => l(event));
    }
}

export const simulatorManager = new SimulatorManager();
