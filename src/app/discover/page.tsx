import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import BarberCard from '@/components/BarberCard';

// DiscoverPage Component: Main component that fetches and displays all barbers
export default async function DiscoverPage() {
  // Create Supabase client for server-side data fetching
  const supabase = createServerComponentClient({ cookies });

  // Fetch all barbers from the profiles table
  const { data: barbers, error } = await supabase
    .from('profiles')
    .select('id, username, bio, location, profile_picture, role')
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
      <main style={{ 
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
      </main>
    );
  }

  return (
    <main style={{ 
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
        {barbers && barbers.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            padding: '0 1rem',
          }}>
            {barbers.map((barber) => (
              <BarberCard key={barber.id} profile={barber} />
            ))}
          </div>
        ) : (
          // No barbers found message
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: '#232526',
            borderRadius: '12px',
            border: '1px solid #333',
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}>
              ✂️
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#fff',
              marginBottom: '0.5rem',
            }}>
              No barbers found at this time
            </h2>
            <p style={{
              color: '#BDBDBD',
              fontSize: '1rem',
            }}>
              Check back later for new barber profiles.
            </p>
          </div>
        )}

        {/* Results Count */}
        {barbers && barbers.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '3rem',
            padding: '1rem',
            color: '#BDBDBD',
            fontSize: '0.9rem',
          }}>
            Showing {barbers.length} barber{barbers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </main>
  );
} 