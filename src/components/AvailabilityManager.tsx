'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import React from 'react';

interface SupabaseUser {
  id: string;
  email: string;
}

interface Availability {
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface AvailabilityManagerProps {
  user: SupabaseUser;
}

export default function AvailabilityManager({ user }: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get current date and calculate next occurrence of each day
  const getNextDayDate = (dayOfWeek: number): string => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + daysUntilNext);
    
    return nextDay.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Days of the week for display
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Generate time options with 5-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Convert to 12-hour format with AM/PM for display
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
        
        options.push({
          value: timeString,
          display: displayTime
        });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Initialize availability state with default values
  const initializeAvailability = () => {
    const defaultAvailability: Availability[] = daysOfWeek.map(day => ({
      user_id: user.id,
      day_of_week: day.value,
      start_time: '09:00',
      end_time: '17:00',
    }));
    setAvailability(defaultAvailability);
  };

  // Fetch existing availability from database
  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week');

      if (error) {
        console.error('Error fetching availability:', error);
        toast.error('Failed to load availability schedule');
        // Initialize with default values if fetch fails
        initializeAvailability();
        return;
      }

      if (data && data.length > 0) {
        // Normalize: if a day is not closed but has 00:00, set to 09:00/17:00
        const normalized = data.map((item: Availability) => {
          if (item.start_time === '00:00' && item.end_time === '00:00') {
            return item; // closed day
          }
          return {
            ...item,
            start_time: item.start_time === '00:00' ? '09:00' : item.start_time,
            end_time: item.end_time === '00:00' ? '17:00' : item.end_time,
          };
        });
        setAvailability(normalized);
      } else {
        // Initialize with default values if no data exists
        initializeAvailability();
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability schedule');
      initializeAvailability();
    } finally {
      setLoading(false);
    }
  };

  // Load availability on component mount
  useEffect(() => {
    fetchAvailability();
  }, [user.id, fetchAvailability]);

  // Update time for a specific day
  const updateTime = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => 
      prev.map(item => 
        item.day_of_week === dayOfWeek 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // Validate time inputs
  const validateTimes = (): boolean => {
    for (const day of availability) {
      // Skip validation for closed days
      if (day.start_time === '00:00' && day.end_time === '00:00') continue;
      if (day.start_time >= day.end_time) {
        toast.error(`${daysOfWeek.find(d => d.value === day.day_of_week)?.label}: Start time must be before end time`);
        return false;
      }
    }
    return true;
  };

  // Save availability schedule to database
  const handleSaveSchedule = async () => {
    if (!validateTimes()) {
      return;
    }

    try {
      setSaving(true);

      // First, delete all existing availability for this user
      const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting existing availability:', deleteError);
        toast.error('Failed to update schedule');
        return;
      }

      // Then, insert new availability records
      const { error: insertError } = await supabase
        .from('availability')
        .insert(availability);

      if (insertError) {
        console.error('Error inserting availability:', insertError);
        toast.error('Failed to save schedule');
        return;
      }

      toast.success('Schedule updated successfully!');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  // Toggle day availability (set to closed or open)
  const toggleDayClosed = (dayOfWeek: number) => {
    setAvailability(prev => 
      prev.map(item => 
        item.day_of_week === dayOfWeek 
          ? { 
              ...item, 
              start_time: isDayClosed(item) ? '09:00' : '00:00', 
              end_time: isDayClosed(item) ? '17:00' : '00:00' 
            }
          : item
      )
    );
  };

  // Check if a day is set to closed (00:00-00:00)
  const isDayClosed = (day: Availability) => {
    return day.start_time === '00:00' && day.end_time === '00:00';
  };

  // Helper to get the correct value for dropdowns
  const getDropdownValue = (value: string, isClosed: boolean, type: 'start' | 'end') => {
    if (isClosed) return '00:00';
    if (!value || value === '00:00') return type === 'start' ? '09:00' : '17:00';
    return value;
  };

  // Apply first day's times to all open days
  const applyToAllDays = () => {
    if (availability.length === 0) return;
    const firstDay = availability[0];
    setAvailability(prev =>
      prev.map((item, idx) =>
        idx === 0 || isDayClosed(item)
          ? item
          : { ...item, start_time: firstDay.start_time, end_time: firstDay.end_time }
      )
    );
  };

  // // Helper to normalize time (strip seconds)
  // function normalizeTime(time: string) {
  //   // Handles '09:00:00' -> '09:00'
  //   return time.length === 8 ? time.slice(0, 5) : time;
  // }

  if (loading) {
    return (
      <div style={{
        background: '#232526',
        borderRadius: '12px',
        padding: '2rem',
        marginTop: '2rem',
        border: '1px solid #333',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#bbb',
          fontSize: '1rem',
        }}>
          Loading availability schedule...
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: '#232526',
        borderRadius: '12px',
        padding: '2rem',
        marginTop: '2rem',
        marginBottom: '3rem',
        border: '1px solid #333',
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          Weekly Availability Schedule
        </h3>

        <div style={{
          marginBottom: '2rem',
        }}>
          <p style={{
            color: '#bbb',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: '1rem',
          }}>
            Set your working hours for each day of the week. (This sets your availability for every week)
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          {daysOfWeek.map((day, idx) => {
            const dayAvailability = availability.find(a => a.day_of_week === day.value);
            const isClosed = dayAvailability ? isDayClosed(dayAvailability) : false;
            const nextDate = getNextDayDate(day.value);

            return (
              <div
                key={day.value}
                className="availability-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: idx === 0 ? '2rem 1rem 2.5rem 1rem' : '1rem',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  position: 'relative',
                }}
              >
                {/* Day label with date */}
                <div
                  className="availability-day-label"
                  style={{
                    width: '120px',
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                  }}
                >
                  <div>{day.label}</div>
                  <div style={{
                    color: '#888',
                    fontSize: '0.8rem',
                    fontWeight: 400,
                  }}>
                    {nextDate}
                  </div>
                </div>

                {/* Start time dropdown */}
                <div
                  className="availability-time-col"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginRight: '1rem',
                    flex: 1,
                  }}
                >
                  <label style={{
                    color: '#bbb',
                    fontSize: '0.8rem',
                    marginBottom: '0.25rem',
                  }}>
                    Start Time
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={getDropdownValue(dayAvailability?.start_time ?? '', isClosed, 'start')}
                      onChange={(e) => updateTime(day.value, 'start_time', e.target.value)}
                      disabled={saving}
                      style={{
                        padding: '0.5rem',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        opacity: isClosed ? 0.5 : 1,
                        appearance: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {timeOptions.map(option => (
                        <option key={option.value} value={option.value} style={{ background: '#333' }}>
                          {option.display}
                        </option>
                      ))}
                    </select>
                    {/* Dropdown icon */}
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#888',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* End time dropdown */}
                <div
                  className="availability-time-col"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginRight: '1rem',
                    flex: 1,
                  }}
                >
                  <label style={{
                    color: '#bbb',
                    fontSize: '0.8rem',
                    marginBottom: '0.25rem',
                  }}>
                    End Time
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={getDropdownValue(dayAvailability?.end_time ?? '', isClosed, 'end')}
                      onChange={(e) => updateTime(day.value, 'end_time', e.target.value)}
                      disabled={saving}
                      style={{
                        padding: '0.5rem',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        opacity: isClosed ? 0.5 : 1,
                        appearance: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {timeOptions.map(option => (
                        <option key={option.value} value={option.value} style={{ background: '#333' }}>
                          {option.display}
                        </option>
                      ))}
                    </select>
                    {/* Dropdown icon */}
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#888',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div
                  className="availability-status"
                  style={{
                    width: '80px',
                    textAlign: 'center',
                  }}
                >
                  {isClosed ? (
                    <span style={{
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}>
                      Closed
                    </span>
                  ) : (
                    <span style={{
                      color: '#10b981',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}>
                      Open
                    </span>
                  )}
                </div>

                {/* Button group for toggle and apply-all (desktop: row, mobile: column) */}
                <div className="availability-btn-group" style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <button
                    className="availability-toggle-btn"
                    onClick={() => toggleDayClosed(day.value)}
                    disabled={saving}
                    style={{
                      padding: '0.5rem 1rem',
                      background: isClosed ? '#10b981' : '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {isClosed ? 'Set Open' : 'Close Day'}
                  </button>
                  {/* Apply to All Days button (only for first day, in line with toggle button) */}
                  {idx === 0 && (
                    <button
                      type="button"
                      onClick={applyToAllDays}
                      className="apply-all-btn"
                      style={{
                        marginLeft: '0.5rem',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        opacity: saving ? 0.5 : 1,
                      }}
                      disabled={saving}
                    >
                      Apply to All Days
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            style={{
              background: saving ? '#555' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '1rem 2rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'background-color 0.2s ease',
              minWidth: '200px',
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.background = '#3b82f6';
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>

        {/* Help text */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #444',
          paddingBottom: '2rem',
        }}>
          <h4 style={{
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}>
            Tips:
          </h4>
          <ul style={{
            color: '#bbb',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            paddingLeft: '1.5rem',
          }}>
            <li>Set both start and end times to 00:00 to mark a day as closed</li>
            <li>Start time must be before end time for each day</li>
            <li>Your schedule will be visible to customers when they book appointments</li>
            <li>You can update your schedule at any time</li>
          </ul>
        </div>
      </div>

      {/* Responsive styles for mobile */}
      <style jsx global>{`
        @media (max-width: 600px) {
          .availability-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.75rem;
            padding: 1rem 0.5rem !important;
          }
          .availability-day-label {
            width: 100% !important;
            margin-bottom: 0.5rem;
            text-align: left !important;
          }
          .availability-time-col {
            margin-right: 0 !important;
            width: 100% !important;
          }
          .availability-status {
            width: 100% !important;
            text-align: left !important;
            margin-bottom: 0.5rem;
          }
          .availability-btn-group {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100%;
            gap: 0.5rem;
          }
          .availability-toggle-btn,
          .apply-all-btn {
            width: 100%;
            margin-left: 0 !important;
          }
          .availability-row select {
            width: 100% !important;
            min-height: 44px;
            font-size: 1rem;
          }
          .availability-row button {
            min-height: 44px;
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
}

// Export styles component for backward compatibility
export const AvailabilityManagerStyles = () => null;