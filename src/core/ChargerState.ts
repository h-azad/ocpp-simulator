export type ConnectorStatus =
    | 'Available'
    | 'Preparing'
    | 'Charging'
    | 'SuspendedEVSE'
    | 'SuspendedEV'
    | 'Finishing'
    | 'Reserved'
    | 'Unavailable'
    | 'Faulted';

export interface ConnectorState {
    connectorId: number;
    status: ConnectorStatus;
    currentTransactionId?: number; // Internal or protocol-specific ID
    meterValue: number; // in Wh
}

export interface ChargerState {
    chargerId: string;
    connectors: Record<number, ConnectorState>;
    isConnected: boolean;
    csmsUrl?: string;
    heartbeatInterval: number; // in seconds
    booted: boolean;
}

export const createInitialConnectorState = (id: number): ConnectorState => ({
    connectorId: id,
    status: 'Available',
    meterValue: 0,
});

export const createInitialState = (chargerId: string, numConnectors: number = 1): ChargerState => {
    const connectors: Record<number, ConnectorState> = {};
    for (let i = 1; i <= numConnectors; i++) {
        connectors[i] = createInitialConnectorState(i);
    }
    return {
        chargerId,
        connectors,
        isConnected: false,
        csmsUrl: undefined,
        heartbeatInterval: 60,
        booted: false,
    };
};
