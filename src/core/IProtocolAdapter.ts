export interface IProtocolAdapter {
    version: string;

    // Connection Management
    connect(csmsUrl: string, chargerId: string): Promise<void>;
    disconnect(): Promise<void>;

    // Callback for outgoing messages or events that the Charger core needs to handle
    // e.g., logging, or state updates requested by the adapter
    onMessage(handler: (message: any, direction: 'in' | 'out') => void): void;

    // Core Operations
    sendBootNotification(model: string, vendor: string): Promise<{ interval: number; status: string }>;
    sendHeartbeat(): Promise<Date>;
    authorize(idTag: string): Promise<{ idTagInfo: { status: string } }>;
    startTransaction(connectorId: number, idTag: string, meterStart: number): Promise<{ transactionId: number; idTagInfo: { status: string } }>;
    stopTransaction(transactionId: number, meterStop: number, idTag: string): Promise<{ idTagInfo: { status: string } }>;
    sendStatusNotification(connectorId: number, status: string, errorCode?: string): Promise<void>;
    sendMeterValues(connectorId: number, transactionId: number, meterValue: number): Promise<void>;
}
