import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS
    );

    const body = await request.json();
    const { barber_id, customer_id, service_id, appointment_time, payment_intent_id } = body;

    console.log('Creating appointment with data:', {
      barber_id,
      customer_id,
      service_id,
      appointment_time,
      payment_intent_id,
    });

    // Validate required fields
    if (!barber_id || !customer_id || !service_id || !appointment_time || !payment_intent_id) {
      console.error('Missing required fields:', {
        barber_id: !!barber_id,
        customer_id: !!customer_id,
        service_id: !!service_id,
        appointment_time: !!appointment_time,
        payment_intent_id: !!payment_intent_id,
      });
      return NextResponse.json(
        { error: 'Missing required fields', received: body },
        { status: 400 }
      );
    }

    // Check if appointment already exists (prevent duplicates)
    const { data: existingAppt } = await supabase
      .from('appointments')
      .select('id')
      .eq('payment_intent_id', payment_intent_id)
      .single();

    if (existingAppt) {
      console.log('Appointment already exists for payment:', payment_intent_id);
      return NextResponse.json({ 
        success: true, 
        appointment: existingAppt,
        message: 'Appointment already exists'
      });
    }

    // Create appointment in database
    const { data, error: insertError } = await supabase
      .from('appointments')
      .insert([
        {
          barber_id,
          customer_id,
          service_id,
          appointment_time,
          payment_intent_id,
          payment_status: 'paid',
          status: 'scheduled',
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating appointment:', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error details:', insertError.details);
      console.error('Error hint:', insertError.hint);
      return NextResponse.json(
        { error: 'Failed to create appointment', details: insertError.message, code: insertError.code },
        { status: 500 }
      );
    }

    console.log('✅ Appointment created successfully via API:', data.id);

    return NextResponse.json({ 
      success: true, 
      appointment: data 
    });
  } catch (error) {
    console.error('Error in create-appointment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

