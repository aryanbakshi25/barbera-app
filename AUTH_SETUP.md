# Authentication Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to your project dashboard
3. Navigate to Settings > API
4. Copy the "Project URL" and "anon public" key to your `.env.local` file

## Database Schema

Make sure you have the following table in your Supabase database:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Email Confirmation

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable "Enable email confirmations"
3. Configure your email templates if needed

## Features

The login page (`/login`) includes:

- **Sign In**: Authenticates existing users and redirects to homepage
- **Sign Up**: Creates new accounts with email confirmation
- **Error Handling**: Displays authentication errors to users
- **Loading States**: Shows loading indicators during authentication
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Navigate to `/login` to access the authentication page
2. Users can either sign in with existing credentials or create a new account
3. New users will receive an email confirmation link
4. After successful authentication, users are redirected to the homepage 