# Supabase Database Setup

## Running Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Run the migration

Alternatively, if you have Supabase CLI installed:

```bash
supabase db push
```

## Schema Overview

- **users**: User profiles (extends auth.users)
- **services**: Available social media services
- **orders**: User orders with status tracking
- **refills**: Refill requests for orders
- **payments**: Payment transactions

## Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to only access their own data
- Allow public read access to services
- Prevent unauthorized access to other users' data

