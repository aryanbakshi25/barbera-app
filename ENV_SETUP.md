# Quick Environment Setup

To fix the Stripe integration errors, you need to create a `.env.local` file in your project root with the following variables:

## Step 1: Create .env.local file

Create a file named `.env.local` in your project root directory (`/Users/aryanbakshi/Desktop/barbera-app/.env.local`) with this content:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Step 2: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Replace the placeholder values in `.env.local`

## Step 3: Get Your Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the **Project URL** and **anon public** key
5. Go to Settings > API > Service Role to get the **service_role** key
6. Replace the placeholder values in `.env.local`

## Step 4: Restart Your Development Server

After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

## Test Cards for Development

Once configured, you can test with these Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`

## Note

The `.env.local` file is already in your `.gitignore`, so it won't be committed to version control (which is good for security). 