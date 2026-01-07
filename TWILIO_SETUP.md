# Twilio Setup Guide

## Prerequisites

1. Create a Twilio account at [twilio.com](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from the [Twilio Console](https://www.twilio.com/console)

## Environment Variables

Add these to your `.env.local` file:

```bash
TELECOM_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
```

## Install Twilio SDK

```bash
npm install twilio
```

## Configure Webhooks

### SMS Webhook

1. In Twilio Console, go to Phone Numbers > Manage > Active Numbers
2. Click on a phone number you've purchased
3. Under "Messaging Configuration", set:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/sms`
   - **HTTP Method**: POST

### Call Webhook

1. In the same phone number configuration:
2. Under "Voice & Fax Configuration", set:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/calls`
   - **HTTP Method**: POST

### Webhook Security (Recommended)

Twilio webhook signatures are verified automatically when using the Twilio SDK. The webhook handlers will use your `TWILIO_AUTH_TOKEN` for verification.

For production, ensure your webhook URLs are HTTPS and properly secured.

## TwiML Call Forwarding

The system includes a TwiML endpoint at `/api/twilio/forward-twiml` that handles call forwarding. When you configure call forwarding for a business number, it will use this endpoint to forward calls to the specified number.

## Testing

1. Purchase a test number from Twilio
2. Configure webhooks to point to your development server (use ngrok for local testing)
3. Test SMS and call functionality

## Notes

- Twilio numbers typically support both SMS and Voice by default
- Pricing information may need to be fetched separately from Twilio's Pricing API
- Webhook payloads from Twilio are form-encoded, not JSON (handled automatically)

