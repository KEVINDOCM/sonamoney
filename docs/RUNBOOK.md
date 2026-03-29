# SonaMoney Operations Runbook

**Version:** 1.0  
**Last Updated:** March 28, 2026  

---

## Quick Reference

| Issue | Command/Solution | Severity | Response Time |
|-------|-----------------|----------|---------------|
| Site down | Check status, enable maintenance mode | 🔴 Critical | 5 min |
| Database outage | Activate disaster recovery | 🔴 Critical | 15 min |
| High error rate | Check logs, rollback deployment | 🔴 Critical | 10 min |
| Rate limiting too aggressive | Adjust thresholds | 🟡 Medium | 30 min |
| False positive (WAF) | Disable rule, investigate | 🟡 Medium | 20 min |
| Slow queries | Check DB performance | 🟡 Medium | 45 min |

**Emergency Contacts:**
- Primary On-Call: [Your phone]
- Secondary: [Secondary contact]
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/help
- Cloudflare Support: https://support.cloudflare.com

---

## 1. Incident Response

### 1.1 Site Down - Complete Outage

**Symptoms:**
- 503 errors on all requests
- Health check failures
- Status page alerts

**Immediate Actions:**

```bash
# 1. Enable maintenance mode (stops further damage)
npm run maintenance:on

# 2. Check if it's a deployment issue
vercel --version  # Verify CLI works
vercel list        # Check deployment status

# 3. Rollback if needed
vercel rollback [previous-deployment-url]

# 4. Check Supabase status
curl https://status.supabase.com/api/v2/status.json | jq '.status.description'

# 5. Check Cloudflare status
curl https://www.cloudflarestatus.com/api/v2/status.json | jq '.status.description'
```

**Investigation:**

```bash
# Check recent deployment logs
vercel logs --limit=100

# Check if database is accessible
psql $DATABASE_URL -c "SELECT NOW();"

# Check Redis connectivity
# (via Upstash dashboard or Redis CLI)
```

**Resolution:**
- If deployment issue: Rollback and fix
- If database issue: Follow disaster recovery
- If third-party: Enable maintenance mode, communicate via status page

---

### 1.2 Database Performance Degradation

**Symptoms:**
- Slow queries (>500ms p95)
- Connection timeouts
- High CPU on Supabase dashboard

**Investigation:**

```sql
-- Check active queries
SELECT pid, usename, application_name, state, query_start, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;

-- Check locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check slow queries (pg_stat_statements extension)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Resolution:**

1. **Kill runaway queries:**
```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE query LIKE '%problematic_pattern%';
```

2. **Check for missing indexes:**
```sql
SELECT schemaname, tablename, attname as column, n_tup_read, n_tup_fetch
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_tup_read DESC;
```

3. **Scale database if needed:**
   - Go to Supabase Dashboard > Database > Add-ons
   - Increase compute or storage

---

### 1.3 High Error Rate

**Symptoms:**
- Sentry alerts
- Vercel function errors
- User complaints

**Investigation:**

```bash
# Check error logs
vercel logs --limit=200 | grep -i "error"

# Check specific function
vercel logs [function-name] --limit=100
```

**Common Causes & Fixes:**

| Cause | Symptom | Fix |
|-------|---------|-----|
| Missing env var | `undefined` errors | Add to Vercel env |
| DB connection limit | Connection refused | Scale or optimize |
| Redis unavailable | Rate limiting fails | Check Upstash status |
| Memory leak | 504 timeouts | Restart functions |

**Rollback:**
```bash
# Get last known good deployment
vercel list --limit=5

# Rollback
vercel rollback [deployment-url]

# Verify
watch -n 5 'curl -s https://sonamoney.my.id/api/health'
```

---

## 2. Security Incidents

### 2.1 Suspected Breach

**Symptoms:**
- Unauthorized access logs
- Unusual data patterns
- User reports of account issues

**Immediate Actions:**

```bash
# 1. Enable maintenance mode immediately
npm run maintenance:on

# 2. Rotate all secrets
# Generate new secret
openssl rand -base64 32

# Update in Vercel
vercel env rm REQUEST_SECRET production
vercel env add REQUEST_SECRET production

