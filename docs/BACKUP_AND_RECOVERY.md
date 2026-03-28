# SonaMoney Backup and Disaster Recovery Strategy

**Document Version:** 1.0  
**Last Updated:** March 28, 2026  
**Owner:** DevOps/Security Team  

---

## 1. Overview

This document outlines the backup strategy, retention policies, and disaster recovery procedures for the SonaMoney personal finance application.

**Recovery Objectives:**
- **RPO (Recovery Point Objective):** 24 hours maximum data loss
- **RTO (Recovery Time Objective):** 4 hours for full service restoration

---

## 2. Backup Components

### 2.1 Database Backups (Supabase PostgreSQL)

#### Automated Daily Backups
- **Frequency:** Daily at 00:00 UTC
- **Retention:** 7 days (rolling)
- **Storage:** Supabase-managed (included in plan)
- **Encryption:** AES-256 at rest

#### Manual Point-in-Time Recovery (PITR)
- **Available:** Up to 7 days
- **Granularity:** Minute-level recovery
- **Access:** Supabase Dashboard > Database > Backups

#### Custom Backup Export
```bash
# Export full database schema and data
pg_dump $DATABASE_URL \
  --format=custom \
  --file=sonamoney_backup_$(date +%Y%m%d_%H%M%S).dump \
  --verbose

# Export specific tables (if needed)
pg_dump $DATABASE_URL \
  --table=public.transactions \
  --table=public.accounts \
  --data-only \
  --file=transactions_backup_$(date +%Y%m%d).sql
```

### 2.2 Application Code & Configuration

#### Source Code (Git Repository)
- **Platform:** GitHub
- **Branches Protected:** `main`, `production`
- **Required Reviews:** 2 approvals for production
- **Retention:** Indefinite (Git history)

#### Environment Variables
- **Storage:** Vercel Environment Variables (encrypted)
- **Backup:** Manual export via Vercel CLI
```bash
# Export environment variables
vercel env ls > env_backup_$(date +%Y%m%d).txt
```

**CRITICAL:** Store `.env.local` and `.env.production` in password manager (1Password/Bitwarden)

### 2.3 Infrastructure as Code

#### Terraform State
- **Location:** `infrastructure/waf/`
- **Backup:** Commit to Git after changes
- **State File:** Cloudflare-managed (via Terraform Cloud or S3 backend)

#### WAF Rules
- **Source:** `infrastructure/waf/cloudflare_waf.tf`
- **Backup:** Git version control
- **Deployment:** Documented in `infrastructure/waf/DEPLOYMENT_GUIDE.md`

---

## 3. Backup Retention Policy

| Data Type | Primary Storage | Retention | Archive |
|-----------|----------------|-----------|---------|
| Database | Supabase | 7 days | Manual export monthly |
| Audit Logs | Supabase | 1 year | Export to S3 Glacier |
| User Data | Supabase | Indefinite | N/A (active retention) |
| Code | GitHub | Indefinite | N/A |
| Configs | Vercel/Git | Indefinite | 1Password backup |

### Compliance Requirements

| Standard | Retention Requirement | Status |
|----------|----------------------|--------|
| **PCI DSS** | 1 year (3 months immediately available) | ✅ Met via Supabase + exports |
| **SOX** | 7 years | ⚠️ Requires quarterly exports to Glacier |
| **GDPR** | Duration of relationship + legal requirements | ✅ Configurable per user |

---

## 4. Disaster Recovery Procedures

### 4.1 Database Recovery

#### Scenario 1: Accidental Data Deletion
```sql
-- Step 1: Identify deletion timestamp
SELECT * FROM transactions 
WHERE deleted_at > NOW() - INTERVAL '1 hour'
ORDER BY deleted_at DESC;

-- Step 2: Restore from PITR via Supabase Dashboard
-- Or use backup export
pg_restore --dbname=$DATABASE_URL sonamoney_backup_YYYYMMDD.dump
```

#### Scenario 2: Complete Database Loss

**Immediate Actions (0-30 minutes):**
1. Enable maintenance mode: `npm run maintenance:on`
2. Notify stakeholders via status page
3. Identify last known good backup timestamp

**Recovery Steps (30 minutes - 4 hours):**
```bash
# 1. Create new Supabase project (if needed)
# 2. Apply migrations in order
for migration in supabase/migrations/*.sql; do
  psql $NEW_DATABASE_URL -f $migration
done

# 3. Restore data from backup
pg_restore --dbname=$NEW_DATABASE_URL sonamoney_backup_latest.dump

# 4. Update environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL $NEW_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY $NEW_KEY

# 5. Redeploy application
vercel --prod
```

