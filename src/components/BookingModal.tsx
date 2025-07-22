'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { DayPicker } from 'react-day-picker';
import { format, addMinutes, isBefore, isAfter, isEqual, parseISO, setHours, setMinutes, startOfDay, addDays } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface BookingModalProps {
  barberId: string;
  services: Service[];
  customerId: string; // You may want to get this from context/auth instead
  onClose: () => void;
}

interface Availability {
  day_of_week: number;
  start_time: string; // '09:00'
  end_time: string;   // '17:00'
}

interface Appointment {
  appointment_time: string; // ISO string
  service_id: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to normalize time (strip seconds)
function normalizeTime(time: string) {
  return time.length === 8 ? time.slice(0, 5) : time;
}

export default function BookingModal({ barberId, services, customerId, onClose }: BookingModalProps) {
  const [step, setStep] = useState<'service' | 'date' | 'time' | 'payment' | 'confirm'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availDays, setAvailDays] = useState<Set<number>>(new Set());

  // Step 1: Service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('date');
  };

  // Step 2: Date selection
  const handleDateSelect = (date?: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  // Step 3: Fetch and generate available time slots
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !selectedService) return;
      setLoadingSlots(true);
      setError(null);

      try {
        // 1. Get day_of_week (0=Sunday, 6=Saturday)
        const dayOfWeek = selectedDate.getDay();

        // Debug logging
        console.log('BookingModal Debug:', {
          barberId,
          selectedDate: selectedDate.toISOString(),
          dayOfWeek,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
        });

        // 2. Fetch barber's availability for that day - FIXED: Remove .single()
        const { data: availabilities, error: availError } = await supabase
          .from('availability')
          .select('*')
          .eq('user_id', barberId)
          .eq('day_of_week', dayOfWeek);

        if (availError) {
          console.error('Error fetching availability:', availError);
          setAvailableSlots([]);
          setLoadingSlots(false);
          setError('Failed to check barber availability.');
          return;
        }

        // Check if any availability record exists for this day
        if (!availabilities || availabilities.length === 0) {
          setAvailableSlots([]);
          setLoadingSlots(false);
          setError('Barber has not set availability for this day.');
          return;
        }

        // Get the first (and should be only) availability record
        const availability = availabilities[0] as Availability;
        const { start_time, end_time } = availability;
        const normStart = normalizeTime(start_time);
        const normEnd = normalizeTime(end_time);
        
        // Check if the day is marked as closed
        if (normStart === '00:00' && normEnd === '00:00') {
          setAvailableSlots([]);
          setLoadingSlots(false);
          setError('Barber is closed on this day.');
          return;
        }

        // 3. Fetch existing appointments for that day
        const dayStart = startOfDay(selectedDate);
        const dayEnd = addMinutes(dayStart, 24 * 60 - 1);
        const { data: appointments } = await supabase
          .from('appointments')
          .select('appointment_time, service_id')
          .eq('barber_id', barberId)
          .gte('appointment_time', dayStart.toISOString())
          .lte('appointment_time', dayEnd.toISOString());

        // 4. Generate all possible slots
        const [startHour, startMinute] = normStart.split(':').map(Number);
        const [endHour, endMinute] = normEnd.split(':').map(Number);

        const workStart = setMinutes(setHours(dayStart, startHour), startMinute);
        const workEnd = setMinutes(setHours(dayStart, endHour), endMinute);

        const slots: Date[] = [];
        let slot = workStart;
        const duration = selectedService.duration_minutes;

        while (
          isBefore(addMinutes(slot, duration), workEnd) ||
          isEqual(addMinutes(slot, duration), workEnd)
        ) {
          slots.push(slot);
          slot = addMinutes(slot, 5); // 5-minute increments
        }

        // 5. Filter out slots that conflict with existing appointments
        const taken: { start: Date; end: Date }[] = (appointments || []).map((appt: Appointment) => {
          const apptStart = parseISO(appt.appointment_time);
          const apptService = services.find(s => s.id === appt.service_id);
          const apptDuration = apptService ? apptService.duration_minutes : 30;
          return {
            start: apptStart,
            end: addMinutes(apptStart, apptDuration),
          };
        });

        const available = slots.filter(slot => {
          const slotEnd = addMinutes(slot, duration);
          return !taken.some(({ start, end }) =>
            (isBefore(slot, end) && isAfter(slotEnd, start)) // overlap
          );
        });

        setAvailableSlots(available);
        setLoadingSlots(false);
        setError(available.length === 0 ? 'No available slots for this day.' : null);
      } catch (err) {
        console.error('Error in fetchSlots:', err);
        setError('Failed to load slots.');
        setAvailableSlots([]);
        setLoadingSlots(false);
      }
    };

    if (step === 'time') {
      fetchSlots();
    }
  }, [selectedDate, selectedService, barberId, services, step]);

  // Compute available day_of_week set after service is selected
  useEffect(() => {
    if (!selectedService || !barberId) return;
    const fetchAvailabilityForCalendar = async () => {
      const { data: allAvail, error } = await supabase
        .from('availability')
        .select('day_of_week, start_time, end_time')
        .eq('user_id', barberId);
      if (error || !allAvail) return;
      const days = new Set<number>();
      allAvail.forEach((row: Availability) => {
        const normStart = normalizeTime(row.start_time);
        const normEnd = normalizeTime(row.end_time);
        if (!(normStart === '00:00' && normEnd === '00:00')) {
          days.add(Number(row.day_of_week));
        }
      });
      setAvailDays(days);
    };
    fetchAvailabilityForCalendar();
  }, [selectedService, barberId]);

  // Step 4: Book appointment
  const handleBook = async () => {
    if (!selectedService || !selectedTime || !customerId) return;
    setBooking(true);
    setError(null);

    const appointment_time = selectedTime.toISOString();

    const { error: insertError } = await supabase.from('appointments').insert([
      {
        barber_id: barberId,
        customer_id: customerId,
        service_id: selectedService.id,
        appointment_time,
      },
    ]);

    setBooking(false);

    if (insertError) {
      console.error('Error booking appointment:', insertError);
      setError('Failed to book appointment. Please try again.');
    } else {
      setStep('confirm');
    }
  };

  // UI rendering
  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        {step !== 'confirm' && (
          <button className="close-btn" onClick={onClose} title="Close">&times;</button>
        )}
        {step === 'service' && (
          <div>
            <h3>Select a Service</h3>
            &nbsp;
            <ul className="service-list">
              {services.map(service => (
                <li key={service.id}>
                  <button
                    className="service-btn"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div>
                      <strong>{service.name}</strong>
                      <span> (${service.price})</span>
                    </div>
                    <div>
                      <small>{service.duration_minutes} min</small>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 'date' && (
          <div>
            <h3>Select a Date</h3>
            &nbsp;
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              fromDate={new Date()}
              toDate={addDays(new Date(), 59)}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || !availDays.has(date.getDay());
              }}
              modifiers={{
                available: (date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date >= today && availDays.has(date.getDay());
                },
                unavailable: (date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date >= today && !availDays.has(date.getDay());
                }
              }}
              modifiersStyles={{
                available: {
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '50%'
                },
                unavailable: {
                  backgroundColor: '#ef4444',
                  color: 'white',
                  opacity: 0.7,
                  borderRadius: '50%'
                }
              }}
            />
            <button className="back-btn" onClick={() => setStep('service')}>Back</button>
          </div>
        )}

        {step === 'time' && (
          <div>
            <h3>Select a Time</h3>
            {loadingSlots && <p>Loading available slots...</p>}
            {error && <p className="error">{error}</p>}
            <div className="slots-list-vertical">
              {availableSlots.map(slot => (
                <button
                  key={slot.toISOString()}
                  className={`slot-btn${selectedTime && isEqual(selectedTime, slot) ? ' selected' : ''}`}
                  onClick={() => setSelectedTime(slot)}
                >
                  {format(slot, 'h:mm a')}
                </button>
              ))}
            </div>
            <button className="back-btn" onClick={() => setStep('date')}>Back</button>
            <button
              className="confirm-btn"
              disabled={!selectedTime || booking}
              onClick={() => setStep('payment')}
            >
              {booking ? 'Booking...' : 'Confirm'}
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div>
            <h3>Payment</h3>
            {/* Replace this with your real Stripe Elements UI */}
            <p>Stripe payment form goes here...</p>
            <button className="back-btn" onClick={() => setStep('time')}>Back</button>
            <button className="confirm-btn" onClick={handleBook} disabled={booking}>
              {booking ? 'Processing...' : 'Pay & Confirm'}
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="booking-confirm-box">
            <div className="booking-celebrate-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="#e6f9f2"/><path d="M8 12l3 3 5-5"/></svg>
            </div>
            <h3 className="booking-confirm-title">Appointment Confirmed!</h3>
            <div className="booking-confirm-details">
              <div className="booking-confirm-service">{selectedService?.name}</div>
              <div className="booking-confirm-date">
                {selectedDate && (
                  <>
                    <span className="booking-confirm-day">{format(selectedDate, 'EEE')}</span>
                    <span className="booking-confirm-date-main">{format(selectedDate, 'MMMM do, yyyy')}</span>
                  </>
                )}
              </div>
              <div className="booking-confirm-time">{selectedTime && format(selectedTime, 'h:mm a')}</div>
            </div>
            <div className="booking-confirm-message">🎉 You just booked your appointment! 🎉</div>
            <button className="close-btn confirm-close-btn" onClick={onClose} title="Close">&times;</button>
          </div>
        )}
      </div>
      <style jsx>{`
        .slots-list-vertical {
          display: flex;
          flex-direction: column;
          max-height: 260px;
          overflow-y: auto;
          gap: 0.5rem;
          margin: 1rem 0;
        }
        .booking-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .booking-modal {
          background: #232526; color: #fff; border-radius: 12px; padding: 2rem; min-width: 320px; max-width: 95vw; box-shadow: 0 4px 32px #0008;
          position: relative;
        }
        .close-btn {
          position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer; z-index: 10;
        }
        .confirm-close-btn {
          position: absolute;
          top: 0.05rem;
          right: 1rem;
          background: none;
          color: #10b981;
          font-size: 2.2rem;
          border: none;
          cursor: pointer;
          z-index: 2;
        }
        .service-list { list-style: none; padding: 0; }
        .service-btn {
          width: 100%; background: #333; color: #fff; border: none; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
        }
        .service-btn:hover, .slot-btn.selected, .service-btn:focus { background: #3b82f6; color: #fff; }
        .slot-btn {
          background: #333; color: #fff; border: none; border-radius: 6px; padding: 0.75rem 1.25rem; cursor: pointer; font-size: 1rem;
        }
        .slot-btn.selected, .slot-btn:hover { background: #10b981; color: #fff; }
        .back-btn, .confirm-btn {
          margin-top: 1rem; margin-right: 1rem; background: #444; color: #fff; border: none; border-radius: 6px; padding: 0.75rem 1.5rem; cursor: pointer; font-size: 1rem;
        }
        .confirm-btn { background: #3b82f6; }
        .confirm-btn:disabled { background: #555; cursor: not-allowed; }
        .error { color: #ef4444; margin: 1rem 0; }
        .booking-confirm-box {
          position: relative;
          background: linear-gradient(135deg, #e6f9f2 0%, #f0fdfa 100%);
          color: #111;
          border-radius: 18px;
          padding: 2.5rem 2rem 2.5rem 2rem;
          box-shadow: 0 6px 32px #10b98133, 0 1.5px 8px #0002;
          text-align: center;
          min-width: 320px;
          max-width: 95vw;
          margin: 0 auto;
        }
        .booking-celebrate-icon {
          margin-bottom: 1.2rem;
        }
        .booking-confirm-title {
          font-size: 2.1rem;
          font-weight: 800;
          color: #10b981;
          margin-bottom: 0.7rem;
        }
        .booking-confirm-details {
          font-size: 1.15rem;
          margin-bottom: 1.2rem;
        }
        .booking-confirm-service {
          font-weight: 600;
          font-size: 1.2rem;
          margin-bottom: 0.3rem;
        }
        .booking-confirm-date {
          font-size: 1.1rem;
          margin-bottom: 0.2rem;
        }
        .booking-confirm-day {
          font-weight: 700;
          color: #2563eb;
          margin-right: 0.5rem;
        }
        .booking-confirm-date-main {
          color: #222;
        }
        .booking-confirm-time {
          font-size: 1.1rem;
          color: #2563eb;
          font-weight: 600;
        }
        .booking-confirm-message {
          font-size: 1.2rem;
          color: #10b981;
          margin-top: 1.2rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        @media (max-width: 600px) {
          .booking-modal { padding: 1rem; min-width: 95vw; }
          .slots-list-vertical { max-height: 180px; }
        }
      `}</style>
    </div>
  );
}