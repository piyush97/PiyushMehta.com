# Phase 1 Implementation Guide: Database, Security & GDPR

This guide covers implementing Phase 1 of making your project production-ready: Database integration, Security, and GDPR compliance.

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Note down your project URL and API keys

### 2. Configure Environment Variables

Update your `.env` file with the Supabase credentials:

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your Supabase credentials
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run Database Migration

Execute the SQL migration in your Supabase dashboard:

```sql
-- Run the content of supabase/migrations/001_initial_schema.sql
-- in your Supabase SQL Editor
```

This creates:
- `users` table (extends Supabase auth)
- `comments` table with full CRUD support
- `comment_likes` table for like tracking
- `user_sessions` table for session management
- `gdpr_consents` table for GDPR compliance
- `rate_limits` table for rate limiting
- Necessary indexes and functions
- Row Level Security (RLS) policies

### 4. Verify Database Setup

Check in Supabase dashboard:
- [ ] All tables created successfully
- [ ] RLS policies are active
- [ ] Functions are working
- [ ] Indexes are in place

## 🔒 Security Implementation

### 1. Rate Limiting with Upstash Redis

1. Create an [Upstash Redis](https://upstash.com) database
2. Add credentials to `.env`:

```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
ENABLE_RATE_LIMITING=true
```

### 2. Generate Security Secrets

Generate secure random strings for:

```bash
# Generate 32+ character strings
AUTH_SECRET=your_auth_secret_key_min_32_characters
JWT_SECRET=your_jwt_secret_key_for_token_signing
NEXTAUTH_SECRET=your_nextauth_secret_32_characters_min
CSRF_SECRET=your_csrf_secret_key_32_characters
```

### 3. Rate Limiting Configuration

Current limits (configurable in `.env`):
- Comments: 10 per hour per IP
- Login attempts: 5 per 15 minutes per IP
- API requests: 100 per minute per IP
- Like actions: 50 per minute per IP

## 📋 GDPR Compliance

### 1. Add GDPR Component to Layout

Update your main layout to include the GDPR consent banner:

```astro
---
// src/layouts/Layout.astro
import { GDPRConsent } from '../components/GDPRConsent';
---

<html>
  <body>
    <!-- Your existing content -->
    
    <!-- Add GDPR consent at the end of body -->
    <GDPRConsent client:load />
  </body>
</html>
```

### 2. Configure Data Retention

Set data retention period in `.env`:

```bash
DATA_RETENTION_DAYS=365
COOKIE_CONSENT_REQUIRED=true
```

### 3. Create Privacy Policy

Create or update your privacy policy page at `/src/pages/privacy-policy.astro` to include:

- What data you collect
- How you use the data
- Cookie usage
- User rights under GDPR
- Contact information for data requests

## 🔧 Updated Comment System

The comment system now uses Supabase with these enhancements:

### Features Added:
- ✅ Persistent database storage
- ✅ Rate limiting protection
- ✅ GDPR consent tracking
- ✅ IP address logging for moderation
- ✅ Spam detection scoring
- ✅ User authentication ready
- ✅ Admin moderation capabilities

### Database Schema:
```sql
-- Comments with full metadata
comments (
  id, post_id, user_id, author_name, author_email, 
  content, status, parent_id, likes, created_at, 
  ip_address, user_agent, spam_score
)

-- Like tracking prevents duplicates
comment_likes (
  comment_id, user_id, ip_address, created_at
)

-- GDPR consent tracking
gdpr_consents (
  user_id, ip_address, consent_analytics, 
  consent_marketing, privacy_policy_version
)
```

## 🚀 Deployment Checklist

### Pre-Production:
- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] GDPR consent banner working
- [ ] Rate limiting active
- [ ] Comment system using database
- [ ] Privacy policy updated

### Production:
- [ ] Supabase project in production mode
- [ ] Environment variables in Vercel
- [ ] Rate limiting enabled
- [ ] Analytics consent properly tracked
- [ ] Backup strategy in place

## 🧪 Testing Phase 1

1. **Database Connection**: Verify comments save to Supabase
2. **Rate Limiting**: Test comment submission limits
3. **GDPR Consent**: Test consent banner and preferences
4. **Security**: Verify no sensitive data exposed
5. **Performance**: Check database query performance

## 📊 Monitoring

Monitor these metrics post-deployment:

- Database performance (query times)
- Rate limiting effectiveness
- GDPR consent rates
- Comment submission success rates
- Security incident logs

## 🔄 Next Steps (Phase 2)

After Phase 1 is stable:
- [ ] Authentication system (OAuth, magic links)
- [ ] Email notifications for comments
- [ ] Admin dashboard for moderation
- [ ] Advanced spam detection
- [ ] Real-time comment updates

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Fails**
   - Check Supabase URL and keys
   - Verify network connectivity
   - Check RLS policies

2. **Rate Limiting Not Working**
   - Verify Upstash Redis credentials
   - Check environment variables
   - Ensure `ENABLE_RATE_LIMITING=true`

3. **GDPR Banner Not Showing**
   - Check component import
   - Verify client:load directive
   - Check browser console for errors

4. **Comments Not Saving**
   - Check database migration
   - Verify table permissions
   - Check RLS policies

### Support:
- Supabase: [docs.supabase.com](https://docs.supabase.com)
- Upstash: [docs.upstash.com](https://docs.upstash.com)
- Project issues: Create GitHub issue

---

**Status**: Phase 1 infrastructure ready for production deployment.
**Estimated Setup Time**: 2-4 hours
**Next Phase**: User authentication and email notifications