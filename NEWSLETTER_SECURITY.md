# Newsletter API Security Documentation

This document describes the comprehensive security measures implemented in the newsletter subscription API.

## 🔐 Security Features Overview

### ✅ Implemented Features

1. **Redis/Database Persistent Rate Limiting**
   - Upstash Redis support for serverless environments
   - Traditional Redis (ioredis) support
   - Fallback to in-memory for development
   - Configurable limits and time windows

2. **Failed Attempt Blocking**
   - Progressive blocking for repeated violations
   - Exponential backoff
   - Redis persistence for cross-instance blocking

3. **Email Security**
   - Comprehensive disposable email domain blocking (40+ domains)
   - Email sanitization and validation
   - Custom domain blocking via environment variables

4. **Bot Protection**
   - Honeypot field detection
   - Enhanced User-Agent validation
   - Browser signature verification
   - Timestamp validation for replay attack prevention

5. **CAPTCHA Integration** (Optional)
   - Google reCAPTCHA v3 support
   - Configurable score thresholds
   - Graceful fallback when disabled

6. **IP Allowlisting** (Optional)
   - Support for individual IPs
   - CIDR range support
   - Bypasses other restrictions for trusted sources

7. **Comprehensive Monitoring**
   - Security event logging to Redis
   - Real-time alerting via webhooks
   - Security metrics API for analytics
   - Structured logging for analysis

8. **Enhanced Headers**
   - Security headers (HSTS, CSP, etc.)
   - Rate limit information headers
   - CORS protection

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install @upstash/redis @upstash/ratelimit ioredis
```

### 2. Configure Environment

Copy `.env.newsletter.example` to `.env` and configure:

```bash
cp .env.newsletter.example .env
```

### 3. Basic Configuration

Minimum required configuration:

```env
# For serverless (recommended)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# OR for traditional setup
REDIS_URL=redis://localhost:6379
```

## 📊 Security Metrics API

Access security analytics at `/api/newsletter-metrics` (requires admin token):

```bash
curl -H "Authorization: Bearer your-admin-token" \
     https://yourdomain.com/api/newsletter-metrics
