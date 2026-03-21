# SonaMoney Security Architecture

## Overview

This document describes the unified security architecture for SonaMoney, organized by concern with clear separation between frontend and backend responsibilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  lib/security/client.ts                                 │   │
│  │  • generateSecureHeaders() - Returns empty signatures   │   │
│  │  • securePost() - Standard fetch with Supabase auth   │   │
│  │  ⚠️ HMAC signatures DISABLED (secret not exposed)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Supabase Auth (Primary Security)                     │   │
│  │  • JWT tokens                                         │   │
│  │  • Session management                                 │   │
│  │  • Row Level Security                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP Requests
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Next.js/API)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Middleware (middleware.ts)                             │   │
│  │  • Rate limiting (Redis → In-Memory fallback)          │   │
│  │  • IP blocking for abuse                              │   │
│  │  • VPN/Proxy detection                                │   │
│  │  • Maintenance mode bypass                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  lib/security/server.ts (SERVER-ONLY)                   │   │
│  │  • generateRequestSignature() - HMAC-SHA256            │   │
│  │  • verifyRequestSignature() - Constant-time verify    │   │
│  │  • timingSafeEqual() - Prevent timing attacks         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  lib/security/rateLimiter.ts                            │   │
│  │  • Redis (Upstash) for distributed rate limiting       │   │
│  │  • In-memory fallback for resilience                    │   │
│  │  • Sliding window algorithm                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SQL
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase PostgreSQL)                  │
│  • auth_attempts - Failed login tracking                         │
│  • audit_log - Security events (90 day retention)                │
│  • rate_limit_entries - Fallback when Redis unavailable        │
│  • ip_blocks - Temporary IP bans                                 │
│  • rate_limit_violations - Audit trail                          │
└─────────────────────────────────────────────────────────────────┘
```

## Module Structure

### 1. `lib/security/index.ts` - Universal Exports
Safe to import from anywhere (client or server):
```typescript
import { sanitizeXSS, isRequestFresh } from "@/lib/security"
import { REQUEST_TIMEOUT_MS } from "@/lib/security/config"
```

### 2. `lib/security/config.ts` - Configuration
Environment variables and constants:
```typescript
export const REQUEST_SECRET = process.env.REQUEST_SECRET || ""
export const REQUEST_TIMEOUT_MS = 30000 // 30 seconds
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000
```

### 3. `lib/security/server.ts` - Server-Only Crypto
⚠️ **NEVER import in client components:**
```typescript
// Server components and API routes only
import { verifyRequestSignature } from "@/lib/security/server"
```

Functions:
- `generateRequestSignature()` - HMAC-SHA256 with sorted keys
- `verifyRequestSignature()` - Constant-time comparison
- `timingSafeEqual()` - Side-channel resistant compare
- `sortObjectKeys()` - Consistent serialization

### 4. `lib/security/client.ts` - Client Headers
```typescript
import { generateSecureHeaders } from "@/lib/security/client"
```

⚠️ **Important:** Returns empty signatures to prevent secret exposure.
Authentication relies entirely on Supabase session.

### 5. `lib/security/validation.ts` - Input Validation
```typescript
import { emailSchema, isRequestFresh } from "@/lib/security/validation"
```

- Zod schemas for email/password validation
- Anti-replay timestamp checking
- Request freshness validation

### 6. `lib/security/sanitization.ts` - XSS Protection
```typescript
import { sanitizeXSS, sanitizeEmail } from "@/lib/security/sanitization"
```

- Removes `< > / \` and event handlers
- Strips HTML tags
- Filename sanitization for path traversal prevention

### 7. `lib/security/rateLimiter.ts` - Rate Limiting
```typescript
import { checkGeneralRateLimit, isBlocked } from "@/lib/security/rateLimiter"
```

- Redis (Upstash) for distributed state
- In-memory Map fallback
- Configurable limits per endpoint type

## Security Controls Matrix

| Control | Frontend | Backend | Database | Purpose |
|---------|----------|---------|----------|---------|
| Authentication | Supabase Auth | Supabase JWT | RLS | Identity |
| Request Signing | ❌ Disabled | ✅ HMAC-SHA256 | - | Integrity |
| Rate Limiting | - | ✅ Redis + Fallback | ✅ Tables | Availability |
| XSS Protection | ✅ Sanitize | ✅ Validate | - | Injection |
| SQL Injection | - | ✅ Parameterized | ✅ RLS | Injection |
| Field Whitelist | - | ✅ validateRequest() | - | Mass Assignment |
| Anti-Replay | - | ✅ Timestamp check | - | Replay |
| Timing Attacks | - | ✅ Constant-time | - | Side-channel |
| IP Blocking | - | ✅ Middleware | ✅ Table | Abuse |
| Audit Logging | - | ✅ Console + DB | ✅ audit_log | Compliance |

## Data Flow: Secure Request

```
1. User Action (Frontend)
   └── generateSecureHeaders() 
       └── Returns: { "X-Request-Timestamp": "1234567890000", "X-Request-Signature": "" }

