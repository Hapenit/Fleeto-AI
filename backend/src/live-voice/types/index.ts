export interface LiveVoiceEvent {
  eventId: string;
  eventType: string;

  callId: string;
  requirementId: string;
  vendorId: string;

  timestamp: string;
  sequenceNumber: number;

  data: any;
}
