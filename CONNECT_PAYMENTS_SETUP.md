# Stripe Connect Payments - Quick Setup Guide

## ✅ What's Been Implemented

Your payment system now uses **Stripe Connect destination charges** with application fees:

- ✅ Payments go to barbers' Stripe accounts automatically
- ✅ Platform takes a configurable percentage cut (default: 5%)
- ✅ Barbers must complete Stripe onboarding before receiving payments
- ✅ Error handling for barbers who haven't onboarded

## 🚀 Next Steps

### 1. Set Platform Fee Percentage (Optional)

The default is 5%, but you can change it:

**In Vercel:**
1. Go to your project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `PLATFORM_FEE_PERCENT`
   - **Value**: `5` (or your desired percentage, e.g., `7` for 7%)
   - **Environment**: Production (and Preview if you want)

**In `.env.local` (for local testing):**
```bash
PLATFORM_FEE_PERCENT=5
```

### 2. Test the Flow

1. **Make sure a barber has completed Stripe onboarding:**
   - Log in as a barber
   - Go to `/account`
   - Click "Set Up Payouts"
   - Complete Stripe onboarding

2. **Test a payment:**
   - Book an appointment with that barber
   - Complete payment
   - Check Stripe Dashboard → Connect → Accounts
   - Verify the barber received the payment (minus your fee)

### 3. Verify in Stripe Dashboard

After a test payment:
1. Go to Stripe Dashboard → Payments
2. Click on the payment
3. Check the "Connect" section:
   - **Application fee**: Your platform's cut
   - **Transfer amount**: What the barber receives
   - **Destination**: Barber's Stripe account

## 📊 How It Works

### Example: $100 Payment with 5% Platform Fee

```
Customer Pays:        $100.00
Platform Fee (5%):    $5.00
Barber Receives:      $95.00

Stripe Fees:
- Platform pays:      ~$0.32 (on $5)
- Barber pays:        ~$3.06 (on $95)
- Total Stripe fees:  ~$3.38
```

### What Happens

1. Customer pays $100
2. Payment Intent created with:
   - `on_behalf_of`: Barber's Stripe account
   - `application_fee_amount`: $5.00 (your cut)
   - `transfer_data.destination`: Barber's account
3. Funds are automatically split:
   - $5.00 → Your platform account (minus Stripe fees)
   - $95.00 → Barber's account (minus Stripe fees)

## ⚠️ Important Notes

### Barbers Must Complete Onboarding

- If a barber hasn't completed Stripe onboarding, payments will fail
- Error message: "This barber has not completed their payment setup"
- Barbers must go to `/account` and complete onboarding first

### Changing the Fee

- Update `PLATFORM_FEE_PERCENT` in Vercel
- Redeploy (or wait for next deployment)
- New payments will use the new percentage
- Existing payments are not affected

### Stripe Fees

- Stripe fees are deducted from each party's portion
- Platform pays fees on the application fee
- Barbers pay fees on what they receive
- Total Stripe fees: ~3.4% of the payment

## 🔍 Monitoring

### Check Payments

1. Stripe Dashboard → Payments
2. View payment details
3. See Connect section with fee breakdown

### Check Barber Accounts

1. Stripe Dashboard → Connect → Accounts
2. View each barber's account
3. See:
   - Available balance
   - Payout schedule
   - Transfer history

## 🐛 Troubleshooting

### Payment fails with "payment setup" error

**Cause**: Barber hasn't completed Stripe onboarding

**Fix**: Barber must complete onboarding at `/account` page

### Barber not receiving payments

**Check**:
1. Barber's Stripe account status (must be active)
2. Payment Intent status in Stripe Dashboard
3. Webhook delivery logs
4. Barber's account verification status

## 📝 Files Modified

- `src/app/api/create-payment-intent/route.ts` - Now uses Connect destination charges
- `src/components/PaymentForm.tsx` - Better error handling for onboarding

## 🎯 Ready to Test!

Everything is set up. Just:
1. Set `PLATFORM_FEE_PERCENT` (optional, defaults to 5%)
2. Make sure barbers complete onboarding
3. Test a payment
4. Verify in Stripe Dashboard

Your barbers will now receive payments directly to their Stripe accounts! 🎉

