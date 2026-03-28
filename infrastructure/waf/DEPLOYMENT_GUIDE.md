# WAF Deployment Guide

## Cloudflare WAF Deployment for SonaMoney

### Prerequisites

1. **Cloudflare Account** with Pro or Business plan (WAF requires paid plan)
2. **Domain configured** in Cloudflare (sonamoney.my.id)
3. **Terraform** installed (optional, for infrastructure-as-code deployment)

---

## Deployment Methods

### Method 1: Cloudflare Dashboard (Manual)

#### Step 1: Enable Managed Rules

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your zone (sonamoney.my.id)
3. Go to **Security** > **WAF** > **Managed rules**
4. Enable the following rulesets:
   - **OWASP Core Ruleset** - Set to "Managed Challenge"
   - **Cloudflare Managed Rules** - Set to "Block"
   - **Cloudflare Exposed Credentials Check** - Set to "Managed Challenge"

#### Step 2: Create Custom Rules

1. Go to **Security** > **WAF** > **Custom rules**
2. Create rules in order (priority matters):

| Priority | Rule Name | Expression | Action |
|----------|-----------|------------|--------|
| 1 | Block High-Risk Countries | `(ip.geoip.country in {"CN", "RU", "KP", "IR"})` | Block |
| 2 | SQL Injection Protection | `(http.request.uri.query contains "union select" or http.request.uri.query contains "1=1")` | Block |
| 3 | XSS Protection | `(http.request.uri.query contains "<script>" or http.request.uri.query contains "javascript:")` | Block |
| 4 | Path Traversal | `(http.request.uri.path contains "../" or http.request.uri.query contains "file://")` | Block |
| 5 | API Rate Limit | `(http.request.uri.path contains "/api/")` | Rate Limit (100/min) |
| 6 | Block Bad Bots | `(cf.bot_management.score lt 30)` | Block |
| 7 | Challenge Suspected Bots | `(cf.bot_management.score ge 30 and cf.bot_management.score lt 50)` | Managed Challenge |
| 8 | High Threat Score | `(cf.threat_score gt 49)` | Block |
| 9 | Medium Threat Score | `(cf.threat_score gt 24 and cf.threat_score le 49)` | Managed Challenge |
| 10 | Enforce API Auth | `(http.request.uri.path contains "/api/" and not any(http.request.headers.names[*] == "authorization"))` | Block |

#### Step 3: Configure Rate Limiting

1. Go to **Security** > **WAF** > **Rate limiting rules**
2. Create these rules:

**General API Limit:**
- **When incoming requests match:** `(http.request.uri.path contains "/api/")`
- **Characteristics:** IP + Data Center
- **Period:** 1 minute
- **Threshold:** 100 requests
- **Action:** Block for 10 minutes

**Auth Endpoint Limit:**
- **When incoming requests match:** `(http.request.uri.path contains "/api/auth/")`
- **Characteristics:** IP
- **Period:** 1 minute
- **Threshold:** 10 requests
- **Action:** Block for 10 minutes

**Sensitive Endpoint Limit:**
- **When incoming requests match:** `(http.request.uri.path contains "/api/scan-receipt")`
- **Characteristics:** IP
- **Period:** 1 minute
- **Threshold:** 20 requests
- **Action:** Block for 10 minutes

#### Step 4: Enable Bot Management

1. Go to **Security** > **Bots**
2. Enable **Bot Fight Mode** (if available on your plan)
3. Enable **Super Bot Fight Mode** for more aggressive bot detection
4. Set **Definitely automated** to "Block"
5. Set **Likely automated** to "Managed Challenge"

#### Step 5: Configure DDoS Protection

1. Go to **Security** > **DDoS**
2. Enable **HTTP DDoS Attack Protection**
3. Set sensitivity to "Default"
4. Set action to "Managed Challenge"

---

### Method 2: Terraform (Automated)

#### Step 1: Install Terraform

