"use client";
import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import BookingModal from '@/components/BookingModal';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
}

interface BookButtonProps {
  profileId: string;
}

export default function BookButton({ profileId }: BookButtonProps) {
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkOwnerAndUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCustomerId(user.id);
          if (user.id === profileId) {
            setIsOwner(true);
          }
        }
      } catch (error) {
        console.error('Error checking owner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnerAndUser();
  }, [profileId]);

  useEffect(() => {
    // Fetch barber's services
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const fetchServices = async () => {
      setLoadingServices(true);
      const { data } = await supabase
        .from('services')
        .select('id, name, price, duration_minutes')
        .eq('user_id', profileId)
        .order('price', { ascending: true });
      if (data) setServices(data);
      setLoadingServices(false);
    };
    fetchServices();
  }, [profileId]);

  if (isLoading || isOwner || !customerId) {
    return null;
  }

  return (
    <>
      <button
        className="button-64"
        role="button"
        style={{ marginTop: '16px' }}
        onClick={() => setShowModal(true)}
        disabled={loadingServices || services.length === 0}
      >
        <span className="text">Book an Appointment</span>
      </button>
      {showModal && (
        <BookingModal
          barberId={profileId}
          services={services}
          customerId={customerId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
} 