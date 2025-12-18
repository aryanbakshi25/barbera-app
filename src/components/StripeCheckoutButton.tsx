'use client';

import React, { useState, useEffect } from 'react';

interface StripeCheckoutButtonProps {
  amount: number;
  serviceName: string;
  appointmentTime: string;
  barberId: string;
  customerId: string;
  serviceId: string;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function StripeCheckoutButton({
  amount,
  serviceName,
  appointmentTime,
  barberId,
  customerId,
  serviceId,
  onError,
  onCancel,
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    // Create checkout session when component mounts
    const createCheckout = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            serviceName,
            appointmentTime,
            barberId,
            customerId,
            serviceId,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        if (data.url) {
          setCheckoutUrl(data.url);
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        onError(error instanceof Error ? error.message : 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    createCheckout();
  }, [amount, serviceName, appointmentTime, barberId, customerId, serviceId, onError]);

  const handleRedirect = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="checkout-container">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <div className="payment-details">
          <div className="payment-item">
            <span>Service:</span>
            <span>{serviceName}</span>
          </div>
          <div className="payment-item">
            <span>Date & Time:</span>
            <span>{new Date(appointmentTime).toLocaleString()}</span>
          </div>
          <div className="payment-item total">
            <span>Total:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Preparing secure checkout...</p>
        </div>
      )}

      {checkoutUrl && !loading && (
        <div className="checkout-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-btn"
            disabled={loading}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleRedirect}
            className="checkout-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : `Proceed to Payment - $${amount.toFixed(2)}`}
          </button>
        </div>
      )}

      <style jsx>{`
        .checkout-container {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          padding: 1rem;
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

        .loading-state {
          text-align: center;
          padding: 2rem;
          color: #fff;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #10b981;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .checkout-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .cancel-btn,
        .checkout-btn {
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

        .checkout-btn {
          background: #10b981;
          color: white;
          font-weight: 600;
        }

        .checkout-btn:hover:not(:disabled) {
          background: #059669;
        }

        .checkout-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .checkout-container {
            padding: 0.5rem;
          }

          .checkout-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

