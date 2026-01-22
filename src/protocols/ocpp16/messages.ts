import { z } from 'zod';
import * as schemas from './schemas';

export type BootNotificationRequest = z.infer<typeof schemas.BootNotificationRequestSchema>;
export type BootNotificationResponse = z.infer<typeof schemas.BootNotificationResponseSchema>;

export type HeartbeatRequest = z.infer<typeof schemas.HeartbeatRequestSchema>;
export type HeartbeatResponse = z.infer<typeof schemas.HeartbeatResponseSchema>;

export type AuthorizeRequest = z.infer<typeof schemas.AuthorizeRequestSchema>;
export type AuthorizeResponse = z.infer<typeof schemas.AuthorizeResponseSchema>;

export type StartTransactionRequest = z.infer<typeof schemas.StartTransactionRequestSchema>;
export type StartTransactionResponse = z.infer<typeof schemas.StartTransactionResponseSchema>;

export type StopTransactionRequest = z.infer<typeof schemas.StopTransactionRequestSchema>;
export type StopTransactionResponse = z.infer<typeof schemas.StopTransactionResponseSchema>;

export type StatusNotificationRequest = z.infer<typeof schemas.StatusNotificationRequestSchema>;
export type StatusNotificationResponse = z.infer<typeof schemas.StatusNotificationResponseSchema>;

export type MeterValuesRequest = z.infer<typeof schemas.MeterValuesRequestSchema>;
export type MeterValuesResponse = z.infer<typeof schemas.MeterValuesResponseSchema>;

export type SetChargingProfileRequest = z.infer<typeof schemas.SetChargingProfileRequestSchema>;
export type SetChargingProfileResponse = z.infer<typeof schemas.SetChargingProfileResponseSchema>;

export type ClearChargingProfileRequest = z.infer<typeof schemas.ClearChargingProfileRequestSchema>;
export type ClearChargingProfileResponse = z.infer<typeof schemas.ClearChargingProfileResponseSchema>;

export type UpdateFirmwareRequest = z.infer<typeof schemas.UpdateFirmwareRequestSchema>;
export type UpdateFirmwareResponse = z.infer<typeof schemas.UpdateFirmwareResponseSchema>;

export type GetDiagnosticsRequest = z.infer<typeof schemas.GetDiagnosticsRequestSchema>;
export type GetDiagnosticsResponse = z.infer<typeof schemas.GetDiagnosticsResponseSchema>;

export type FirmwareStatusNotificationRequest = z.infer<typeof schemas.FirmwareStatusNotificationRequestSchema>;
export type FirmwareStatusNotificationResponse = z.infer<typeof schemas.FirmwareStatusNotificationResponseSchema>;

export type DiagnosticsStatusNotificationRequest = z.infer<typeof schemas.DiagnosticsStatusNotificationRequestSchema>;
export type DiagnosticsStatusNotificationResponse = z.infer<typeof schemas.DiagnosticsStatusNotificationResponseSchema>;

// Message Type constants
export enum MessageType {
    CALL = 2,
    CALLRESULT = 3,
    CALLERROR = 4,
}

// OCPP 1.6 Actions
export type ActionName =
    | 'BootNotification'
    | 'Heartbeat'
    | 'Authorize'
    | 'StartTransaction'
    | 'StopTransaction'
    | 'StatusNotification'
    | 'StatusNotification'
    | 'MeterValues'
    | 'SetChargingProfile'
    | 'SetChargingProfile'
    | 'ClearChargingProfile'
    | 'UpdateFirmware'
    | 'GetDiagnostics'
    | 'FirmwareStatusNotification'
    | 'DiagnosticsStatusNotification';
