# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for your barber appointment booking app.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your app deployed and running

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook secret (see webhook setup below)

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Stripe Dashboard Setup

### 1. Get Your API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** > **API keys**
3. Copy your **Publishable key** and **Secret key**
4. Add them to your environment variables

### 2. Set Up Webhooks

1. In your Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/webhook`
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the webhook signing secret and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### 3. Database Schema Updates

Make sure your `appointments` table has the following columns for payment tracking:

```sql
-- Add these columns to your appointments table if they don't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
```

## Testing the Integration

### Test Cards

Use these test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Flow

1. Start your development server: `npm run dev`
2. Navigate to a barber's profile page
3. Click "Book Appointment"
4. Select a service, date, and time
5. Complete the payment using a test card
6. Verify the appointment is created in your database

## Production Deployment

### 1. Update Environment Variables

For production, use your live Stripe keys:

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Update Webhook URL

Update your webhook endpoint URL to your production domain:
`https://your-production-domain.com/api/webhook`

### 3. Test in Production

1. Deploy your app
2. Test the payment flow with real cards
3. Monitor webhook events in your Stripe Dashboard

## Security Considerations

1. **Never expose your secret key** in client-side code
2. **Always verify webhook signatures** (already implemented)
3. **Use HTTPS** in production
4. **Validate payment amounts** on the server side
5. **Handle failed payments** gracefully

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your environment variables are correctly set
   - Ensure you're using the right keys for test/production

2. **Webhook not receiving events**
   - Verify the webhook URL is correct
   - Check that the webhook secret is properly set
   - Ensure your server is accessible from Stripe

3. **Payment succeeds but appointment not created**
   - Check your webhook logs
   - Verify your Supabase service role key has write permissions
   - Check the database schema matches the expected format

### Debug Mode

To enable debug logging, add this to your environment variables:

```bash
NODE_ENV=development
```

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For app-specific issues, check your server logs and Stripe Dashboard webhook events. 