# Update in Supabase (if using service role key)
# Go to Dashboard > Settings > API > Regenerate key

# 3. Force password resets for affected users
# (Requires database script or Supabase admin)
```

**Investigation:**

```sql
-- Check security audit logs
SELECT * FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check failed logins
SELECT email, COUNT(*) as attempts, MAX(attempted_at) as last_attempt
FROM auth.audit_log_entries
WHERE action = 'login_failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY email
HAVING COUNT(*) > 5;

-- Check suspicious transactions
SELECT * FROM transactions
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND amount > 10000  -- Large amounts
ORDER BY created_at DESC;
```

**Communication:**
- Notify affected users via email
- Post on status page
- Document in incident log

---

### 2.2 DDoS Attack

**Symptoms:**
- Sudden traffic spike
- High Cloudflare blocked requests
- Site slowdown

**Actions:**

1. **Verify WAF is active:**
```bash
curl -I https://sonamoney.my.id | grep "cf-ray"
# Should see Cloudflare headers
```

2. **Check Cloudflare Analytics:**
   - Go to Dashboard > Analytics
   - Check "Security Events"
   - Verify rate limiting is triggering

3. **Escalate DDoS protection (if Business plan):**
   - Contact Cloudflare support
   - Enable "I'm Under Attack" mode
   - Consider upgrading plan temporarily

4. **Monitor:**
```bash
# Watch real-time traffic
watch -n 2 'curl -s https://sonamoney.my.id/api/health'
```

---

### 2.3 False Positive (WAF Blocking Legitimate Users)

**Symptoms:**
- Users reporting 403 errors
- Specific pattern in Security Events

**Immediate Fix:**

1. Identify the rule:
```bash
# Check Cloudflare Security Events
# Dashboard > Security > Events
```

2. Add bypass expression:
```hcl
# In cloudflare_waf.tf, add to specific rule:
expression = "(original expression) and not (ip.src in {admin_ips})"
```

3. Or disable via Dashboard (temporary):
   - Security > WAF > Custom rules
   - Toggle rule to "Disabled"

**Permanent Fix:**
- Update Terraform config with refined rule
- Apply: `terraform apply`

---

## 3. Database Operations

### 3.1 Manual Backup

```bash
# Create timestamped backup
BACKUP_FILE="sonamoney_backup_$(date +%Y%m%d_%H%M%S).dump"

pg_dump $DATABASE_URL \
  --format=custom \
  --file=$BACKUP_FILE \
  --verbose \
  --no-owner \
  --no-privileges

# Verify backup
pg_restore --list $BACKUP_FILE | head -20
```

### 3.2 Restore from Backup

```bash
# 1. Enable maintenance mode
npm run maintenance:on

# 2. Create restore target
# Option A: Restore to staging
pg_restore --dbname=$STAGING_DATABASE_URL \
  --clean \
  --no-owner \
  sonamoney_backup_latest.dump

# Option B: Restore to production (CAREFUL!)
# First, backup current state
pg_dump $DATABASE_URL --format=custom --file=pre_restore_backup.dump

# Then restore
pg_restore --dbname=$DATABASE_URL \
  --clean \
  --no-owner \
  sonamoney_backup_target.dump

# 3. Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 4. Disable maintenance mode
npm run maintenance:off
```

### 3.3 Query Performance Optimization

**Check slow queries:**
```sql
-- Enable query logging temporarily
ALTER DATABASE your_db SET log_min_duration_statement = 1000;  -- Log queries > 1s

-- Find missing indexes
SELECT 
  schemaname,
  tablename,
  attname as column,
  n_tup_read,
  n_tup_fetch,
  n_tup_fetch / NULLIF(n_tup_read, 0) as cache_hit_ratio
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_tup_read DESC;
```

**Add index:**
```sql
-- Covering index for transaction list
CREATE INDEX CONCURRENTLY idx_transactions_user_date_covering 
ON transactions(user_id, transaction_date DESC) 
INCLUDE (amount, description, category_id);
```

---

## 4. Maintenance Procedures

### 4.1 Monthly Maintenance

```bash
# 1. Update dependencies
npm audit fix
npm update

# 2. Run security scan
npm run test:security

# 3. Test backups
pg_restore --list latest_backup.dump

