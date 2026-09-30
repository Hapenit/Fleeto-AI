export interface InitiateCallInput {
  callId: string;
  phoneNumber: string;
  webhookUrl: string;
}

export interface InitiateCallResult {
  providerCallId: string;
  status: string;
}

export interface ProviderCallStatus {
  providerCallId: string;
  status: string;
  duration?: number;
}
