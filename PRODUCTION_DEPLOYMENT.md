# Production Deployment Guide

Your payment flow is ready for production! This guide will walk you through deploying your barber appointment booking app.

## 🎉 What's Already Working

✅ Payment processing works immediately  
✅ Appointments are created right after payment (no waiting for webhooks)  
✅ Webhook serves as backup for edge cases  
✅ Duplicate prevention in place  

## Step 1: Prepare Your Code

Your code is production-ready! Just make sure:

```bash
# Commit your changes
git add .
git commit -m "Fix payment flow - create appointments immediately on payment success"
git push
```

## Step 2: Set Up Production Stripe Webhook

**Important:** The webhook secret from Stripe CLI (`whsec_...`) is ONLY for local development. For production, you need a different one from Stripe Dashboard.

### 2.1 Create Production Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Make sure you're in **Live mode** (toggle in top right)
3. Click **"Add endpoint"**
4. Set the endpoint URL to: `https://your-production-domain.com/api/webhook`
   - Replace `your-production-domain.com` with your actual domain (e.g., `barbera-app.vercel.app`)
5. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Click **"Add endpoint"**
7. **Copy the webhook signing secret** (starts with `whsec_` - this is DIFFERENT from the CLI one)

### 2.2 Test Mode Webhook (Optional)

If you want to test on a staging/test URL, create a separate webhook endpoint:
- Set endpoint URL to your test/staging domain
- Use **Test mode** in Stripe Dashboard
- Copy that webhook secret separately

## Step 3: Deploy Your App

### Option A: Deploy to Vercel (Recommended)

1. **Push to GitHub/GitLab** (if not already):
   ```bash
   git remote -v  # Check if you have a remote
   # If not, add one:
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add these variables:

   ```
   # Supabase (same for dev and production)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Stripe Production Keys
   STRIPE_SECRET_KEY=sk_live_...  # LIVE key from Stripe Dashboard
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # LIVE key
   STRIPE_WEBHOOK_SECRET=whsec_...  # From Step 2.1 (PRODUCTION webhook secret)
   ```

   **Important:** 
   - Use `sk_live_...` and `pk_live_...` for production (not test keys)
   - Use the webhook secret from Stripe Dashboard (not from CLI)

4. **Redeploy** after adding environment variables

### Option B: Deploy to Other Platforms

For other platforms (Netlify, Railway, etc.):
1. Add the same environment variables in their dashboard
2. Make sure `STRIPE_WEBHOOK_SECRET` uses the production webhook secret from Stripe Dashboard

## Step 4: Update Webhook URL

After your app is deployed:

1. Go back to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Find your production webhook endpoint
3. Make sure the URL is correct: `https://your-production-domain.com/api/webhook`
4. Test it by clicking "Send test webhook"

## Step 5: Test Production Payment Flow

### 5.1 Use Real Test Cards (in Live Mode)

Stripe provides test cards that work in live mode:
- **Success**: Use your Stripe Dashboard test card tool
- Go to Payments → Create test payment in Dashboard

Or use Stripe's test cards for live mode testing (different from test mode cards)

### 5.2 Verify Everything Works

1. Make a test booking on your production site
2. Check that:
   - Payment processes
   - Appointment appears in dashboard
   - Webhook events appear in Stripe Dashboard (optional, since appointments are created immediately)

## Environment Variables Summary

### Local Development (.env.local)
```bash
# Use TEST keys and CLI webhook secret
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From `stripe listen` CLI
```

### Production (Vercel/Platform Dashboard)
```bash
# Use LIVE keys and Dashboard webhook secret
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Dashboard webhook
```

## How It Works

Your payment flow now works in two ways:

1. **Primary (Immediate)**: When payment succeeds, appointment is created immediately in the browser
   - ✅ Fast user experience
   - ✅ Works even if webhook is slow
   - ✅ User sees appointment right away

2. **Backup (Webhook)**: If webhook fires later, it checks if appointment exists
   - ✅ Prevents duplicates
   - ✅ Handles edge cases
   - ✅ More reliable for production

## Troubleshooting

### Webhook Not Working in Production?

**Good news:** Your app works WITHOUT webhooks! The webhook is just a backup. Appointments are created immediately on payment success.

If you want webhooks to work:
1. Verify webhook URL is correct in Stripe Dashboard
2. Check that `STRIPE_WEBHOOK_SECRET` in production matches the Dashboard secret
3. Check Stripe Dashboard → Webhooks → Recent events for any errors

### Payments Work But Appointments Don't Show?

1. Check browser console for errors
2. Verify Supabase keys are correct in production
3. Check Supabase Dashboard → Logs for database errors
4. Verify user is logged in when making payment

### Can't See Webhook Events?

Webhooks might not fire immediately for instant payments. This is normal! Your app creates appointments immediately anyway, so webhooks are just for redundancy.

## Security Checklist

Before going fully live:

- [ ] Using `sk_live_...` keys (not test keys) in production
- [ ] Webhook secret from Stripe Dashboard (not CLI)
- [ ] All environment variables set in deployment platform
- [ ] HTTPS enabled (should be automatic on Vercel)
- [ ] Test payment flow works end-to-end
- [ ] Dashboard shows appointments correctly

## Next Steps

1. ✅ Code is ready
2. ⬜ Set up production webhook in Stripe Dashboard
3. ⬜ Deploy to Vercel/your platform
4. ⬜ Add environment variables
5. ⬜ Test payment flow
6. ⬜ Go live! 🚀

---

## Quick Reference

- **Local webhook secret**: From `stripe listen` command (only for local dev)
- **Production webhook secret**: From Stripe Dashboard → Webhooks → Your endpoint (use this in production)
- **Test keys**: `sk_test_...` and `pk_test_...` (for development)
- **Live keys**: `sk_live_...` and `pk_live_...` (for production)

Your app is production-ready! 🎉

