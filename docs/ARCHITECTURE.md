# SonaMoney System Architecture

**Version:** 1.0  
**Last Updated:** March 28, 2026  

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │   Mobile     │  │   PWA        │  │  Third-Party │     │
│  │   (Next.js)  │  │   (Future)   │  │   (Offline)  │  │    APIs      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          └─────────────────┴─────────────────┴─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE/CDN LAYER                                     │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     Cloudflare WAF + CDN                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   DDoS      │  │  OWASP      │  │  Rate       │  │   Bot       │  │   │
│  │  │ Protection  │  │  CRS Rules  │  │  Limiting   │  │ Management│  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Vercel Edge Network                              │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │   │
│  │  │  Next.js    │  │  Middleware │  │  API Routes │  │  Static  │  │   │
│  │  │  App Router │  │  (Security) │  │  (Server)   │  │  Assets  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │   │
│  │                                                                      │   │
│  │  Security Features:                                                  │   │
│  │  • Rate limiting (Redis)                                             │   │
│  │  • CSRF protection                                                   │   │
│  │  • RBAC authorization                                                │   │
│  │  • Maintenance mode                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│                                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                    │
│  │      Supabase           │  │       Upstash Redis     │                    │
│  │    (PostgreSQL)         │  │    (Rate Limiting)      │                    │
│  │                         │  │                         │                    │
│  │  ┌─────────────────┐   │  │  ┌─────────────────┐   │                    │
│  │  │   Auth (GoTrue) │   │  │  │  Rate Limits    │   │                    │
│  │  └─────────────────┘   │  │  │  Session Cache  │   │                    │
│  │                         │  │  └─────────────────┘   │                    │
│  │  ┌─────────────────┐   │  └─────────────────────────┘                    │
  │  │   Database      │   │                                                  │
│  │  │   (Postgres)  │   │                                                  │
│  │  │                 │   │                                                  │
│  │  │  • RLS Policies │  │                                                  │
│  │  │  • Triggers     │  │                                                  │
│  │  │  • Functions    │  │                                                  │
│  │  │  • Indexes      │  │                                                  │
│  │  └─────────────────┘   │                                                  │
│  └─────────────────────────┘                                                  │
│                                                                              │
│  ┌─────────────────────────┐                                                  │
│  │   Google AI (Gemini)    │  ← Receipt Scanning, Chat Assistant             │
│  └─────────────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Components

```
app/
├── (auth)/                    # Authentication routes (login, signup, forgot-password)
│   ├── layout.tsx            # Auth layout (no sidebar)
│   └── ...
├── (dashboard)/               # Protected dashboard routes
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Dashboard home
│   ├── transactions/
│   ├── budget/
│   ├── analytics/
│   └── ...
├── api/                       # API routes (Serverless Functions)
│   ├── auth/
│   ├── transactions/
│   ├── chat/
│   └── scan-receipt/
└── ...

components/
├── analytics/                 # Analytics visualizations
├── budget/                    # Budget management UI
├── calendar/                  # Calendar view
├── categories/                # Category management
├── transactions/              # Transaction forms/lists
├── ui/                        # Shared UI components
└── ...

lib/
├── actions/                   # Server actions (form submissions)
├── api/                       # API client utilities
├── contexts/                  # React contexts (Currency, Translation)
├── hooks/                     # Custom React hooks
├── security/                  # Security utilities
│   ├── config.ts             # Security configuration
│   ├── rateLimiter.ts        # Distributed rate limiting
│   └── ...
└── utils/                     # General utilities
```

### 2.2 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REQUEST FLOW                                │
└─────────────────────────────────────────────────────────────────┘

1. Request Received
   │
   ▼
┌─────────────────┐
│  Cloudflare WAF │  → DDoS, SQLi, XSS, Bot Detection
│  (Edge Layer)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel Edge    │  → SSL Termination, Geo Routing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js        │  → Middleware Execution
│  Middleware     │
│                 │
│  ├─ IP Extraction & Anonymizer Detection
│  ├─ Maintenance Mode Check
│  ├─ Rate Limiting (Redis)
│  ├─ Supabase Auth (Session Validation)
│  ├─ CSRF Protection (Unauthenticated routes)
│  └─ RBAC Authorization (/admin, /audit)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Route Handler  │  → Application Logic
│                 │
│  ├─ Input Validation (Zod)
│  ├─ Field Whitelisting
│  ├─ IDOR Prevention (user_id filters)
│  ├─ HMAC Verification (Optional)
│  └─ Audit Logging
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB    │  → RLS Policy Enforcement
│  (PostgreSQL)   │
└─────────────────┘
```

### 2.3 Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                               │
└─────────────────────────────────────────────────────────────────┘

auth.users                    # Supabase managed auth users
    │
    ├──► user_roles           # RBAC: user, admin, auditor, support
    │
    ├──► accounts             # User's financial accounts
    │   │
    │   └──► transactions     # Financial transactions (with idempotency_key)
    │
    ├──► categories           # Transaction categories (user + system)
    │
    ├──► goals                # Savings goals
    │
    ├──► settings             # User preferences
    │
    ├──► mfa_settings         # MFA configuration
    │   │
    │   ├──► webauthn_credentials   # FIDO2 keys
    │   └──► mfa_verification_sessions
    │
    └──► security_audit_log   # Security event logging

System Tables:
├── role_permissions          # RBAC permission definitions
├── mv_monthly_aggregates     # Materialized view for analytics
└── transfers                 # Inter-account transfers
```

