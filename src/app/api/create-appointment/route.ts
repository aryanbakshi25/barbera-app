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

    const { barber_id, customer_id, service_id, appointment_time, payment_intent_id } = await request.json();

    // Validate required fields
    if (!barber_id || !customer_id || !service_id || !appointment_time || !payment_intent_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Failed to create appointment', details: insertError.message },
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

