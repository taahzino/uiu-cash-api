# UIU Cash API Endpoints

## Authentication Required

All endpoints except `/api/auth/*` require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

---

## Transaction Endpoints

### 1. Add Money

Add money to wallet from debit/credit card linked to bank account.

**Endpoint**: `POST /api/transactions/add-money`

**Authentication**: Required (User)

**Request Body**:
```json
{
  "amount": 1000.0,
  "cardNumber": "4111111111111111",
  "cvv": "123",
  "expiryMonth": "12",
  "expiryYear": "28",
  "cardHolderName": "Ahmed Hassan"
}
```

**Validation Rules**:
- `amount`: Number, min ৳50, max ৳25,000
- `cardNumber`: String, exactly 16 digits
- `cvv`: String, exactly 3 digits
- `expiryMonth`: String, 2 digits (01-12)
- `expiryYear`: String, 2 digits (YY format, must not be expired)
- `cardHolderName`: String, min 3 characters

**Success Response** (200):
```json
{
  "success": true,
  "message": "Money added successfully",
  "data": {
    "transaction": {
      "id": "uuid",
      "transaction_id": "TRX20251228002",
      "type": "ADD_MONEY",
      "amount": 1000.0,
      "fee": 0.0,
      "status": "COMPLETED",
      "created_at": "2025-12-28T11:00:00Z"
    },
    "card": {
      "cardType": "VISA",
      "cardNumber": "****-****-****-1111",
      "cardHolder": "Ahmed Hassan",
      "bankName": "Sonali Bank"
    },
    "bankAccount": {
      "oldBalance": 125000.0,
      "newBalance": 124000.0
    },
    "wallet": {
      "balance": 6250.5,
      "availableBalance": 6250.5
    }
  }
}
```

**Error Responses**:
- `400` - Card not found, invalid CVV, card expired, insufficient balance in bank
- `401` - Unauthorized (invalid or missing token)
- `403` - Account not active
- `422` - Validation error (invalid card format, amount out of range)
- `500` - Internal server error

**Card to Bank Account Mapping**:
- Each bank account in simulation has a linked card
- Card details verified: number, CVV, expiry date
- Bank account balance checked before deduction
- Amount debited from linked bank account
- See `/simulation/bank_accounts/data.json` for test cards

**Notes**:
- No transaction fee for adding money
- Real bank account deduction via card
- Instant credit to wallet after successful card verification
- Double-entry accounting (bank debit → wallet credit)

---

### 2. Send Money

Send money to another user (P2P transfer).

**Endpoint**: `POST /api/transactions/send-money`

**Authentication**: Required (User)

**Request Body**:
```json
{
  "recipientIdentifier": "user@example.com",
  "amount": 500.0,
  "description": "Payment for services",
  "pin": "1234"
}
```

**Validation Rules**:
- `recipientIdentifier`: String, valid email or BD phone (+8801XXXXXXXXX)
- `amount`: Number, min ৳10, max ৳25,000
- `description`: String (optional), max 200 characters
- `pin`: String (optional), exactly 4 digits

**Success Response** (200):
```json
{
  "success": true,
  "message": "Money sent successfully",
  "data": {
    "transaction": {
      "id": "uuid",
      "transaction_id": "TRX20251228001",
      "type": "SEND_MONEY",
      "amount": 500.0,
      "fee": 5.0,
      "status": "COMPLETED",
      "description": "Payment for services",
      "created_at": "2025-12-28T10:30:00Z",
      "completed_at": "2025-12-28T10:30:05Z"
    },
    "recipient": {
      "name": "Jane Smith",
      "phone": "+8801712345679"
    },
    "newBalance": 4745.5
  }
}
```

**Error Responses**:
- `400` - Validation error, insufficient balance, limits exceeded
- `401` - Unauthorized
- `403` - Account/wallet inactive
- `404` - Recipient not found
- `500` - Transaction processing failed

**Fee Structure**:
- Send Money Fee: ৳5.00 (flat fee, paid by sender)
- Recipient receives full amount

**Limits** (per user):
- Daily Limit: ৳50,000
- Monthly Limit: ৳200,000

**Notes**:
- Sender and recipient must both have ACTIVE accounts
- Sender pays the fee (৳5) in addition to the amount
- Double-entry ledger system
- Cannot send money to yourself

---

### 3. Get Transaction History

Get paginated transaction history with optional filters.

**Endpoint**: `GET /api/transactions/history`

**Authentication**: Required (User)

**Query Parameters**:
- `page`: Number (optional), default 1, min 1
- `limit`: Number (optional), default 20, min 1, max 100
- `type`: String (optional), one of:
  - `SEND_MONEY`
  - `ADD_MONEY`
  - `CASH_OUT`
  - `CASH_IN`
  - `BILL_PAYMENT`
  - `BANK_TRANSFER`
  - `CASHBACK`
  - `COMMISSION`
  - `ONBOARDING_BONUS`
- `status`: String (optional), one of:
  - `PENDING`
  - `PROCESSING`
  - `COMPLETED`
  - `FAILED`

