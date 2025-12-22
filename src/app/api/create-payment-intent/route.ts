import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { amount, serviceName, appointmentTime, barberId, customerId, serviceId } = await request.json();

    // Fetch barber's Stripe account ID
    const { data: barberProfile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', barberId)
      .single();

    if (profileError || !barberProfile) {
      console.error('Error fetching barber profile:', profileError);
      return NextResponse.json(
        { error: 'Barber profile not found' },
        { status: 404 }
      );
    }

    // Check if barber has completed Stripe onboarding
    if (!barberProfile.stripe_account_id) {
      return NextResponse.json(
        { error: 'Barber has not completed payment setup. Please contact the barber to set up their payment account.' },
        { status: 400 }
      );
    }

    // Verify barber's Stripe account is active
    try {
      const account = await stripe.accounts.retrieve(barberProfile.stripe_account_id);
      if (account.details_submitted === false) {
        return NextResponse.json(
          { error: 'Barber\'s Stripe account is not fully set up. Please complete payment setup.' },
          { status: 400 }
        );
      }
    } catch (accountError) {
      console.error('Error retrieving Stripe account:', accountError);
      return NextResponse.json(
        { error: 'Barber\'s Stripe account is invalid or not found.' },
        { status: 400 }
      );
    }

    // Calculate platform fee (default 5%, configurable via environment variable)
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5');
    const totalAmount = Math.round(amount * 100); // Convert to cents
    const applicationFeeAmount = Math.round(totalAmount * (platformFeePercent / 100));

    // Create a PaymentIntent with destination charge (Stripe Connect)
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        application_fee_amount: applicationFeeAmount, // Platform's cut
        on_behalf_of: barberProfile.stripe_account_id, // Barber's Stripe account
        transfer_data: {
          destination: barberProfile.stripe_account_id, // Funds go to barber
        },
        metadata: {
          serviceName,
          appointmentTime,
          barberId,
          customerId,
          serviceId,
          platformFeePercent: platformFeePercent.toString(),
          applicationFeeAmount: applicationFeeAmount.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('✅ Payment Intent created with Connect:');
      console.log('   Total Amount:', totalAmount, 'cents ($' + amount + ')');
      console.log('   Platform Fee:', applicationFeeAmount, 'cents ($' + (applicationFeeAmount / 100).toFixed(2) + ')');
      console.log('   Barber Receives:', totalAmount - applicationFeeAmount, 'cents ($' + ((totalAmount - applicationFeeAmount) / 100).toFixed(2) + ')');
      console.log('   Barber Stripe Account:', barberProfile.stripe_account_id);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (stripeError: any) {
      console.error('Stripe API error creating payment intent:', stripeError);
      console.error('Error type:', stripeError.type);
      console.error('Error code:', stripeError.code);
      console.error('Error message:', stripeError.message);
      
      // Return more specific error messages
      if (stripeError.code === 'account_invalid') {
        return NextResponse.json(
          { error: 'Barber\'s Stripe account is invalid. Please contact support.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create payment intent', 
          details: stripeError.message || 'Unknown Stripe error',
          code: stripeError.code || 'unknown'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 