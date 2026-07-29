# GeneHub Supabase Setup

## Notifications System Setup

Go to **Supabase Dashboard > SQL Editor** and run:

1. `migrations/001_notifications.sql` - Creates notification tables and views
2. `migrations/002_notifications_cron.sql` - Sets up scheduled jobs (after Step 3)

### Step 2: Set Up Resend

1. Create account at [resend.com](https://resend.com)
2. Verify your domain or use the test domain for development
3. Get your API key from Resend dashboard

### Step 3: Deploy Edge Functions

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend API key secret
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx

# Deploy all functions
supabase functions deploy check-low-nitrogen
supabase functions deploy check-low-stock
supabase functions deploy periodic-reminder
```

### Step 4: Set Up Cron Jobs

1. Edit `migrations/002_notifications_cron.sql`:
   - Replace `YOUR_PROJECT_REF` with your Supabase project reference
   - Replace `YOUR_ANON_KEY` with your Supabase anon key

2. Run the SQL in Supabase Dashboard > SQL Editor

### Step 5: Test

Test each function manually:

```bash
# Test low nitrogen check
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-low-nitrogen \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Test low stock check
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-low-stock \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Test periodic reminder
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/periodic-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Notification Schedule

| Function | Schedule | Description |
|----------|----------|-------------|
| `check-low-nitrogen` | Every 10 hours | Checks tanks below nitrogen threshold |
| `check-low-stock` | Every 10 hours | Checks medical inventory below reorder threshold |
| `periodic-reminder` | 1st of month, 9 AM UTC | Monthly summary reminder |

## Cooldown Periods

- **Low Nitrogen Alerts**: 5 days per tank
- **Low Stock Alerts**: 5 days per item
- **Periodic Reminders**: 30 days per user

## Monitoring

View cron job status:

```sql
-- All scheduled jobs
SELECT * FROM cron.job;

-- Recent job runs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Notification log
SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 50;
```
