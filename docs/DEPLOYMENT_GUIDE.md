# Salah Companion - Complete Production Deployment Guide

This guide walks you step-by-step through setting up Supabase, generating VAPID push keys, deploying the `send-prayer-reminders` Edge Function, configuring pg_cron + pg_net, deploying to Vercel, and installing the PWA on iPhone (Safari) and tablets.

---

## 1. Supabase Setup & Database Migration

### A. Create Project
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Click **New Project**, choose your region and a secure database password.
3. Once provisioned, navigate to **Project Settings > API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` secret key (keep this secret; only used in Edge Functions)

### B. Run Database Migration
1. Go to **SQL Editor** in the Supabase Dashboard.
2. Open or paste the contents of `supabase/migrations/20260929000000_salah_companion_schema.sql`.
3. Click **Run**. This will create:
   - `profiles` table with automatic user creation trigger
   - `push_subscriptions` table for multi-device push support
   - `notification_log` table with unique constraints preventing duplicate reminders
   - `prayer_logs` table for tracking on-time, late, missed, and qada prayers
   - `stories`, `story_categories`, `story_tags` for authentic Islamic stories
   - `duas`, `daily_content`, `user_bookmarks`, `user_story_reads` tables
   - Row Level Security (RLS) policies on all tables
   - Initial seed data (5 authentic stories, 10 duas, 10 ayahs/hadiths)

### C. Enable Extensions
In the Supabase Dashboard, go to **Database > Extensions** and ensure:
- `uuid-ossp` is enabled
- `pgcrypto` is enabled
- `pg_net` is enabled (for Edge Function HTTP invocations)
- `pg_cron` is enabled (for minute-by-minute scheduling)

---

## 2. Generating Web Push VAPID Keys

Web Push requires an ECDSA P-256 key pair to authenticate notifications sent from your server to Apple Push Notification Service (APNs) and Google Cloud Messaging.

Run the following command in your terminal:

```bash
npx web-push generate-vapid-keys
```

You will receive output formatted like:
```text
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa7_8yR...
Private Key:
your-vapid-private-key-secret...
=======================================
```

Save these values securely.

---

## 3. Deploying the Supabase Edge Function (`send-prayer-reminders`)

The Edge Function computes each subscriber's daily prayer times using the offline `adhan` library in their timezone, evaluates minute offsets and nudges, and sends push notifications.

### A. Install the Supabase CLI
```bash
npm install -g supabase
```

### B. Link your project & deploy
```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

# Set Edge Function Secrets
supabase secrets set \
  SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<YOUR_SERVICE_ROLE_KEY>" \
  VAPID_PUBLIC_KEY="<YOUR_VAPID_PUBLIC_KEY>" \
  VAPID_PRIVATE_KEY="<YOUR_VAPID_PRIVATE_KEY>" \
  VAPID_SUBJECT="mailto:support@yourdomain.com"

# Deploy the function
supabase functions deploy send-prayer-reminders --no-verify-jwt
```

---

## 4. Scheduling the pg_cron Job

In your Supabase Dashboard **SQL Editor**, schedule the job to invoke the Edge Function every minute:

```sql
SELECT cron.schedule(
  'send-prayer-reminders-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-prayer-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

To verify the cron job:
```sql
SELECT * FROM cron.job;
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;
```

---

## 5. Deploying the Frontend to Vercel

1. Push your repository to GitHub or GitLab.
2. Import the repository into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<YOUR_PROJECT_REF>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<YOUR_ANON_KEY>`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: `<YOUR_VAPID_PUBLIC_KEY>`
   - `VAPID_PRIVATE_KEY`: `<YOUR_VAPID_PRIVATE_KEY>`
   - `VAPID_SUBJECT`: `mailto:support@yourdomain.com`
   - `APP_URL`: `https://your-salah-companion.vercel.app`
4. Click **Deploy**. Vercel will build and assign an HTTPS URL with automatic SSL.

---

## 6. Installing on iPhone & iPad (iOS 16.4+)

> **Apple iOS Constraint:** Web Push notifications on iOS require the app to be installed to the Home Screen and running in `standalone` display mode.

1. Open Safari on your iPhone or iPad and navigate to your deployed HTTPS URL.
2. Tap the **Share** button in Safari's bottom toolbar (or top right on iPad).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name "Salah Companion" and tap **Add**.
5. Launch the app from the new Home Screen icon.
6. Tap the **Settings** tab (or the prompt banner) and tap **Enable Reminders**.
7. iOS will display the system permission prompt: *"Salah Companion Would Like to Send You Notifications"* — tap **Allow**.

---

## 7. Installing on Android & Tablet

1. Open Google Chrome on your Android phone or tablet.
2. Tap the **Install** button in the top banner (or open Chrome menu ⋮ and tap **Install app** / **Add to Home screen**).
3. Open the installed app and tap **Enable Reminders** in Settings to grant notification permissions.
