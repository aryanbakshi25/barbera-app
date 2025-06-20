'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { toast } from "react-hot-toast";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 002.25 12s3.75 7.5 9.75 7.5c2.042 0 3.82-.393 5.282-1.023M6.228 6.228A10.45 10.45 0 0112 4.5c6 0 9.75 7.5 9.75 7.5a10.46 10.46 0 01-4.293 4.747M6.228 6.228L3 3m0 0l18 18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

export default function CompleteProfilePage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function fetchOrCreateProfile() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      router.push('/');
      return;
    }
    // Try to fetch the profile
    let { data, error } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single();
    if (error) {
      // Try to insert a new profile row (ignore duplicate errors)
      await supabase
        .from('profiles')
        .insert([{ id: user.id, username: '', role: 'customer' }], { upsert: true });
      // Try to fetch again
      ({ data, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single());
      if (error) {
        setError('Could not fetch or create profile. Please try again later.');
        setLoading(false);
        return;
      }
    }
    setUsername(data.username || '');
    setRole(data.role || 'customer');
    setLoading(false);
  }

  useEffect(() => {
    fetchOrCreateProfile();
    // eslint-disable-next-line
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not logged in.');
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ username, role })
      .eq('id', user.id);
    if (error) {
      setError('Failed to update profile.');
    } else {
      setSuccess(true);
      toast.success('Profile updated!');
      // Fetch the updated profile to reflect changes
      await fetchOrCreateProfile();
      setTimeout(() => setSuccess(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full" style={{ padding: '40px 0' }}>
        <div className="text-center" style={{ marginBottom: '60px' }}>
          <Link href="/" className="inline-block" style={{ marginBottom: '30px' }}>
            <img
              src="/images/barb_cut_icon.png"
              alt="Barbera Logo"
              className="h-24 w-24 mx-auto"
            />
          </Link>
          <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>Complete Your Profile</h2>
          <p className="text-gray-400 text-xl">Set your username and role</p>
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-lg">Loading...</div>
        ) : (
          <form onSubmit={handleSave} style={{ marginBottom: '60px' }}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 pt-12 mb-10" style={{ paddingLeft: '1rem', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '3' }}>
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 pt-12 mb-10" style={{ paddingLeft: '1rem', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '3' }}>
                <p className="text-green-400 font-medium">Profile updated!</p>
              </div>
            )}
            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="username" className="block text-base font-medium text-gray-300" style={{ marginBottom: '10px' }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
                placeholder="Choose a username"
                style={{paddingLeft: '1rem', lineHeight: '2.5'}}
                disabled={saving}
              />
            </div>
            <div style={{ marginBottom: '50px' }}>
              <label className="block text-base font-medium text-gray-300" style={{ marginBottom: '16px' }}>
                I am a...
              </label>
              <div>
                <label className="flex items-center cursor-pointer" style={{ marginBottom: '16px' }}>
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={role === 'customer'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                    style={{ marginRight: '16px' }}
                    disabled={saving}
                  />
                  <span className="text-gray-300 text-base">Customer (looking for barbers)</span>
                </label>
                <label className="flex items-center cursor-pointer" style={{ marginBottom: '16px' }}>
                  <input
                    type="radio"
                    name="role"
                    value="barber"
                    checked={role === 'barber'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                    style={{ marginRight: '16px' }}
                    disabled={saving}
                  />
                  <span className="text-gray-300 text-base">Barber (providing services)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="both"
                    checked={role === 'both'}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                    style={{ marginRight: '16px' }}
                    disabled={saving}
                  />
                  <span className="text-gray-300 text-base">Both (customer and barber)</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !username}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg"
              style={{lineHeight: 2.5 }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            By completing your profile, you agree to our{' '}
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

// NOTE: If you have RLS enabled on the profiles table, you must have a policy like:
// create policy "Users can update own profile" on profiles for update using (auth.uid() = id); 