'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Appointment {
  id: string;
  appointment_time: string;
  serviceName?: string;
  status: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Verify payment and fetch appointment
    const verifyPayment = async () => {
      try {
        // Call API to verify session and get appointment
        const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        if (data.appointment) {
          setAppointment(data.appointment);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Failed to verify payment');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-6 py-8">
        <div className="max-w-md w-full" style={{ padding: '40px 0' }}>
          <div className="text-center">
            <div className="border-4 border-blue-600 border-t-transparent rounded-full w-12 h-12 mx-auto mb-4 animate-spin" style={{ marginTop: '60px' }}></div>
            <p className="text-gray-300 text-xl">Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-6 py-8">
        <div className="max-w-md w-full" style={{ padding: '40px 0' }}>
          {/* Header */}
          <div className="text-center" style={{ marginBottom: '60px' }}>
            <Link href="/" className="inline-block" style={{ marginBottom: '30px' }}>
              <Image
                src="/images/barb_cut_icon.png"
                alt="Barbera Logo"
                width={96}
                height={96}
                className="h-24 w-24 mx-auto"
              />
            </Link>
            <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>Payment Error</h2>
            <p className="text-gray-400 text-xl">Something went wrong</p>
          </div>

          {/* Error Display */}
          <div 
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 pt-12 mb-10"
            style={{
              paddingLeft: '1rem',
              fontSize: '1rem',
              marginBottom: '1.5rem',
              lineHeight: '3',
            }}
          >
            <p className="text-red-400 font-medium">{error}</p>
          </div>

          {/* Button */}
          <Link
            href="/dashboard"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg inline-block text-center"
            style={{ lineHeight: 2.5 }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '60px' }}>
          <Link href="/" className="inline-block" style={{ marginBottom: '30px' }}>
            <Image
              src="/images/barb_cut_icon.png"
              alt="Barbera Logo"
              width={96}
              height={96}
              className="h-24 w-24 mx-auto"
            />
          </Link>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-12 h-12 text-green-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>Payment Successful!</h2>
          <p className="text-gray-400 text-xl">Your appointment has been confirmed</p>
        </div>

        {/* Appointment Details */}
        {appointment && (
          <div style={{ marginBottom: '50px' }}>
            <div style={{ marginBottom: '25px' }}>
              <label className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
                Service
              </label>
              <div className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl text-white text-base" style={{ paddingLeft: '1rem', lineHeight: '2.5' }}>
                {appointment.serviceName || 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
                Date & Time
              </label>
              <div className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl text-white text-base" style={{ paddingLeft: '1rem', lineHeight: '2.5' }}>
                {appointment.appointment_time ? new Date(appointment.appointment_time).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }) : 'Invalid Date'}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
                Status
              </label>
              <div className="w-full px-6 py-5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-base font-medium" style={{ paddingLeft: '1rem', lineHeight: '2.5' }}>
                Confirmed
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ marginBottom: '60px' }}>
          <Link
            href="/dashboard"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg inline-block text-center mb-6"
            style={{ lineHeight: 2.5, marginBottom: '1.5rem' }}
          >
            View Appointments
          </Link>
          <Link
            href="/"
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg inline-block text-center"
            style={{ lineHeight: 2.5 }}
          >
            Go Home
          </Link>
        </div>

        {/* Footer Message */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            You will receive a confirmation email shortly with your appointment details.
          </p>
        </div>
      </div>
    </div>
  );
}

