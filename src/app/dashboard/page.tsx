"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { format, parseISO } from 'date-fns';
import Navbar from "@/components/Navbar";

interface Appointment {
  id: string;
  appointment_time: string;
  status: string;
  payment_status?: string;
  service: { name: string; } | null;
  barber: { username: string; } | null;
  customer: { username: string; } | null;
}



export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPastAppointments, setShowPastAppointments] = useState(false);

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
        .select(`
          id, 
          appointment_time, 
          status, 
          payment_status,
          service_id,
          barber_id,
          customer_id,
          services(name),
          barber_profile:barber_id(username),
          customer_profile:customer_id(username)
        `)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (data || []).map((appt: any) => {
        return {
          id: appt.id,
          appointment_time: appt.appointment_time,
          status: appt.status,
          payment_status: appt.payment_status,
          service: appt.services || null,
          barber: appt.barber_profile || null,
          customer: appt.customer_profile || null,
        };
      }) as Appointment[];
      
      setAppointments(normalized);
      setLoading(false);
    };
    fetchAppointments();
    // eslint-disable-next-line
  }, []);

  // Filter appointments based on date and showPastAppointments state
  const filteredAppointments = appointments.filter(appt => {
    const appointmentDate = new Date(appt.appointment_time);
    const now = new Date();
    const isPast = appointmentDate < now;
    
    if (showPastAppointments) {
      return true; // Show all appointments
    } else {
      return !isPast; // Only show future appointments
    }
  });

  return (
    <main>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#18181b', padding: '2rem 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: '#232526', borderRadius: 16, padding: 32, color: '#fff', boxShadow: '0 4px 32px #0008' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          {role === 'barber' ? 'Received Appointments' : 'My Booked Appointments'}
        </h2>
        
        {/* Toggle button for past appointments */}
        {!loading && !error && appointments.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setShowPastAppointments(!showPastAppointments)}
              style={{
                background: showPastAppointments ? '#10b981' : 'transparent',
                color: showPastAppointments ? '#ffffff' : '#10b981',
                border: '1px solid #10b981',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!showPastAppointments) {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!showPastAppointments) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#10b981';
                }
              }}
            >
              {showPastAppointments ? 'Hide Past Appointments' : 'Show Past Appointments'}
            </button>
          </div>
        )}
        
        {loading ? (
          <div style={{ color: '#bbb', textAlign: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{ color: '#bbb', textAlign: 'center' }}>
            {showPastAppointments ? 'No appointments found.' : 'No upcoming appointments found.'}
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {/* Desktop Table View */}
            <div className="hidden md:table" style={{ display: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#18181b' }}>
                    <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Service</th>
                    <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Date</th>
                    <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Time</th>
                    <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>{role === 'barber' ? 'Customer' : 'Barber'}</th>
                    <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Status</th>
                    <th style={{ color: '#10b981', padding: '12px 8px', fontWeight: 600 }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(appt => {
                    const dt = parseISO(appt.appointment_time);
                    const isPast = dt < new Date();
                    return (
                      <tr 
                        key={appt.id} 
                        style={{ 
                          borderBottom: '1px solid #333',
                          opacity: isPast ? 0.6 : 1,
                        }}
                      >
                        <td style={{ padding: '10px 8px', color: '#fff' }}>{appt.service?.name || '-'}</td>
                        <td style={{ padding: '10px 8px', color: '#fff' }}>{format(dt, 'MMM d, yyyy')}</td>
                        <td style={{ padding: '10px 8px', color: '#fff' }}>{format(dt, 'h:mm a')}</td>
                        <td style={{ padding: '10px 8px', color: '#fff' }}>{role === 'barber' ? appt.customer?.username : appt.barber?.username}</td>
                        <td style={{ padding: '10px 8px', color: appt.status === 'confirmed' ? '#10b981' : '#f59e42', fontWeight: 600 }}>
                          {appt.status ? appt.status.replace(/^'|'$/g, '') : 'pending'}
                        </td>
                        <td style={{ padding: '10px 8px', color: appt.payment_status === 'paid' ? '#10b981' : '#f59e42', fontWeight: 600 }}>
                          {appt.payment_status || 'pending'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden" style={{ display: 'block' }}>
              {filteredAppointments.map(appt => {
                const dt = parseISO(appt.appointment_time);
                const isPast = dt < new Date();
                return (
                  <div
                    key={appt.id}
                    style={{
                      background: '#1a1a1a',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      border: '1px solid #333',
                      opacity: isPast ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>
                          {appt.service?.name || '-'}
                        </div>
                        <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                          {format(dt, 'MMM d, yyyy')} at {format(dt, 'h:mm a')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <div style={{ 
                          background: appt.status === 'confirmed' ? '#10b981' : '#f59e42',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {appt.status ? appt.status.replace(/^'|'$/g, '') : 'pending'}
                        </div>
                        <div style={{ 
                          background: appt.payment_status === 'paid' ? '#10b981' : '#f59e42',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {appt.payment_status || 'pending'}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#bbb', fontSize: '0.9rem' }}>
                      {role === 'barber' ? 'Customer: ' : 'Barber: '}
                      <span style={{ color: '#fff', fontWeight: 500 }}>
                        {role === 'barber' ? appt.customer?.username : appt.barber?.username}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
} 