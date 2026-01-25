import { twilioClient, TwilioError } from "./client";
import twilio from "twilio";

export interface SMSMessage {
  sid: string;
  to: string;
  from: string;
  body: string;
  status: string;
  dateCreated: Date;
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS(
  to: string,
  from: string,
  body: string
): Promise<SMSMessage> {
  try {
    const message = await twilioClient.messages.create({
      to,
      from,
      body,
    });

    return {
      sid: message.sid,
      to: message.to,
      from: message.from || from,
      body: message.body || body,
      status: message.status || "queued",
      dateCreated: message.dateCreated || new Date(),
    };
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    throw new TwilioError(
      error.message || "Failed to send SMS",
      error.status,
      error.code
    );
  }
}

/**
 * Validate Twilio webhook signature
 */
export function validateWebhookSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error("Error validating webhook signature:", error);
    return false;
  }
}

/**
 * Parse incoming SMS webhook data
 */
export interface IncomingSMSWebhook {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
}

export function parseIncomingSMS(formData: FormData): IncomingSMSWebhook {
  return {
    MessageSid: formData.get("MessageSid")?.toString() || "",
    AccountSid: formData.get("AccountSid")?.toString() || "",
    From: formData.get("From")?.toString() || "",
    To: formData.get("To")?.toString() || "",
    Body: formData.get("Body")?.toString() || "",
    NumMedia: formData.get("NumMedia")?.toString() || "0",
  };
}














