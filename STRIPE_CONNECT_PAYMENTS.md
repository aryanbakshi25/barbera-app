# Stripe Connect Payments Implementation

## Overview

Payments now use Stripe Connect destination charges, which means:
- **Customers pay** → Payment goes to your platform account
- **Barbers receive** → Funds are automatically transferred to their Stripe Express account
- **Platform keeps** → Application fee (configurable percentage)

## How It Works

### Payment Flow

1. Customer books appointment and pays
2. Payment Intent is created with:
   - `on_behalf_of`: Barber's Stripe account ID
   - `transfer_data.destination`: Barber's Stripe account ID
   - `application_fee_amount`: Your platform's cut (calculated as percentage)
3. Payment processes → Customer pays full amount
4. Funds are split automatically:
   - **Barber receives**: Total amount - application fee
   - **Platform receives**: Application fee

### Example

If a customer pays $100 for a service:
- **Platform fee (5%)**: $5.00
- **Barber receives**: $95.00
- **Stripe fees**: Deducted from each party's portion

## Configuration

### Platform Fee Percentage

Set the platform fee percentage via environment variable:

```bash
# In .env.local (for local testing)
PLATFORM_FEE_PERCENT=5

# In Vercel → Environment Variables → Production
PLATFORM_FEE_PERCENT=5
```

**Default**: If not set, defaults to 5%

**How to change**:
1. Update `PLATFORM_FEE_PERCENT` in Vercel environment variables
2. Redeploy (or wait for next deployment)
3. New payments will use the new fee percentage

### Example Fee Calculations

| Customer Pays | Platform Fee (5%) | Barber Receives |
|--------------|-------------------|-----------------|
| $50.00       | $2.50            | $47.50          |
| $100.00      | $5.00            | $95.00          |
| $150.00      | $7.50            | $97.50          |

## Requirements

### For Barbers

Barbers **must** complete Stripe onboarding before they can receive payments:
1. Go to `/account` page
2. Click "Set Up Payouts"
3. Complete Stripe Express onboarding
4. Provide business info and bank account details

### Error Handling

If a barber hasn't completed onboarding:
- Payment creation will fail with error: "Barber has not completed payment setup"
- Customer will see an error message
- Barber must complete onboarding before accepting payments

## Stripe Fees

### How Stripe Fees Work with Connect

**Platform Account** (Your account):
- Pays Stripe fees on the application fee amount
- Example: If you take $5, you pay ~$0.32 in Stripe fees (2.9% + $0.30)

**Barber Account** (Connected account):
- Pays Stripe fees on the amount they receive
- Example: If barber receives $95, they pay ~$3.06 in Stripe fees (2.9% + $0.30)

**Total Stripe Fees**: ~$3.38 on a $100 payment
- Platform pays: ~$0.32
- Barber pays: ~$3.06

### Fee Structure Recommendation

When setting your platform fee, consider:
- Stripe fees (~3.4% total)
- Your desired profit margin
- Competitive rates

**Example**: If you want to net 2% after Stripe fees:
- Set `PLATFORM_FEE_PERCENT=5`
- You'll receive ~$4.68 after Stripe fees (5% - 0.32% = 4.68%)
- Barber receives ~$91.94 after Stripe fees (95% - 3.06% = 91.94%)

## Testing

### Test Mode

1. Use test mode Stripe keys
2. Barbers complete onboarding in test mode
3. Process test payments
4. Check Stripe Dashboard → Connect → Accounts to verify transfers

### Live Mode

1. Use live mode Stripe keys
2. Barbers complete onboarding in live mode
3. Process real payments
4. Monitor transfers in Stripe Dashboard

## Monitoring

### Stripe Dashboard

Check payment distribution:
1. Go to Stripe Dashboard → Payments
2. Click on a payment
3. View "Connect" section to see:
   - Application fee (your cut)
   - Transfer amount (barber's cut)
   - Destination account (barber's Stripe account)

### Connect Accounts

Monitor barber accounts:
1. Go to Stripe Dashboard → Connect → Accounts
2. View each barber's account
3. Check:
   - Account status
   - Payout schedule
   - Available balance
   - Transfer history

## Troubleshooting

### Error: "Barber has not completed payment setup"

**Cause**: Barber hasn't completed Stripe onboarding

**Solution**: 
- Barber must go to `/account` page
- Click "Set Up Payouts"
- Complete Stripe Express onboarding

### Error: "Failed to create payment intent"

**Possible causes**:
- Barber's Stripe account is not active
- Barber's account needs additional verification
- Stripe API error

**Solution**:
- Check Stripe Dashboard → Connect → Accounts
- Verify barber's account status
- Check Stripe logs for detailed error

### Payments not transferring to barbers

**Check**:
1. Barber's Stripe account status (must be active)
2. Barber's account verification status
3. Payment Intent status in Stripe Dashboard
4. Webhook delivery logs

## Security Notes

- Application fee is calculated server-side (never trust client)
- Barber's Stripe account ID is fetched from database (service role key)
- Payment metadata includes fee information for auditing
- All sensitive operations use server-side API routes

## Next Steps

- Monitor payment distribution
- Adjust platform fee percentage as needed
- Set up automated payouts for barbers (Stripe handles this automatically)
- Consider adding fee transparency in UI (show platform fee to barbers)

