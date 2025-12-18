import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

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

    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Extract metadata
    const { appointmentTime, barberId, customerId, serviceId, serviceName } = session.metadata || {};

    if (!appointmentTime || !barberId || !customerId || !serviceId) {
      return NextResponse.json(
        { error: 'Missing appointment details' },
        { status: 400 }
      );
    }

    // Check if appointment already exists
    const { data: existingAppt } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_id', customerId)
      .eq('appointment_time', appointmentTime)
      .single();

    if (existingAppt) {
      return NextResponse.json({
        success: true,
        appointment: {
          ...existingAppt,
          serviceName,
        },
      });
    }

    // Create appointment if it doesn't exist
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert([
        {
          barber_id: barberId,
          customer_id: customerId,
          service_id: serviceId,
          appointment_time: appointmentTime,
          payment_intent_id: session.payment_intent as string,
          payment_status: 'paid',
          status: 'scheduled',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating appointment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: {
        ...newAppointment,
        serviceName,
      },
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}

