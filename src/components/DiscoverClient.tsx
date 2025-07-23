"use client";
import { useEffect, useState } from "react";
import BarberCard from "./BarberCard";

interface Barber {
  id: string;
  username: string;
  bio: string;
  location: string;
  profile_picture: string;
  role: string;
  latitude: number;
  longitude: number;
}

export default function DiscoverClient({ barbers }: { barbers: Barber[] }) {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation error:", error);
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <>
      {/* Barbers Grid */}
      {barbers && barbers.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          padding: '0 1rem',
        }}>
          {barbers.map((barber) => (
            <BarberCard key={barber.id} profile={barber} />
          ))}
        </div>
      ) : (
        // No barbers found message
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#232526',
          borderRadius: '12px',
          border: '1px solid #333',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}>
            ✂️
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#fff',
            marginBottom: '0.5rem',
          }}>
            No barbers found at this time
          </h2>
          <p style={{
            color: '#BDBDBD',
            fontSize: '1rem',
          }}>
            Check back later for new barber profiles.
          </p>
        </div>
      )}

      {/* Results Count */}
      {barbers && barbers.length > 0 && (
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '1rem',
          color: '#BDBDBD',
          fontSize: '0.9rem',
        }}>
          Showing {barbers.length} barber{barbers.length !== 1 ? 's' : ''}
        </div>
      )}
    </>
  );
}
