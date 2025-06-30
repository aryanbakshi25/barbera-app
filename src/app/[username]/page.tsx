import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import BookButton from './BookButton';
import ClientServicesListWrapper from '@/components/ClientServicesListWrapper';
import EditProfileButton from '@/components/EditProfileButton';
import PortfolioUploadWrapper from '@/components/PortfolioUploadWrapper';
import PortfolioGrid from '@/components/PortfolioGrid';

// TypeScript interfaces for data
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

interface Post {
  id: string;
  image_url?: string; // For backward compatibility
  images?: string[] | Array<{ url: string; alt?: string; caption?: string }>; // JSONB support
  caption?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
}

// Placeholder components for clarity and separation of concerns
function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return <p style={{ color: '#bbb' }}>No reviews yet.</p>;
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {reviews.map(review => (
        <li key={review.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
          <div style={{ color: '#FFD700', fontSize: '1.2rem' }}>
            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
          </div>
          <div style={{ color: '#eee', marginTop: '0.3rem' }}>{review.comment}</div>
        </li>
      ))}
    </ul>
  );
}

export const revalidate = 60;

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = createServerComponentClient({ cookies });

  // 1. Fetch the main profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, role, bio, profile_picture')
    .eq('username', username)
    .single();

  // 2. If not found, show 404
  if (!profile) {
    notFound();
  }

  // 3. If the user is a barber, fetch posts, services, and reviews
  let posts: Post[] = [];
  let services: Service[] = [];
  let reviews: Review[] = [];
  if (profile.role === 'barber') {
    // Fetch posts (portfolio)
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, image_url, images, caption')
      .eq('user_id', profile.id)
      .order('id', { ascending: false });
    posts = postsData || [];

    // Fetch services
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, description, price, duration_minutes')
      .eq('user_id', profile.id)
      .order('price', { ascending: true });
    services = servicesData || [];

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment')
      .eq('barber_id', profile.id)
      .order('id', { ascending: false });
    reviews = reviewsData || [];
  }

  // 4. Render the page based on the user's role
  if (profile.role === 'customer') {
    // Customer: universal info + simple message
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#18181b' }}>
        <div style={{ background: '#232526', borderRadius: 16, padding: 32, color: '#fff', maxWidth: 500, width: '100%' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 8 }}>@{profile.username}</h1>
          {profile.bio && <p style={{ color: '#BDBDBD', marginBottom: 24 }}>{profile.bio}</p>}
          <div style={{ color: '#4A90E2', fontWeight: 600, fontSize: '1.1rem', marginBottom: 24 }}>Community Member</div>
          <EditProfileButton profileId={profile.id} />
        </div>
      </main>
    );
  }

  // Barber: two-column layout
  return (
    <main style={{ minHeight: '100vh', background: '#18181b', padding: '40px 0' }}>
      <div style={{
        display: 'flex',
        maxWidth: 1100,
        margin: '0 auto',
        background: '#232526',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 32px #0004'
      }}>
        {/* Left Sidebar */}
        <aside style={{
          flex: '0 0 320px',
          background: '#232526',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRight: '1px solid #333'
        }}>
          {/* Real profile picture */}
          <div style={{
            width: 146,
            height: 146,
            borderRadius: '50%',
            background: 'linear-gradient(144deg, var(--metallic-accent), var(--chrome-silver))',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#222',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Image
                src={profile.profile_picture || '/images/default_pfp.png'}
                alt={`${profile.username}'s profile picture`}
                width={140}
                height={140}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </div>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>@{profile.username}</h1>
          {profile.bio && <p style={{ color: '#BDBDBD', marginBottom: 24, textAlign: 'center' }}>{profile.bio}</p>}
          <BookButton profileId={profile.id} />
          <EditProfileButton profileId={profile.id} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 12, marginTop: 32 }}>Services</h2>
          <ClientServicesListWrapper services={services} profileId={profile.id} />
        </aside>
        {/* Right Main Content */}
        <section style={{ flex: 1, padding: '2.5rem 2.5rem 2.5rem 2rem', background: '#232526' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Portfolio</h2>
            <PortfolioUploadWrapper profileId={profile.id} />
          </div>
          <PortfolioGrid posts={posts} profileId={profile.id} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '2.5rem 0 1rem' }}>Reviews</h2>
          <ReviewsList reviews={reviews} />
        </section>
      </div>
    </main>
  );
}