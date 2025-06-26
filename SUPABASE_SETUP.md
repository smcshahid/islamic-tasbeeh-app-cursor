# Supabase Setup Guide for Tasbeeh App

This guide will help you set up Supabase for the Tasbeeh App to enable authentication and cloud sync functionality.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `tasbeeh-app` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure the App

1. Open `src/utils/supabase.ts`
2. Replace the placeholder values:

```typescript
// Replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
```

Example:
```typescript
const supabaseUrl = 'https://abcdefgh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1NzEyMDAsImV4cCI6MjAwNTE0NzIwMH0.example';
```

## 📊 Database Schema Setup

### 4. Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run the following SQL:

```sql
-- Create counters table
CREATE TABLE public.counters (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    target INTEGER,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    counter_id TEXT NOT NULL,
    counter_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    start_count INTEGER DEFAULT 0,
    end_count INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    total_counts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for tables
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for counters table
CREATE POLICY "Users can view their own counters" ON public.counters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own counters" ON public.counters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own counters" ON public.counters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own counters" ON public.counters
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for sessions table
CREATE POLICY "Users can view their own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_counters_user_id ON public.counters(user_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_counter_id ON public.sessions(counter_id);
CREATE INDEX idx_sessions_start_time ON public.sessions(start_time);
```

### 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: 
   - For development: `http://localhost:8081`
   - For production: your app's URL
3. Add **Redirect URLs** (if needed):
   - `http://localhost:8081/**`
   - Your production domain
4. **Email Templates** (optional): Customize welcome/reset emails

## 🔧 Advanced Configuration

### 6. Email Configuration (Optional)

For production, configure custom SMTP:

1. Go to **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable custom SMTP and enter your email provider details

### 7. Security Settings

1. **JWT Settings**: Keep default values
2. **Password Policy**: Configure minimum requirements
3. **Rate Limiting**: Adjust if needed for your use case

## 🧪 Testing the Setup

### 8. Test Authentication

1. Start your Expo app: `npx expo start`
2. Navigate to the Auth screen (`/auth`)
3. Try signing up with a test email
4. Check **Authentication** → **Users** in Supabase dashboard
5. Try signing in with the same credentials

### 9. Test Data Sync

1. Sign in to the app
2. Create some counters and count
3. Go to **Table Editor** in Supabase dashboard
4. Check that data appears in `counters` and `sessions` tables

## 🔒 Security Checklist

- ✅ Row Level Security enabled on all tables
- ✅ Policies restrict access to user's own data
- ✅ anon key is used (not service role key)
- ✅ Database passwords are strong
- ✅ Site URLs are configured correctly

## 🚨 Troubleshooting

### Common Issues

**"Invalid API key" error:**
- Check that you copied the correct anon key
- Ensure no extra spaces in the key

**"Table doesn't exist" error:**
- Run the SQL schema setup commands
- Check table names match exactly

**"Row Level Security" policy error:**
- Ensure RLS policies are created
- Check user is authenticated when making requests

**Authentication not working:**
- Verify Site URL configuration
- Check redirect URLs are correct
- Ensure email confirmation is not required (for testing)

### Debug Mode

To debug Supabase issues:

1. Open browser dev tools
2. Check Network tab for failed requests
3. Look for error messages in Console
4. Check Supabase logs in dashboard

## 📱 Production Deployment

For production deployment:

1. **Update Site URLs** with your production domain
2. **Configure custom SMTP** for email delivery
3. **Set up proper redirect URLs**
4. **Consider upgrading** from free tier if needed
5. **Set up monitoring** and alerts

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://supabase.com/discord
- **GitHub Issues**: Create an issue in this repository

---

**🕌 May Allah accept our dhikr and grant us success in this endeavor. Ameen.** 