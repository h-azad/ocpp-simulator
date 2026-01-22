export type BootNotificationRequest = {
    chargingStation: {
        model: string;
        vendorName: string;
    };
    reason: 'PowerUp' | 'Unknown' | 'Watchdog';
};

export type BootNotificationResponse = {
    currentTime: string;
    interval: number;
    status: 'Accepted' | 'Pending' | 'Rejected';
};

export type HeartbeatRequest = {};

export type HeartbeatResponse = {
    currentTime: string;
};

export type TransactionEventRequest = {
    eventType: 'Started' | 'Updated' | 'Ended';
    timestamp: string;
    triggerReason: 'Authorized' | 'CablePluggedIn' | 'ChargingStateChanged' | 'EVCommunicationLost' | 'EVConnect' | 'EVDeparted' | 'EVDetected' | 'MeterValuePeriodic' | 'MeterValueOnDemand' | 'RemoteStart' | 'RemoteStop' | 'Reset' | 'SignedDataReceived' | 'StopAuthorized' | 'TransactionStopped' | 'UnlockCommand';
    seqNo: number;
    transactionInfo: {
        transactionId: string;
    };
    idToken?: {
        idToken: string;
        type: 'ISO14443' | 'ISO15693' | 'Central';
    };
    evse?: {
        id: number;
        connectorId?: number;
    };
    meterValue?: Array<{
        timestamp: string;
        sampledValue: Array<{
            value: number;
            measurand?: string;
            unit?: string;
        }>;
    }>;
};

export type TransactionEventResponse = {
    idTokenInfo?: {
        status: 'Accepted' | 'Blocked' | 'Expired' | 'Invalid' | 'ConcurrentTx';
    };
};

export type AuthorizeRequest = {
    idToken: {
        idToken: string;
        type: 'ISO14443' | 'ISO15693' | 'Central';
    };
};

export type AuthorizeResponse = {
    idTokenInfo: {
        status: 'Accepted' | 'Blocked' | 'Expired' | 'Invalid' | 'ConcurrentTx';
    };
};

export type StatusNotificationRequest = {
    timestamp: string;
    connectorStatus: 'Available' | 'Occupied' | 'Reserved' | 'Unavailable' | 'Faulted';
    evseId: number;
    connectorId: number;
};

export type StatusNotificationResponse = {};
