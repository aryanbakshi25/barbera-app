"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { format, parseISO } from 'date-fns';

interface Appointment {
  id: string;
  appointment_time: string;
  status: string;
  service: { name: string; } | null;
  barber: { username: string; } | null;
  customer: { username: string; } | null;
}

interface RawAppointment {
  id: string;
  appointment_time: string;
  status: string;
  service: { name: string; }[];
  barber: { username: string; }[];
  customer: { username: string; }[];
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Not logged in.");
        setLoading(false);
        return;
      }
      // Fetch user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!profile) {
        setError("Could not fetch user profile.");
        setLoading(false);
        return;
      }
      setRole(profile.role);
      let query = supabase.from('appointments')
        .select('id, appointment_time, status, service:service_id(name), barber:barber_id(username), customer:customer_id(username)')
        .order('appointment_time', { ascending: false });
      if (profile.role === 'customer') {
        query = query.eq('customer_id', user.id);
      } else if (profile.role === 'barber') {
        query = query.eq('barber_id', user.id);
      }
      const { data, error: apptError } = await query;
      if (apptError) {
        setError("Failed to fetch appointments.");
        setLoading(false);
        return;
      }
      
      // Transform the data to match the Appointment interface
      const normalized = (data || []).map((appt: RawAppointment) => ({
        ...appt,
        service: appt.service?.[0] || null,
        barber: appt.barber?.[0] || null,
        customer: appt.customer?.[0] || null,
      }));
      
      setAppointments(normalized);
      setLoading(false);
    };
    fetchAppointments();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#18181b', padding: '2rem 0' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: '#232526', borderRadius: 16, padding: 32, color: '#fff', boxShadow: '0 4px 32px #0008' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          {role === 'barber' ? 'Received Appointments' : 'My Booked Appointments'}
        </h2>
        {loading ? (
          <div style={{ color: '#bbb', textAlign: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>
        ) : appointments.length === 0 ? (
          <div style={{ color: '#bbb', textAlign: 'center' }}>No appointments found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ background: '#18181b' }}>
                <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Service</th>
                <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Date</th>
                <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Time</th>
                <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>{role === 'barber' ? 'Customer' : 'Barber'}</th>
                <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => {
                const dt = parseISO(appt.appointment_time);
                return (
                  <tr key={appt.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px 8px', color: '#fff' }}>{appt.service?.name || '-'}</td>
                    <td style={{ padding: '10px 8px', color: '#fff' }}>{format(dt, 'MMM d, yyyy')}</td>
                    <td style={{ padding: '10px 8px', color: '#fff' }}>{format(dt, 'h:mm a')}</td>
                    <td style={{ padding: '10px 8px', color: '#fff' }}>{role === 'barber' ? appt.customer?.username : appt.barber?.username}</td>
                    <td style={{ padding: '10px 8px', color: appt.status === 'confirmed' ? '#10b981' : '#f59e42', fontWeight: 600 }}>{appt.status || 'pending'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 