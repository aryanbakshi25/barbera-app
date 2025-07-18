# Password Reset Functionality

This document explains the password reset implementation for the Barbera app.

## Overview

The password reset functionality allows users to reset their password if they forget it. The flow consists of three main components:

1. **Password Reset Request** (`/reset-password`)
2. **Password Update** (`/update-password`)
3. **Auth Callback Handler** (`/auth/callback`)

## Flow Description

### 1. Password Reset Request
- User clicks "Forgot your password?" on the login page
- User enters their email address
- System sends a password reset email via Supabase
- User receives a success message

### 2. Password Reset Email
- Supabase sends an email with a reset link
- The link contains a secure token and redirects to `/auth/callback`
- The callback exchanges the token for a session
- User is redirected to `/update-password`

### 3. Password Update
- User enters and confirms their new password
- System validates password requirements (minimum 6 characters)
- Password is updated via Supabase
- User receives success message and is redirected to login

## Files Created/Modified

### New Files
- `src/app/reset-password/page.tsx` - Password reset request page
- `src/app/update-password/page.tsx` - Password update page

### Modified Files
- `src/app/login/page.tsx` - Added "Forgot your password?" link
- `src/app/auth/callback/route.ts` - Enhanced to handle password reset redirects

## Supabase Configuration

### Email Templates
You may want to customize the password reset email template in your Supabase dashboard:

1. Go to Authentication > Email Templates
2. Customize the "Reset Password" template
3. The redirect URL will automatically use the current domain (localhost for development, production URL for production)

### Environment Variables
Make sure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Security Features

- Password reset links expire after a set time (configured in Supabase)
- Tokens are single-use and cannot be reused
- Password validation ensures minimum security requirements
- Session validation prevents unauthorized access to update page

## User Experience

- Consistent UI design matching the existing app
- Clear error messages and success feedback
- Toast notifications for better UX
- Automatic redirects after successful operations
- Responsive design for all screen sizes

## Testing

### Local Development
To test the password reset flow locally:

1. Go to `http://localhost:3000/login` and click "Forgot your password?"
2. Enter a valid email address
3. Check your email for the reset link
4. Click the link and set a new password
5. Verify you can log in with the new password

### Production
The same flow works in production at `https://barbera.vercel.app/login`

## Deployment

The password reset functionality is production-ready and will automatically work in both development and production environments. The system uses dynamic URLs based on the current domain:

- **Development**: `http://localhost:3000/update-password`
- **Production**: `https://barbera.vercel.app/update-password`

No additional configuration is needed for deployment.

## Troubleshooting

### Common Issues
- **Email not received**: Check spam folder and Supabase email settings
- **Invalid link**: Links expire after a certain time, request a new one
- **Session errors**: Clear browser cookies and try again

### Supabase Dashboard Checks
- Verify email provider is configured
- Check email template settings
- Ensure redirect URLs include both localhost and production URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/update-password`
  - `http://localhost:3000/`
  - `https://barbera.vercel.app/auth/callback`
  - `https://barbera.vercel.app/update-password`
  - `https://barbera.vercel.app/`
- Monitor authentication logs for errors 