# Database Migration Guide: Supabase to Neon

This guide will help you migrate your barber appointment booking app from Supabase to Neon (PostgreSQL) while preserving all data and relationships.

## Why Neon?

- **Free Tier**: 3GB storage, 10GB transfer/month
- **PostgreSQL**: Same database engine as Supabase
- **Minimal Code Changes**: Similar API structure
- **Performance**: Excellent for small to medium apps

## Step 1: Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy your connection string (it will look like: `postgresql://username:password@hostname/database`)

## Step 2: Export Data from Supabase

### Export SQL Schema
Run this in your Supabase SQL editor to get the complete schema:

```sql
-- Export all table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;
```

### Export Data
1. Go to Supabase Dashboard → Table Editor
2. For each table, click "Export" → "CSV"
3. Download all tables: profiles, services, appointments, availability, posts, reviews

## Step 3: Set Up Neon Database Schema

Create a new file `neon-schema.sql` with this complete schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    username TEXT,
    role TEXT DEFAULT 'customer',
    profile_picture TEXT,
    bio TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    appointment_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled',
    payment_intent_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create availability table
CREATE TABLE availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, day_of_week)
);

-- Create posts table (portfolio)
CREATE TABLE posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    image_url TEXT,
    images JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_service_id ON appointments(service_id);
CREATE INDEX idx_availability_user_id ON availability(user_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_appointments_payment_intent_id ON appointments(payment_intent_id);
CREATE INDEX idx_appointments_payment_status ON appointments(payment_status);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for availability table
CREATE TRIGGER update_availability_updated_at 
    BEFORE UPDATE ON availability 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Step 4: Update Your Application

### Install Required Packages

```bash
npm install pg @types/pg
```

### Create Database Connection

Create `lib/database.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
```

### Create Database Client

Create `lib/supabase-client.ts`:

```typescript
import pool from './database';

export class DatabaseClient {
  async query(text: string, params?: any[]) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      client.release();
    }
  }

  async from(table: string) {
    return {
      select: (columns: string) => ({
        select: (columns: string) => this.query(`SELECT ${columns} FROM ${table}`),
        eq: (column: string, value: any) => ({
          select: (columns: string) => this.query(`SELECT ${columns} FROM ${table} WHERE ${column} = $1`, [value])
        }),
        order: (column: string, options: { ascending: boolean }) => ({
          select: (columns: string) => this.query(`SELECT ${columns} FROM ${table} ORDER BY ${column} ${options.ascending ? 'ASC' : 'DESC'}`)
        })
      }),
      insert: (data: any) => this.query(`INSERT INTO ${table} (${Object.keys(data).join(', ')}) VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(', ')})`, Object.values(data)),
      update: (data: any) => ({
        eq: (column: string, value: any) => this.query(`UPDATE ${table} SET ${Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ')} WHERE ${column} = $${Object.keys(data).length + 1}`, [...Object.values(data), value])
      }),
      delete: () => ({
        eq: (column: string, value: any) => this.query(`DELETE FROM ${table} WHERE ${column} = $1`, [value])
      })
    };
  }

  // Add authentication methods
  async auth = {
    getUser: async () => {
      // Implement JWT-based authentication
      // This is a simplified version - you'll need to implement proper JWT handling
      return { data: { user: null }, error: null };
    },
    signOut: async () => {
      // Clear JWT token
      return { error: null };
    }
  };
}

export const supabase = new DatabaseClient();
```

## Step 5: Authentication Migration

Since you're losing Supabase Auth, you'll need to implement JWT-based authentication:

### Install JWT Package

```bash
npm install jsonwebtoken @types/jsonwebtoken bcryptjs @types/bcryptjs
```

### Create Auth Utilities

Create `lib/auth.ts`:

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};
```

## Step 6: Environment Variables

Update your `.env.local`:

```env
# Database
DATABASE_URL=postgresql://username:password@hostname/database

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Stripe (keep existing)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 7: Data Migration Script

Create `scripts/migrate-data.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateData() {
  try {
    // Read CSV files and insert data
    const tables = ['profiles', 'services', 'appointments', 'availability', 'posts', 'reviews'];
    
    for (const table of tables) {
      const csvPath = path.join(__dirname, `../data/${table}.csv`);
      if (fs.existsSync(csvPath)) {
        console.log(`Migrating ${table}...`);
        // Implement CSV to database migration
        // This is a simplified version - you'll need proper CSV parsing
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateData();
```

## Step 8: Update Components

You'll need to update all components that use Supabase. Here's an example for the account page:

```typescript
// Replace Supabase imports
import { supabase } from '@/lib/supabase-client';

// Update database calls
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("username, role, profile_picture, bio, location")
  .eq("id", user.id)
  .single();
```

## Alternative: Quick Supabase Account Switch

If you want the fastest migration with minimal code changes:

1. Create a new Supabase account with a different email
2. Create a new project
3. Run your existing SQL migrations
4. Export data from old account
5. Import data to new account
6. Update environment variables

This approach requires zero code changes but you'll lose the old account data.

## Recommendation

I recommend **Neon** because:
- It's PostgreSQL (same as Supabase)
- Generous free tier
- Minimal code changes required
- Better long-term scalability

Would you like me to help you implement any specific part of this migration?

