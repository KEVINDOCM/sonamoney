# Cloudflare WAF Deployment Checklist

**Status:** Ready for Deployment  
**Last Updated:** March 28, 2026  
**Terraform Config:** `infrastructure/waf/cloudflare_waf.tf`

---

## Pre-Deployment Checklist

### Prerequisites

- [ ] Cloudflare account with Pro/Business plan (WAF requires paid plan)
- [ ] Domain `sonamoney.my.id` configured and active in Cloudflare
- [ ] Terraform CLI installed locally
- [ ] Cloudflare API Token with Zone:Edit and Account:Edit permissions
- [ ] Zone ID and Account ID from Cloudflare Dashboard

### Required Variables

Create `infrastructure/waf/terraform.tfvars`:

```hcl
cloudflare_zone_id   = "your-zone-id-here"
cloudflare_account_id = "your-account-id-here"
```

Set environment variable:
```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

---

## Deployment Steps

### Step 1: Initialize Terraform

```bash
cd infrastructure/waf
terraform init
```

**Expected Output:**
```
Initializing the backend...
Initializing provider plugins...
- Finding cloudflare/cloudflare versions matching "~> 4.0"...
- Installing cloudflare/cloudflare v4.x.x...
```

### Step 2: Validate Configuration

```bash
terraform validate
```

**Expected Output:**
```
Success! The configuration is valid.
```

### Step 3: Plan Deployment

```bash
terraform plan
```

**Review the plan output for:**
- 1 OWASP Core Ruleset resource
- 1 Cloudflare Managed Rules resource
- 1 API Rate Limiting resource
- 1 Geographic Blocking resource
- 1 Bot Management resource
- 1 SQL Injection Protection resource
- 1 XSS Protection resource
- 1 API Auth Enforcement resource
- 1 Path Traversal resource
- 1 IP Reputation resource
- 1 DDoS Protection resource
- 1 Custom Block Page resource

### Step 4: Apply Configuration

```bash
terraform apply
```

**Confirm:** Type `yes` when prompted.

**Expected Output:**
```
Apply complete! Resources: 12 added, 0 changed, 0 destroyed.
```

---

## Post-Deployment Verification

### 1. Verify WAF Rules in Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select `sonamoney.my.id`
3. Navigate to **Security** > **WAF**
4. Verify rules are active:
   - OWASP Core Ruleset: ✅ Active
   - Rate Limiting: ✅ Active
   - Custom Rules: ✅ 10 rules active

### 2. Test WAF Rules

Run the security test script:
```bash
npm run test:security
```

Manual tests:
```bash
# Test 1: SQL Injection should be blocked
curl -I "https://sonamoney.my.id/api/transactions?id=1' OR '1'='1"
# Expected: HTTP 403 Forbidden

# Test 2: XSS attempt should be blocked
curl -I "https://sonamoney.my.id/search?q=<script>alert(1)</script>"
# Expected: HTTP 403 Forbidden

# Test 3: Path traversal should be blocked
curl -I "https://sonamoney.my.id/../../../etc/passwd"
# Expected: HTTP 403 Forbidden

# Test 4: Rate limiting
curl -I "https://sonamoney.my.id/api/transactions"
# Run 101 times in 1 minute - should block on 101st request
```

### 3. Monitor Security Events

1. Go to **Security** > **Events** in Cloudflare Dashboard
2. Filter by **Action:** Block, Challenge
3. Verify requests are being evaluated

---

## Rollback Procedure

If issues occur:

### Immediate Rollback

```bash
cd infrastructure/waf
terraform destroy
```

**Confirm:** Type `yes` when prompted.

### Selective Rollback

Disable specific rules via Dashboard:
1. Go to **Security** > **WAF** > **Custom rules**
2. Toggle problematic rule to **Disabled**
3. Monitor for improvement

---

## Troubleshooting

### Issue: Terraform Apply Fails

**Symptom:** Error applying WAF rules

**Solution:**
```bash
# Check credentials
echo $CLOUDFLARE_API_TOKEN

# Verify permissions in Cloudflare Dashboard
# Profile > API Tokens > Edit token permissions

# Try with explicit token
terraform apply -var="cloudflare_api_token=$CLOUDFLARE_API_TOKEN"
```

### Issue: False Positives

**Symptom:** Legitimate users being blocked

**Solution:**
1. Check **Security Events** for blocked request details
2. Identify rule that triggered
3. Add bypass condition or adjust sensitivity
4. Apply update via Terraform or Dashboard

### Issue: Rules Not Triggering

**Symptom:** Attacks not being blocked

**Solution:**
1. Verify rule priority order
2. Check if another rule is matching first
3. Test expression in Expression Builder
4. Enable logging for the rule

---

## Maintenance

### Weekly Tasks
- Review Security Events for false positives
- Check top blocked countries/IPs
- Verify DDoS protection status

### Monthly Tasks
- Review rate limiting thresholds
- Analyze bot traffic patterns
- Update SQL/XSS patterns if needed
- Review and rotate Cloudflare API token

### Quarterly Tasks
- Full WAF rule audit
- Terraform state cleanup
- Update rules based on new threats
- Test disaster recovery (destroy and re-apply)

---

## Compliance Notes

Deploying WAF satisfies:

| Standard | Requirement | Status |
|----------|-------------|--------|
| **PCI DSS 4.0** | Req 6.6.2: WAF for public-facing web apps | ✅ Satisfied |
| **OWASP Top 10** | A03:2021 (Injection), A01:2021 (Access Control) | ✅ Satisfied |
| **ISO 27001** | A.12.6.1: Management of technical vulnerabilities | ✅ Satisfied |

---

## Contact

- Cloudflare Support: https://support.cloudflare.com
- Terraform Provider Docs: https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs
- Internal Security: security@sonamoney.my.id

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Verified By:** _______________
