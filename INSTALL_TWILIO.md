# Installing Twilio SDK

The Twilio SDK needs to be installed for the VirtualNumberHub module to work with Twilio.

## Installation

Run this command in your project root:

```bash
npm install twilio
```

Or if you're using pnpm:

```bash
pnpm add twilio
```

Or if you're using yarn:

```bash
yarn add twilio
```

## After Installation

1. Make sure you have the required environment variables set:
   ```bash
   TELECOM_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

## Error Message

If you see an error like "Twilio SDK is not installed", it means the `twilio` package needs to be installed using one of the commands above.



