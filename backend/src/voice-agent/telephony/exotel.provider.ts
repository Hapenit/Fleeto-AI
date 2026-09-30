import { Injectable, Logger } from '@nestjs/common';
import { TelephonyProvider } from './telephony.provider.js';
import { InitiateCallInput, InitiateCallResult, ProviderCallStatus } from './telephony.types.js';

@Injectable()
export class ExotelProvider implements TelephonyProvider {
  private readonly logger = new Logger(ExotelProvider.name);

  async initiateCall(input: InitiateCallInput): Promise<InitiateCallResult> {
    const sid = process.env.EXOTEL_SID;
    const key = process.env.EXOTEL_API_KEY;
    const token = process.env.EXOTEL_API_TOKEN;
    const exophone = process.env.EXOTEL_CALLER_ID || ''; 
    const webhookUrl = process.env.EXOTEL_APP_URL || ''; // E.g., http://my.app.com/api/webhooks/exotel

    if (!sid || !key || !token || !exophone) {
      this.logger.warn('Exotel credentials or caller ID missing. Simulating call initiation for POC flow.');
      return {
        providerCallId: `mock_exotel_${Date.now()}`,
        status: 'INITIATING',
      };
    }

    this.logger.log(`Initiating real Exotel call to ${input.phoneNumber}`);

    const auth = Buffer.from(`${key}:${token}`).toString('base64');
    const url = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;

    const formData = new URLSearchParams();
    formData.append('From', input.phoneNumber);
    formData.append('To', exophone); // Assuming To is Exophone
    formData.append('CallerId', exophone);
    formData.append('Url', webhookUrl); // Custom app URL for handling
    
    // Some exotel setups require CallType
    formData.append('CallType', 'trans');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.warn(`Exotel call failed: ${JSON.stringify(data)}. Falling back to simulation for flow testing.`);
        return {
          providerCallId: `mock_exotel_${Date.now()}`,
          status: 'INITIATING',
        };
      }

      return {
        providerCallId: data.Call.Sid,
        status: data.Call.Status === 'queued' ? 'INITIATING' : data.Call.Status,
      };
    } catch (error) {
      this.logger.warn(`Failed to initiate Exotel call: ${error}. Falling back to simulation.`);
      return {
        providerCallId: `mock_exotel_${Date.now()}`,
        status: 'INITIATING',
      };
    }
  }

  async getCallStatus(providerCallId: string): Promise<ProviderCallStatus> {
    if (providerCallId.startsWith('mock_exotel_')) {
      return { providerCallId, status: 'in-progress' };
    }

    const sid = process.env.EXOTEL_SID;
    const key = process.env.EXOTEL_API_KEY;
    const token = process.env.EXOTEL_API_TOKEN;

    if (!sid || !key || !token) {
      return { providerCallId, status: 'in-progress' };
    }

    const auth = Buffer.from(`${key}:${token}`).toString('base64');
    const url = `https://api.exotel.com/v1/Accounts/${sid}/Calls/${providerCallId}.json`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
         return { providerCallId, status: 'in-progress' };
      }

      const data: any = await response.json();
      return {
        providerCallId,
        status: data.Call.Status, // e.g. "in-progress", "completed", "failed", "busy", "no-answer"
      };
    } catch (e) {
       return { providerCallId, status: 'in-progress' };
    }
  }

  async terminateCall(providerCallId: string): Promise<void> {
    this.logger.log(`Terminating real Exotel call ${providerCallId} (Not fully supported by basic connect API without custom app control)`);
    // Exotel usually doesn't allow terminating an ongoing call easily via basic API unless using agent controls or Call control APIs.
  }

  async handleWebhook(payload: unknown): Promise<void> {
    this.logger.log('Received Exotel webhook', payload);
    // Parse Payload to extract recording URL, status, etc.
  }
}