```

### Response Format

```json
{
  "success": true,
  "data": {
    "total_events": 150,
    "by_type": {
      "rate_limit": 45,
      "blocked_email": 30,
      "bot_detected": 25,
      "suspicious_request": 20
    },
    "by_ip": {
      "192.168.1.1": 10,
      "10.0.0.1": 5
    },
    "last_24h": 75,
    "generated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🛡️ Rate Limiting

### Default Limits

- **5 requests** per 15-minute window per IP
- **3 failed attempts** before 1-hour IP block
- Persistent storage across server restarts

### Redis Implementation

The API automatically detects and uses:
1. **Upstash Redis** (if `UPSTASH_REDIS_REST_URL` configured)
2. **Traditional Redis** (if `REDIS_URL` configured)  
3. **In-memory fallback** (development only)

### Configuration

```env
NEWSLETTER_MAX_REQUESTS=5          # Requests per window
NEWSLETTER_WINDOW_MS=900000        # 15 minutes in milliseconds
NEWSLETTER_MAX_FAILED=3            # Failed attempts before block
NEWSLETTER_BLOCK_MS=3600000        # 1 hour block duration
```

## 🤖 Bot Protection

### Honeypot Field

Add to your form (must remain empty):

```html
<input
  type="text"
  name="website"
  class="honeypot-field"
  style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;"
  tabindex="-1"
  autocomplete="off"
/>
```

### Enhanced User-Agent Detection

Blocks requests from:
- Known bots, crawlers, spiders
- Automated tools (curl, wget, python-requests)
- Missing or invalid browser signatures

## 🔒 CAPTCHA Integration

### Setup Google reCAPTCHA v3

1. Get keys from [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Configure environment:

```env
NEWSLETTER_CAPTCHA_ENABLED=true
NEWSLETTER_CAPTCHA_SECRET=your-secret-key
NEWSLETTER_CAPTCHA_THRESHOLD=0.5
```

3. Add to frontend:

```javascript
// Include reCAPTCHA script
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

// Get token before form submission
grecaptcha.ready(() => {
  grecaptcha.execute('YOUR_SITE_KEY', {action: 'newsletter'}).then(token => {
    // Include token in request body
    body: JSON.stringify({
      email: email,
      captchaToken: token,
      // ... other fields
    })
  });
});
```

## 🌐 IP Allowlisting

### Configuration

```env
# Single IPs
NEWSLETTER_TRUSTED_IPS=192.168.1.1,10.0.0.1

# CIDR ranges
NEWSLETTER_TRUSTED_IPS=192.168.1.0/24,10.0.0.0/16

# Mixed
NEWSLETTER_TRUSTED_IPS=192.168.1.1,10.0.0.0/16,172.16.0.0/12
```

### Behavior

- Empty = Allow all IPs (default)
- Configured = Only allow listed IPs/ranges
- Trusted IPs bypass rate limiting and other restrictions

## 📧 Email Security

### Blocked Domains

The API blocks 40+ disposable email domains including:
- 10minutemail.com
- tempmail.com
- mailinator.com
- guerrillamail.com
- And many more...

### Custom Blocking

Add your own domains:

```env
NEWSLETTER_CUSTOM_BLOCKED_DOMAINS=spam-domain.com,another-temp-mail.org
```

## 📈 Monitoring & Alerting

### Webhook Alerts

Configure Slack/Discord/custom webhooks:

```env
NEWSLETTER_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
NEWSLETTER_ALERT_THRESHOLD=10
```

### Alert Triggers

Alerts are sent when an IP exceeds the threshold for:
- Rate limiting violations
- Blocked email attempts  
- Bot detection events
- Suspicious requests

### Webhook Payload

```json
{
  "text": "🚨 Newsletter API Security Alert: rate_limit threshold exceeded",
  "alert": {
    "type": "threshold_exceeded",
    "event_type": "rate_limit",
    "ip": "192.168.1.1",
    "count": 10,
    "threshold": 10
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Frontend Integration

### Enhanced Request Format

```javascript
const response = await fetch('/api/newsletter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    honeypot: '',                    // Must be empty
    timestamp: Date.now(),           // Current timestamp
    referrer: document.referrer,     // Page referrer
    captchaToken: 'token...',        // reCAPTCHA token (if enabled)
    fingerprint: 'browser...'        // Optional browser fingerprint
  }),
});
```

### Rate Limit Headers

Check response headers for rate limit status:

```javascript
const remaining = response.headers.get('X-Rate-Limit-Remaining');
const limit = response.headers.get('X-Rate-Limit-Limit');
const window = response.headers.get('X-Rate-Limit-Window');
```

## 🐛 Troubleshooting

### Common Issues

1. **Rate limiting too aggressive**
   ```env
   NEWSLETTER_MAX_REQUESTS=10
   NEWSLETTER_WINDOW_MS=1800000  # 30 minutes
   ```

2. **CAPTCHA not working**
   - Verify secret key is correct
   - Check threshold value (0.0-1.0)
   - Ensure frontend includes valid token

3. **IP allowlisting blocking legitimate users**
   - Verify CIDR ranges are correct
   - Consider removing allowlisting if not needed
   - Check for proxy/CDN IP forwarding

4. **Redis connection issues**
   - Verify Upstash credentials
   - Check firewall/network connectivity
   - Monitor Redis logs for errors

### Debug Mode

Enable detailed logging:

```env
DEBUG=newsletter:*
```

### Health Check

Test the API:

```bash
curl -X POST https://yourdomain.com/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","honeypot":"","timestamp":1642255800000}'
```

## 🚀 Production Deployment

### Vercel Deployment

Add environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables from `.env.newsletter.example`
3. Redeploy your application

### Performance Considerations

- Upstash Redis recommended for serverless
- Monitor Redis usage and costs
- Consider CDN caching for static assets
- Use connection pooling for traditional Redis

### Security Best Practices

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update blocked domain lists

2. **Monitoring**
   - Set up alerts for unusual activity
   - Review security metrics regularly
   - Monitor error logs

3. **Access Control**
   - Secure admin endpoints
   - Use strong admin tokens
   - Implement proper authentication

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review security metrics for patterns
3. Monitor application logs
4. Consider professional security audit for high-traffic applications

---

**⚠️ Security Notice**: This implementation provides robust protection against common attacks. For high-value applications, consider additional measures like professional security audits, advanced DDoS protection, and threat intelligence integration.