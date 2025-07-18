'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import Image from 'next/image';

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    // Eye open SVG
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ) : (
    // Eye closed SVG
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 002.25 12s3.75 7.5 9.75 7.5c2.042 0 3.82-.393 5.282-1.023M6.228 6.228A10.45 10.45 0 0112 4.5c6 0 9.75 7.5 9.75 7.5a10.46 10.46 0 01-4.293 4.747M6.228 6.228L3 3m0 0l18 18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize Supabase client for browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle Sign In
  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Fetch user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          if (!profile || !profile.username) {
            router.push('/complete-profile');
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission (for Enter key)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignIn();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '60px' }}>
          <Link href="/" className="inline-block" style={{ marginBottom: '30px' }}>
            <Image
              src="/images/barb_cut_icon.png"
              alt="Barbera Logo"
              width={96}
              height={96}
              className="h-24 w-24 mx-auto"
            />
          </Link>
          <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>Welcome Back</h2>
          <p className="text-gray-400 text-xl">Sign in to your account to continue</p>
        </div>

{/* Error Display */}
{error && (
  <div 
    className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 pt-12 mb-10" // Added pt-12 for extra top padding
    style={{
      paddingLeft: '1rem',
      fontSize: '1rem', // Custom font size
      marginBottom: '1.5rem',
      lineHeight: '3',   // Custom line height
    }}
  >
    <p className="text-red-400 font-medium">
      {error}
    </p>
  </div>
)}





        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '60px' }}>
          <div style={{
            marginBottom: '25px'

           }}>
            <label htmlFor="email" className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
              placeholder="Enter your email address"
              style={{paddingLeft: '1rem', lineHeight: '2.5'}}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '25px', position: 'relative' }}>
            <label htmlFor="password" className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
              placeholder="Enter your password"
              style={{paddingLeft: '1rem', lineHeight: '2.5'}}
              disabled={isLoading}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: '18px',
                top: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                paddingTop: '2rem',
                cursor: 'pointer',
                zIndex: 2,
              }}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right mb-8">
            <Link 
              href="/reset-password" 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg"
            style={{lineHeight: 2.5 }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center border-t border-gray-700" style={{ padding: '40px 0', marginBottom: '40px' }}>
          <p className="text-gray-400 text-lg">
            Don{'\''}t have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 