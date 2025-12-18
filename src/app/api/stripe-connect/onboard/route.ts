import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

    // Authenticate user via Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Not needed for read operations
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });

    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch user's current stripe_account_id from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    let stripeAccountId = profile?.stripe_account_id;

    // If stripe_account_id is null, create a new Stripe Express account
    if (!stripeAccountId) {
      try {
        const account = await stripe.accounts.create({
          type: 'express',
        });

        stripeAccountId = account.id;

        // Update the profiles table with the new stripe_account_id
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ stripe_account_id: stripeAccountId })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile with Stripe account ID:', updateError);
          return NextResponse.json(
            { error: 'Failed to save Stripe account ID' },
            { status: 500 }
          );
        }

        console.log('✅ Created new Stripe Express account:', stripeAccountId);
      } catch (stripeError) {
        console.error('Error creating Stripe account:', stripeError);
        return NextResponse.json(
          { error: 'Failed to create Stripe account' },
          { status: 500 }
        );
      }
    }

    // Generate Stripe Account Link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';

    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/account`,
        return_url: `${baseUrl}/stripe/return`,
        type: 'account_onboarding',
      });

      return NextResponse.json({ url: accountLink.url });
    } catch (linkError) {
      console.error('Error creating account link:', linkError);
      return NextResponse.json(
        { error: 'Failed to create account link' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in stripe-connect/onboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

