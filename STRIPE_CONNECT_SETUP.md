# Stripe Connect Express Onboarding Setup & Testing Guide

## Prerequisites

### 1. Environment Variables

Make sure you have these environment variables set in your `.env.local` file (for local testing) and in Vercel (for production):

```bash
# Stripe Test Mode Keys (for testing)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Base URL (for redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # For local
# NEXT_PUBLIC_BASE_URL=https://your-domain.com  # For production

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Important**: Use **Test Mode** keys (`sk_test_...` and `pk_test_...`) for testing. You can get these from:
- Stripe Dashboard → Developers → API keys → **Test mode**

### 2. Database Setup

Verify that your `profiles` table has a `stripe_account_id` column:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'stripe_account_id';

-- If it doesn't exist, add it:
ALTER TABLE profiles
ADD COLUMN stripe_account_id TEXT;
```

## Testing Steps

### Step 1: Start Your Development Server

```bash
npm run dev
```

### Step 2: Log In as a Barber

1. Go to `http://localhost:3000/login`
2. Log in with a barber account (or create one and set role to "barber" in the account page)
3. Navigate to `/account`

### Step 3: Locate the Payment Setup Section

You should see a new "Payment Setup" section on the account page (only visible for barbers), with:
- A label: "Payment Setup"
- Description text
- A button: "Set Up Payouts (Test Mode)"

### Step 4: Click the Onboarding Button

1. Click "Set Up Payouts (Test Mode)"
2. The button should show "Loading..." briefly
3. You should be redirected to Stripe's onboarding page

### Step 5: Complete Stripe Onboarding (Test Mode)

On Stripe's onboarding page, you'll need to fill out:

1. **Business Type**: Select "Individual" or "Company" (for testing, "Individual" is easiest)
2. **Business Details**: 
   - Business name (can be test data)
   - Website (can be `http://localhost:3000` for testing)
   - Business description
3. **Personal Information**:
   - First name, last name
   - Email (can be your test email)
   - Date of birth
   - Phone number
4. **Address**:
   - Country
   - Address line 1
   - City
   - State/Province
   - Postal code
5. **Bank Account** (for payouts):
   - When you see bank account options, select **"Bank account (no OAuth)"** or **"Enter bank details directly"**
   - Use Stripe's test account numbers:
     - **Account number**: `000123456789`
     - **Routing number**: `110000000`
   - Or use any test data (Stripe will accept it in test mode)

### Step 6: Verify Return Flow

After completing onboarding:

1. You should be redirected to `/stripe/return`
2. You'll see a success message: "Onboarding complete! You will now be redirected back to Barbera."
3. After 3 seconds, you'll be automatically redirected to `/account`

### Step 7: Verify Database Update

Check that the `stripe_account_id` was saved:

```sql
-- Check your profile
SELECT id, username, stripe_account_id
FROM profiles
WHERE id = 'your-user-id';
```

You should see a `stripe_account_id` value like `acct_...`.

### Step 8: Test Re-Onboarding (Optional)

1. Click the button again
2. Since you already have a `stripe_account_id`, it should skip account creation
3. You'll be redirected to Stripe's dashboard/login page for that account
4. This allows you to update your account details later

## Troubleshooting

### Issue: "Unauthorized" Error

**Solution**: Make sure you're logged in. The API route requires authentication.

### Issue: "Stripe is not configured" Error

**Solution**: 
- Check that `STRIPE_SECRET_KEY` is set in `.env.local`
- Make sure you're using test mode keys (`sk_test_...`)
- Restart your dev server after adding environment variables

### Issue: "Database not configured" Error

**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart your dev server

### Issue: Button doesn't redirect / No URL returned

**Solution**:
- Check browser console for errors
- Check server logs for API errors
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly

### Issue: Redirect URL is incorrect

**Solution**:
- Make sure `NEXT_PUBLIC_BASE_URL` matches your actual domain
- For local testing: `http://localhost:3000`
- For production: `https://your-domain.com`

## What Happens Behind the Scenes

1. **First Time Click**:
   - API creates a new Stripe Express account
   - Saves `stripe_account_id` to your profile
   - Generates onboarding link
   - Redirects you to Stripe

2. **Subsequent Clicks**:
   - API uses existing `stripe_account_id`
   - Generates new onboarding link (for updates)
   - Redirects you to Stripe

## Next Steps After Testing

Once testing is complete:

1. **Switch to Live Mode** (when ready for production):
   - Update `STRIPE_SECRET_KEY` to live key (`sk_live_...`)
   - Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live key (`pk_live_...`)
   - Update `NEXT_PUBLIC_BASE_URL` to your production domain
   - Redeploy

2. **Enable Stripe Connect in Production**:
   - Make sure you've completed Stripe's Connect onboarding in your Stripe Dashboard
   - Verify your Stripe account is in good standing

3. **Test with Real Accounts**:
   - Have barbers complete onboarding with real information
   - Verify payouts work correctly

## Stripe Dashboard Verification

After onboarding, you can verify the account in Stripe Dashboard:

1. Go to Stripe Dashboard → **Connect** → **Accounts**
2. You should see the Express account you created
3. Click on it to see account details and status

## Important Notes

- **Test Mode**: All accounts created during testing are in Stripe's test mode
- **No Real Money**: Test mode accounts cannot receive real payments
- **Test Data**: You can use any test data during onboarding in test mode
- **Account Status**: After onboarding, the account status will be "Pending" until you complete all required information

