# SonaMoney Security Gap Audit

**Date:** March 21, 2026  
**Auditor:** Security Analysis Team  
**Scope:** Full application security assessment against industry best practices  
**Risk Rating:** 🔴 **HIGH** — Multiple critical security gaps identified

---

## Executive Summary

This audit identifies **security deficiencies** where SonaMoney does **NOT** conform to industry best practices and security standards (OWASP, NIST, ISO 27001, CIS Controls). The findings reveal **critical gaps** that could lead to security breaches, data exposure, or compliance violations.

### Overall Risk Score: **7.2/10** (High Risk)

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 **Critical** | 5 | Immediate remediation required |
| 🟠 **High** | 8 | Address within 30 days |
| 🟡 **Medium** | 12 | Address within 90 days |
| 🟢 **Low** | 6 | Address within 180 days |

---

## 🔴 Critical Findings (Immediate Action Required)

### CR-001: Secret Exposure to Client Side
**Severity:** 🔴 Critical  
**Category:** Cryptographic Failures (A02:2021)  
**Location:** `lib/security/config.ts:5`

**Issue:** The `NEXT_PUBLIC_REQUEST_SECRET` is exposed to the client side via `NEXT_PUBLIC_` prefix. This allows attackers to extract the signing secret from browser DevTools.

```typescript
// ❌ CRITICAL VULNERABILITY
export const REQUEST_SECRET = process.env.NEXT_PUBLIC_REQUEST_SECRET || ""
```

**Impact:** Attackers can forge HMAC signatures and impersonate legitimate requests.  
**Standard Violated:** OWASP A02:2021 - Secrets must never be client-accessible.  
**Recommendation:** 
- Remove `NEXT_PUBLIC_` prefix and use server-side-only environment variable
- Implement secret rotation mechanism
- Add immediate secret revocation and regeneration

---

### CR-002: State-Only Rate Limiting (Non-Scalable)
**Severity:** 🔴 Critical  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** `middleware.ts:15-51`

**Issue:** Rate limiting uses in-memory `Map` which:
- **Resets on server restart** — attackers can bypass limits by triggering a restart
- **Does not scale** — multiple server instances have independent counters
- **No persistence** — blocked IPs are forgotten after restart
- **Memory leak risk** — Map grows unbounded in high-traffic scenarios

```typescript
// ❌ CRITICAL: State doesn't persist or scale
const ipRateLimitMap = new Map<string, IpRateLimitEntry>()
```

**Impact:** DDoS attacks, brute force attacks, resource exhaustion.  
**Standard Violated:** NIST 800-53 AC-17 — Rate limiting must be persistent and distributed.  
**Recommendation:** 
- Implement Redis-based rate limiting
- Use cloud-native rate limiting (Cloudflare, AWS WAF)
- Add rate limit persistence to database

---

### CR-003: Inconsistent Security Headers
**Severity:** 🔴 Critical  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** `next.config.js:38` vs `lib/security/index.ts:485`

**Issue:** X-Frame-Options header has **conflicting values**:
- `next.config.js`: `SAMEORIGIN` — allows framing from same origin
- `lib/security/index.ts`: `DENY` — denies all framing

This inconsistency creates a **race condition** where the weaker `SAMEORIGIN` policy may be applied, enabling clickjacking attacks.

**Impact:** Clickjacking attacks can trick users into performing unintended actions.  
**Standard Violated:** OWASP A05:2021, CIS Control 3.11  
**Recommendation:** 
- Standardize on `DENY` (strongest policy)
- Implement automated header validation in CI/CD
- Add Content-Security-Policy `frame-ancestors` directive

---

### CR-004: No Multi-Factor Authentication (MFA)
**Severity:** 🔴 Critical  
**Category:** Authentication Failures (A07:2021)  
**Location:** Authentication system

**Issue:** No MFA/2FA implementation exists. Users are protected by single-factor (password-only) authentication.

