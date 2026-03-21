# Security Audit Fixes - Deployment Checklist

## Pre-Deployment Checklist

### Environment Variables
- [ ] `REQUEST_SECRET` set in production environment (NOT `NEXT_PUBLIC_REQUEST_SECRET`)
- [ ] `UPSTASH_REDIS_REST_URL` set in production
- [ ] `UPSTASH_REDIS_REST_TOKEN` set in production
- [ ] `NEXT_PUBLIC_SUPABASE_URL` verified
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` verified
- [ ] `MAINTENANCE_ADMIN_IPS` configured (optional)

### Security Configuration
- [ ] `X-Frame-Options: DENY` in response headers
- [ ] Client-side HMAC signing removed (returns empty string)
- [ ] Server-side signature validation optional
- [ ] Rate limiting active in middleware

### Build Verification
```bash
# Run these before deploying
npm run build
npm run lint
npm run test:security  # if available
```

## Deployment Steps

### 1. Vercel Deployment
```bash
# Using Vercel CLI
vercel --prod

# Or set environment variables in dashboard:
# Project Settings > Environment Variables
```

### 2. Netlify Deployment
```bash
# Using Netlify CLI
netlify deploy --prod

# Or in Netlify Dashboard:
# Site settings > Environment variables
```

### 3. Manual/Server Deployment
```bash
# Build locally
npm run build

# Copy to server
scp -r .next/ user@server:/app/

# Set environment variables on server
export REQUEST_SECRET=your-secret
export UPSTASH_REDIS_REST_URL=https://...
export UPSTASH_REDIS_REST_TOKEN=...

# Start with PM2 or similar
pm2 start npm --name "sonamoney" -- start
```

## Post-Deployment Verification

### 1. Test Security Headers
```bash
curl -I https://your-app.com | grep -i "x-frame-options"
# Expected: X-Frame-Options: DENY
```

### 2. Test Rate Limiting
```bash
# Should return 429 after 60 requests in 1 minute
for i in {1..65}; do 
  curl -s -o /dev/null -w "%{http_code}\n" https://your-app.com/api/health
done
```

### 3. Test Client-Side Secret Not Exposed
```bash
# Search built files for secret
grep -r "NEXT_PUBLIC_REQUEST_SECRET" .next/ || echo "✅ No client-side secret found"
```

### 4. Verify Redis Connection
Check application logs for:
- ✅ `[RateLimiter] Using Redis-based rate limiting`
- ❌ `[RateLimiter] Redis unavailable` (if fallback active)

## Rollback Plan

If issues occur:
1. Revert to previous deployment in Vercel/Netlify dashboard
2. Or set `DISABLE_RATE_LIMITING=true` temporarily
3. Check Redis credentials if rate limiting fails

## Monitoring Commands

```bash
# Check rate limit blocks
vercel logs your-app.com | grep "Rate limit exceeded"

# Monitor Redis connection
vercel logs your-app.com | grep "Redis"

# Watch for security events
vercel logs your-app.com | grep "\[SECURITY\]"
```

## Contact for Issues

- Upstash support: https://upstash.com/support
- Vercel issues: status.vercel.com
- Application issues: Check `docs/REDIS_SETUP.md`
