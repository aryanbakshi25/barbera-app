-- Update availability table with proper constraints
-- Run this in your Supabase SQL editor

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS availability;

-- Create the availability table with proper constraints
CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Create an index for better performance
CREATE INDEX idx_availability_user_id ON availability(user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_availability_updated_at 
    BEFORE UPDATE ON availability 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own availability
CREATE POLICY "Users can view own availability" ON availability
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own availability
CREATE POLICY "Users can insert own availability" ON availability
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own availability
CREATE POLICY "Users can update own availability" ON availability
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own availability
CREATE POLICY "Users can delete own availability" ON availability
    FOR DELETE USING (auth.uid() = user_id); 