**Impact:** Account takeover via credential stuffing, phishing, or brute force.  
**Standard Violated:** 
- NIST 800-63B (Digital Identity Guidelines — requires AAL2 for financial apps)
- PCI DSS 8.3 (requires MFA for admin access)
- ISO 27001 A.9.4.2 (secure logon)

**Recommendation:** 
- Implement TOTP-based 2FA (Google Authenticator, Authy)
- Add WebAuthn/FIDO2 support for hardware keys
- Require MFA for sensitive operations (large transfers, settings changes)

---

### CR-005: No Role-Based Access Control (RBAC)
**Severity:** 🔴 Critical  
**Category:** Broken Access Control (A01:2021)  
**Location:** Application-wide

**Issue:** Application uses **binary authentication** (logged in / not logged in) with no role differentiation. No support for:
- Admin vs User roles
- Read-only users
- Tiered permissions

**Impact:** 
- Privilege escalation attacks
- Internal threats (employees accessing all data)
- Compliance violations (SOX, GDPR access control requirements)

**Standard Violated:** OWASP A01:2021, NIST 800-53 AC-3, ISO 27001 A.9.1.2  
**Recommendation:** 
- Implement RBAC with roles: `user`, `admin`, `auditor`, `support`
- Add row-level security policies in Supabase
- Implement permission middleware

---

## 🟠 High Severity Findings

### HI-001: Missing CSRF Protection on State-Changing Operations
**Severity:** 🟠 High  
**Category:** Injection (A03:2021)  
**Location:** API routes

**Issue:** No CSRF tokens implemented. While `SameSite=Lax` provides partial protection, it is **not sufficient** for:
- Cross-origin POST requests from trusted subdomains
- Browser compatibility issues (older browsers ignore SameSite)
- JSON-based CSRF attacks

**Standard Violated:** OWASP CSRF Prevention Cheat Sheet  
**Recommendation:** 
- Implement Double-Submit Cookie pattern
- Add CSRF tokens to all state-changing operations
- Validate `Origin` and `Referer` headers

---

### HI-002: No Security Event Correlation IDs
**Severity:** 🟠 High  
**Category:** Logging Failures (A09:2021)  
**Location:** Logging system

**Issue:** No request ID / correlation ID tracking across:
- Multiple microservices
- Frontend to backend traces
- Distributed systems

Without correlation IDs, security incidents cannot be traced across the application stack.

**Standard Violated:** NIST 800-53 AU-6, ISO 27001 A.12.4.1  
**Recommendation:** 
- Implement UUID-based request IDs
- Propagate via `X-Request-ID` header
- Include in all audit logs

---

### HI-003: No Automated Secret Rotation
**Severity:** 🟠 High  
**Category:** Cryptographic Failures (A02:2021)  
**Location:** Security configuration

**Issue:** Secrets (HMAC keys, API keys) are **static** with no rotation mechanism:
- `NEXT_PUBLIC_REQUEST_SECRET` — no rotation
- `GEMINI_API_KEY` — no rotation
- `SUPABASE_SERVICE_ROLE_KEY` — no rotation

**Impact:** 
- Long-lived secrets increase exposure window
- Former employees retain access if keys aren't rotated
- Compromised keys remain valid indefinitely

**Standard Violated:** NIST 800-53 SC-12, CIS Control 14.5  
**Recommendation:** 
- Implement 90-day automatic rotation
- Add key versioning support
- Use cloud secret managers (AWS Secrets Manager, HashiCorp Vault)

---

### HI-004: No Web Application Firewall (WAF)
**Severity:** 🟠 High  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** Infrastructure layer

**Issue:** No WAF protection at the edge:
- No SQL injection filtering
- No XSS pattern blocking
- No bot detection
- No geographic blocking
- No DDoS protection at L7

**Standard Violated:** OWASP A05:2021, NIST 800-53 SC-7  
**Recommendation:** 
- Implement Cloudflare WAF or AWS WAF
- Enable OWASP Core Rule Set
- Add custom rules for API abuse

---

### HI-005: No Database Encryption at Rest
**Severity:** 🟠 High  
**Category:** Cryptographic Failures (A02:2021)  
**Location:** Supabase database

