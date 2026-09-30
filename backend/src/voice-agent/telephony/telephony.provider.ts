import { InitiateCallInput, InitiateCallResult, ProviderCallStatus } from './telephony.types.js';

export const TELEPHONY_PROVIDER_TOKEN = 'TelephonyProvider';

export interface TelephonyProvider {
  initiateCall(input: InitiateCallInput): Promise<InitiateCallResult>;
  getCallStatus(providerCallId: string): Promise<ProviderCallStatus>;
  terminateCall(providerCallId: string): Promise<void>;
  handleWebhook(payload: unknown): Promise<void>;
}
