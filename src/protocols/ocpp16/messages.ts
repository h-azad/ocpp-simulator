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
    | 'MeterValues';
