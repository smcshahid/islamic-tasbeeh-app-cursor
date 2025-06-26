# 🚀 Supabase Setup Guide - Tasbeeh App

This guide provides step-by-step instructions for setting up Supabase backend infrastructure for the Tasbeeh application, including database schema, authentication, and security configuration.

## 🎯 Overview

### What You'll Set Up
- **Database**: PostgreSQL tables for counters and sessions
- **Authentication**: Email/password with guest mode support
- **Security**: Row Level Security (RLS) policies
- **API**: Auto-generated REST endpoints
- **Real-time**: Live data synchronization

### Prerequisites
- Supabase account (free tier available)
- Basic understanding of PostgreSQL
- Admin access to your Supabase project

## 🔧 Initial Setup

### 1. Create Supabase Project

1. **Visit** [database.new](https://database.new)
2. **Sign in** with GitHub, Google, or email
3. **Create New Project**:
   - **Organization**: Select or create
   - **Name**: `tasbeeh-app-production` (or your preferred name)
   - **Database Password**: Generate strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

4. **Wait** for project initialization (1-2 minutes)

### 2. Get API Credentials

1. **Navigate** to `Settings` → `API`
2. **Copy** the following values:
   ```
   Project URL: https://your-project-id.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Add** to your `.env` file:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   # Keep service role key secure - don't expose to client
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## 🗄️ Database Schema

### 1. Create Tables

Navigate to `SQL Editor` and execute the following SQL:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create counters table
CREATE TABLE public.counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    target INTEGER,
    color TEXT NOT NULL DEFAULT '#22C55E',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES public.counters(id) ON DELETE CASCADE,
    counter_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    start_count INTEGER NOT NULL DEFAULT 0,
    end_count INTEGER NOT NULL DEFAULT 0,
    duration INTEGER DEFAULT 0, -- in seconds
    total_counts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    haptic_feedback BOOLEAN DEFAULT true,
    notifications BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT false,
    default_counter UUID REFERENCES public.counters(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table (for future use)
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Add indexes for performance
CREATE INDEX idx_counters_user_id ON public.counters(user_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_counter_id ON public.sessions(counter_id);
CREATE INDEX idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_achievements_user_id ON public.user_achievements(user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_counters_updated_at BEFORE UPDATE ON public.counters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Set up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Counters policies
CREATE POLICY "Users can view their own counters" ON public.counters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own counters" ON public.counters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own counters" ON public.counters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own counters" ON public.counters
    FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.sessions
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. Create Helper Functions

```sql
-- Function to create default counter for new users
CREATE OR REPLACE FUNCTION create_default_counter_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.counters (user_id, name, color)
    VALUES (NEW.id, 'Default', '#22C55E');
    
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default data for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_counter_for_user();

-- Function to calculate user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_counts', COALESCE(SUM(count), 0),
        'total_counters', COUNT(*),
        'total_sessions', (
            SELECT COUNT(*) FROM public.sessions WHERE user_id = p_user_id
        ),
        'total_time_minutes', (
            SELECT COALESCE(SUM(duration), 0) / 60 FROM public.sessions WHERE user_id = p_user_id
        ),
        'latest_activity', (
            SELECT MAX(updated_at) FROM public.counters WHERE user_id = p_user_id
        )
    ) INTO result
    FROM public.counters
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ language 'plpgsql';
```

## 🔐 Authentication Setup

### 1. Configure Auth Settings

1. **Navigate** to `Authentication` → `Settings`
2. **Configure** the following:

```json
{
  "site_url": "https://your-app-domain.com",
  "additional_redirect_urls": [
    "exp://localhost:8081",
    "tasbeeh-app://auth",
    "https://your-app.netlify.app"
  ],
  "jwt_expiry": 3600,
  "refresh_token_rotation_enabled": true,
  "double_confirm_changes_enabled": false,
  "enable_signup": true,
  "enable_manual_linking": false
}
```

### 2. Email Templates (Optional)

Navigate to `Authentication` → `Email Templates` and customize:

**Confirm Signup Template**:
```html
<h2>Welcome to Tasbeeh App!</h2>
<p>Thank you for joining our spiritual journey. Please confirm your email to start using cloud sync.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>May Allah bless your dhikr practice.</p>
```

**Reset Password Template**:
```html
<h2>Reset Your Tasbeeh App Password</h2>
<p>Someone requested a password reset for your account.</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>If you didn't request this, please ignore this email.</p>
```

### 3. Enable Providers (Optional)

For social authentication (future enhancement):
1. **Navigate** to `Authentication` → `Providers`
2. **Enable** desired providers:
   - Google (for Gmail users)
   - Apple (for iOS users)
   - GitHub (for developers)

## 🔒 Security Configuration

### 1. API Settings

Navigate to `Settings` → `API` and configure:

```json
{
  "db_schema": "public",
  "db_extra_search_path": "public",
  "max_rows": 1000,
  "db_use_legacy_gucs": false
}
```

### 2. Rate Limiting

```sql
-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_seconds INTEGER DEFAULT 3600
)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
BEGIN
    -- Count requests in the time window
    SELECT COUNT(*)
    INTO request_count
    FROM auth.audit_log_entries
    WHERE 
        payload->>'user_id' = p_user_id::TEXT
        AND payload->>'action' = p_action
        AND created_at > NOW() - INTERVAL '1 second' * p_window_seconds;
    
    RETURN request_count < p_max_requests;
