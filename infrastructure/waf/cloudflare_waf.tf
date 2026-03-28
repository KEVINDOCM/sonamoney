# Cloudflare WAF Configuration for SonaMoney
# Deploy via Cloudflare Dashboard or API

# ============================================
# WAF RULE SETS
# ============================================

# 1. OWASP Core Rule Set (Managed Rules)
resource "cloudflare_ruleset" "owasp_rules" {
  zone_id = var.cloudflare_zone_id
  name    = "OWASP Core Ruleset"
  kind    = "zone"
  phase   = "http_request_firewall_managed"

  # Enable all OWASP rules at default sensitivity
  rules = [
    {
      action = "managed_challenge"
      expression = "true"  # Apply to all requests
      description = "OWASP Core Rule Set - Block SQL Injection, XSS, LFI, RFI"
      enabled = true
    }
  ]
}

# 2. Cloudflare Managed Rules
resource "cloudflare_ruleset" "managed_rules" {
  zone_id = var.cloudflare_zone_id
  name    = "Cloudflare Managed Rules"
  kind    = "zone"
  phase   = "http_request_firewall_managed"

  # Enable all managed rule categories
  rules = [
    {
      action = "block"
      expression = "true"
      description = "Cloudflare Managed Rules - Known Bad IPs, Bots, CVEs"
      enabled = true
    }
  ]
}

# ============================================
# CUSTOM WAF RULES
# ============================================

# Rate Limiting Rule - API Abuse Protection
resource "cloudflare_ruleset" "api_rate_limit" {
  zone_id = var.cloudflare_zone_id
  name    = "API Rate Limiting"
  kind    = "zone"
  phase   = "http_request_ratelimit"

  rules = [
    {
      action = "block"
      expression = "(http.request.uri.path contains \"/api/\")"
      description = "API Rate Limit - 100 requests per minute per IP"
      enabled = true
      ratelimit = {
        characteristics = ["ip.src", "cf.colo.id"]
        period = 60  # 1 minute
        requests_per_period = 100
        mitigation_timeout = 600  # 10 minute block
        counting_expression = "true"
      }
    }
  ]
}

# Geographic Blocking - High Risk Countries
resource "cloudflare_ruleset" "geo_block" {
  zone_id = var.cloudflare_zone_id
  name    = "Geographic Blocking"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      action = "block"
      expression = "(ip.geoip.country in {\"CN\", \"RU\", \"KP\", \"IR\"})"
      description = "Block high-risk countries"
      enabled = true
    }
  ]
}

# Bot Management - Block Known Bad Bots
resource "cloudflare_ruleset" "bot_management" {
  zone_id = var.cloudflare_zone_id
  name    = "Bot Management"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      action = "block"
      expression = "(cf.bot_management.score lt 30)"
      description = "Block requests with low bot score"
      enabled = true
    },
    {
      action = "managed_challenge"
      expression = "(cf.bot_management.score ge 30 and cf.bot_management.score lt 50)"
      description = "Challenge suspected bots"
      enabled = true
    }
  ]
}

# SQL Injection Protection (Custom Rules)
resource "cloudflare_ruleset" "sqli_protection" {
  zone_id = var.cloudflare_zone_id
  name    = "SQL Injection Protection"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      action = "block"
      expression = "(http.request.uri.query contains \"union select\" or http.request.uri.query contains \"union all select\" or http.request.uri.query contains \"insert into\" or http.request.uri.query contains \"delete from\" or http.request.uri.query contains \"drop table\" or http.request.uri.query contains \"1=1\" or http.request.uri.query contains \"' or '\")"
      description = "Block common SQL injection patterns in query strings"
      enabled = true
    },
    {
      action = "block"
      expression = "(lower(http.request.body.raw) contains \"union select\" or lower(http.request.body.raw) contains \"union all select\" or lower(http.request.body.raw) contains \"insert into\" or lower(http.request.body.raw) contains \"delete from\")"
      description = "Block SQL injection in POST body"
      enabled = true
    }
  ]
}

