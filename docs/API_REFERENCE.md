# SonaMoney API Reference

**Version:** 1.0  
**Base URL:** `https://sonamoney.my.id/api`  
**Authentication:** Supabase Session (Cookie-based JWT)  

---

## Authentication

All API requests (except public endpoints) require an active Supabase session cookie. The session is automatically managed by the Supabase client.

### Authentication Endpoints

#### POST `/api/auth/login`

Authenticate a user with email and password.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  },
  "session": {
    "access_token": "eyJ...",
    "expires_at": 1234567890
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded. Try again in 15 minutes."
}
```

**Rate Limiting:** 10 requests per 15 minutes per IP

---

#### POST `/api/auth/register`

Register a new user account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json
X-Request-Timestamp: 1234567890
X-Request-Signature: (deprecated, leave empty)

{
  "email": "newuser@example.com",
  "password": "securePassword123!",
  "confirmPassword": "securePassword123!"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com"
  },
  "message": "Account created successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Email already registered",
  "field": "email"
}
```

**Bot Detection:** Honeypot field `website` - if populated, request rejected

**Password Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- Cannot be in breach database (checked via HaveIBeenPwned)

---

#### GET `/api/auth/callback`

OAuth callback handler for third-party authentication (Google, GitHub, etc.).

**Query Parameters:**
- `code` - Authorization code from OAuth provider
- `state` - State parameter for CSRF protection

**Response:** Redirects to `/dashboard` on success, `/login?error=...` on failure

---

#### POST `/api/auth/maintenance-bypass`

Special endpoint for admin IP addresses to bypass maintenance mode.

**Request:**
```http
POST /api/auth/maintenance-bypass
Content-Type: application/json

{
  "secret": "maintenance-bypass-secret"
}
```

**Requirements:**
- Request must originate from `MAINTENANCE_ADMIN_IPS`
- Valid bypass secret required

---

## Transactions

#### GET `/api/transactions`

Retrieve paginated list of user's transactions.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |
| `start_date` | date | Filter by start date (ISO 8601) |
| `end_date` | date | Filter by end date (ISO 8601) |
| `category_id` | uuid | Filter by category |
| `account_id` | uuid | Filter by account |
| `type` | string | Filter by type: `income`, `expense`, `transfer` |
| `search` | string | Search in description |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "account_id": "uuid",
      "category_id": "uuid",
      "amount": 150.00,
      "type": "expense",
      "description": "Grocery shopping",
      "transaction_date": "2026-03-28",
      "created_at": "2026-03-28T10:00:00Z",
      "updated_at": "2026-03-28T10:00:00Z",
      "idempotency_key": "uuid",
      "category": {
        "id": "uuid",
        "name": "Groceries",
        "color": "#22c55e"
      },
      "account": {
        "id": "uuid",
        "name": "Main Checking"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Security:** RLS ensures users only see their own transactions

---

#### POST `/api/transactions`

Create a new transaction.

**Request:**
```http
POST /api/transactions
Content-Type: application/json
X-Idempotency-Key: unique-key-for-this-request

{
  "account_id": "uuid",
  "category_id": "uuid",
  "amount": 150.00,
  "type": "expense",
  "description": "Grocery shopping",
  "transaction_date": "2026-03-28",
  "is_recurring": false
}
```

**Idempotency:** Use `X-Idempotency-Key` header to prevent duplicate transactions on retry

**Validation:**
- `amount` must be positive number
- `account_id` must belong to current user
- `category_id` must exist and belong to user
- `type` must be one of: `income`, `expense`, `transfer`

**Response (201 Created):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "account_id": "uuid",
  "amount": 150.00,
  "type": "expense",
  "description": "Grocery shopping",
  "transaction_date": "2026-03-28",
  "created_at": "2026-03-28T10:00:00Z"
}
```

**Response (409 Conflict - Duplicate):**
```json
{
  "error": "Duplicate transaction",
  "idempotency_key": "uuid",
  "existing_transaction_id": "uuid"
}
```

---

#### PUT `/api/transactions/[id]`

Update an existing transaction.

**Request:**
```http
PUT /api/transactions/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "amount": 175.00,
  "description": "Updated description"
}
```

**Validation:** Same as POST, plus ownership verification

**Response (200 OK):** Updated transaction object

**Response (403 Forbidden):**
```json
{
  "error": "Cannot modify transaction: not owner"
}
```

---

#### DELETE `/api/transactions/[id]`

Delete a transaction.

**Request:**
```http
DELETE /api/transactions/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "message": "Transaction deleted",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Side Effects:** Account balance automatically updated via database trigger

---

## Categories

