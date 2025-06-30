'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface EditProfileButtonProps {
  profileId: string;
}

export default function EditProfileButton({ profileId }: EditProfileButtonProps) {
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

  return (
    <Link 
      href="/account" 
      style={{
        display: 'inline-block',
        background: 'linear-gradient(144deg, var(--metallic-accent), var(--chrome-silver))',
        color: '#000',
        padding: '12px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      }}
    >
      Edit Profile
    </Link>
  );
} 