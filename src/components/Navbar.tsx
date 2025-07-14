'use client';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          .select('username, profile_picture, role')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.username) {
          setIsLoggedIn(true);
          setProfilePicture(profile.profile_picture || null);
          setUsername(profile.username);
          setRole(profile.role || null);
        } else {
          router.push('/complete-profile');
        }
      } else {
        setIsLoggedIn(false);
        setProfilePicture(null);
        setUsername(null);
        setRole(null);
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, _session) => {
      checkUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <>
      <header className="header" style={{ height: '90px' }}>
        <nav className="nav container">
          <div className="logo" style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)' }}>
            <Link href="/">
              <Image
                src="/images/barb_cut_icon.png"
                alt="Barbera Logo"
                width={50}
                height={50}
                style={{ cursor: "pointer" }}
              />
            </Link>
          </div>
          <ul
            className="nav-links"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              gap: '20px',
              display: windowWidth && windowWidth < 768 ? 'none' : 'flex',
            }}
          >
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            {(!role || role !== 'customer') && <li><a href="#pricing">Pricing</a></li>}
            <li><a href="#about">About</a></li>
          </ul>
          <div
            className="auth-buttons"
            style={{
              position: 'absolute',
              right: 30,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
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
      <div style={{ height: '90px' }}></div>
    </>
  );
}
