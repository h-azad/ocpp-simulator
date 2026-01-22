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

// ... other message types (simplified for now)