END;
$$ language 'plpgsql';
```

### 3. Audit Logging

```sql
-- Create audit log table
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    row_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow viewing own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        row_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Add audit triggers to important tables
CREATE TRIGGER audit_counters
    AFTER INSERT OR UPDATE OR DELETE ON public.counters
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_sessions
    AFTER INSERT OR UPDATE OR DELETE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## 📊 Testing & Validation

### 1. Test Basic Operations

```sql
-- Test data insertion (replace with actual user ID)
INSERT INTO public.counters (user_id, name, color, target)
VALUES ('your-user-id-here', 'Test Counter', '#3B82F6', 100);

-- Test data retrieval
SELECT * FROM public.counters WHERE user_id = 'your-user-id-here';

-- Test session creation
INSERT INTO public.sessions (
    user_id, 
    counter_id, 
    counter_name, 
    start_time, 
    start_count
) VALUES (
    'your-user-id-here',
    (SELECT id FROM public.counters WHERE name = 'Test Counter' LIMIT 1),
    'Test Counter',
    NOW(),
    0
);
```

### 2. Verify RLS Policies

```sql
-- Test RLS (should return empty for other users)
SET request.jwt.claims TO '{"sub": "different-user-id"}';
SELECT * FROM public.counters; -- Should return no rows

-- Reset to your user
SET request.jwt.claims TO '{"sub": "your-user-id-here"}';
SELECT * FROM public.counters; -- Should return your data
```

### 3. Performance Testing

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM public.counters WHERE user_id = 'your-user-id-here';
EXPLAIN ANALYZE SELECT * FROM public.sessions WHERE user_id = 'your-user-id-here' ORDER BY start_time DESC;
```

## 🚀 Production Considerations

### 1. Backup Configuration

1. **Navigate** to `Settings` → `Database`
2. **Enable** Point-in-Time Recovery (PITR)
3. **Set** backup retention to at least 7 days
4. **Schedule** weekly full backups

### 2. Monitoring Setup

```sql
-- Create monitoring views
CREATE VIEW user_activity_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_sessions,
    AVG(duration) as avg_session_duration
FROM public.sessions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

CREATE VIEW popular_counter_names AS
SELECT 
    name,
    COUNT(*) as usage_count,
    AVG(count) as avg_count
FROM public.counters
GROUP BY name
ORDER BY usage_count DESC;
```

### 3. Performance Optimization

```sql
-- Add additional indexes for complex queries
CREATE INDEX idx_sessions_user_date ON public.sessions(user_id, DATE_TRUNC('day', start_time));
CREATE INDEX idx_counters_name_pattern ON public.counters USING gin(name gin_trgm_ops);

-- Create materialized view for statistics
CREATE MATERIALIZED VIEW user_statistics AS
SELECT 
    user_id,
    COUNT(DISTINCT c.id) as total_counters,
    SUM(c.count) as total_counts,
    COUNT(DISTINCT s.id) as total_sessions,
    EXTRACT(EPOCH FROM (MAX(s.end_time) - MIN(s.start_time))) / 86400 as days_active
FROM public.counters c
LEFT JOIN public.sessions s ON c.user_id = s.user_id
GROUP BY user_id;

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_statistics;
END;
$$ language 'plpgsql';
```

## 🔧 Environment-Specific Setup

### Development Environment
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_ENABLE_LOGGING=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### Production Environment
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_ENABLE_LOGGING=false
EXPO_PUBLIC_LOG_LEVEL=error
```

## 🆘 Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   
   -- Check existing policies
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

2. **Authentication Issues**
   ```sql
   -- Check user creation
   SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
   
   -- Check email confirmation status
   SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'user@example.com';
   ```

3. **Performance Issues**
   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY total_time DESC LIMIT 10;
   ```

### Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Community Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues
- **Stack Overflow**: Tag with `supabase`

## 📞 Next Steps

1. **Test** the setup with your mobile app
2. **Monitor** the database performance
3. **Set up** backup procedures
4. **Configure** alerts for critical issues
5. **Plan** for scaling as users grow

---

**🎉 Congratulations!** Your Supabase backend is now ready for the Tasbeeh app. This setup provides a solid foundation for a scalable, secure Islamic prayer counter application. 