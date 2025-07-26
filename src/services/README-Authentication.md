# Talk to August - Authentication & Database Setup Guide

## Overview

This guide covers setting up authentication and the database for the Talk to August app using Supabase.

## Prerequisites

- Supabase account ([supabase.com](https://supabase.com))
- Node.js and npm/yarn installed
- Expo CLI installed

## 1. Supabase Project Setup

### Create a New Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `talk-to-august`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"

### Get Your Project Credentials
1. Go to Settings → API
2. Copy these values:
   - **Project URL** (SUPABASE_URL)
   - **Project API Key** (anon/public key) (SUPABASE_ANON_KEY)

## 2. Environment Variables Setup

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Important**: 
- Replace the placeholder values with your actual Supabase credentials
- Never commit this file to version control (it's already in .gitignore)
- Use `EXPO_PUBLIC_` prefix for variables you need in the client

## 3. Database Schema Setup

### Method 1: Using the SQL Editor (Recommended)

1. In your Supabase dashboard, go to "SQL Editor"
2. Copy the entire contents of `src/services/database-setup.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute all the SQL

### Method 2: Manual Table Creation

If you prefer to create tables individually, you can use the Table Editor in Supabase:

1. Go to "Table Editor" in your Supabase dashboard
2. Create each table manually using the schema defined in `database-setup.sql`

## 4. Database Schema Overview

The database includes these key tables:

### Core Tables
- **users**: User profile information (age_range, gender, sexuality, relationship_status)
- **onboarding_selections**: User's initial goal preferences
- **journal_entries**: User journal entries with optional tags
- **goals**: User-defined wellness goals with categories and completion tracking
- **daily_wellness_ratings**: Daily 1-5 scale wellness check-ins (one per day per user)

### Feature Tables
- **audio_guides**: Audio content metadata and file paths
- **audio_guide_progress**: User listening progress tracking
- **chat_history**: August AI conversation history
- **sexual_happiness_scores**: Calculated wellness scores over time

### Security Features
- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own data
- **Public Audio**: All users can read audio guides
- **Auth Integration**: Uses Supabase Auth for user identification

## 5. Authentication Flow

### Sign Up Process
```typescript
const { signUp } = useAuth()
const response = await signUp(email, password, username)
```

### Sign In Process
```typescript
const { signIn } = useAuth()
const response = await signIn(email, password)
```

### Auth State Management
```typescript
const { user, loading } = useAuth()
// user: null when logged out, User object when logged in
// loading: true during auth state transitions
```

## 6. Testing Your Setup

### Test Database Connection
1. Try creating a test account in your app
2. Check the Supabase dashboard → Authentication → Users to see if the user was created
3. Check Table Editor to see if related data appears in your tables

### Test Environment Variables
1. Start your development server: `npx expo start`
2. Look for the env loading message: `env: load .env`
3. If you see Supabase errors, check your environment variables

## 7. Common Issues & Troubleshooting

### "supabaseUrl is required" Error
- Check that your `.env` file exists in the project root
- Verify the variable names use `EXPO_PUBLIC_` prefix
- Restart your development server after changing environment variables

### Authentication Errors
- Verify your Supabase project is active (not paused)
- Check that your API keys are correct
- Ensure RLS policies are properly configured

### Database Connection Issues
- Confirm your database schema was created successfully
- Check that all tables have RLS enabled
- Verify the user isolation policies are in place

### Development vs Production
- Development: Use `.env` file for local testing
- Production: Set environment variables in your hosting platform
- Never expose your service role key on the client side

## 8. Next Steps

After completing this setup:

1. **Test Authentication**: Create and log in with test accounts
2. **Implement Onboarding**: Build the user profile setup flow
3. **Add Features**: Journal, goals, audio guides, and AI chat
4. **Configure Storage**: Set up file storage for audio guides
5. **Add Analytics**: Track user engagement and wellness scores

## 9. Production Considerations

### Security
- Enable email confirmation for production
- Set up proper SMTP for email delivery
- Configure custom domains for auth emails
- Review and tighten RLS policies as needed

### Performance
- Monitor database performance in Supabase dashboard
- Add additional indexes for frequently queried data
- Consider implementing caching for audio guides

### Monitoring
- Set up Supabase monitoring and alerts
- Implement error tracking (e.g., Sentry)
- Monitor user authentication flows

## 10. Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with React Native](https://supabase.com/docs/guides/auth/auth-helpers/react-native)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need Help?** Check the Supabase documentation or the auth service implementation in `src/services/auth.ts` for more details. 