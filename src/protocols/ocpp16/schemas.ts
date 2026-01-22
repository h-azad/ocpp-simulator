import { z } from 'zod';

export const BootNotificationRequestSchema = z.object({
    chargePointVendor: z.string(),
    chargePointModel: z.string(),
    chargePointSerialNumber: z.string().optional(),
    chargeBoxSerialNumber: z.string().optional(),
    firmwareVersion: z.string().optional(),
    iccid: z.string().optional(),
    imsi: z.string().optional(),
    meterType: z.string().optional(),
    meterSerialNumber: z.string().optional(),
});

export const BootNotificationResponseSchema = z.object({
    status: z.enum(['Accepted', 'Pending', 'Rejected']),
    currentTime: z.string(),
    interval: z.number(), // in seconds
});

export const HeartbeatRequestSchema = z.object({});

export const HeartbeatResponseSchema = z.object({
    currentTime: z.string(),
});

export const AuthorizeRequestSchema = z.object({
    idTag: z.string().max(20),
});

export const AuthorizeResponseSchema = z.object({
    idTagInfo: z.object({
        status: z.enum(['Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx']),
        expiryDate: z.string().optional(),
        parentIdTag: z.string().optional(),
    }),
});

export const StartTransactionRequestSchema = z.object({
    connectorId: z.number().int().min(1),
    idTag: z.string().max(20),
    timestamp: z.string(),
    meterStart: z.number().int(),
    reservationId: z.number().int().optional(),
});

export const StartTransactionResponseSchema = z.object({
    transactionId: z.number().int(),
    idTagInfo: z.object({
        status: z.enum(['Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx']),
        expiryDate: z.string().optional(),
        parentIdTag: z.string().optional(),
    }),
});

export const StopTransactionRequestSchema = z.object({
    transactionId: z.number().int(),
    idTag: z.string().max(20).optional(),
    timestamp: z.string(),
    meterStop: z.number().int(),
    reason: z.enum(['EmergencyStop', 'EVDisconnected', 'HardReset', 'Local', 'Other', 'PowerLoss', 'Reboot', 'Remote', 'SoftReset', 'UnlockCommand', 'DeAuthorized']).optional(),
    transactionData: z.array(z.any()).optional(),
});

export const StopTransactionResponseSchema = z.object({
    idTagInfo: z.object({
        status: z.enum(['Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx']),
        expiryDate: z.string().optional(),
        parentIdTag: z.string().optional(),
    }).optional(),
});

export const StatusNotificationRequestSchema = z.object({
    connectorId: z.number().int().min(0),
    errorCode: z.enum(['ConnectorLockFailure', 'EVCommunicationError', 'GroundFailure', 'HighTemperature', 'InternalError', 'LocalListConflict', 'NoError', 'OtherError', 'OverCurrentFailure', 'PowerMeterFailure', 'PowerSwitchFailure', 'ReaderFailure', 'ResetFailure', 'UnderVoltage', 'OverVoltage', 'WeakSignal']),
    info: z.string().optional(),
    status: z.enum(['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted']),
    timestamp: z.string().optional(),
    vendorId: z.string().optional(),
    vendorErrorCode: z.string().optional(),
});

export const StatusNotificationResponseSchema = z.object({});

export const MeterValuesRequestSchema = z.object({
    connectorId: z.number().int().min(0),
    transactionId: z.number().int().optional(),
    meterValue: z.array(z.object({
        timestamp: z.string(),
        sampledValue: z.array(z.object({
            value: z.string(),
            context: z.string().optional(),
            format: z.string().optional(),
            measurand: z.string().optional(),
            phase: z.string().optional(),
            location: z.string().optional(),
            unit: z.string().optional(),
        })),
    })),
});

export const MeterValuesResponseSchema = z.object({});

// --- Smart Charging ---

export const ChargingSchedulePeriodSchema = z.object({
    startPeriod: z.number().int(),
    limit: z.number(),
    numberPhases: z.number().int().optional(),
});

export const ChargingScheduleSchema = z.object({
    duration: z.number().int().optional(),
    startSchedule: z.string().optional(),
    chargingRateUnit: z.enum(['A', 'W']),
    chargingSchedulePeriod: z.array(ChargingSchedulePeriodSchema),
    minChargingRate: z.number().optional(),
});

export const ChargingProfileSchema = z.object({
    chargingProfileId: z.number().int(),
    transactionId: z.number().int().optional(),
    stackLevel: z.number().int().min(0),
    chargingProfilePurpose: z.enum(['ChargePointMaxProfile', 'TxDefaultProfile', 'TxProfile']),
    chargingProfileKind: z.enum(['Absolute', 'Recurring', 'Relative']),
    recurrencyKind: z.enum(['Daily', 'Weekly']).optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    chargingSchedule: ChargingScheduleSchema,
});

export const SetChargingProfileRequestSchema = z.object({
    connectorId: z.number().int().min(0),
    csChargingProfiles: ChargingProfileSchema,
});

export const SetChargingProfileResponseSchema = z.object({
    status: z.enum(['Accepted', 'Rejected', 'NotSupported']),
});

export const ClearChargingProfileRequestSchema = z.object({
    id: z.number().int().optional(),
    connectorId: z.number().int().optional(),
    chargingProfilePurpose: z.enum(['ChargePointMaxProfile', 'TxDefaultProfile', 'TxProfile']).optional(),
    stackLevel: z.number().int().optional(),
});

export const ClearChargingProfileResponseSchema = z.object({
    status: z.enum(['Accepted', 'Unknown']),
});

// --- Firmware & Diagnostics ---

export const UpdateFirmwareRequestSchema = z.object({
    location: z.string(),
    retries: z.number().int().optional(),
    retrieveDate: z.string(),
    retryInterval: z.number().int().optional(),
});
export const UpdateFirmwareResponseSchema = z.object({});

export const GetDiagnosticsRequestSchema = z.object({
    location: z.string(),
    retries: z.number().int().optional(),
    retryInterval: z.number().int().optional(),
    startTime: z.string().optional(),
    stopTime: z.string().optional(),
});
export const GetDiagnosticsResponseSchema = z.object({
    fileName: z.string().optional(),
});

export const FirmwareStatusNotificationRequestSchema = z.object({
    status: z.enum(['Downloaded', 'DownloadFailed', 'Downloading', 'Idle', 'InstallationFailed', 'Installing', 'Installed']),
});
export const FirmwareStatusNotificationResponseSchema = z.object({});

export const DiagnosticsStatusNotificationRequestSchema = z.object({
    status: z.enum(['Idle', 'Uploaded', 'UploadFailed', 'Uploading']),
});
export const DiagnosticsStatusNotificationResponseSchema = z.object({});
