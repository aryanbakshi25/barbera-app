"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import ClientServicesList from "./ClientServicesList";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
}

export default function ClientServicesListWrapper({
  services,
  profileId,
}: {
  services: Service[];
  profileId: string;
}) {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === profileId) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error('Error checking owner:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOwner();
  }, [profileId, supabase.auth]);

  if (loading) {
    return <div style={{ color: '#bbb' }}>Loading...</div>;
  }

  return <ClientServicesList services={services} isOwner={isOwner} />;
} 