### 4.2 Application Recovery

#### Vercel Deployment Recovery
```bash
# Rollback to previous deployment
vercel rollback [deployment-url]

# Or redeploy from Git
vercel --prod
```

#### Complete Rebuild
```bash
# 1. Clone repository
git clone https://github.com/kevindocm/sonamoney.git
cd sonamoney

# 2. Install dependencies
npm install

# 3. Set environment variables (from 1Password backup)
cp .env.production .env.local

# 4. Run migrations
supabase db push

# 5. Build and deploy
npm run build
vercel --prod
```

### 4.3 WAF/Infrastructure Recovery

#### Cloudflare WAF Restoration
```bash
cd infrastructure/waf

# If Terraform state exists
terraform apply

# If manual recreation needed, follow:
# infrastructure/waf/DEPLOYMENT_GUIDE.md
```

---

## 5. Testing Procedures

### 5.1 Monthly Backup Test

**Schedule:** First Sunday of each month

```bash
# 1. Verify backup exists
ls -la backups/sonamoney_backup_*.dump | head -5

# 2. Test restore to staging
pg_restore --dbname=$STAGING_DATABASE_URL --verbose sonamoney_backup_latest.dump

# 3. Run integration tests
npm run test:integration

# 4. Verify data integrity
psql $STAGING_DATABASE_URL -c "SELECT COUNT(*) FROM transactions;"
psql $STAGING_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### 5.2 Quarterly Disaster Recovery Drill

**Participants:** DevOps, Security, Engineering leads

**Scenario:** Complete infrastructure loss

**Success Criteria:**
- Service restored within 4 hours
- Data loss < 24 hours
- All security controls functional
- WAF rules restored

---

## 6. Monitoring and Alerting

### 6.1 Backup Health Checks

```bash
# Daily automated check (add to CI/CD)
#!/bin/bash
LAST_BACKUP=$(supabase backups list --limit=1 --format=json | jq -r '.[0].created_at')
BACKUP_AGE=$(( ($(date +%s) - $(date -d "$LAST_BACKUP" +%s)) / 86400 ))

if [ $BACKUP_AGE -gt 1 ]; then
  echo "ALERT: Last backup is $BACKUP_AGE days old"
  # Send alert to PagerDuty/Slack
fi
```

### 6.2 Recovery Metrics

Track and report monthly:
- Backup success rate (target: 100%)
- RTO achievement (target: < 4 hours)
- Data integrity test results (target: 100% pass)

---

## 7. Security Considerations

### 7.1 Backup Encryption

- All database exports use `pg_dump` with encryption flags
- S3 Glacier archives use SSE-S3 or SSE-KMS
- Local backup files must be stored on encrypted volumes

### 7.2 Access Control

- Database backups: Restricted to `admin` role users
- S3 buckets: Private with IAM access policies
- Encryption keys: Managed via AWS KMS or HashiCorp Vault

### 7.3 Data Residency

- Primary: Supabase (US East)
- Archive: S3 Glacier (Same region for compliance)
- Cross-region: Optional replication for DR

---

## 8. Runbook: Quick Recovery Commands

### Emergency Contacts
- **Primary On-Call:** [Your phone/email]
- **Secondary:** [Secondary contact]
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/help

### Critical Commands

```bash
# Enable maintenance mode (immediate)
npm run maintenance:on

# Get latest backup
supabase backups list --limit=1

# Restore from backup
supabase backups restore [backup-id]

# Check database connectivity
psql $DATABASE_URL -c "SELECT NOW();"

# Verify WAF status
curl -I https://sonamoney.my.id | grep -i "cf-ray"
```

---

## 9. Document Maintenance

**Review Schedule:**
- Monthly: Backup test results
- Quarterly: Full DR drill and document update
- Annually: Compliance audit and policy review

**Change Log:**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-03-28 | 1.0 | Initial document | Cascade AI |

---

## 10. Appendix

### A. Environment Variables Required for Recovery

```bash
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Application
REQUEST_SECRET=...
GEMINI_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Infrastructure
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
```

### B. Useful Links

- Supabase Backups: https://supabase.com/dashboard/project/_/database/backups
- Vercel Deployments: https://vercel.com/dashboard
- Cloudflare WAF: https://dash.cloudflare.com
- Status Page: https://status.sonamoney.my.id

---

*This document is confidential and should only be shared with authorized personnel.*
