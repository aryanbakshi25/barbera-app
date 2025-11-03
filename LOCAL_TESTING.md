# Local Testing Guide

This guide will help you set up and test your barber appointment booking app locally, including the payment flow.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Stripe account (free test account)
- A Supabase account

## Step 1: Install Dependencies

If you haven't already, install all project dependencies:

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_for_local_testing
```

### Getting Your Keys:

**Supabase:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY`

**Stripe:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy Secret key → `STRIPE_SECRET_KEY`

## Step 3: Install Stripe CLI (for Webhook Testing)

For local testing, you need Stripe CLI to forward webhooks to your local server:

### macOS:
```bash
brew install stripe/stripe-cli/stripe
```

### Linux/Windows:
Download from [Stripe CLI Releases](https://github.com/stripe/stripe-cli/releases)

### Login to Stripe CLI:
```bash
stripe login
```

This will open your browser to authenticate with Stripe.

## Step 4: Start the Development Server

In your terminal, run:

```bash
npm run dev
```

Your app should be running at `http://localhost:3000`

## Step 5: Set Up Stripe Webhooks (Local Testing)

Open a **new terminal window** (keep the dev server running) and run:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

This will:
- Forward Stripe webhook events to your local server
- Display a webhook signing secret (something like `whsec_...`)

**Important:** Copy this webhook secret and update your `.env.local` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...  # The secret from stripe listen
```

**Then restart your dev server** (stop with `Ctrl+C` and run `npm run dev` again).

## Step 6: Test the Payment Flow

1. **Open your app**: Navigate to `http://localhost:3000`
2. **Login/Signup**: Create an account or login
3. **Find a barber**: Go to Discover page or a barber profile
4. **Book an appointment**:
   - Select a service
   - Choose a date
   - Select a time slot
   - Click "Continue to Payment"

5. **Test Payment**: Use Stripe test card:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

6. **Click "Pay"** and watch:
   - The payment form should show "Processing..."
   - Then redirect to the confirmation screen
   - In the Stripe CLI terminal, you should see webhook events being received

## Step 7: Monitor for Issues

**Browser Console** (F12 → Console):
- Look for the payment status logs we added
- Check for any errors

**Terminal (Stripe CLI)**:
- Should show webhook events being received
- Look for `payment_intent.succeeded` events

**Terminal (Dev Server)**:
- Should show API requests to `/api/create-payment-intent`
- Should show webhook events at `/api/webhook`

## Troubleshooting

### Webhooks not working?
- Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhook`
- Check that `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the secret from Stripe CLI
- Restart your dev server after updating `.env.local`

### Payment goes back to time selection?
- Check browser console for errors
- Verify Stripe keys are correct
- Make sure webhook secret matches
- Check that `STRIPE_SECRET_KEY` starts with `sk_test_` (not `sk_live_`)

### Supabase errors?
- Verify your Supabase URL and keys are correct
- Check that your database tables exist (profiles, services, appointments, availability)

### Port already in use?
If port 3000 is busy:
```bash
# Use a different port
PORT=3001 npm run dev
```

## Test Cards

For testing different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

## Quick Test Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with all keys
- [ ] Dev server running (`npm run dev`)
- [ ] Stripe CLI forwarding webhooks (`stripe listen --forward-to localhost:3000/api/webhook`)
- [ ] Can login/signup
- [ ] Can view barber profiles
- [ ] Can select service, date, and time
- [ ] Payment form loads
- [ ] Test payment succeeds
- [ ] Appointment shows in dashboard

## Stopping Everything

- **Dev Server**: Press `Ctrl+C` in the terminal running `npm run dev`
- **Stripe CLI**: Press `Ctrl+C` in the terminal running `stripe listen`

That's it! You're ready to test your payment flow locally. 🚀

