import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Check if required environment variables are set
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase configuration missing');
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil',
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        // Extract metadata
        const { appointmentTime, barberId, customerId, serviceId } = paymentIntent.metadata;

        // Check if appointment already exists (in case client created it already)
        const { data: existingAppt } = await supabase
          .from('appointments')
          .select('id')
          .eq('payment_intent_id', paymentIntent.id)
          .single();

        if (existingAppt) {
          console.log('Appointment already exists for payment:', paymentIntent.id);
          return NextResponse.json({ received: true, message: 'Appointment already exists' });
        }

        // Create appointment in database
        const { error: insertError } = await supabase
          .from('appointments')
          .insert([
            {
              barber_id: barberId,
              customer_id: customerId,
              service_id: serviceId,
              appointment_time: appointmentTime,
              payment_intent_id: paymentIntent.id,
              payment_status: 'paid',
              status: 'scheduled',
            },
          ]);

        if (insertError) {
          console.error('Error creating appointment:', insertError);
          return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
          );
        }

        console.log('✅ Appointment created successfully!');
        console.log('   Payment Intent ID:', paymentIntent.id);
        console.log('   Barber ID:', barberId);
        console.log('   Customer ID:', customerId);
        console.log('   Service ID:', serviceId);
        console.log('   Appointment Time:', appointmentTime);
      } catch (error) {
        console.error('Error processing payment success:', error);
        return NextResponse.json(
          { error: 'Failed to process payment success' },
          { status: 500 }
        );
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 