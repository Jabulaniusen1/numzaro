# SocialBoost

A full-stack web application for buying social media services (followers, likes, comments) built with Next.js, TypeScript, TailwindCSS, Supabase, and Paystack.

## Features

- 🔐 Authentication with Supabase (Email + Google OAuth)
- 💳 Payment processing with Paystack
- 📊 Real-time order tracking
- 🔄 Refill and cancel orders
- 💰 User balance management
- 📱 Responsive design

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Configure your environment variables in `.env.local`

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn-ui
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Paystack
- **API Integration:** Exosupplier API