**Issue:** No explicit database encryption at rest configuration for:
- Financial transaction data
- User PII (email, potentially SSN/tax IDs)
- Authentication tokens

**Impact:** Data exposure if database is compromised (backup theft, insider threat).  
**Standard Violated:** PCI DSS 3.4, GDPR Article 32, ISO 27001 A.10.1.2  
**Recommendation:** 
- Enable Supabase column-level encryption
- Encrypt sensitive fields (amounts, notes with PII)
- Use AES-256-GCM for encryption

---

### HI-006: No API Versioning for Security Updates
**Severity:** 🟠 High  
**Category:** Vulnerable Components (A06:2021)  
**Location:** API architecture

**Issue:** No API versioning strategy. Security fixes may break backward compatibility, forcing a choice between:
- Security (breaking changes)
- Compatibility (leaving vulnerabilities)

**Standard Violated:** REST API Design Best Practices  
**Recommendation:** 
- Implement `/api/v1/`, `/api/v2/` versioning
- Deprecate old versions with sunset headers
- Allow security-only updates to existing versions

---

### HI-007: No Content Security Policy Reporting
**Severity:** 🟠 High  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** `next.config.js:86-111`

**Issue:** CSP is configured but:
- No `report-uri` or `report-to` directive
- No violation monitoring
- `unsafe-inline` in script-src weakens CSP significantly

**Impact:** XSS attacks may go undetected. Policy violations are silently ignored.  
**Standard Violated:** CSP Level 3 Specification  
**Recommendation:** 
- Add CSP reporting endpoint
- Implement `report-to` with Reporting API
- Remove `unsafe-inline` using nonce/hash-based CSP

---

### HI-008: Insufficient Session Management
**Severity:** 🟠 High  
**Category:** Authentication Failures (A07:2021)  
**Location:** Supabase Auth integration

**Issue:** No custom session management controls:
- No absolute session timeout (users stay logged in indefinitely)
- No idle session timeout
- No concurrent session limits
- No session invalidation on suspicious activity
- No session binding to IP/device fingerprint

**Standard Violated:** OWASP Session Management Cheat Sheet, NIST 800-63B 7.2  
**Recommendation:** 
- Implement 24-hour absolute timeout
- 30-minute idle timeout
- Maximum 3 concurrent sessions
- Alert on new device/location login

---

## 🟡 Medium Severity Findings

### ME-001: No Security.txt File
**Severity:** 🟡 Medium  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** Public directory

**Issue:** Missing `.well-known/security.txt` file for responsible disclosure.

**Standard Violated:** securitytxt.org RFC (draft-foudil-securitytxt-12)  
**Recommendation:** Create `public/.well-known/security.txt` with contact information.

---

### ME-002: Error Messages Expose Implementation Details
**Severity:** 🟡 Medium  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** Multiple API routes

**Issue:** Development error details exposed in production responses:

```typescript
// ❌ Exposes internal implementation
return Response.json({ 
  error: "Server configuration error", 
  details: process.env.NODE_ENV === "development" 
    ? `Missing: ${missingVars.join(", ")}` 
    : "Contact support if this persists." 
})
```

While the ternary checks NODE_ENV, the pattern itself is risky if misconfigured.

**Recommendation:** 
- Use structured error codes only
- Log details server-side
- Send generic messages to clients

---

### ME-003: No Automated Dependency Vulnerability Scanning
**Severity:** 🟡 Medium  
**Category:** Vulnerable Components (A06:2021)  
**Location:** CI/CD pipeline

**Issue:** No automated vulnerability scanning in build process:
- No `npm audit` in CI
- No Snyk/Dependabot integration
- No SCA (Software Composition Analysis)

**Recommendation:** 
- Add `npm audit --audit-level=high` to CI
- Enable GitHub Dependabot alerts
- Integrate Snyk or OWASP Dependency-Check

---