```bash
# macOS
brew install terraform

# Windows
choco install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

#### Step 2: Configure Cloudflare Provider

Create `terraform.tfvars`:

```hcl
cloudflare_zone_id   = "your-zone-id-here"
cloudflare_account_id = "your-account-id-here"
cloudflare_api_token = "your-api-token-here"
```

#### Step 3: Initialize and Deploy

```bash
cd infrastructure/waf
terraform init
terraform plan
terraform apply
```

---

### Method 3: Cloudflare API (Scripted)

```bash
#!/bin/bash

# Set your credentials
ZONE_ID="your-zone-id"
API_TOKEN="your-api-token"

# Create custom rule - Block high-risk countries
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/firewall/rules" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "expression": "(ip.geoip.country in {\"CN\", \"RU\", \"KP\", \"IR\"})",
      "paused": false
    },
    "action": "block",
    "priority": 1,
    "paused": false,
    "description": "Block high-risk countries"
  }'

# Create rate limiting rule
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rate_limits" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "request": {
        "url": "*api*",
        "schemes": ["HTTPS"],
        "methods": ["GET", "POST", "PUT", "DELETE"]
      }
    },
    "threshold": 100,
    "period": 60,
    "action": {
      "mode": "ban",
      "timeout": 600
    }
  }'
```

---

## Verification

### Test WAF Rules

```bash
# Test 1: SQL Injection should be blocked
curl -I "https://sonamoney.my.id/api/transactions?id=1' OR '1'='1"
# Expected: HTTP 403 Forbidden

# Test 2: Path traversal should be blocked
curl -I "https://sonamoney.my.id/../../../etc/passwd"
# Expected: HTTP 403 Forbidden

# Test 3: XSS attempt should be blocked
curl -I "https://sonamoney.my.id/search?q=<script>alert(1)</script>"
# Expected: HTTP 403 Forbidden

# Test 4: Rate limiting
curl -I "https://sonamoney.my.id/api/transactions"
# Run 101 times in 1 minute - should block on 101st request
```

### Monitor WAF Events

1. Go to **Security** > **Events** in Cloudflare Dashboard
2. Filter by:
   - **Action:** Block, Challenge, Managed Challenge
   - **Source:** WAF, Rate Limit, Bot Fight
3. Review blocked requests and adjust rules if needed

---

## Post-Deployment Configuration

### 1. Add Custom Block Page

Go to **Custom Pages** in Cloudflare Dashboard and customize the WAF block page with your branding.

### 2. Configure Notifications

Set up alerts for:
- Spike in blocked requests
- DDoS attacks
- New bot patterns

### 3. Review Analytics

Weekly review of:
- Top blocked countries
- Top blocked IPs
- Most triggered rules
- False positive rate

---

## Troubleshooting

### False Positives

If legitimate users are being blocked:

1. Check **Security Events** for the blocked request
2. Identify which rule triggered
3. Add bypass condition:
   ```
   (not http.request.headers.contains("x-bypass-token"))
   ```
4. Or adjust rule sensitivity

### Rule Not Triggering

1. Verify rule is enabled
2. Check priority order (lower number = higher priority)
3. Test expression in Cloudflare's Expression Builder
4. Check if another rule is matching first

---

## Maintenance

### Weekly Tasks
- Review blocked requests in Security Events
- Check for false positives
- Update geographic blocks if needed

### Monthly Tasks
- Review rate limiting thresholds
- Analyze bot traffic patterns
- Update SQL/XSS patterns based on new attack vectors

### Quarterly Tasks
- Full WAF rule audit
- Update Terraform configurations
- Review access logs with security team

---

## Compliance Notes

The WAF configuration helps meet compliance requirements for:

- **PCI DSS 4.0**: Requirement 6.6.2 (WAF for web applications)
- **OWASP Top 10**: Protection against A03:2021 (Injection), A01:2021 (Broken Access Control)
- **ISO 27001**: A.12.6.1 (Management of technical vulnerabilities)

---

## Support

For issues or questions:
- Cloudflare Support: https://support.cloudflare.com
- Terraform Provider Docs: https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs
- Internal Security Team: security@sonamoney.my.id
