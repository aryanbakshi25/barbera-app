# Vercel Environment Variables Setup

Add these environment variables in your Vercel project settings:

## How to Add in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable below
4. Select **Production**, **Preview**, and **Development** for each (or just Production if you prefer)
5. Click **Save**

---

## Required Environment Variables:

### 1. Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL
```
- **Value**: Your Supabase project URL
- **Example**: `https://xxxxx.supabase.co`
- **Where to get**: Supabase Dashboard → Settings → API → Project URL
- **Same for**: Dev and Production (you can use the same Supabase project)

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
- **Value**: Your Supabase anon/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to get**: Supabase Dashboard → Settings → API → anon public key
- **Same for**: Dev and Production

```
SUPABASE_SERVICE_ROLE_KEY
```
- **Value**: Your Supabase service role key (⚠️ SECRET - server-side only)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to get**: Supabase Dashboard → Settings → API → service_role key
- **⚠️ Important**: Keep this secret! Never expose it in client code.
- **Same for**: Dev and Production

---

### 2. Stripe Configuration

#### For Production (when going live):

```
STRIPE_SECRET_KEY
```
- **Value**: Your Stripe **LIVE** secret key
- **Example**: `sk_live_51xxxxx...`
- **Where to get**: Stripe Dashboard → Developers → API keys → **Live mode** → Secret key
- **⚠️ Important**: Use `sk_live_...` for production (not `sk_test_...`)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
- **Value**: Your Stripe **LIVE** publishable key
- **Example**: `pk_live_51xxxxx...`
- **Where to get**: Stripe Dashboard → Developers → API keys → **Live mode** → Publishable key
- **⚠️ Important**: Use `pk_live_...` for production (not `pk_test_...`)

```
STRIPE_WEBHOOK_SECRET
```
- **Value**: Your Stripe **PRODUCTION** webhook signing secret
- **Example**: `whsec_xxxxx...`
- **Where to get**: 
  1. Go to Stripe Dashboard → Developers → Webhooks (in **Live mode**)
  2. Create/select endpoint: `https://your-domain.com/api/webhook`
  3. Copy the "Signing secret" (starts with `whsec_`)
- **⚠️ Important**: This is DIFFERENT from the CLI secret (`whsec_...` from `stripe listen`)

#### For Testing/Preview (optional):

If you want to test with test cards in preview deployments, you can add separate test keys:
- Use `sk_test_...` and `pk_test_...` 
- Use a test mode webhook secret (create separate webhook endpoint in Test mode)

---

## Complete List (Copy-Paste Friendly):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

---

## Step-by-Step Setup:

### Step 1: Get Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Get Stripe Production Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to Live mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Secret key** (`sk_live_...`) → `STRIPE_SECRET_KEY`
   - **Publishable key** (`pk_live_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Step 3: Get Stripe Webhook Secret
1. Still in Stripe Dashboard (Live mode)
2. Go to **Developers** → **Webhooks**
3. Click **Add endpoint** (or use existing)
4. Set endpoint URL: `https://your-vercel-domain.vercel.app/api/webhook`
   - Replace `your-vercel-domain` with your actual Vercel domain
5. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Click **Add endpoint**
7. **Copy the "Signing secret"** (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`

### Step 4: Add to Vercel
1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. Add each variable:
   - Variable name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (paste from Step 1)
   - Environment: Select **Production**, **Preview**, **Development**
   - Click **Save**
4. Repeat for all 6 variables

### Step 5: Redeploy
After adding all variables, Vercel will ask to redeploy. Click **Redeploy** to apply the new environment variables.

---

## Quick Checklist:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Dashboard (service_role)
- [ ] `STRIPE_SECRET_KEY` - From Stripe Dashboard (LIVE mode, `sk_live_...`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard (LIVE mode, `pk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe Dashboard webhook (LIVE mode, `whsec_...`)

---

## Important Notes:

1. **Test vs Live Keys**: 
   - Use `sk_test_...` and `pk_test_...` for local development
   - Use `sk_live_...` and `pk_live_...` for production

2. **Webhook Secrets**:
   - Local: Use secret from `stripe listen` CLI command
   - Production: Use secret from Stripe Dashboard webhook endpoint

3. **Service Role Key**: 
   - This is sensitive - never commit it to git
   - Only used server-side (webhooks)

4. **Public Keys**: 
   - Keys with `NEXT_PUBLIC_` prefix are safe to expose in client code
   - Keys WITHOUT `NEXT_PUBLIC_` are server-side only

---

## Testing After Deployment:

1. Visit your deployed site
2. Try booking an appointment
3. Use a test card: `4242 4242 4242 4242`
4. Verify appointment appears in dashboard
5. Check Stripe Dashboard → Payments to see the payment

Your app should work perfectly! 🚀

