'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { toast } from "react-hot-toast";
import Image from 'next/image';

export default function CompleteProfilePage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('customer');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log(router); // Satisfy linter

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
      .select('username, role, profile_picture')
      .eq('id', user.id)
      .single();
    if (error) {
      // Try to insert a new profile row (ignore duplicate errors)
      await supabase
        .from('profiles')
        .upsert({ id: user.id, username: '', role: 'customer' });
      // Try to fetch again
      ({ data, error } = await supabase
        .from('profiles')
        .select('username, role, profile_picture')
        .eq('id', user.id)
        .single());
      if (error || !data) {
        setError('Could not fetch or create profile. Please try again later.');
        setLoading(false);
        return;
      }
    }
    if (data) {
      setUsername(data.username || '');
      setRole(data.role || 'customer');
      setProfilePicture(data.profile_picture || null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchOrCreateProfile();
    // eslint-disable-next-line
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    let filePath = `${user.id}.${fileExt}`;
    
    // Remove all possible previous files for this user
    const possibleExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const removePaths = possibleExts.map(ext => `${user.id}.${ext}`);
    await supabase.storage.from('avatars').remove(removePaths);
    
    let uploadResult = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadResult.error) {
      if (
        uploadResult.error.message === 'The resource already exists' ||
        uploadResult.error.message === 'Duplicate'
      ) {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        filePath = `${user.id}-${randomSuffix}.${fileExt}`;
        uploadResult = await supabase.storage
          .from("avatars")
          .upload(filePath, file);
        if (uploadResult.error) {
          toast.error(`Failed to upload image (retry): ${uploadResult.error.message}`);
          return;
        }
      } else {
        toast.error(`Failed to upload image: ${uploadResult.error.message}`);
        return;
      }
    }
    
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setProfilePicture(data.publicUrl || null);
    toast.success("Profile picture updated!");
  };

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

    // Validate username isn't just whitespace
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      setSaving(false);
      return;
    }

    // Securely check if username is taken using the database function
    const { data: isTaken, error: rpcError } = await supabase.rpc(
      'is_username_taken',
      {
        username_to_check: username,
        user_id_to_exclude: user.id,
      }
    );

    if (rpcError) {
      setError('Error checking username. Please try again.');
      setSaving(false);
      return;
    }

    if (isTaken) {
      setError('This username is already taken. Please choose another.');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username, role, profile_picture: profilePicture })
      .eq('id', user.id);
    if (error) {
      setError('Failed to update profile.');
    } else {
      setSuccess(true);
      toast.success('Profile updated!');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full" style={{ padding: '40px 0' }}>
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
            <div className="flex flex-col items-center mb-8">
                <div className="relative w-28 h-28 mb-3">
                    <Image
                        src={profilePicture || "/images/default_pfp.png"}
                        alt="Profile Picture"
                        width={112}
                        height={112}
                        className="rounded-full object-cover aspect-square border-2 border-gray-700"
                        style={{ width: 112, height: 112 }}
                    />
                    <button
                        type="button"
                        className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 focus:outline-none cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        title="Change profile picture"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
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
                <label className="flex items-center cursor-pointer">
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
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || username.trim().length < 3}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg cursor-pointer"
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