# SocialBoost Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Paystack account
- Therealowlet API key

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `REALOWLET_API_KEY` - Your Therealowlet API key
- `PAYSTACK_SECRET_KEY` - Your Paystack secret key
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Your Paystack public key
- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g., http://localhost:3000)
- `ADMIN_EMAILS` - Comma-separated list of admin email addresses (e.g., admin@example.com,owner@example.com)
- `EXCHANGE_RATE_API_KEY` - Your ExchangeRate-API.com API key (for currency conversion)
- `CRON_SECRET_TOKEN` - Secret token for securing cron endpoints (optional but recommended)

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration

### 4. Configure Supabase Authentication

1. In Supabase dashboard, go to Authentication > Providers
2. Enable Email provider
3. Enable Google OAuth provider and configure it with your Google OAuth credentials
4. Set the redirect URL to: `http://localhost:3000/auth/callback` (or your production URL)

### 5. Configure Paystack

1. In your Paystack dashboard, set your webhook URL:
   - Development: `http://localhost:3000/api/webhooks/paystack`
   - Production: `https://yourdomain.com/api/webhooks/paystack`
2. Payment callback/redirect is handled automatically per transaction by:
   - `http://localhost:3000/api/payments/verify` (development)
   - `https://yourdomain.com/api/payments/verify` (production)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
social-booster/
├── app/
│   ├── api/              # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── pricing/          # Pricing page
│   └── page.tsx           # Landing page
├── components/
│   ├── dashboard/         # Dashboard components
│   └── ui/                # shadcn-ui components
├── lib/
│   ├── api/              # API integration layer
│   ├── hooks/             # React hooks
│   ├── paystack/          # Paystack client
│   └── supabase/          # Supabase clients
└── supabase/
    └── migrations/        # Database migrations
```

## Features Implemented

✅ User authentication (Email + Google OAuth)
✅ Service browsing and filtering
✅ Order creation with payment integration
✅ Real-time order status polling (30s interval)
✅ Refill functionality
✅ Cancel order functionality
✅ User balance display
✅ Order history
✅ Responsive design with TailwindCSS
✅ Toast notifications

## Testing

1. Create an account or sign in
2. Browse services on the dashboard
3. Create an order (use Paystack test mode)
4. View order status updates
5. Test refill/cancel functionality

## Production Deployment

1. Set up environment variables on your hosting platform
2. Run database migrations on Supabase
3. Update OAuth redirect URLs
4. Update Paystack callback URLs
5. Build and deploy:

```bash
npm run build
npm start
```

## Support

For issues or questions, refer to the documentation or contact support.