#### GET `/api/categories`

Get all categories for the current user (including system defaults).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by `income`, `expense`, or `all` |
| `include_system` | boolean | Include system default categories (default: true) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Groceries",
      "type": "expense",
      "color": "#22c55e",
      "icon": "shopping-cart",
      "is_system": false,
      "budget_limit": 500.00,
      "created_at": "2026-01-15T00:00:00Z"
    }
  ]
}
```

---

#### POST `/api/categories`

Create a custom category.

**Request:**
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Subscription Services",
  "type": "expense",
  "color": "#8b5cf6",
  "icon": "credit-card",
  "budget_limit": 100.00
}
```

**Validation:**
- `name` must be unique per user
- `color` must be valid hex color code
- `type` must be `income` or `expense`

---

## Receipt Scanning

#### POST `/api/scan-receipt`

Scan and parse receipt image using AI.

**Request:**
```http
POST /api/scan-receipt
Content-Type: multipart/form-data

file: [binary image data]
```

**Supported Formats:** JPEG, PNG, WebP (max 10MB)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "merchant": "Whole Foods Market",
    "date": "2026-03-28",
    "total": 156.43,
    "items": [
      {
        "name": "Organic Bananas",
        "amount": 4.99,
        "category": "Groceries"
      }
    ],
    "suggested_category": "Groceries",
    "confidence": 0.92
  }
}
```

**Rate Limiting:** 20 scans per hour per user

---

## Chat/AI Assistant

#### POST `/api/chat`

Send message to AI financial assistant.

**Request:**
```http
POST /api/chat
Content-Type: application/json

{
  "message": "How much did I spend on groceries last month?",
  "context": {
    "current_view": "dashboard",
    "selected_date_range": "last_30_days"
  }
}
```

**Response (200 OK):**
```json
{
  "response": "You spent $487.32 on groceries last month. That's 12% under your budget of $550.",
  "data": {
    "amount": 487.32,
    "budget": 550.00,
    "variance": -62.68,
    "variance_percent": -12
  },
  "suggested_actions": [
    {
      "type": "view_transactions",
      "label": "View grocery transactions",
      "url": "/transactions?category=groceries&date_range=last_month"
    }
  ]
}
```

**Rate Limiting:** 100 messages per hour per user

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "field_name",
    "message": "Specific field error"
  },
  "request_id": "uuid-for-debugging"
}
```

### HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Not authenticated or session expired |
| 403 | Forbidden | Insufficient permissions (RBAC) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate request (idempotency) or resource conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |
| 503 | Service Unavailable | Maintenance mode or service down |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1234567890
Retry-After: 900
```

---

## Security

### Request Signing (Deprecated)

Client-side HMAC signing has been disabled to prevent secret exposure. Authentication is now handled entirely via Supabase session cookies.

### Security Headers

All API responses include:
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self' ...
```

### CORS

Allowed origins:
- `https://sonamoney.my.id`
- `https://*.sonamoney.my.id`
- `http://localhost:3000` (development only)

---

## Pagination

List endpoints support cursor-based pagination:

**Request:**
```http
GET /api/transactions?page=2&limit=50
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 250,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true,
    "nextCursor": "base64_encoded_cursor",
    "prevCursor": "base64_encoded_cursor"
  }
}
```

---

## Webhooks (Future)

Planned webhook endpoints for external integrations:

- `transaction.created` - New transaction added
- `transaction.updated` - Transaction modified
- `budget.threshold_reached` - Budget limit approaching
- `goal.milestone` - Savings goal progress

**Note:** Webhooks not yet implemented. ETA: Q3 2026.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Create transaction
const createTransaction = async (data: TransactionInput) => {
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert(data)
    .single()
  
  return { transaction, error }
}
```

### cURL

```bash
# Get transactions
curl -X GET \
  'https://sonamoney.my.id/api/transactions?page=1&limit=20' \
  -H 'Cookie: supabase-auth-token=...'

# Create transaction
curl -X POST \
  https://sonamoney.my.id/api/transactions \
  -H 'Content-Type: application/json' \
  -H 'X-Idempotency-Key: unique-key-123' \
  -H 'Cookie: supabase-auth-token=...' \
  -d '{
    "account_id": "uuid",
    "amount": 100.00,
    "type": "expense",
    "description": "Coffee"
  }'
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-28 | Initial API documentation |
| 0.9 | 2026-02-15 | Added idempotency support |
| 0.8 | 2026-01-10 | Added receipt scanning |
| 0.7 | 2025-12-01 | Added AI chat endpoint |

---

**Support:** For API support, contact api-support@sonamoney.my.id or open an issue on GitHub.
