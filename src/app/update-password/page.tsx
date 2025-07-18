'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { toast } from "react-hot-toast";
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

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Initialize Supabase client for browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if user is authenticated and has a valid session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };
    checkSession();
  }, [supabase.auth]);

  // Handle Password Update
  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        toast.success('Password updated successfully!');
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
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
    handleUpdatePassword();
  };

  if (success) {
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
            <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>Password Updated!</h2>
            <p className="text-gray-400 text-xl">Your password has been successfully reset</p>
          </div>

          {/* Success Message */}
          <div 
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 pt-12 mb-10"
            style={{
              paddingLeft: '1rem',
              fontSize: '1rem',
              marginBottom: '1.5rem',
              lineHeight: '3',
            }}
          >
            <p className="text-green-400 font-medium">
              Your password has been successfully updated. You will be redirected to the sign-in page shortly.
            </p>
          </div>

          {/* Manual Login Link */}
          <div className="text-center">
            <Link 
              href="/login" 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-lg"
            >
              Sign In Now →
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>New Password</h2>
          <p className="text-gray-400 text-xl">Enter your new password below</p>
        </div>

        {/* Error Display */}
        {error && (
          <div 
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 pt-12 mb-10"
            style={{
              paddingLeft: '1rem',
              fontSize: '1rem',
              marginBottom: '1.5rem',
              lineHeight: '3',
            }}
          >
            <p className="text-red-400 font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '60px' }}>
          <div style={{ marginBottom: '25px', position: 'relative' }}>
            <label htmlFor="password" className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
              New Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
              placeholder="Enter your new password"
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

          <div style={{ marginBottom: '50px', position: 'relative' }}>
            <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
              placeholder="Confirm your new password"
              style={{paddingLeft: '1rem', lineHeight: '2.5'}}
              disabled={isLoading}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirmPassword((v) => !v)}
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
              <EyeIcon visible={showConfirmPassword} />
            </button>
          </div>

          {/* Update Password Button */}
          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg"
            style={{lineHeight: 2.5 }}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center border-t border-gray-700" style={{ padding: '40px 0', marginBottom: '40px' }}>
          <p className="text-gray-400 text-lg">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Need help? Contact our{' '}
            <Link href="/support" className="text-blue-400 hover:text-blue-300">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 