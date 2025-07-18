'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Camera, Sparkles, Smartphone, Users, Star } from 'lucide-react';

export default function ARHairFilterPage() {
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
          <h2 className="text-5xl font-bold text-white" style={{ marginBottom: '12px' }}>AR Hair Filter</h2>
          <p className="text-gray-400 text-xl">Try on hairstyles virtually with our Snapchat-style AR filter</p>
        </div>

        {/* Coming Soon Badge */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-6 py-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-medium">Coming Soon</span>
          </div>
        </div>

        {/* Feature Description */}
        <div style={{ marginBottom: '60px' }}>
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            Experience the future of hairstyling with our revolutionary AR hair filter. 
            Try on different hairstyles, cuts, and colors in real-time using your device's camera. 
            See how you'll look before making any changes to your actual hair.
          </p>

          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-gray-300">Real-time preview with your camera</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-gray-300">Hundreds of professional hairstyles</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-gray-300">High-quality filters by expert stylists</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-gray-300">Easy sharing with friends and barbers</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ marginBottom: '60px' }}>
          <Link 
            href="/discover" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg block text-center"
            style={{lineHeight: 2.5 }}
          >
            Find Your Barber
          </Link>
        </div>

        {/* Newsletter Signup */}
        <div style={{ marginBottom: '60px' }}>
          <h3 className="text-xl font-bold text-white mb-4 text-center">Get Notified</h3>
          <p className="text-gray-300 mb-6 text-center">
            Be the first to know when our AR hair filter launches.
          </p>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full px-6 py-5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-colors text-base"
              style={{paddingLeft: '1rem', lineHeight: '2.5'}}
            />
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg"
              style={{lineHeight: 2.5 }}
            >
              Notify Me
            </button>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center border-t border-gray-700" style={{ padding: '40px 0', marginBottom: '40px' }}>
          <p className="text-gray-400 text-lg">
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Barbera. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 