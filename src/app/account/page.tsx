"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import ServicesManager from "@/components/ServicesManager";
import AvailabilityManager from "@/components/AvailabilityManager";
import StripeOnboardingButton from "@/components/StripeOnboardingButton";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SupabaseUser {
  id: string;
  email: string;
  // Add more fields if needed
}

interface Service {
  id: string;
  user_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  created_at?: string;
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("customer");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUserAndProfile() {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        router.replace("/login");
        return;
      }
      setUser({ id: user.id, email: user.email ?? "" });
      setEmail(user.email ?? "");
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, role, profile_picture, bio, location, stripe_account_id")
        .eq("id", user.id)
        .single();
      if (profileError) {
        setError("Could not fetch profile.");
      } else {
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setLocation(profile.location || "");
        setRole(profile.role || "customer");
        setProfilePicture(profile.profile_picture || null);
        setStripeAccountId(profile.stripe_account_id || null);
        
        // If user is a barber, fetch their services
        if (profile.role === 'barber') {
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (!servicesError && servicesData) {
            setServices(servicesData);
          }
        }
      }
      setLoading(false);
    }
    fetchUserAndProfile();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (!user) return;

    // Validate username
    if (username.trim().length < 3) {
        setError('Username must be at least 3 characters long.');
        setSaving(false);
        return;
    }

    // Validate bio length
    if (bio.length > 500) {
        setError('Bio must be 500 characters or less.');
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
      .from("profiles")
      .update({ username, role, profile_picture: profilePicture, bio, location })
      .eq("id", user.id);
    if (error) {
      setError("Failed to update profile.");
    } else {
      toast.success("Profile updated!");
      // Redirect to main page after a short delay so the toast is visible
      setTimeout(() => {
        router.push("/");
      }, 800);
    }
    setSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    if (!file) return;
    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    let filePath = `${user.id}.${fileExt}`;
    // Remove all possible previous files for this user
    const possibleExts = ["jpg", "jpeg", "png", "webp", "gif"];
    const removePaths = possibleExts.map((ext) => `${user.id}.${ext}`);
    await supabase.storage.from("avatars").remove(removePaths);

    let uploadResult = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadResult.error) {
      // Only warn for the first (expected) error
      console.warn(
        "Supabase upload warning (first attempt):",
        uploadResult.error
      );
      if (
        uploadResult.error.message === "The resource already exists" ||
        uploadResult.error.message === "Duplicate"
      ) {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        filePath = `${user.id}-${randomSuffix}.${fileExt}`;
        console.log("Retrying upload with new path:", filePath);
        uploadResult = await supabase.storage
          .from("avatars")
          .upload(filePath, file);
        if (uploadResult.error) {
          // Only log as error if the retry fails
          console.error("Supabase upload error (retry):", uploadResult.error);
          toast.error(
            `Failed to upload image (retry): ${uploadResult.error.message}`
          );
          return;
        }
      } else {
        console.error("Supabase upload error:", uploadResult.error);
        toast.error(`Failed to upload image: ${uploadResult.error.message}`);
        return;
      }
    }
    // Get public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setProfilePicture(data.publicUrl || null);
    toast.success("Profile picture updated!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300 text-xl">
        Loading...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4 md:px-8 lg:px-12 py-8">
      <div className={`${role === 'barber' ? 'max-w-md md:max-w-4xl lg:max-w-5xl' : 'max-w-3xl md:max-w-4xl lg:max-w-5xl'} mx-auto`} style={{ padding: "40px 0" }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "60px" }}>
          <Link
            href="/"
            className="inline-block"
            style={{ marginBottom: "30px" }}
          >
            <Image
              src="/images/barb_cut_icon.png"
              alt="Barbera Logo"
              width={96}
              height={96}
              className="h-24 w-24 mx-auto"
            />
          </Link>
          <h2
            className="text-5xl font-bold text-white"
            style={{ marginBottom: "12px" }}
          >
            Account
          </h2>
          <p className="text-gray-400 text-xl">View and update your profile</p>
        </div>
        {error && (
          <div
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 pt-12 mb-10"
            style={{
              paddingLeft: "1rem",
              fontSize: "1rem",
              marginBottom: "1.5rem",
              lineHeight: "3",
            }}
          >
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}
        <form onSubmit={handleSave} style={{ marginBottom: "60px" }}>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
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
            <span className="text-gray-400 text-sm">{email}</span>
          </div>
          <div className="w-full max-w-4xl mx-auto" style={{ marginBottom: "25px" }}>
            <label
              htmlFor="username"
              className="block text-base font-medium text-gray-300"
              style={{ marginBottom: "10px" }}
            >
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
              placeholder="Enter your username"
              style={{ paddingLeft: "1rem", lineHeight: "2.5" }}
              disabled={saving}
            />
          </div>
          <div style={{ marginBottom: "25px" }}>
            <label
              htmlFor="location"
              className="block text-base font-medium text-gray-300"
              style={{ marginBottom: "10px" }}
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              autoComplete="off"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
              placeholder="Enter your location (e.g., New York, NY)"
              style={{ paddingLeft: "1rem", lineHeight: "2.5" }}
              disabled={saving}
            />
          </div>
          <div style={{ marginBottom: "50px" }}>
            <label
              className="block text-base font-medium text-gray-300"
              style={{ marginBottom: "16px" }}
            >
              Role
            </label>
            <div>
              <label
                className="flex items-center cursor-pointer"
                style={{ marginBottom: "16px" }}
              >
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={role === "customer"}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                  style={{ marginRight: "16px" }}
                  disabled={saving}
                />
                <span className="text-gray-300 text-base">Customer</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="barber"
                  checked={role === "barber"}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                  style={{ marginRight: "16px" }}
                  disabled={saving}
                />
                <span className="text-gray-300 text-base">Barber</span>
              </label>
            </div>
          </div>
          <div style={{ marginBottom: "50px" }}>
            <label
              htmlFor="bio"
              className="block text-base font-medium text-gray-300"
              style={{ marginBottom: "10px" }}
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base resize-none"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
              style={{ paddingLeft: "1rem", lineHeight: "2.2" }}
              disabled={saving}
            />
            <p className="text-gray-500 text-sm mt-2">
              {bio.length}/500 characters
            </p>
          </div>
        </form>
        
        {/* Services Management for Barbers */}
        {role === 'barber' && user && (
          <div className="mt-8">
            <ServicesManager user={user} initialServices={services} />
          </div>
        )}
        
        {/* Availability Management for Barbers */}
        {role === 'barber' && user && (
          <AvailabilityManager user={user} />
        )}
        
        {/* Stripe Connect Onboarding for Barbers */}
        {role === 'barber' && user && (
          <div className="mt-8 mb-8">
            <div style={{ marginBottom: '25px' }}>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-medium text-gray-300">
                  Payment Setup
                </label>
                {/* Status Indicator */}
                {stripeAccountId ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 500 }}>Completed</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>REQUIRED</span>
                  </div>
                )}
              </div>
              
              {/* Required Warning Box */}
              {!stripeAccountId && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  paddingBottom: '2rem',
                }}>
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    <div>
                      <p className="text-red-300 font-semibold text-base" style={{ marginBottom: '0.5rem' }}>
                        Payment Setup Required
                      </p>
                      <p className="text-red-200/90 text-sm">
                        You <strong>must</strong> complete Stripe onboarding to receive payouts from appointments. 
                        Without this setup, you will not be able to accept payments or receive earnings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {stripeAccountId && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  paddingBottom: '2rem',
                }}>
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-green-300 font-semibold text-base" style={{ marginBottom: '0.5rem' }}>
                        Payment Setup Complete
                      </p>
                      <p className="text-green-200/90 text-sm">
                        Your Stripe account is connected. You can now receive payouts from appointments. 
                        Click the button below to update your account details if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Instructions Box */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                paddingBottom: '2rem',
              }}>
                <p className="text-blue-300 text-sm font-medium" style={{ marginBottom: '0.5rem' }}>What to expect:</p>
                <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                  <li>You&apos;ll be redirected to Stripe&apos;s secure onboarding page</li>
                  <li>Fill in your business information and personal details</li>
                  <li>When asked for bank account setup, select <strong className="text-gray-300">&quot;Bank account (no OAuth)&quot;</strong> or <strong className="text-gray-300">&quot;Enter bank details directly&quot;</strong></li>
                  <li>Complete all required fields to finish setup</li>
                </ul>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <StripeOnboardingButton hasAccount={!!stripeAccountId} />
              </div>
            </div>
          </div>
        )}
        
        {/* Save Changes Button */}
        <button
          onClick={handleSave}
          disabled={saving || username.trim().length < 3}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg cursor-pointer"
          style={{ lineHeight: 2.5, marginBottom: '35px'}}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        
        <div className="text-center border-t border-gray-700 mt-12" style={{ paddingTop: '30px' }}>
            <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-400 font-medium transition-colors"
            >
                Sign Out
            </button>
        </div>
      </div>
    </div>
  );
}