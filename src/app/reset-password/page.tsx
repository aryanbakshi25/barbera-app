'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { toast } from "react-hot-toast";
import Image from 'next/image';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize Supabase client for browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle Password Reset Request
  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setEmail('');
        toast.success('Password reset email sent successfully!');
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
    handleResetPassword();
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
            <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>Check Your Email</h2>
            <p className="text-gray-400 text-xl">We&apos;ve sent you a password reset link</p>
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
              Password reset instructions have been sent to your email address. Please check your inbox and follow the link to reset your password.
            </p>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link 
              href="/login" 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-lg"
            >
              ← Back to Sign In
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
          <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>Reset Password</h2>
          <p className="text-gray-400 text-xl">Enter your email to receive reset instructions</p>
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
          <div style={{ marginBottom: '50px' }}>
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

          {/* Reset Password Button */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg"
            style={{lineHeight: 2.5 }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
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