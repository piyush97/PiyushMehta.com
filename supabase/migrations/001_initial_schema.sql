-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your_jwt_secret_here';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    website TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    consent_analytics BOOLEAN DEFAULT FALSE,
    consent_marketing BOOLEAN DEFAULT FALSE,
    data_retention_agreed BOOLEAN DEFAULT FALSE
);

-- Comments table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_website TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    spam_score DECIMAL DEFAULT 0.0
);

-- Comment likes table (prevent duplicate likes)
CREATE TABLE public.comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id),
    UNIQUE(comment_id, ip_address)
);

-- User sessions table
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- GDPR consent tracking
CREATE TABLE public.gdpr_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address INET,
    consent_analytics BOOLEAN DEFAULT FALSE,
    consent_marketing BOOLEAN DEFAULT FALSE,
    consent_functional BOOLEAN DEFAULT TRUE,
    data_retention_agreed BOOLEAN DEFAULT FALSE,
    privacy_policy_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- IP address or user ID
    action TEXT NOT NULL, -- 'comment', 'login', etc.
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, action, window_start)
);

-- Indexes for performance
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_status ON public.comments(status);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_consents_updated_at BEFORE UPDATE ON public.gdpr_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment statistics view
CREATE VIEW public.comment_stats AS
SELECT 
    post_id,
    COUNT(*) as total_comments,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_comments,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_comments,
    COALESCE(SUM(likes), 0) as total_likes
FROM public.comments
GROUP BY post_id;

-- Function to get comments with reply count
CREATE OR REPLACE FUNCTION get_comments_with_replies(
    post_id_param TEXT,
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    post_id TEXT,
    author_name TEXT,
    author_email TEXT,
    author_website TEXT,
    content TEXT,
    status TEXT,
    parent_id UUID,
    likes INTEGER,
    is_edited BOOLEAN,
    created_at TIMESTAMPTZ,
    reply_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.author_name,
        c.author_email,
        c.author_website,
        c.content,
        c.status,
        c.parent_id,
        c.likes,
        c.is_edited,
        c.created_at,
        (SELECT COUNT(*) FROM public.comments r WHERE r.parent_id = c.id) as reply_count
    FROM public.comments c
    WHERE c.post_id = post_id_param 
      AND c.status = 'approved'
    ORDER BY c.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- Function to safely increment comment likes
CREATE OR REPLACE FUNCTION increment_comment_likes(
    comment_id_param UUID,
    user_ip INET DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_likes INTEGER;
BEGIN
    -- Try to insert a like record
    INSERT INTO public.comment_likes (comment_id, ip_address)
    VALUES (comment_id_param, user_ip)
    ON CONFLICT (comment_id, ip_address) DO NOTHING;
    
    -- If a row was inserted, increment the counter
    IF FOUND THEN
        UPDATE public.comments 
        SET likes = likes + 1 
        WHERE id = comment_id_param
        RETURNING likes INTO current_likes;
    ELSE
        -- Return current likes count if already liked
        SELECT likes INTO current_likes 
        FROM public.comments 
        WHERE id = comment_id_param;
    END IF;
    
    RETURN COALESCE(current_likes, 0);
END;
$$;

-- Function to safely decrement comment likes
CREATE OR REPLACE FUNCTION decrement_comment_likes(
    comment_id_param UUID,
    user_ip INET DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_likes INTEGER;
BEGIN
    -- Try to delete the like record
    DELETE FROM public.comment_likes 
    WHERE comment_id = comment_id_param AND ip_address = user_ip;
    
    -- If a row was deleted, decrement the counter
    IF FOUND THEN
        UPDATE public.comments 
        SET likes = GREATEST(likes - 1, 0)
        WHERE id = comment_id_param
        RETURNING likes INTO current_likes;
    ELSE
        -- Return current likes count if not previously liked
        SELECT likes INTO current_likes 
        FROM public.comments 
        WHERE id = comment_id_param;
    END IF;
    
    RETURN COALESCE(current_likes, 0);
END;
$$;

-- Row Level Security (RLS) Policies

-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Comments table policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments" ON public.comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert comments" ON public.comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (user_id IS NULL AND author_email = (SELECT email FROM public.users WHERE id = auth.uid()))
    );

-- Comment likes policies
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.comment_likes
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- GDPR consents policies
ALTER TABLE public.gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents" ON public.gdpr_consents
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can insert consent records" ON public.gdpr_consents
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;