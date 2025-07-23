import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import BarberCard from '@/components/BarberCard';
import Navbar from '@/components/Navbar'
import DiscoverClient from '@/components/DiscoverClient';

// DiscoverPage Component: Main component that fetches and displays all barbers
export default async function DiscoverPage() {

  // Create Supabase client for server-side data fetching
  const supabase = createServerComponentClient({ cookies });

  // Fetch all barbers from the profiles table
  const { data: barbers, error } = await supabase
    .from('profiles')
    .select('id, username, bio, location, profile_picture, role, latitude, longitude')
    .eq('role', 'barber')
    .order('username', { ascending: true });

  // Handle potential database errors
  if (error) {
    console.error('Error fetching barbers:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return (
      <main>
        <Navbar />
        <div style={{ 
          minHeight: '100vh', 
          background: '#18181b', 
          padding: '40px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#232526',
            borderRadius: '12px',
            padding: '2rem',
            color: '#fff',
            textAlign: 'center',
            maxWidth: '500px',
          }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ color: '#BDBDBD', marginBottom: '1rem' }}>Unable to load barbers at this time. Please try again later.</p>
            <p style={{ color: '#666', fontSize: '0.8rem' }}>Error: {error.message}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <div style={{ 
        minHeight: '100vh', 
        background: '#18181b', 
        padding: '40px 20px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Page Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '0.5rem',
            }}>
              Discover Our Barbers
            </h1>
            <p style={{
              color: '#BDBDBD',
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Find the perfect barber for your style. Browse profiles, check out their work, and book your next appointment.
            </p>
          </div>

          {/* Barbers Grid */}
          <DiscoverClient barbers={barbers || []} />

        </div>
      </div>
    </main>
  );
}