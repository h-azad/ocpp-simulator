import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IProtocolAdapter } from '../../core/IProtocolAdapter';
import {
    BootNotificationRequest, BootNotificationResponse,
    HeartbeatRequest, HeartbeatResponse
} from './messages';

export class Ocpp201Adapter implements IProtocolAdapter {
    version = 'ocpp2.0.1';
    private ws: WebSocket | null = null;
    private messageHandlers: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
    private externalMessageHandler: ((message: any, direction: 'in' | 'out') => void) | null = null;

    async connect(csmsUrl: string, chargerId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = csmsUrl.endsWith('/') ? `${csmsUrl}${chargerId}` : `${csmsUrl}/${chargerId}`;
            this.ws = new WebSocket(url, 'ocpp2.0.1');

            this.ws.on('open', () => {
                console.log('WebSocket (2.0.1) connected');
                resolve();
            });

            this.ws.on('error', (err) => reject(err));
            this.ws.on('message', (data) => this.handleIncomingMessage(data));
            this.ws.on('close', () => console.log('WebSocket closed'));
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

    private async callAction<T>(action: string, payload: any): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('Not connected');
        const messageId = uuidv4();
        const message = [2, messageId, action, payload];

        return new Promise((resolve, reject) => {
            this.messageHandlers.set(messageId, { resolve, reject });
            this.ws!.send(JSON.stringify(message), (err) => {
                if (err) {
                    this.messageHandlers.delete(messageId);
                    reject(err);
                } else {
                    if (this.externalMessageHandler) this.externalMessageHandler(message, 'out');
                }
            });
            setTimeout(() => {
                if (this.messageHandlers.has(messageId)) {
                    this.messageHandlers.delete(messageId);
                    reject(new Error(`Timeout ${action}`));
                }
            }, 30000);
        });
    }

    private handleIncomingMessage(data: WebSocket.Data) {
        try {
            const message = JSON.parse(data.toString());
            if (!Array.isArray(message)) return;
            const [typeId, messageId] = message;

            if (this.externalMessageHandler) this.externalMessageHandler(message, 'in');

            if (typeId === 3) { // CALLRESULT
                const handler = this.messageHandlers.get(messageId);
                if (handler) {
                    handler.resolve(message[2]);
                    this.messageHandlers.delete(messageId);
                }
            } else if (typeId === 4) { // CALLERROR
                const handler = this.messageHandlers.get(messageId);
                if (handler) {
                    handler.reject(new Error(`Error: ${message[2]}`));
                    this.messageHandlers.delete(messageId);
                }
            }
        } catch (e) {
            console.error('Msg error', e);
        }
    }

    // --- Actions ---

    async sendBootNotification(model: string, vendor: string): Promise<{ interval: number; status: string }> {
        const request: BootNotificationRequest = {
            chargingStation: { model, vendorName: vendor },
            reason: 'PowerUp'
        };
        const response = await this.callAction<BootNotificationResponse>('BootNotification', request);
        return { interval: response.interval, status: response.status };
    }

    async sendHeartbeat(): Promise<Date> {
        const response = await this.callAction<HeartbeatResponse>('Heartbeat', {});
        return new Date(response.currentTime);
    }

    // Stubs for other methods to satisfy interface
    async authorize(idTag: string) { return { idTagInfo: { status: 'Accepted' } }; }
    async startTransaction() { return { transactionId: 0, idTagInfo: { status: 'Accepted' } }; }
    async stopTransaction() { return { idTagInfo: { status: 'Accepted' } }; }
    async sendStatusNotification() { }
    async sendMeterValues() { }
}
