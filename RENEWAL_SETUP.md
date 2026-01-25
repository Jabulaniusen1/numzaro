# Automatic Renewal System Setup

This document explains how to set up the automatic renewal system for phone numbers.

## Features

1. **5-Day Renewal Reminder**: Users receive email and in-app notifications 5 days before their number expires
2. **Automatic Renewal**: Numbers are automatically renewed when they expire (if user has sufficient balance)
3. **3-Day Grace Period**: After expiration, users have 3 days to add funds before the number is restricted
4. **Number Restriction**: After the grace period, numbers are restricted and users are notified via email

## Environment Variables

Add these to your `.env.local` file:

```env
# Google SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Cron Job Security (optional but recommended)
CRON_SECRET=your-random-secret-key-here
```

## Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "App passwords" (https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use this password as `SMTP_PASSWORD` (not your regular Gmail password)

## Setting Up the Cron Job

### Option 1: Vercel Cron Jobs (Recommended)

If you're using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/renewals",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours. You can adjust the schedule:
- `0 */6 * * *` - Every 6 hours
- `0 * * * *` - Every hour
- `0 0 * * *` - Once daily at midnight

### Option 2: External Cron Service

Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier available)
- **Uptime Robot** (free tier available)

Set up a cron job to call:
```
GET https://your-domain.com/api/cron/renewals
Authorization: Bearer YOUR_CRON_SECRET
```

### Option 3: Manual Testing

You can manually trigger the cron job by visiting:
```
https://your-domain.com/api/cron/renewals
```

Or using curl:
```bash
curl -X GET "https://your-domain.com/api/cron/renewals" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Database Migration

Run the migration to add the required columns:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/011_add_renewal_tracking.sql
```

## How It Works

1. **5 Days Before Expiry**: 
   - System checks for numbers expiring in 5 days
   - Sends email reminder
   - Creates in-app notification
   - Marks reminder as sent

2. **On Expiry Date**:
   - System checks if user has sufficient balance
   - If yes: Automatically renews the number (extends by 30 days)
   - If no: Number enters grace period

3. **Grace Period (3 days after expiry)**:
   - Number remains active but user is notified
   - User can add funds and manually renew
   - System continues to check for sufficient balance

4. **After Grace Period**:
   - Number status changes to "restricted"
   - User receives email notification
   - Number cannot receive messages until renewed

## Email Templates

The system uses HTML email templates located in `lib/email/templates.ts`:
- Renewal reminder (5 days before)
- Renewal success (after auto-renewal)
- Number restricted (after grace period)

## Monitoring

The cron job returns a JSON response with statistics:
```json
{
  "message": "Renewal cron job completed",
  "processed": 10,
  "remindersSent": 2,
  "renewalsProcessed": 3,
  "restrictionsApplied": 1
}
```

## Troubleshooting

### Emails not sending
- Verify SMTP credentials are correct
- Check that Gmail App Password is used (not regular password)
- Ensure 2-Step Verification is enabled
- Check server logs for SMTP errors

### Renewals not processing
- Verify cron job is running
- Check database for number statuses
- Review server logs for errors
- Ensure users have sufficient balance

### Numbers not being restricted
- Verify grace period logic (3 days)
- Check number status in database
- Review cron job execution logs

## Security

- Always use `CRON_SECRET` to protect your cron endpoint
- Never expose SMTP credentials
- Use environment variables for all sensitive data
- Regularly rotate your cron secret