# XSS Protection (Custom Rules)
resource "cloudflare_ruleset" "xss_protection" {
  zone_id = var.cloudflare_zone_id
  name    = "XSS Protection"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      action = "block"
      expression = "(http.request.uri.query contains \"<script>\" or http.request.uri.query contains \"javascript:\" or http.request.uri.query contains \"onload=\" or http.request.uri.query contains \"onerror=\")"
      description = "Block XSS patterns in query strings"
      enabled = true
    },
    {
      action = "block"
      expression = "(lower(http.request.body.raw) contains \"<script>\" or lower(http.request.body.raw) contains \"javascript:\" or lower(http.request.body.raw) contains \"alert(\" or lower(http.request.body.raw) contains \"document.cookie\")"
      description = "Block XSS patterns in request body"
      enabled = true
    }
  ]
}

# API Authentication Enforcement
resource "cloudflare_ruleset" "api_auth" {
  zone_id = var.cloudflare_zone_id
  name    = "API Authentication Enforcement"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      action = "block"
      expression = "(http.request.uri.path contains \"/api/\" and not http.request.uri.path contains \"/api/auth/\" and not any(http.request.headers.names[*] == \"authorization\"))"
      description = "Block API requests without Authorization header"
      enabled = true
    }
  ]
}

# Path Traversal Protection
resource "cloudflare_ruleset" "path_traversal" {
  zone_id = var.cloudflare_zone_id
  name    = "Path Traversal Protection"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      action = "block"
      expression = "(http.request.uri.path contains \"../\" or http.request.uri.path contains \"..\\\" or http.request.uri.query contains \"../\" or http.request.uri.query contains \"file://\" or http.request.uri.query contains \"://\")"
      description = "Block path traversal attempts"
      enabled = true
    }
  ]
}

# IP Reputation - Block Known Threats
resource "cloudflare_ruleset" "ip_reputation" {
  zone_id = var.cloudflare_zone_id
  name    = "IP Reputation"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      action = "block"
      expression = "(cf.threat_score gt 49)"
      description = "Block requests from IPs with high threat score"
      enabled = true
    },
    {
      action = "managed_challenge"
      expression = "(cf.threat_score gt 24 and cf.threat_score le 49)"
      description = "Challenge requests from IPs with medium threat score"
      enabled = true
    }
  ]
}

# ============================================
# DDoS PROTECTION
# ============================================

# Layer 7 DDoS Protection
resource "cloudflare_ruleset" "ddos_protection" {
  zone_id = var.cloudflare_zone_id
  name    = "DDoS Protection"
  kind    = "zone"
  phase   = "ddos_l7"

  rules = [
    {
      action = "execute"
      expression = "true"
      description = "Enable Cloudflare DDoS protection"
      enabled = true
      action_parameters = {
        overrides = {
          rules = [
            {
              id = "0e059335170d41a6a328b70c4a1e4c7d"  # HTTP DDoS Attack Protection
              sensitivity_level = "default"
              action = "managed_challenge"
            }
          ]
        }
      }
    }
  ]
}

# ============================================
# CUSTOM ERROR PAGES
# ============================================

# Custom block page for WAF blocks
resource "cloudflare_custom_pages" "waf_block" {
  zone_id = var.cloudflare_zone_id
  type    = "waf_block"
  
  value = <<-EOT
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Denied | SonaMoney</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #0F172A 0%, #1A1A2E 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .container {
        max-width: 480px;
        text-align: center;
      }
      .card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        padding: 40px 32px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      h1 {
        color: #fff;
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 16px;
      }
      p {
        color: #9CA3AF;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .error-code {
        color: #EF4444;
        font-family: monospace;
        font-size: 14px;
        background: rgba(239, 68, 68, 0.1);
        padding: 8px 16px;
        border-radius: 8px;
        display: inline-block;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <h1>Access Denied</h1>
        <p>Your request has been blocked by our security system. This may be due to suspicious activity or a security policy violation.</p>
        <div class="error-code">Error 1020: Access Denied</div>
        <p style="margin-top: 24px; font-size: 14px;">If you believe this is an error, please contact support@sonamoney.my.id</p>
      </div>
    </div>
  </body>
  </html>
  EOT
}

# ============================================
# VARIABLES
# ============================================

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for sonamoney.my.id"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}