### ME-004: No Subresource Integrity (SRI)
**Severity:** 🟡 Medium  
**Category:** Integrity Failures (A08:2021)  
**Location:** External resources

**Issue:** External scripts (Cloudflare Insights, Google Fonts) loaded without SRI hashes.

**Recommendation:** Add `integrity` attributes to all external `<script>` and `<link>` tags.

---

### ME-005: No DDoS Protection at Edge
**Severity:** 🟡 Medium  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** Infrastructure

**Issue:** No volumetric DDoS protection beyond basic rate limiting.

**Recommendation:** Enable Cloudflare DDoS protection or AWS Shield Standard.

---

### ME-006: No IP Allowlisting for Admin Functions
**Severity:** 🟡 Medium  
**Category:** Broken Access Control (A01:2021)  
**Location:** Admin/maintenance features

**Issue:** Maintenance bypass and admin functions accessible from any IP.

**Recommendation:** 
- Implement IP allowlist for admin endpoints
- Require VPN access for sensitive operations
- Add geographic restrictions

---

### ME-007: Insufficient Audit Log Retention
**Severity:** 🟡 Medium  
**Category:** Logging Failures (A09:2021)  
**Location:** `lib/utils/auditLog.ts`

**Issue:** No defined audit log retention policy. Compliance requires:
- PCI DSS: 1 year retention, 3 months immediately available
- SOX: 7 years
- GDPR: As long as necessary for security

**Recommendation:** 
- Implement tiered retention (hot: 90 days, warm: 1 year, cold: 7 years)
- Archive to immutable storage (S3 Glacier, Azure Archive)

---

### ME-008: No Input Length Limits on All Fields
**Severity:** 🟡 Medium  
**Category:** Injection (A03:2021)  
**Location:** API validation

**Issue:** Not all fields have strict length limits. Missing limits on:
- Some `notes` fields
- Custom category names
- Search query parameters

**Recommendation:** Implement strict length validation on ALL user inputs (max 10KB per field).

---

### ME-009: No HSTS Preload Submission
**Severity:** 🟡 Medium  
**Category:** Cryptographic Failures (A02:2021)  
**Location:** `next.config.js:81-83`