**Example Requests**:
```
GET /api/transactions/history
GET /api/transactions/history?page=2&limit=50
GET /api/transactions/history?type=SEND_MONEY&status=COMPLETED
GET /api/transactions/history?page=1&limit=20&type=ADD_MONEY
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Transaction history retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "transaction_id": "TRX20251228001",
        "type": "SEND_MONEY",
        "amount": 500.0,
        "fee": 5.0,
        "status": "COMPLETED",
        "description": "Payment for services",
        "created_at": "2025-12-28T10:30:00Z",
        "completed_at": "2025-12-28T10:30:05Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses**:
- `400` - Invalid query parameters
- `401` - Unauthorized
- `500` - Internal server error

**Notes**:
- Returns transactions where user is sender OR receiver
- Sorted by creation date (newest first)
- All filters are optional

---

### 4. Get Transaction Details

Get detailed information about a specific transaction.

**Endpoint**: `GET /api/transactions/:id`

**Authentication**: Required (User)

**Path Parameters**:
- `id`: String, transaction ID (8 characters, e.g., TRX20251228001)

**Example Request**:
```
GET /api/transactions/TRX20251228001
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Transaction details retrieved successfully",
  "data": {
    "id": "uuid",
    "transaction_id": "TRX20251228001",
    "type": "SEND_MONEY",
    "amount": 500.0,
    "fee": 5.0,
    "status": "COMPLETED",
    "description": "Payment for services",
    "created_at": "2025-12-28T10:30:00Z",
    "completed_at": "2025-12-28T10:30:05Z",
    "sender": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+8801712345678"
    },
    "receiver": {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+8801712345679"
    },
    "metadata": {
      "recipient_phone": "+8801712345679",
      "recipient_email": "jane@example.com"
    }
  }
}
```

**Error Responses**:
- `400` - Invalid transaction ID format
- `401` - Unauthorized
- `403` - Forbidden (transaction doesn't belong to user)
- `404` - Transaction not found
- `500` - Internal server error

**Authorization**:
- User can only view transactions where they are the sender OR receiver
- If user is the receiver, sender details are shown
- If user is the sender, receiver details are shown

---

## User Authentication Endpoints

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "phone": "+8801712345678",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-01-15",
  "role": "PERSONAL"
}
```

**Validation Rules**:
- `email`: Valid email format
- `phone`: BD phone format (+8801XXXXXXXXX)
- `password`: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- `firstName`, `lastName`: Required strings
- `dateOfBirth`: ISO date format, user must be 18+
- `role`: Enum (PERSONAL, AGENT)

---

### 2. User Login

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "identifier": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules**:
- `identifier`: Email or phone number
- `password`: Required string

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "expiresIn": "3h",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PERSONAL",
      "status": "ACTIVE"
    }
  }
}
```

**Notes**:
- Token validity: 3 hours
- No refresh token mechanism
- No failed login tracking or account locking

---

## Admin Authentication Endpoints

### 1. Admin Login

**Endpoint**: `POST /api/admin/auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "identifier": "admin@uiucash.com",
  "password": "AdminPass123!"
}
```

---

### 2. Create Admin

**Endpoint**: `POST /api/admin/auth/register`

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "email": "newadmin@uiucash.com",
  "password": "AdminPass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "SUPER_ADMIN"
}
```

**Validation Rules**:
- `role`: Enum (SUPER_ADMIN, ADMIN, SUPPORT)

---

## System Configuration Endpoints

### 1. Get Config by Key

**Endpoint**: `GET /api/admin/system-config/:key`

**Authentication**: Required (Admin)

---

### 2. Update Config

**Endpoint**: `PUT /api/admin/system-config/:key`

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "value": "10.00"
}
```

**Example Configs**:
- `send_money_fee`: ৳5.00 (flat fee for P2P transfers)
- `agent_commission_rate`: 1.5% (agent commission percentage)
- `onboarding_bonus`: ৳50.00 (bonus for new PERSONAL users)

---

## User Management Endpoints (Admin)

### 1. Get All Users

**Endpoint**: `GET /api/admin/users`

**Authentication**: Required (Admin)

**Query Parameters**:
- `page`: Number (optional)
- `limit`: Number (optional)
- `status`: String (optional) - PENDING, ACTIVE, SUSPENDED, DEACTIVATED
- `role`: String (optional) - PERSONAL, AGENT

---

### 2. Search Users

**Endpoint**: `GET /api/admin/users/search`

**Authentication**: Required (Admin)

**Query Parameters**:
- `query`: String (search by name, email, phone)

---

### 3. Get User by ID

**Endpoint**: `GET /api/admin/users/:id`

**Authentication**: Required (Admin)

---

### 4. Update User Status

**Endpoint**: `PATCH /api/admin/users/:id/status`

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "status": "SUSPENDED",
  "reason": "Suspicious activity detected"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be between ৳10 and ৳25,000"
    }
  ]
}
```

---

## Common HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or invalid input |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

---

## Transaction Types

| Type | Description |
|------|-------------|
| SEND_MONEY | P2P money transfer |
| ADD_MONEY | Add money via card |
| CASH_OUT | Withdraw cash via agent |
| CASH_IN | Deposit cash via agent |
| BILL_PAYMENT | Pay utility bills |
| BANK_TRANSFER | Transfer to bank account |
| CASHBACK | Cashback/rewards |
| COMMISSION | Agent commission |
| ONBOARDING_BONUS | New user bonus |

---

## Transaction Status

| Status | Description |
|--------|-------------|
| PENDING | Transaction initiated |
| PROCESSING | Transaction being processed |
| COMPLETED | Transaction successful |
| FAILED | Transaction failed |

---

## Notes

- All amounts are in BDT (৳)
- All timestamps are in ISO 8601 format (UTC)
- All responses include `success` boolean field
- Validation errors return 422 with detailed field errors
- Authentication uses JWT Bearer tokens (3 hours validity)