---

## 3. Data Flow Diagrams

### 3.1 Transaction Creation Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Middleware│────▶│  API     │────▶│ Database │
│          │     │          │     │ Route    │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │                │                │                │
     ▼                ▼                ▼                ▼
1. User submits    2. Validate      3. Field         4. RLS Policy
   transaction       session          whitelist        enforcement
   form                              check            (user_id match)
                                        │
                     2b. Rate limit   3b. IDOR         4b. Trigger
                        check          prevention       updates
                                        │                account
                     2c. CSRF token   3c. Validate       balance
                        validation     idempotency
                                        key
                     2d. RBAC check  3d. Audit log
                                        entry
```

### 3.2 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │     │  Next.js │     │ Supabase │     │  Email   │
│          │     │   Auth   │     │  Auth    │     │ Provider │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └──────────┘
     │                │                │
     │ 1. Enter       │                │
     │    credentials │                │
     │────────────────▶│                │
     │                │                │
     │                │ 2. Validate    │
     │                │    password    │
     │                │    (HaveIBeenPwned)
     │                │───────┬───────▶│
     │                │       │        │
     │                │ 3. Create/     │
     │                │    Verify      │
     │                │    Session     │
     │                │◀──────┴────────│
     │                │                │
     │ 4. Set cookie  │                │
     │    (httpOnly,  │                │
     │    secure)     │                │
     │◀───────────────│                │
     │                │                │
     │ 5. Redirect    │                │
     │    to dashboard│                │
     │◀───────────────│                │
```

### 3.3 Rate Limiting Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Request │────▶│Middleware│────▶│  Redis   │────▶│  Decision│
│          │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘

1. Request arrives
   ├─ Extract IP address
   ├─ Check anonymizer/VPN
   └─ Determine limit type
      ├─ General: 60 req/min
      ├─ Auth: 10 req/15min
      └─ Admin: 100 req/min

2. Redis lookup
   Key: `rate_limit:{type}:{ip}`
   
3. Check count
   ├─ If count < limit: Allow
   │  ├─ Increment counter
   │  └─ Set expiry (TTL)
   │
   └─ If count >= limit: Block
      ├─ Return 429
      └─ Add Retry-After header

4. Fallback (if Redis unavailable)
   ├─ Use in-memory Map
   └─ Log warning (non-scalable)
```

---

## 4. Security Architecture

### 4.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│ Layer 1: Network Security                                        │
│   ├─ Cloudflare DDoS Protection                                  │
│   ├─ WAF Rules (SQLi, XSS, Path Traversal)                       │
│   ├─ Geo-blocking (CN, RU, KP, IR)                               │
│   └─ IP Reputation Scoring                                       │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: Application Security                                    │
│   ├─ Rate Limiting (Redis-based)                                 │
│   ├─ CSRF Protection                                             │
│   ├─ Input Validation (Zod)                                      │
│   ├─ Field Whitelisting                                          │
│   └─ HMAC Request Signing (Optional)                             │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Authentication & Authorization                          │
│   ├─ Supabase Auth (JWT + Sessions)                              │
│   ├─ MFA Support (WebAuthn/FIDO2, TOTP)                          │
│   ├─ RBAC (user, admin, auditor, support)                        │
│   └─ Session Management                                          │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: Data Security                                           │
│   ├─ Row-Level Security (RLS)                                    │
│   ├─ IDOR Prevention                                             │
│   ├─ Audit Logging                                               │
│   ├─ Password Breach Detection                                   │
│   └─ Idempotency Keys (duplicate prevention)                     │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: Infrastructure Security                                 │
│   ├─ Security Headers (CSP, HSTS, X-Frame-Options)               │
│   ├─ Maintenance Mode                                            │
│   ├─ Secret Management                                           │
│   └─ Automated Backups                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 RBAC Permission Model

```
                    ┌─────────────┐
                    │   Actions   │
                    │             │
  ┌───────────┐     ├─ Create     │
  │   Roles   │     ├─ Read       │
  │           │◀────┤─ Update     │
  ├─ user     │     ├─ Delete     │
  ├─ admin    │     └─ Admin      │
  ├─ auditor  │
  └─ support  │
  └───────────┘

