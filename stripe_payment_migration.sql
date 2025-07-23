-- Add payment tracking columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_appointments_payment_intent_id 
ON appointments(payment_intent_id);

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status 
ON appointments(payment_status);

-- Update existing appointments to have 'paid' status if they don't have payment tracking
UPDATE appointments 
SET payment_status = 'paid' 
WHERE payment_status IS NULL OR payment_status = 'pending'; 