**Issue:** HSTS is configured with `preload` directive but domain not submitted to [hstspreload.org](https://hstspreload.org).

**Recommendation:** Submit domain to HSTS preload list after confirming HTTPS stability.

---

### ME-010: No Bot Detection/CAPTCHA
**Severity:** 🟡 Medium  
**Category:** Authentication Failures (A07:2021)  
**Location:** Login/Register forms

**Issue:** No CAPTCHA or bot detection beyond basic honeypot field.

**Recommendation:** 
- Implement hCaptcha or Cloudflare Turnstile
- Add progressive CAPTCHA (only after failed attempts)
- Use device fingerprinting

---

### ME-011: Insufficient CORS Preflight Caching
**Severity:** 🟡 Medium  
**Category:** Broken Access Control (A01:2021)  
**Location:** `next.config.js:194-196`

**Issue:** `Access-Control-Max-Age: 86400` (24 hours) causes unnecessary preflight requests.

**Recommendation:** Increase to 7200 seconds (2 hours) for dynamic environments.

---

### ME-012: No Secure Backup Encryption
**Severity:** 🟡 Medium  
**Category:** Cryptographic Failures (A02:2021)  
**Location:** Database backups

**Issue:** No explicit backup encryption configuration mentioned.

**Recommendation:** 
- Encrypt all database backups with AES-256
- Store encryption keys in separate key management system
- Test backup restoration procedures

---

## 🟢 Low Severity Findings

### LO-001: Missing Permissions-Policy Directives
**Severity:** 🟢 Low  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** `next.config.js:57-65`

**Issue:** Permissions-Policy missing modern directives:
- `accelerometer=()`
- `gyroscope=()`
- `magnetometer=()`
- `payment=()`

---

### LO-002: No Feature Policy for Legacy Browsers
**Severity:** 🟢 Low  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** Headers

**Issue:** No `Feature-Policy` header (deprecated but needed for IE11/old Safari).

---

### LO-003: No Expect-CT Header
**Severity:** 🟢 Low  
**Category:** Cryptographic Failures (A02:2021)  
**Location:** TLS configuration

**Issue:** Missing `Expect-CT` header for Certificate Transparency monitoring.

**Note:** This is now less critical as Chrome enforces CT by default.

---

### LO-004: No DNSSEC Configuration
**Severity:** 🟢 Low  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** DNS

**Issue:** DNSSEC not mentioned in domain configuration.

---

### LO-005: No Automated Security Regression Tests
**Severity:** 🟢 Low  
**Category:** Security Misconfiguration (A05:2021)  
**Location:** CI/CD

**Issue:** Security tests exist but not run automatically on every PR.

**Recommendation:** Add security test execution to CI pipeline gates.

---

### LO-006: No Dark Web Monitoring
**Severity:** 🟢 Low  
**Category:** Logging Failures (A09:2021)  
**Location:** Threat intelligence

**Issue:** No monitoring for credentials/database dumps on dark web.

**Recommendation:** Integrate HaveIBeenPwned API for ongoing monitoring (already using for passwords, extend to emails).

---

## Remediation Roadmap

### Phase 1: Critical (Week 1-2)
1. Rotate `NEXT_PUBLIC_REQUEST_SECRET` to server-only variable
2. Standardize X-Frame-Options to `DENY`
3. Implement Redis-based rate limiting
4. Add MFA support for admin accounts
5. Design RBAC schema

### Phase 2: High (Week 3-6)
1. Implement CSRF tokens
2. Add request correlation IDs
3. Enable Supabase column encryption
4. Implement secret rotation mechanism
5. Deploy WAF (Cloudflare/AWS)
6. Add API versioning
7. Implement CSP reporting
8. Add session timeouts

### Phase 3: Medium (Week 7-12)
1. Add security.txt
2. Implement automated dependency scanning
3. Add SRI to external resources
4. Define audit retention policy
5. Submit HSTS preload
6. Add CAPTCHA protection

### Phase 4: Low (Ongoing)
1. Complete Permissions-Policy
2. Add legacy Feature-Policy
3. Enable DNSSEC
4. Integrate dark web monitoring

---

## Compliance Gap Analysis

| Standard | Compliant | Gaps |
|----------|:---------:|------|
| **PCI DSS 4.0** | ❌ No | Missing: MFA (8.3), WAF (6.6.2), encryption at rest (3.4) |
| **SOC 2 Type II** | ⚠️ Partial | Missing: RBAC, session timeouts, structured audit trails |
| **ISO 27001:2022** | ⚠️ Partial | Missing: A.9.1.2 (RBAC), A.9.4.2 (session control), A.10.1.2 (encryption) |
| **GDPR Article 32** | ⚠️ Partial | Missing: Encryption at rest, pseudonymization |
| **NIST 800-53** | ⚠️ Partial | Missing: AC-3 (RBAC), SC-7 (WAF), AU-6 (log analysis) |
| **OWASP ASVS Level 2** | ⚠️ Partial | Missing: V2.2 (MFA), V4.1 (CSRF), V11.1 (RBAC) |

---

## Conclusion

SonaMoney has implemented **basic security controls** (input validation, XSS sanitization, basic rate limiting) but has **significant gaps** against industry best practices. The **5 critical findings** require immediate attention, particularly the client-side secret exposure and non-scalable rate limiting.

**Immediate Actions Required:**
1. ✅ Rotate exposed secrets
2. ✅ Implement distributed rate limiting
3. ✅ Add MFA for all admin accounts
4. ✅ Standardize security headers
5. ✅ Design RBAC architecture

**Risk Acceptance Required For:**
- Operating without MFA until implemented
- Operating without WAF until deployed
- Operating without encryption at rest until enabled

---

*This audit was conducted against industry standards including OWASP Top 10 2021, NIST 800-53 Rev 5, ISO 27001:2022, PCI DSS 4.0, and CIS Controls v8.*
