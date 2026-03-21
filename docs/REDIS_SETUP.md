# Redis Setup & Rate Limiting Monitoring

## Upstash Redis Account Setup

### 1. Create Account
1. Visit [https://upstash.com/](https://upstash.com/)
2. Sign up with GitHub, Google, or email
3. Verify your email address

### 2. Create Redis Database
1. Click "Create Database"
2. Choose a name (e.g., "sonamoney-rate-limit")
3. Select region closest to your deployment (e.g., `ap-southeast-1` for Singapore)
4. Click "Create"

### 3. Get Credentials
1. In your database dashboard, go to **REST API** tab
2. Copy:
   - **REST URL** (e.g., `https://your-db.upstash.io`)
   - **REST TOKEN** (long string starting with your account)

### 4. Configure Environment
Add to `.env.local`:
```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token-here
```

## Rate Limiting Configuration

The rate limiter uses these default settings (defined in `lib/security/rateLimiter.ts`):

| Endpoint Type | Requests | Window | Block Duration |
|--------------|----------|--------|----------------|
| General API | 60 | 1 minute | - |
| Auth endpoints | 10 | 15 minutes | 30 min after 5 failures |
| Sensitive (scan-receipt) | 5 | 1 minute | 30 min after 5 failures |

## Monitoring Rate Limiting

### Check Current Status
```bash
# View Redis connection status
npm run dev
# Look for: "[RateLimiter] Using Redis-based rate limiting" or "[RateLimiter] Redis unavailable, using in-memory fallback"
```

### Test Rate Limits
```bash
# Test general rate limit (should block after 60 requests)
for i in {1..65}; do curl -s -o /dev/null -w "%{http_code}\n" https://your-app.com/api/health; done

# Test auth rate limit (should block after 10 requests)
for i in {1..12}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://your-app.com/api/auth/login; done
```

### Monitor Blocked IPs
Check your application logs for:
- `[RateLimiter] IP blocked` - When an IP exceeds limits
- `[RateLimiter] Rate limit exceeded` - When rate limit hit
- `[RateLimiter] Redis error` - When Redis connection fails

## Troubleshooting

### Redis Connection Failing
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`
2. Check if Redis database is active in Upstash dashboard
3. Application will automatically fall back to in-memory rate limiting

### Rate Limits Not Working
1. Check `middleware.ts` is properly importing from `lib/security/rateLimiter`
2. Verify environment variables are loaded (restart dev server)
3. Check browser console for 429 responses

### Want to Disable Rate Limiting (Development Only)
Add to `.env.local`:
```env
DISABLE_RATE_LIMITING=true
```
Then modify `middleware.ts` to check this flag.

## Security Best Practices

1. **Rotate Redis token** periodically in Upstash dashboard
2. **Monitor blocked IPs** - Investigate patterns of abuse
3. **Adjust limits** based on your actual traffic patterns
4. **Never expose** `UPSTASH_REDIS_REST_TOKEN` to client-side code
5. **Use environment-specific databases** - separate dev/staging/prod

## Upgrading from In-Memory to Redis

If currently using in-memory rate limiting:
1. Set up Upstash Redis as above
2. Deploy with Redis credentials
3. Monitor for any connection issues
4. In-memory rate limiting serves as automatic fallback
