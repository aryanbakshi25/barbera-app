'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import PortfolioUpload from './PortfolioUpload';

interface PortfolioUploadWrapperProps {
  profileId: string;
}

export default function PortfolioUploadWrapper({ profileId }: PortfolioUploadWrapperProps) {
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkOwner = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === profileId) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error('Error checking owner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwner();
  }, [profileId]);

  if (isLoading || !isOwner) {
    return null;
  }

  return <PortfolioUpload profileId={profileId} />;
} 