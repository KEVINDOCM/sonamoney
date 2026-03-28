# SonaMoney Test Plan

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** Active

---

## 1. Test Strategy Overview

### 1.1 Testing Levels

| Level | Type | Coverage Target | Framework |
|-------|------|-----------------|-----------|
| **Unit** | Component/Function | 60% | Vitest + React Testing Library |
| **Integration** | API Routes | 80% | Vitest + Supertest |
| **E2E** | Critical User Flows | 100% | Playwright |
| **Security** | Vulnerability Tests | 100% | Custom (Vitest) |
| **Performance** | Load/Stress | Key endpoints | k6 |

### 1.2 Test Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| **Local** | Development | Mock/Seed data |
| **CI** | Pre-merge validation | Isolated test DB |
| **Staging** | Pre-release | Production-like |
| **Production** | Smoke tests | Read-only |

---

## 2. Unit Tests

### 2.1 Existing Tests (Security)

| Test File | Coverage | Status |
|-----------|----------|--------|
| `field-whitelist.test.ts` | Mass assignment prevention | ✅ Complete |
| `hmac-validation.test.ts` | Request signing | ✅ Complete |
| `idor-prevention.test.ts` | Access control | ✅ Complete |

### 2.2 Required Unit Tests

#### Priority 1: Core Utilities

| Module | Test File | Test Cases |
|--------|-----------|------------|
| `lib/security/config.ts` | `config.test.ts` | 5 cases |
| `lib/security/rateLimiter.ts` | `rate-limiter.test.ts` | 8 cases |
| `lib/utils/auditLog.ts` | `audit-log.test.ts` | 6 cases |
| `lib/utils/exportExcel.ts` | `export-excel.test.ts` | 4 cases |

#### Priority 2: Data Access

| Module | Test File | Test Cases |
|--------|-----------|------------|
| `lib/actions/categories.ts` | `categories.test.ts` | 10 cases |
| `lib/actions/goals.ts` | `goals.test.ts` | 8 cases |
| `lib/actions/auth.ts` | `auth-actions.test.ts` | 12 cases |

#### Priority 3: Components

| Component | Test File | Priority |
|-----------|-----------|----------|
| `AddTransactionForm` | `AddTransactionForm.test.tsx` | 🔴 High |
| `LoginForm` | `LoginForm.test.tsx` | 🔴 High |
| `BudgetChart` | `BudgetChart.test.tsx` | 🟡 Medium |
| `CategoryTable` | `CategoryTable.test.tsx` | 🟡 Medium |

---

## 3. Integration Tests

### 3.1 API Route Coverage

| Endpoint | Method | Tests | File |
|----------|--------|-------|------|
| `/api/auth/login` | POST | 5 cases | `api.test.ts` ✅ |
| `/api/auth/register` | POST | 4 cases | `api.test.ts` ✅ |
| `/api/auth/callback` | GET | 3 cases | `api-auth.test.ts` |
| `/api/transactions` | GET | 4 cases | `api-transactions.test.ts` |
| `/api/transactions` | POST | 5 cases | `api-transactions.test.ts` |
| `/api/transactions/[id]` | PUT | 4 cases | `api-transactions.test.ts` |
| `/api/transactions/[id]` | DELETE | 3 cases | `api-transactions.test.ts` |
| `/api/categories` | GET | 3 cases | `api-categories.test.ts` |
| `/api/categories` | POST | 4 cases | `api-categories.test.ts` |
| `/api/scan-receipt` | POST | 3 cases | `api-receipt.test.ts` |
| `/api/chat` | POST | 3 cases | `api-chat.test.ts` |

### 3.2 Security Integration Tests

| Test Scenario | Status |
|---------------|--------|
| Rate limiting triggers correctly | ✅ In `api.test.ts` |
| CSRF protection blocks invalid tokens | 📝 Planned |
| XSS payload sanitization | 📝 Planned |
| SQL injection prevention | ✅ Via parameterized queries |
| Authentication bypass attempts | 📝 Planned |
| RBAC enforcement | 📝 Planned |

---

## 4. E2E Tests (Playwright)

### 4.1 Critical User Flows

| Flow | Test File | Steps | Priority |
|------|-----------|-------|----------|
| **User Registration** | `auth.spec.ts` | 8 steps | 🔴 Critical |
| **User Login** | `auth.spec.ts` | 5 steps | 🔴 Critical |
| **Add Transaction** | `transactions.spec.ts` | 6 steps | 🔴 Critical |
| **View Dashboard** | `dashboard.spec.ts` | 4 steps | 🔴 Critical |
| **Set Budget** | `budget.spec.ts` | 5 steps | 🟡 High |
| **Export Data** | `export.spec.ts` | 3 steps | 🟡 High |
| **Receipt Scan** | `receipt.spec.ts` | 4 steps | 🟢 Medium |
| **Account Settings** | `settings.spec.ts` | 6 steps | 🟢 Medium |

### 4.2 Cross-Browser Testing

| Browser | Priority | Config |
|---------|----------|--------|
| Chrome | 🔴 Required | `Desktop Chrome` |
| Firefox | 🔴 Required | `Desktop Firefox` |
| Safari | 🔴 Required | `Desktop Safari` |
| Mobile Chrome | 🟡 High | `Pixel 5` |
| Mobile Safari | 🟡 High | `iPhone 12` |
| Edge | 🟢 Medium | `Desktop Edge` |

