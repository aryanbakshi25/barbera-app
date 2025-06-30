"use client";
import Image from "next/image";
import Link from "next/link"; // Import the Link component
import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, profile_picture')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.username) {
          setIsLoggedIn(true);
          setProfilePicture(profile.profile_picture || null);
          setUsername(profile.username);
        } else {
          router.push('/complete-profile');
        }
      } else {
        setIsLoggedIn(false);
        setProfilePicture(null);
        setUsername(null);
      }
    };
    checkUser();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, _session) => {
      checkUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main>
      {/* Header */}
      <header className="header">
        <nav className="nav container">
          <div className="logo">
            <Link href="/">
              <Image
                src="/images/barb_cut_icon.png" // Assumes image is in public/images
                alt="Barbera Logo"
                width={50} // Specify width
                height={50} // Specify height
                style={{ cursor: "pointer" }}
              />
            </Link>
          </div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#about">About</a></li>
          </ul>
          <div className="auth-buttons">
            {isLoggedIn ? (
              <Link href={`/${username}`} className="flex items-center">
                <Image
                  src={profilePicture || "/images/default_pfp.png"}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full border border-gray-700 object-cover aspect-square"
                  style={{ background: '#eee' }}
                />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline">Sign In</Link>
                <Link href="/signup" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Where Style Meets Skill</h1>
            <p>
              With Barbera, discover talented barbers, showcase stunning transformations, and book
              your perfect cut. The premier platform connecting barbers and
              clients through the art of great haircuts.
            </p>
            <div className="hero-buttons">
              <Link href="/discover" className="btn btn-primary btn-large">Find Your Barber</Link>
              <Link href="/signup-barber" className="btn btn-secondary btn-large">Join as Barber</Link>
            </div>
            <Image
              src="/images/undraw_barber_utly.svg" // Assumes image is in public/images
              alt="Illustration of a barber"
              width={500} // Specify width
              height={400} // Specify height
              className="hero-image" // Add a class for styling if needed
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Everything You Need</h2>
            <p>A complete platform designed specifically for the barbering community</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Visual Portfolios</h3>
              <p>
                Showcase your best work with stunning before-and-after galleries
                that let your skills speak for themselves.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Smart Discovery</h3>
              <p>
                Find the perfect barber based on location, specialty, style
                preferences, and verified client reviews.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Seamless Booking</h3>
              <p>
                Book appointments instantly with real-time availability and
                automated reminders for both parties.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Direct Communication</h3>
              <p>
                Connect directly with barbers for consultations, style
                discussions, and follow-up care advice.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Trust & Reviews</h3>
              <p>
                Build trust through authentic reviews and ratings from real clients
                who{'\''}ve experienced your work.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Business Insights</h3>
              <p>
                Track your performance with analytics on bookings, client
                engagement, and portfolio views.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Getting started is simple for both barbers and clients</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Your Profile</h3>
              <p>
                Sign up and set up your professional profile with your specialties,
                location, and services.
              </p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Showcase Your Work</h3>
              <p>
                Upload your best before-and-after photos to build a portfolio that
                attracts clients.
              </p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Connect & Book</h3>
              <p>
                Clients discover your work, connect with you, and book appointments
                seamlessly.
              </p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Grow Your Business</h3>
              <p>
                Build your reputation, gain repeat clients, and expand your
                barbering business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Barbering Experience?</h2>
          <p>
            Join thousands of barbers and clients who{'\''}ve already discovered the
            Barbera difference.
          </p>
          <Link href="/signup" className="btn btn-white btn-large">Get Started Today</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Barbera</h3>
              <p>
                Connecting barbers and clients through the art of great haircuts.
              </p>
            </div>
            <div className="footer-section">
              <h3>For Barbers</h3>
              <Link href="/signup">Create Profile</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/success">Success Stories</Link>
              <Link href="/resources">Resources</Link>
            </div>
            <div className="footer-section">
              <h3>For Clients</h3>
              <Link href="/discover">Find Barbers</Link>
              <Link href="/book">Book Appointment</Link>
              <Link href="#how-it-works">How It Works</Link>
              <Link href="/reviews">Reviews</Link>
            </div>
            <div className="footer-section">
              <h3>Support</h3>
              <Link href="/help">Help Center</Link>
              <Link href="/contact">Contact Us</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Barbera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}