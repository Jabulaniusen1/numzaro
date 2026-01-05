# Admin Dashboard Setup Guide

## Overview

The admin dashboard allows you to:
- Monitor total revenue, costs, and profits
- View monthly statistics and trends
- Control profit markup percentage
- View recent orders with profit breakdown

## Setup Instructions

### 1. Run Database Migration

Run the profit tracking migration in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/003_add_profit_tracking.sql
```

This migration adds:
- `cost_rate` and `markup_percentage` fields to services table
- `customer_charge`, `api_cost`, and `profit` fields to orders table
- `admin_settings` table for storing global settings like markup percentage

### 2. Configure Admin Access

Add your admin email(s) to your `.env.local` file:

```bash
ADMIN_EMAILS=your-email@example.com,another-admin@example.com
```

**Important:** Separate multiple emails with commas (no spaces).

### 3. Access Admin Dashboard

1. Log in with an admin email address
2. Navigate to `/admin` in your browser
3. You'll see the admin dashboard with profit monitoring

### 4. Set Initial Markup

1. Go to Admin Dashboard
2. In the "Profit Markup Settings" section
3. Enter your desired markup percentage (e.g., 30 for 30%)
4. Click "Update Markup"

**Note:** The markup percentage will be applied to all services when they are synced from the API. Existing services will be updated immediately when you change the markup.

## How It Works

### Profit Calculation

- **API Cost (cost_rate):** The price you pay to the API provider (stored when services sync)
- **Customer Price (rate):** API cost × (1 + markup percentage)
- **Profit:** Customer price - API cost

**Example:**
- API cost: $0.90 per 1000
- Markup: 30%
- Customer price: $0.90 × 1.30 = $1.17 per 1000
- Profit: $1.17 - $0.90 = $0.27 per 1000

### Money Flow

When a customer places an order:
1. Customer pays the marked-up price (via Paystack)
2. Order is created with profit tracking
3. You pay the API cost from your balance
4. Your profit = Customer payment - API cost

## Admin Dashboard Features

### Statistics Overview
- **Total Revenue:** Sum of all customer payments
- **Total Costs:** Sum of all API costs
- **Total Profit:** Net profit (Revenue - Costs)
- **Total Orders:** Number of orders placed

### Monthly Comparison
- This month's revenue and profit
- Last month's revenue and profit
- Percentage change indicator

### Markup Control
- Set global markup percentage
- Applies to all services on next sync
- Updates existing services immediately

### Recent Orders
- View latest orders with profit breakdown
- See customer, service, quantity, revenue, and profit per order

## Troubleshooting

### Can't Access Admin Dashboard

1. Check that your email is in `ADMIN_EMAILS` environment variable
2. Make sure you're logged in with the correct email
3. Restart your development server after adding the environment variable

### Markup Not Updating Services

1. Markup changes apply immediately to existing services in the database
2. New services from API will use the new markup on next sync
3. Check browser console for any errors

### Profit Not Showing

1. Ensure the migration has been run
2. Profit is only tracked for orders created after the migration
3. Historical orders will have estimated profit based on 30% markup assumption

## Security Notes

- Admin access is controlled by email address (in `ADMIN_EMAILS`)
- For production, consider implementing a proper role-based system
- Admin routes are protected by authentication middleware
- API routes check admin status before returning data