Role Permissions Matrix:

                Create  Read  Update  Delete  Admin
user (own data)   ✓      ✓      ✓       ✓      ✗
user (others)     ✗      ✗      ✗       ✗      ✗
admin             ✓      ✓      ✓       ✓      ✓
auditor           ✗      ✓      ✗       ✗      ✗
support           ✗      ✓      ✗       ✗      ✗
```

---

## 5. Scalability Architecture

### 5.1 Database Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCALABILITY FEATURES                          │
└─────────────────────────────────────────────────────────────────┘

Read Optimization:
├─ Materialized Views (mv_monthly_aggregates)
│  └─ Pre-computed analytics refreshed every hour
│
├─ Covering Indexes
│  └─ Index includes all columns needed for query
│     (eliminates table lookups)
│
├─ Partial Indexes
│  └─ Index only recent transactions (last 90 days)
│     (reduces index size)
│
└─ BRIN Indexes
   └─ Time-series data optimization
      (date ranges for historical queries)

Write Optimization:
├─ Idempotency Keys
│  └─ Prevent duplicate transactions on retry
│
├─ Atomic Operations
│  └─ RPC functions for balance updates
│     (eliminates race conditions)
│
└─ Batch Operations
   └─ Service layer supports bulk inserts

Query Patterns:
├─ Hot Path (dashboard): Materialized views
├─ List Queries: Covering indexes
├─ Analytics: BRIN + Partial indexes
└─ Recent Data: Time-based partitioning (future)
```

### 5.2 Caching Strategy (Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS (Planned)                      │
└─────────────────────────────────────────────────────────────────┘

Client-Side (SWR/React Query):
├─ Dashboard data: 5 min stale-while-revalidate
├─ Transaction lists: 1 min SWR
├─ Categories: 10 min (rarely change)
└─ User settings: 1 hour

Edge/CDN Caching:
├─ Static assets: 1 year (immutable)
├─ API responses: Vary by auth token
└─ Public pages: 60 seconds

Redis Caching:
├─ Session data: Duration of session
├─ Rate limit counters: Rolling windows
├─ Maintenance mode flag: 60 seconds
└─ Feature flags: 5 minutes
```

---

## 6. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16.1.6 | React framework with App Router |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **State** | Zustand 5.x | Client state management |
| **Forms** | React Hook Form | Form handling |
| **Validation** | Zod 4.x | Schema validation |
| **Backend** | Next.js API Routes | Serverless functions |
| **Database** | Supabase (Postgres 15) | Database + Auth |
| **Cache** | Upstash Redis | Rate limiting |
| **AI** | Google Gemini | Receipt scanning, chat |
| **Hosting** | Vercel | Edge deployment |
| **WAF** | Cloudflare | Security at edge |
| **Testing** | Vitest + Playwright | Unit + E2E tests |

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘

Development                           Production
    │                                   │
    ▼                                   ▼
┌──────────┐  Push to main   ┌─────────────────────┐
│  Local   │────────────────▶│  Vercel Production  │
│  Dev     │                 │                     │
└──────────┘                 │  ├─ Edge Functions  │
                             │  ├─ Static Assets   │
┌──────────┐  PR Branch      │  └─ API Routes      │
│  Feature │────────────────▶│                     │
│  Branch  │                 │  Auto-deploy on push │
└──────────┘                 └─────────────────────┘
                                      │
                                      ▼
                             ┌─────────────────────┐
                             │  Cloudflare WAF     │
                             │  (Global Edge)      │
                             └─────────────────────┘

CI/CD Pipeline:
1. Push to branch
2. Run tests (unit, integration)
3. Run security scan
4. Build application
5. Deploy preview (PR) or production (main)
6. Run smoke tests
7. Update status
```

---

## 8. Future Architecture Considerations

### 8.1 Planned Improvements

1. **Edge Computing**
   - Move auth validation to Edge runtime
   - Reduce latency for global users

2. **Event-Driven Architecture**
   - Background jobs for receipts
   - Async transaction processing
   - Real-time notifications (WebSockets)

3. **Multi-Region**
   - Read replicas in EU/APAC
   - Data residency compliance

4. **Microservices (Future)**
   - Receipt processing service
   - Analytics service
   - Notification service

### 8.2 Capacity Planning

| Metric | Current | Target (1M users) |
|--------|---------|-------------------|
| Database Storage | 10GB | 500GB |
| Read QPS | 100 | 5000 |
| Write QPS | 50 | 2000 |
| API Latency (p95) | 200ms | 100ms |
| CDN Cache Hit Rate | 80% | 95% |

---

*Architecture diagrams created with ASCII art for version control compatibility.*
*For visual diagrams, use tools like Lucidchart, Draw.io, or Mermaid.js.*
