'use client';

import Link from 'next/link';
import Image from 'next/image';

// TypeScript interface for barber profile data
interface BarberProfile {
  id: string;
  username: string;
  bio: string | null;
  location?: string | null;
  profile_picture: string | null;
  role: string;
}

// BarberCard Component: Displays individual barber information in a clickable card
export default function BarberCard({ profile }: { profile: BarberProfile }) {
  return (
    <Link href={`/${profile.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#232526',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #333',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.borderColor = '#4A90E2';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#333';
      }}
      >
        {/* Profile Picture */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(144deg, var(--metallic-accent), var(--chrome-silver))',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          alignSelf: 'center',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#222',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image
              src={profile.profile_picture || '/images/default_pfp.png'}
              alt={`${profile.username}'s profile picture`}
              width={76}
              height={76}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Username */}
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#fff',
          marginBottom: '0.5rem',
          textAlign: 'center',
        }}>
          @{profile.username}
        </h3>

        {/* Location */}
        {profile.location && (
          <div style={{
            color: '#4A90E2',
            fontSize: '0.9rem',
            marginBottom: '0.75rem',
            textAlign: 'center',
            fontWeight: 500,
          }}>
            📍 {profile.location}
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <p style={{
            color: '#BDBDBD',
            fontSize: '0.9rem',
            lineHeight: 1.4,
            margin: 0,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {profile.bio}
          </p>
        )}

        {/* View Profile Button */}
        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
        }}>
          <span style={{
            color: '#4A90E2',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}>
            View Profile →
          </span>
        </div>
      </div>
    </Link>
  );
} 