'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
// Load Stripe outside of component to avoid recreating on every render
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.replace(/^['"]|['"]$/g, '');
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;



interface PaymentFormProps {
  amount: number;
  serviceName: string;
  appointmentTime: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

function CheckoutForm({
  amount,
  serviceName,
  appointmentTime,
  barberId,
  customerId,
  serviceId,
  onSuccess,
  onError,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(''); // Clear any previous messages

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || 'Please check your payment details.');
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (error) {
        setMessage(error.message || 'An error occurred during payment.');
        onError(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Verify payment status
      if (paymentIntent) {
        console.log('Payment intent status:', paymentIntent.status);
        
        if (paymentIntent.status === 'succeeded') {
          // Payment successful - create appointment immediately
          console.log('Payment succeeded, creating appointment...');
          
          try {
            // Create appointment via API route (uses service role key, bypasses RLS)
            const response = await fetch('/api/create-appointment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                barber_id: barberId,
                customer_id: customerId,
                service_id: serviceId,
                appointment_time: appointmentTime,
                payment_intent_id: paymentIntent.id,
              }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
              console.error('Error creating appointment:', result.error || result);
              // Still show success to user, webhook will handle it
              console.log('Appointment creation failed, webhook will handle it');
            } else {
              console.log('✅ Appointment created successfully!', result.appointment?.id);
            }
          } catch (err) {
            console.error('Error creating appointment:', err);
            // Still show success, webhook will handle it
          }
          
          setIsProcessing(false);
          onSuccess();
        } else if (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_capture') {
          // Payment is still processing or requires capture
          // For most cards, this will quickly resolve to succeeded
          // The webhook will create the appointment when payment succeeds
          setMessage('Payment is processing. Please wait...');
          console.log('Payment processing, will complete via webhook');
          
          // Wait a moment and then show success (webhook handles appointment creation)
          // In a production app, you might want to poll, but for simplicity, 
          // we'll trust that if Stripe didn't error, it will succeed
          setTimeout(() => {
            setIsProcessing(false);
            onSuccess();
          }, 1500);
        } else {
          // Payment in unexpected state
          console.error('Unexpected payment status:', paymentIntent.status);
          setMessage(`Payment status: ${paymentIntent.status}. Please try again.`);
          setIsProcessing(false);
          onError(`Payment status: ${paymentIntent.status}`);
        }
      } else {
        // No payment intent returned - check if payment actually succeeded
        console.warn('No payment intent returned, but no error either. Assuming success.');
        setIsProcessing(false);
        // Don't call onError here - if there's no error from Stripe, assume success
        // The webhook will create the appointment
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setMessage(errorMessage);
      onError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <div className="payment-details">
          <div className="payment-item">
            <span>Service:</span>
            <span>{serviceName}</span>
          </div>
          <div className="payment-item">
            <span>Date & Time: </span>
            <span>{new Date(appointmentTime).toLocaleString()}</span>
          </div>
          <div className="payment-item total">
            <span>Total:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <PaymentElement />

              <div className="payment-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-btn"
            disabled={isProcessing}
          >
            Back
          </button>
          <button
            type="submit"
            className="pay-btn"
            disabled={isProcessing || !stripe}
          >
            {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </button>
        </div>

      {message && <div className="payment-error">{message}</div>}

      <style jsx>{`
        .payment-form {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          padding: 1rem;
          max-height: 70vh;
          overflow-y: auto;
        }

        .payment-summary {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          color: #333;
        }

        .payment-summary h3 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.2rem;
        }

        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .payment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e9ecef;
          color: #333;
        }

        .payment-item:last-child {
          border-bottom: none;
        }

        .payment-item.total {
          font-weight: bold;
          font-size: 1.1rem;
          color: #2563eb;
          border-top: 2px solid #dee2e6;
          padding-top: 1rem;
          margin-top: 0.5rem;
        }

        .payment-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .cancel-btn,
        .pay-btn {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #5a6268;
        }

        .pay-btn {
          background: #10b981;
          color: white;
        }

        .pay-btn:hover:not(:disabled) {
          background: #059669;
        }

        .pay-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .payment-error {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 0.75rem;
          margin-top: 1rem;
          text-align: center;
        }

        @media (max-width: 600px) {
          .payment-form {
            padding: 0.5rem;
          }

          .payment-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </form>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Get the Stripe key and strip quotes if present
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.replace(/^['"]|['"]$/g, '');

    // Check if Stripe is configured
    if (!stripeKey) {
      props.onError('Stripe is not configured. Please contact support.');
      return;
    }

    // Create PaymentIntent as soon as the page loads
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: props.amount,
        serviceName: props.serviceName,
        appointmentTime: props.appointmentTime,
        barberId: props.barberId,
        customerId: props.customerId,
        serviceId: props.serviceId,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
        props.onError('Failed to initialize payment: ' + error.message);
      });
  }, [props]);

  // Get the Stripe key and strip quotes if present
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.replace(/^['"]|['"]$/g, '');
  
  if (!stripeKey) {
    return (
      <div className="stripe-not-configured">
        <div className="error-icon">⚠️</div>
        <h3>Payment System Not Available</h3>
        <p>Stripe payment processing is not configured. Please contact support.</p>
        <button onClick={props.onCancel} className="cancel-btn">
          Go Back
        </button>
        <style jsx>{`
          .stripe-not-configured {
            text-align: center;
            padding: 2rem;
            color: #fff;
          }
          .error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          h3 {
            margin-bottom: 1rem;
            color: #f59e42;
          }
          p {
            margin-bottom: 2rem;
            opacity: 0.8;
          }
          .cancel-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="loading-payment">
        <div className="spinner"></div>
        <p>Initializing payment...</p>
        <style jsx>{`
          .loading-payment {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #10b981;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm {...props} />
    </Elements>
  );
} 