# 4. Review access logs
curl -s https://api.cloudflare.com/client/v4/zones/$ZONE_ID/logs/received \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Clean up old data (if needed)
# Archive transactions older than 2 years
```

### 4.2 Quarterly Security Review

1. **Rotate secrets:**
```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)
echo $NEW_SECRET

# Update in Vercel (zero-downtime)
vercel env add REQUEST_SECRET production <<< "$NEW_SECRET"
vercel --prod

# Remove old secret after verification
vercel env ls
```

2. **Review access:**
```sql
-- List all admin users
SELECT u.email, r.role, r.created_at
FROM user_roles r
JOIN auth.users u ON r.user_id = u.id
WHERE r.role = 'admin';
```

3. **Audit dependencies:**
```bash
npm audit
# Review and update vulnerable packages
```

---

## 5. Common Issues

### 5.1 Users Can't Log In

**Check:**
```bash
# Verify Supabase status
curl https://status.supabase.com/api/v2/components.json | jq '.components[] | select(.name | contains("Auth"))'

# Check if session is being set
# Look for Set-Cookie header in login response
```

**Common fixes:**
- Clear site data and cookies
- Check if `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify auth callback URL in Supabase Dashboard

### 5.2 Transactions Not Appearing

**Check:**
```sql
-- Verify RLS is not blocking
SELECT * FROM transactions 
WHERE user_id = 'specific-user-id'
ORDER BY created_at DESC
LIMIT 10;

-- Check if triggers are firing
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%transaction%';
```

### 5.3 Receipt Scanning Fails

**Check:**
```bash
# Verify Gemini API key
echo $GEMINI_API_KEY

# Check file size (max 10MB)
ls -lh uploaded_receipt.jpg

# Test API directly
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent \
  -H "Authorization: Bearer $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

---

## 6. Monitoring & Alerting

### 6.1 Key Metrics to Watch

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|-------------------|-------------------|--------|
| Error rate | > 1% | > 5% | Investigate logs |
| API latency (p95) | > 500ms | > 2000ms | Check DB/Redis |
| Database CPU | > 70% | > 90% | Scale or optimize |
| Rate limit blocks | > 100/min | > 500/min | Check for attack |
| Failed logins | > 10/min | > 50/min | Potential brute force |

### 6.2 Setting Up Alerts

**Vercel (built-in):**
- Go to Project Settings > Alerts
- Enable email/Slack notifications for:
  - Build failures
  - Function errors
  - High latency

**Supabase:**
- Dashboard > Project Settings > Database > Reports
- Set up alerts for:
  - High connection count
  - Slow queries
  - Storage usage

**Cloudflare:**
- Dashboard > Notifications
- Configure for:
  - DDoS attacks
  - Origin errors
  - WAF blocks

### 6.3 Log Aggregation

```bash
# View all logs
vercel logs --limit=1000 --since="1 hour ago"

# Filter by function
vercel logs --since="1 hour ago" | grep "/api/transactions"

# Export logs
vercel logs --since="24 hours ago" > logs_$(date +%Y%m%d).txt
```

---

## 7. Post-Incident Review

After any incident, document:

1. **Timeline:**
   - When detected
   - Actions taken
   - Resolution time

2. **Root Cause:**
   - Why did it happen?
   - How was it detected?

3. **Impact:**
   - Users affected
   - Data at risk
   - Downtime duration

4. **Remediation:**
   - Immediate fix
   - Long-term prevention
   - Monitoring improvements

**Template:**
```markdown
# Incident Report: [Brief Description]

**Date:** YYYY-MM-DD
**Severity:** [Low/Medium/High/Critical]
**Duration:** X minutes
**Reporter:** [Name]

## Summary
Brief description of what happened.

## Timeline
- 14:00 UTC - Alert triggered
- 14:05 UTC - Investigation started
- 14:15 UTC - Root cause identified
- 14:20 UTC - Fix applied
- 14:25 UTC - Service restored

## Root Cause
Detailed explanation.

## Impact
- X users affected
- Y transactions delayed
- Z data points at risk

## Resolution
What was done to fix it.

## Prevention
Steps to prevent recurrence.
```

---

*Runbook maintained by DevOps Team*  
*Review monthly, update after each incident*