### 4.3 Accessibility Tests

| Check | Tool | Priority |
|-------|------|----------|
| WCAG 2.1 AA Compliance | axe-core | 🔴 Required |
| Keyboard Navigation | Manual | 🔴 Required |
| Screen Reader Support | NVDA/VoiceOver | 🟡 High |
| Color Contrast | axe-core | 🔴 Required |

---

## 5. Security Tests

### 5.1 Automated Security Suite

| Test | File | Frequency |
|------|------|-----------|
| Secret exposure scan | `test-security.mjs` | Every deployment |
| Header validation | `test-security.mjs` | Every deployment |
| Rate limiting check | `test-security.mjs` | Every deployment |
| Dependency audit | `npm audit` | Daily (CI) |

### 5.2 Manual Security Reviews

| Review Type | Frequency | Owner |
|-------------|-----------|-------|
| Code security review | Monthly | Security Lead |
| Penetration testing | Quarterly | External firm |
| Access control audit | Quarterly | Compliance |
| Dependency review | Weekly | DevOps |

---

## 6. Performance Tests

### 6.1 Load Testing (k6)

| Endpoint | Target RPS | Duration | SLA |
|----------|-----------|----------|-----|
| `GET /api/transactions` | 100 | 5 min | p95 < 200ms |
| `POST /api/transactions` | 50 | 5 min | p95 < 300ms |
| `GET /dashboard` | 200 | 5 min | p95 < 500ms |
| `POST /api/auth/login` | 20 | 5 min | p95 < 500ms |

### 6.2 Performance Budget

| Metric | Budget | Tool |
|--------|--------|------|
| First Contentful Paint (FCP) | < 1.8s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.8s | Lighthouse |
| Total Blocking Time (TBT) | < 200ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Bundle Size (Initial) | < 200KB | webpack-bundle-analyzer |

---

## 7. Test Data Management

### 7.1 Test Fixtures

| Fixture | Location | Purpose |
|---------|----------|---------|
| `fixtures/users.ts` | `tests/fixtures/` | Test user data |
| `fixtures/categories.ts` | `tests/fixtures/` | Category seed data |
| `fixtures/transactions.ts` | `tests/fixtures/` | Transaction samples |
| `fixtures/auth.ts` | `tests/fixtures/` | Auth tokens/sessions |

### 7.2 Database Seeding

```typescript
// tests/utils/seed.ts
export async function seedTestDatabase() {
  // Clean up first
  await supabase.from("transactions").delete().neq("id", "")
  await supabase.from("categories").delete().neq("id", "")
  
  // Seed test data
  await seedUsers()
  await seedCategories()
  await seedTransactions()
}
```

---

## 8. CI/CD Integration

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:security
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

### 8.2 Pre-Merge Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Security scan passes (no high/critical vulnerabilities)
- [ ] Code coverage > 60%
- [ ] E2E critical flows pass
- [ ] Performance budget met

---

## 9. Test Execution Schedule

| Test Type | Trigger | Environment | Duration |
|-----------|---------|-------------|----------|
| Unit | Every commit | Local/CI | 2 min |
| Integration | Every PR | CI | 5 min |
| Security | Every PR + Daily | CI | 3 min |
| E2E Critical | Every PR + Pre-release | Staging | 10 min |
| E2E Full | Pre-release | Staging | 30 min |
| Performance | Weekly + Pre-release | Staging | 20 min |
| Security Audit | Monthly | Production | Manual |

---

## 10. Reporting and Metrics

### 10.1 Coverage Targets

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Overall Coverage | ~5% | 60% | Q2 2026 |
| Unit Test Coverage | ~5% | 70% | Q2 2026 |
| Integration Coverage | 20% | 80% | Q2 2026 |
| E2E Critical Flows | 30% | 100% | Q2 2026 |

### 10.2 Quality Gates

| Gate | Criteria | Action on Failure |
|------|----------|-------------------|
| **Gate 1** | Unit tests pass | Block PR merge |
| **Gate 2** | Coverage > 50% | Warning, require justification |
| **Gate 3** | Security scan clean | Block PR merge |
| **Gate 4** | E2E critical flows pass | Block deployment |
| **Gate 5** | Performance budget met | Require optimization |

---

## 11. Action Items

### Immediate (Week 1)

- [x] Set up Playwright configuration
- [x] Create integration test suite
- [x] Create E2E test skeleton
- [ ] Add `test:integration` script to package.json
- [ ] Add `test:e2e` script to package.json

### Short-term (Week 2-4)

- [ ] Implement unit tests for `lib/security/*`
- [ ] Implement unit tests for `lib/actions/*`
- [ ] Add component tests for critical forms
- [ ] Expand E2E coverage to all critical flows
- [ ] Set up CI/CD pipeline for automated testing

### Medium-term (Month 2-3)

- [ ] Reach 60% overall coverage
- [ ] Implement performance testing with k6
- [ ] Add visual regression testing
- [ ] Set up test reporting dashboard
- [ ] Document testing best practices

---

## 12. Resources

### Documentation
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [k6 Load Testing](https://k6.io/docs/)

### Internal References
- `docs/BACKUP_AND_RECOVERY.md`
- `infrastructure/waf/DEPLOYMENT_GUIDE.md`
- `security-gap-audit.md`

---

*Test Plan maintained by Engineering Team*  
*Last updated: March 28, 2026*