2. HTTP Request
   └── Headers: Authorization: Bearer <JWT>, X-Request-Timestamp, X-Request-Signature
   └── Body: JSON payload

3. Middleware (First Line)
   └── extractClientIP() → Check IP block list
   └── checkRateLimit(ip, endpoint) → Redis or Memory
   └── If blocked → 429 or 403 response

4. API Route Handler
   └── validateRequest(req, body, schema)
       ├── Check timestamp (anti-replay)
       ├── Optional: Verify signature (empty = skip)
       ├── Sanitize all string fields
       └── Zod schema validation

5. Database
   └── Supabase RLS policies enforce row-level access
   └── Audit log entry created
```

## Migration from Legacy

### Deprecated Files (to be removed):
- `lib/utils/requestSecurity.ts` → Use `lib/security/server.ts`
- `lib/utils/clientSecurity.ts` → Use `lib/security/client.ts`

### Import Updates:
```typescript
// OLD (deprecated)
import { generateRequestSignature } from "@/lib/utils/requestSecurity"

// NEW (server-only)
import { generateRequestSignature } from "@/lib/security/server"

// OLD (deprecated)
import { generateClientSignature } from "@/lib/utils/clientSecurity"

// NEW (client)
import { generateClientSignature } from "@/lib/security/client"
```

## Configuration Requirements

### Environment Variables:
```env
# Server-only (NEVER prefix with NEXT_PUBLIC_)
REQUEST_SECRET=your-generated-secret-here
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Database Migrations:
Run all migrations in order:
```bash
001_core_schema.sql
002_debt_tracking.sql
003_functions_triggers.sql
004_category_icons_and_seed.sql
005_financial_health.sql
006_auth_security.sql        # Auth attempts
007_audit_log.sql            # Security audit log
008_distributed_rate_limiting.sql  # Rate limiting tables
```

## Testing Security

```bash
# Run comprehensive security tests
node scripts/test-security.mjs

# Individual checks
curl -I https://sonamoney.my.id | grep -i x-frame-options
curl -X POST https://sonamoney.my.id/api/auth/login  # Test rate limiting
```

## Compliance Mapping

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| OWASP A01:2021 | Field whitelisting, parameterized queries | Unit tests |
| OWASP A02:2021 | HMAC-SHA256, constant-time compare | Crypto tests |
| OWASP A03:2021 | sanitizeXSS, CSP headers | Security headers test |
| OWASP A07:2021 | Supabase Auth, JWT validation | Auth tests |
| Data Integrity | Atomic DB operations, audit logs | Transaction tests |
| Availability | Rate limiting, IP blocking | Load tests |

## Key Decisions

1. **Client-side HMAC disabled**: Prevents secret exposure, relies on Supabase Auth
2. **Empty signatures accepted**: Backward compatibility during transition
3. **Redis + Fallback**: Scalable but resilient to Redis outages
4. **Database audit tables**: Compliance and forensic capability
5. **Modular architecture**: Clear separation of concerns, maintainable
