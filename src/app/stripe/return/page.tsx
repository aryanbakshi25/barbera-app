'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function StripeReturnPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to /account after 3 seconds
    const timer = setTimeout(() => {
      router.push('/account');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-6 py-8">
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
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-12 h-12 text-green-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>
            Onboarding Complete!
          </h2>
          <p className="text-gray-400 text-xl">
            You will now be redirected back to Barbera.
          </p>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Redirecting in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}

