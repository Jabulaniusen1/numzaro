/**
 * Telnyx provider implementation
 * Implements the TelecomProvider interface for Telnyx API
 */

import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import type {
  TelecomProvider,
  AvailableNumber,
  PurchasedNumber,
  NumberCapability,
} from "./provider";

const TELNYX_API_BASE_URL = "https://api.telnyx.com/v2";

class TelnyxError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "TelnyxError";
  }
}

export class TelnyxProvider implements TelecomProvider {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: TELNYX_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async searchNumbers(
    country: string,
    capabilities: NumberCapability,
    limit: number = 10
  ): Promise<AvailableNumber[]> {
    try {
      // Map capabilities to Telnyx features
      const features: string[] = [];
      if (capabilities.includes("sms")) features.push("sms");
      if (capabilities.includes("voice")) features.push("voice");

      const response = await this.client.get("/available_phone_numbers", {
        params: {
          filter: {
            country_code: country,
            features: features.length > 0 ? features : undefined,
          },
          page: {
            size: Math.min(limit, 100), // Telnyx max is 100
          },
        },
      });

      const numbers: AvailableNumber[] =
        response.data?.data?.map((item: any) => ({
          phoneNumber: item.phone_number || item.number,
          regionInformation: {
            regionName: item.region_information?.region_name || "",
            countryCode: item.region_information?.country_code || country,
          },
          capabilities: this.mapTelnyxFeaturesToCapabilities(
            item.features || []
          ),
          cost: {
            setupCost: parseFloat(item.cost?.upfront || "0") || 0,
            monthlyCost: parseFloat(item.cost?.monthly || "0") || 0,
          },
          providerId: item.id || item.phone_number || item.number,
        })) || [];

      return numbers;
    } catch (error: any) {
      if (error.response) {
        throw new TelnyxError(
          error.response.data?.errors?.[0]?.detail ||
            error.response.data?.errors?.[0]?.title ||
            "Telnyx API error",
          error.response.status,
          error.response.data
        );
      }
      throw new TelnyxError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async purchaseNumber(phoneNumberId: string): Promise<PurchasedNumber> {
    try {
      // In Telnyx, you purchase by phone number, not by ID
      // phoneNumberId is actually the phone number in E.164 format
      const response = await this.client.post("/phone_numbers", {
        phone_number: phoneNumberId,
      });

      const data = response.data?.data || response.data;
      return {
        id: data.id,
        phoneNumber: data.phone_number || data.number,
        country: data.country_code || "",
        capabilities: this.mapTelnyxFeaturesToCapabilities(data.features || []),
        providerId: data.id,
      };
    } catch (error: any) {
      if (error.response) {
        throw new TelnyxError(
          error.response.data?.errors?.[0]?.detail ||
            error.response.data?.errors?.[0]?.title ||
            "Failed to purchase number",
          error.response.status,
          error.response.data
        );
      }
      throw new TelnyxError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async releaseNumber(phoneNumberId: string): Promise<void> {
    try {
      await this.client.delete(`/phone_numbers/${phoneNumberId}`);
    } catch (error: any) {
      if (error.response) {
        throw new TelnyxError(
          error.response.data?.errors?.[0]?.detail ||
            error.response.data?.errors?.[0]?.title ||
            "Failed to release number",
          error.response.status,
          error.response.data
        );
      }
      throw new TelnyxError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async configureSMSWebhook(
    phoneNumberId: string,
    webhookUrl: string
  ): Promise<void> {
    try {
      await this.client.patch(`/phone_numbers/${phoneNumberId}`, {
        messaging_profile_id: null, // Remove from messaging profile if needed
        webhook_url: webhookUrl,
        webhook_api_version: "2",
      });

      // Also configure messaging profile webhook if using messaging profiles
      // For now, we'll set webhook_url directly on the number
    } catch (error: any) {
      if (error.response) {
        throw new TelnyxError(
          error.response.data?.errors?.[0]?.detail ||
            error.response.data?.errors?.[0]?.title ||
            "Failed to configure SMS webhook",
          error.response.status,
          error.response.data
        );
      }
      throw new TelnyxError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async configureCallWebhook(
    phoneNumberId: string,
    webhookUrl: string
  ): Promise<void> {
    try {
      // Configure call control application webhook
      await this.client.patch(`/phone_numbers/${phoneNumberId}`, {
        connection_id: null, // May need to set connection
        webhook_url: webhookUrl,
        webhook_api_version: "2",
      });
    } catch (error: any) {
      if (error.response) {
        throw new TelnyxError(
          error.response.data?.errors?.[0]?.detail ||
            error.response.data?.errors?.[0]?.title ||
            "Failed to configure call webhook",
          error.response.status,
          error.response.data
        );
      }
      throw new TelnyxError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async sendSMS(
    phoneNumberId: string,
    to: string,
    message: string
  ): Promise<string> {
    try {
      const response = await this.client.post("/messages", {
        from: phoneNumberId, // Source phone number
        to: to,
        text: message,
      });

      const data = response.data?.data || response.data;
      return data.id || data.message_id || "";
    } catch (error: any) {
      if (error.response) {
        throw new TelnyxError(
          error.response.data?.errors?.[0]?.detail ||
            error.response.data?.errors?.[0]?.title ||
            "Failed to send SMS",
          error.response.status,
          error.response.data
        );
      }
      throw new TelnyxError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  async configureCallForwarding(
    phoneNumberId: string,
    forwardingNumber: string
  ): Promise<void> {
    try {
      // Telnyx call forwarding is configured via connections/call control apps
      // This is a simplified implementation - actual setup may require
      // creating/updating a connection with forwarding settings
      await this.client.patch(`/phone_numbers/${phoneNumberId}`, {
        // Note: Actual forwarding setup may require connection configuration
        // This is a placeholder - real implementation needs connection setup
        connection_id: null, // Would need to create/use a connection with forwarding
      });

      // For now, we'll store forwarding_number in our DB and handle it in call control
      // This method marks the number as ready for forwarding configuration
    } catch (error: any) {
      if (error.response) {
        throw new TelnyxError(
          error.response.data?.errors?.[0]?.detail ||
            error.response.data?.errors?.[0]?.title ||
            "Failed to configure call forwarding",
          error.response.status,
          error.response.data
        );
      }
      throw new TelnyxError(
        `Network error: ${error.message || "Unknown error"}`
      );
    }
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // Telnyx uses HMAC-SHA256 for webhook signatures
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(payload);
      const calculatedSignature = hmac.digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  parseSMSWebhook(payload: any): {
    from: string;
    to: string;
    message: string;
    messageId: string;
    timestamp: Date;
  } {
    const data = payload.data || payload;
    return {
      from: data.payload?.from?.phone_number || data.from || "",
      to: data.payload?.to?.[0]?.phone_number || data.to || "",
      message: data.payload?.text || data.body || data.message || "",
      messageId: data.id || data.message_id || "",
      timestamp: data.occurred_at
        ? new Date(data.occurred_at)
        : new Date(data.timestamp || Date.now()),
    };
  }

  parseCallWebhook(payload: any): {
    callId: string;
    direction: "inbound" | "outbound";
    from?: string;
    to?: string;
    status: string;
    duration?: number;
    recordingUrl?: string;
    timestamp: Date;
  } {
    const data = payload.data || payload;
    const eventType = data.event_type || data.type || "";
    const callControlId = data.payload?.call_control_id || data.call_id || "";

    return {
      callId: callControlId,
      direction:
        data.payload?.direction || eventType.includes("inbound")
          ? "inbound"
          : "outbound",
      from: data.payload?.from || data.from,
      to: data.payload?.to || data.to,
      status: data.payload?.call_status || data.status || "unknown",
      duration: data.payload?.duration_seconds || data.duration,
      recordingUrl: data.payload?.recording_urls?.[0] || data.recording_url,
      timestamp: data.occurred_at
        ? new Date(data.occurred_at)
        : new Date(data.timestamp || Date.now()),
    };
  }

  private mapTelnyxFeaturesToCapabilities(
    features: string[]
  ): NumberCapability {
    const hasSMS = features.some((f) =>
      f.toLowerCase().includes("sms") || f.toLowerCase().includes("messaging")
    );
    const hasVoice = features.some((f) =>
      f.toLowerCase().includes("voice") || f.toLowerCase().includes("call")
    );

    if (hasSMS && hasVoice) return "sms+voice";
    if (hasSMS) return "sms";
    if (hasVoice) return "voice";
    return "sms"; // Default
  }
}

export { TelnyxError };

