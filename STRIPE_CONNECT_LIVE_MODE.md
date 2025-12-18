# Moving Stripe Connect from Test Mode to Live Mode

## Prerequisites

Before switching to live mode, ensure:
- ✅ Your Stripe account is fully activated and verified
- ✅ You've completed Stripe's Connect onboarding in your Stripe Dashboard
- ✅ Your production domain is set up and working
- ✅ You understand that live mode processes real payments

## Step-by-Step Guide

### Step 1: Get Your Live Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle to Live Mode** (switch in the top right)
3. Navigate to **Developers** → **API keys**
4. Copy your **Live** keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...` (⚠️ Keep this secret!)

### Step 2: Update Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update the following variables for **Production**:

   ```
   STRIPE_SECRET_KEY=sk_live_... (your live secret key)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (your live publishable key)
   NEXT_PUBLIC_BASE_URL=https://your-domain.com (your production domain)
   ```

4. **Important**: 
   - Only update these for **Production** environment
   - Keep test keys for **Preview** and **Development** if you want to test locally
   - Or update all environments if you're ready to go fully live

### Step 3: Update Button Text (Remove "Test Mode")

Update the button component to remove "(Test Mode)" text:

**File**: `src/components/StripeOnboardingButton.tsx`

Change:
```typescript
{isLoading 
  ? 'Loading...' 
  : hasAccount 
    ? 'Update Payment Settings (Test Mode)' 
    : 'Set Up Payouts (Test Mode)'}
```

To:
```typescript
{isLoading 
  ? 'Loading...' 
  : hasAccount 
    ? 'Update Payment Settings' 
    : 'Set Up Payouts'}
```

### Step 4: Set Up Live Mode Webhook

1. In Stripe Dashboard (Live Mode), go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed` (if you use Checkout)
   - `account.updated` (for Connect account updates)
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_... (your live webhook secret)
   ```

### Step 5: Update Local Environment (Optional)

If you want to test locally with live mode (not recommended for production testing):

1. Update `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Warning**: Be very careful with live keys locally. Never commit them to git!

### Step 6: Deploy to Production

1. Commit your changes (button text update):
   ```bash
   git add src/components/StripeOnboardingButton.tsx
   git commit -m "Remove 'Test Mode' label from Stripe onboarding button"
   git push origin main
   ```

2. Vercel will automatically deploy with the new environment variables

### Step 7: Verify Live Mode Setup

1. **Test the onboarding flow**:
   - Log in as a barber on your production site
   - Go to `/account`
   - Click "Set Up Payouts" (should not say "Test Mode")
   - Complete the onboarding with real information
   - Verify the account is created in Stripe Dashboard (Live Mode)

2. **Check Stripe Dashboard**:
   - Go to **Connect** → **Accounts** (in Live Mode)
   - Verify the Express account was created
   - Check account status and requirements

3. **Test a real payment** (if ready):
   - Have a customer book an appointment
   - Process a real payment
   - Verify the payment appears in Stripe Dashboard
   - Verify the barber's account receives the payment

## Important Considerations

### Security
- ⚠️ **Never commit live keys to git**
- ⚠️ **Never share live secret keys**
- ⚠️ **Use environment variables only**
- ⚠️ **Enable 2FA on your Stripe account**

### Testing
- Test the onboarding flow thoroughly in production
- Verify barbers can complete onboarding successfully
- Test with a small real payment before going fully live
- Monitor Stripe Dashboard for any errors

### Compliance
- Ensure barbers provide accurate information during onboarding
- Stripe will verify their identity and business details
- Some accounts may require additional verification
- Monitor account statuses in Stripe Dashboard

### Support
- Barbers may need help during onboarding
- Have documentation ready for common issues
- Monitor Stripe Dashboard for account issues
- Be ready to help barbers complete verification requirements

## Rollback Plan

If you need to rollback to test mode:

1. Update Vercel environment variables back to test keys
2. Redeploy
3. Update button text back to include "(Test Mode)"
4. Barbers with live accounts will need to complete onboarding again in test mode (or you can keep their live accounts)

## Monitoring

After going live, monitor:

1. **Stripe Dashboard**:
   - Connect accounts status
   - Payment success rates
   - Account verification statuses

2. **Your Application**:
   - Onboarding completion rates
   - Error logs
   - User feedback

3. **Webhooks**:
   - Verify webhooks are being received
   - Check for any failed webhook deliveries

## Next Steps After Going Live

1. **Remove test accounts** (optional):
   - Clean up any test Stripe Connect accounts
   - Keep test keys for development/testing

2. **Set up monitoring**:
   - Add error tracking (Sentry, etc.)
   - Set up alerts for failed payments
   - Monitor onboarding completion rates

3. **Documentation**:
   - Update user documentation
   - Create help articles for barbers
   - Document common issues and solutions

4. **Support**:
   - Train support team on Stripe Connect
   - Create FAQ for common questions
   - Set up support channels

---

**Remember**: Once you switch to live mode, all payments and payouts will be real. Make sure you're ready and have tested thoroughly!

