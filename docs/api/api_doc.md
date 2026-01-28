# UIU Cash API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000`  
**Last Updated:** January 27, 2026

---

## Table of Contents

1. [Authentication](#authentication)
   - [User Authentication](#user-authentication)
   - [Agent Authentication](#agent-authentication)
   - [Admin Authentication](#admin-authentication)
2. [Wallet](#wallet)
3. [Transactions](#transactions)
   - [Add Money](#add-money)
   - [Send Money](#send-money)
   - [Cash Out](#cash-out)
   - [Cash In](#cash-in)
   - [Transaction History](#transaction-history)
   - [Transaction Details](#transaction-details)
4. [Bill Payment](#bill-payment)
   - [Get Billers](#get-billers)
   - [Pay Bill](#pay-bill)
   - [Get Bill Payment History](#get-bill-payment-history)
5. [Bank Transfer](#bank-transfer)
   - [Initiate Bank Transfer](#initiate-bank-transfer)
   - [Get Transfer History](#get-transfer-history)
   - [Get Transfer Details](#get-transfer-details)
6. [Admin - Consumer Management](#admin-consumer-management)
   - [Get Paginated Consumers](#get-paginated-consumers)
   - [Get Consumer Details](#get-consumer-details)
   - [Update Consumer Status](#update-consumer-status)
   - [Get Consumer Transactions](#get-consumer-transactions)
7. [Admin - Agent Management](#admin-agent-management)
   - [Get Paginated Agents](#get-paginated-agents)
   - [Get Agent Details](#get-agent-details)
   - [Approve Agent](#approve-agent)
   - [Reject Agent](#reject-agent)
   - [Get Agent Transactions](#get-agent-transactions)
8. [Admin - Analytics](#admin-analytics)
   - [Dashboard Analytics](#dashboard-analytics)
   - [Transaction Analytics](#transaction-analytics)
   - [Consumer Analytics](#consumer-analytics)
   - [Agent Analytics](#agent-analytics)
   - [Revenue Analytics](#revenue-analytics)
9. [Admin - Biller Management](#admin-biller-management)
   - [Create Biller](#create-biller)
   - [Get All Billers (Admin)](#get-all-billers-admin)
   - [Get Biller Details (Admin)](#get-biller-details-admin)
   - [Update Biller](#update-biller)
   - [Update Biller Status](#update-biller-status)
   - [Delete Biller](#delete-biller)
10. [Common Patterns](#common-patterns)
11. [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

**Token Details:**

- **Algorithm:** RS256 (RSA with SHA-256)
- **Expiration:** 7 days
- **Payload:** `{ id, public_key, userType }`

Tokens expire after 7 days and must be refreshed by logging in again.

---

## User Authentication

Base URL: `/api/auth/consumer`

### 1. Register User

Creates a new user account. CONSUMER users are automatically activated and receive ৳50 welcome bonus.

**Endpoint:** `POST /api/auth/consumer/register`  
**Authentication:** None (Public)

**Request Body:**

```json
{
  "email": "user@example.com",
  "phone": "01712345678",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CONSUMER",
  "dateOfBirth": "1995-05-15",
  "nidNumber": "1234567890"
}
```

**Field Validations:**

| Field       | Type   | Required | Validation                                                               |
| ----------- | ------ | -------- | ------------------------------------------------------------------------ |
| email       | string | Yes      | Valid email format                                                       |
| phone       | string | Yes      | Bangladeshi format: `01[3-9]XXXXXXXX` (11 digits)                        |
| password    | string | Yes      | Min 8 chars, must contain uppercase, lowercase, number, and special char |
| firstName   | string | Yes      | 2-100 characters                                                         |
| lastName    | string | Yes      | 2-100 characters                                                         |
| role        | enum   | Yes      | `CONSUMER` or `AGENT`                                                    |
| dateOfBirth | string | No       | ISO date format (YYYY-MM-DD)                                             |
| nidNumber   | string | No       | 10-20 characters                                                         |

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful! You've received ৳50 welcome bonus. You can now log in.",
  "data": {
    "user": {
      "id": "A1B2C3D4",
      "email": "user@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CONSUMER",
      "status": "ACTIVE"
    },
    "bonusGiven": true
  }
}
```

**Error Responses:**

- **409 Conflict** - Email or phone already registered
- **400 Bad Request** - Validation errors

---

### 2. User Login

Authenticates a user and returns a JWT token.

**Endpoint:** `POST /api/auth/consumer/login`  
**Authentication:** None (Public)

**Request Body:**

```json
{
  "identifier": "user@example.com",
  "password": "SecurePass123!"
}
```

**Field Validations:**

| Field      | Type   | Required | Validation            |
| ---------- | ------ | -------- | --------------------- |
| identifier | string | Yes      | Email or phone number |
| password   | string | Yes      | User's password       |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profile": {
      "id": "A1B2C3D4",
      "email": "user@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CONSUMER",
      "status": "ACTIVE",
      "emailVerified": false,
      "phoneVerified": false,
      "dateOfBirth": "1995-05-15",
      "nidNumber": "1234567890",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "wallet": {
        "balance": 50.0,
        "availableBalance": 50.0,
        "pendingBalance": 0.0,
        "currency": "BDT",
        "dailyLimit": 25000.0,
        "monthlyLimit": 100000.0,
        "dailySpent": 0.0,
        "monthlySpent": 0.0
      }
    },
    "userType": "Consumer"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid credentials
- **403 Forbidden** - Accountuser/ suspended or rejected

**Status-Specific Messages:**

- `SUSPENDED`: "Account is suspended. Please contact support."
- `REJECTED`: "Account registration was rejected."

---

### 3. Get User Profile

Retrieves the authenticated user's profile information.

**Endpoint:** `GET /api/auth/profile`  
**Authentication:** Required (User Token)

**Headers:**

```
Authorization: Bearer <user_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "A1B2C3D4",
      "email": "user@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CONSUMER",
      "status": "ACTIVE",
      "dateOfBirth": "1995-05-15",
      "nidNumber": "1234567890",
      "emailVerified": false,
      "phoneVerified": false,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "wallet": {
        "balance": 50.0,
        "availableBalance": 50.0,
        "pendingBalance": 0.0,
        "currency": "BDT",
        "dailyLimit": 25000.0,
        "monthlyLimit": 100000.0,
        "dailySpent": 0.0,
        "monthlySpent": 0.0
      }
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token

---

### 4. Update User Profile

Updates the authenticated user's profile information.

**Endpoint:** `PUT /api/auth/consumer/profile`  
**Authentication:** Required (User Token)

**Headers:**

```
Authorization: Bearer <user_token>
```

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1995-08-20"
}
```

**Field Validations:**

| Field       | Type   | Required | Validation                   |
| ----------- | ------ | -------- | ---------------------------- |
| firstName   | string | No       | 2-100 characters             |
| lastName    | string | No       | 2-100 characters             |
| dateOfBirth | string | No       | ISO date format (YYYY-MM-DD) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "A1B2C3D4",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "dateOfBirth": "1995-08-20"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Validation errors

---

### 5. Change Password

Changes the authenticated user's password.

**Endpoint:** `PUT /api/auth/consumer/change-password`  
**Authentication:** Required (User Token)

**Headers:**

```
Authorization: Bearer <user_token>
```

**Request Body:**

```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Field Validations:**

| Field           | Type   | Required | Validation                                                               |
| --------------- | ------ | -------- | ------------------------------------------------------------------------ |
| currentPassword | string | Yes      | Current password                                                         |
| newPassword     | string | Yes      | Min 8 chars, must contain uppercase, lowercase, number, and special char |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid current password or missing token
- **400 Bad Request** - New password validation errors

---

## Agent Authentication

Base URL: `/api/auth/agent`

Agents are users with additional business information. Agent accounts require admin approval before they can login.

### 1. Register Agent

Creates a new agent account with business details. Account status will be `PENDING` until approved by an admin.

**Endpoint:** `POST /api/auth/agent/register`  
**Authentication:** None (Public)

**Request Body:**

```json
{
  "email": "agent@example.com",
  "phone": "01812345678",
  "password": "SecurePass123!",
  "firstName": "Ahmed",
  "lastName": "Khan",
  "businessName": "Khan Mobile Banking",
  "businessAddress": "123 Main Street, Dhaka-1205",
  "dateOfBirth": "1990-03-10",
  "nidNumber": "1234567890123"
}
```

**Field Validations:**

| Field           | Type   | Required | Validation                                              |
| --------------- | ------ | -------- | ------------------------------------------------------- |
| email           | string | Yes      | Valid email format                                      |
| phone           | string | Yes      | Bangladeshi format: `01[3-9]XXXXXXXX`                   |
| password        | string | Yes      | Min 8 chars, uppercase, lowercase, number, special char |
| firstName       | string | Yes      | 2-100 characters                                        |
| lastName        | string | Yes      | 2-100 characters                                        |
| businessName    | string | Yes      | 3-255 characters                                        |
| businessAddress | string | Yes      | Minimum 10 characters                                   |
| dateOfBirth     | string | No       | ISO date format (YYYY-MM-DD)                            |
| nidNumber       | string | No       | 10-20 characters                                        |

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Agent registration successful. Your account is pending admin approval. You will be notified once approved.",
  "data": {
    "user": {
      "id": "B2C3D4E5",
      "email": "agent@example.com",
      "phone": "01812345678",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "role": "AGENT",
      "status": "PENDING"
    },
    "agent": {
      "id": 1,
      "agentCode": "AG1234567",
      "businessName": "Khan Mobile Banking",
      "businessAddress": "123 Main Street, Dhaka-1205",
      "status": "PENDING"
    }
  }
}
```

**Error Responses:**

- **409 Conflict** - Email or phone already registered
- **400 Bad Request** - Validation errors

**Note:** Agent code is automatically generated in format `AG + 7 digits`.

---

### 2. Agent Login

Authenticates an agent and returns a JWT token. Only agents with `ACTIVE` status can login.

**Endpoint:** `POST /api/auth/agent/login`  
**Authentication:** None (Public)

**Request Body:**

```json
{
  "identifier": "agent@example.com",
  "password": "SecurePass123!"
}
```

**Field Validations:**

| Field      | Type   | Required | Validation            |
| ---------- | ------ | -------- | --------------------- |
| identifier | string | Yes      | Email or phone number |
| password   | string | Yes      | Agent's password      |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profile": {
      "id": "B2C3D4E5",
      "email": "agent@example.com",
      "phone": "01812345678",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "role": "AGENT",
      "status": "ACTIVE",
      "emailVerified": false,
      "phoneVerified": false,
      "dateOfBirth": "1990-03-10",
      "nidNumber": "1234567890123",
      "createdAt": "2026-01-10T08:15:00.000Z",
      "agent": {
        "id": 1,
        "agentCode": "AG1234567",
        "businessName": "Khan Mobile Banking",
        "businessAddress": "123 Main Street, Dhaka-1205",
        "status": "ACTIVE",
        "totalCashouts": 0,
        "totalCommissionEarned": 0.0,
        "approvedAt": "2026-01-11T14:30:00.000Z"
      },
      "wallet": {
        "balance": 0.0,
        "availableBalance": 0.0,
        "pendingBalance": 0.0,
        "currency": "BDT",
        "dailyLimit": 100000.0,
        "monthlyLimit": 500000.0,
        "dailySpent": 0.0,
        "monthlySpent": 0.0
      }
    },
    "userType": "Agent"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid credentials
- **403 Forbidden** - Account not active

\*\*Status-Specific Messageuth/agent

- `PENDING`: "Your agent account is pending approval. Please wait for admin approval."
- `SUSPENDED`: "Account is suspended. Please contact support."
- `REJECTED`: "Your agent registration was rejected. Please contact support for more information."

**Note:** Only users with role `AGENT` can login through this endpoint.

---

### 3. Get Agent Profile

Retrieves the authenticated agent's profile information including business details and statistics.

**Endpoint:** `GET /api/agents/auth/profile`  
**Authentication:** Required (Agent Token)

**Headers:**

```
Authorization: Bearer <agent_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "B2C3D4E5",
      "email": "agent@example.com",
      "phone": "01812345678",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "role": "AGENT",
      "status": "ACTIVE",
      "dateOfBirth": "1990-03-10",
      "nidNumber": "1234567890123",
      "emailVerified": false,
      "phoneVerified": false,
      "createdAt": "2026-01-10T08:15:00.000Z"
    },
    "agent": {
      "id": 1,
      "agentCode": "AG1234567",
      "businessName": "Khan Mobile Banking",
      "businessAddress": "123 Main Street, Dhaka-1205",
      "status": "ACTIVE",
      "totalCashouts": 150,
      "totalCommissionEarned": 7500.00,
      "approvedBy": "ADMIN001",
      "approvedAt": "2026-01-11T14:30:00.000Z",
      "createdAt": "2026-01-10T08:15:00.000Z"
    },
    "wallet": {
      "balance": 15000.00,
      "availableBalance": 15000.00,
      "pendingBalance": 0.00,
      "currency": "BDT",
      "dailyLimit": 100000.00,
      "monthlyLimit": 500000.00,
      "dailySpent": 0.00,
      "monthlySpent": 0.00
    }
  }
}uth/agent
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **403 Forbidden** - User is not an agent

---

### 4. Update Agent Profile

Updates the authenticated agent's profile and business information.

**Endpoint:** `PUT /api/agents/auth/profile`  
**Authentication:** Required (Agent Token)

**Headers:**

```
Authorization: Bearer <agent_token>
```

**Request Body:**

```json
{
  "firstName": "Ahmed",
  "lastName": "Rahman",
  "businessName": "Rahman Mobile Services",
  "businessAddress": "456 New Location, Dhaka-1207",
  "dateOfBirth": "1990-03-10"
}
```

**Field Validations:**

| Field           | Type   | Required | Validation                   |
| --------------- | ------ | -------- | ---------------------------- |
| firstName       | string | No       | 2-100 characters             |
| lastName        | string | No       | 2-100 characters             |
| businessName    | string | No       | 3-255 characters             |
| businessAddress | string | No       | Minimum 10 characters        |
| dateOfBirth     | string | No       | ISO date format (YYYY-MM-DD) |

**Success Response (200 OK):**

````json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "B2C3D4E5",
      "firstName": "Ahmed",
      "lastName": "Rahman",
      "dateOfBirth": "1990-03-10"
    },
    "agent": {
      "id": 1,
      "businessName": "Rahman Mobile Services",
      "businessAddress": "456 New Location, Dhaka-1207"
    }
  }
}
```uth/agent

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **403 Forbidden** - User is not an agent
- **400 Bad Request** - Validation errors

---

### 5. Change Agent Password

Changes the authenticated agent's password.

**Endpoint:** `PUT /api/agents/auth/change-password`
**Authentication:** Required (Agent Token)

**Headers:**

````

Authorization: Bearer <agent_token>

````

**Request Body:**

```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
````

**Field Validations:**

| Field           | Type   | Required | Validation                                              |
| --------------- | ------ | -------- | ------------------------------------------------------- |
| currentPassword | string | Yes      | Current password                                        |
| newPassword     | string | Yes      | Min 8 chars, uppercase, lowercase, number, special char |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid current password or missing token
- **403 Forbidden** - User is not an agent
- **400 Bad Request** - New password validation errors

---

## Admin Authentication

Base URL: `/api/auth/admin`

Admin endpoints are restricted to authenticated administrators.

### 1. Admin Login

Authenticates an admin and returns a JWT token.

**Endpoint:** `POST /api/auth/admin/login`  
**Authentication:** None (Public)

**Request Body:**

```json
{
  "email": "admin@uiucash.com",
  "password": "AdminPass123!"
}
```

**Field Validations:**

| Field    | Type   | Required | Validation         |
| -------- | ------ | -------- | ------------------ |
| email    | string | Yes      | Valid email format |
| password | string | Yes      | Admin's password   |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profile": {
      "id": "ADMIN001",
      "email": "admin@uiucash.com",
      "name": "System Administrator",
      "status": "ACTIVE",
      "lastLoginAt": "2026-01-27T09:30:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "userType": "Admin"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid credentials
- **403 Forbidden** - Account suspended

---

### 2. Create Admin Accounuth/at

Creates a new admin account. This endpoint is restricted to authenticated admins only.

**Endpoint:** `POST /api/admin/register`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "email": "newadmin@uiucash.com",
  "password": "SecureAdminPass123!",
  "name": "New Administrator"
}
```

**Field Validations:**

| Field    | Type   | Required | Validation                                              |
| -------- | ------ | -------- | ------------------------------------------------------- |
| email    | string | Yes      | Valid email format                                      |
| password | string | Yes      | Min 8 chars, uppercase, lowercase, number, special char |
| name     | string | Yes      | 2-255 characters                                        |

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Admin account created successfully",
  "data": {
    "admin": {
      "id": "ADMIN002",
      "email": "newadmin@uiucash.com",
      "name": "New Administrator",
      "status": "ACTIVE"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **409 Conflict** - Email already registered
- **400 Bad Request** - Validation errors

---

### 3. Get Admin Profile

**Endpoint:** `GET /api/auth/admin/profile`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Admin profile retrieved successfully",
  "data": {
    "admin": {
      "id": "ADMIN001",
      "email": "admin@uiucash.com",
      "name": "System Administrator",
      "role": "ADMIN",
      "status": "ACTIVE",
      "last_login_at": "2026-01-27T09:30:00.000Z",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token

---

### 4. Admin Logout

**Endpoint:** `POST /api/auth/admin/logout`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful. All sessions have been terminated."
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token

---

### 5. Change Admin Password

**Endpoint:** `PUT /api/auth/admin/change-password`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "currentPassword": "OldAdminPass123!",
  "newPassword": "NewAdminPass456!"
}
```

**Field Validations:**

| Field           | Type   | Required | Validation                                              |
| --------------- | ------ | -------- | ------------------------------------------------------- |
| currentPassword | string | Yes      | Current admin password                                  |
| newPassword     | string | Yes      | Min 8 chars, uppercase, lowercase, number, special char |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid token or incorrect current password
- **400 Bad Request** - New password doesn't meet requirements

---

## Wallet

Base URL: `/api/wallet`

### 1. Get Wallet Information

Retrieves wallet information including available balance, spending limits, and last 5 transactions.

**Endpoint:** `GET /api/wallet`  
**Authentication:** Required (Consumer or Agent Token)

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Wallet information retrieved successfully",
  "data": {
    "availableBalance": 5000.0,
    "dailyLimit": 25000.0,
    "monthlyLimit": 100000.0,
    "dailySpent": 1500.0,
    "monthlySpent": 12000.0,
    "currency": "BDT",
    "recentTransactions": [
      {
        "id": "T1A2B3C4",
        "transactionId": "TXN202601271234567",
        "type": "SEND_MONEY",
        "amount": 500.0,
        "fee": 5.0,
        "status": "COMPLETED",
        "description": "Payment for lunch",
        "createdAt": "2026-01-27T12:34:56.000Z"
      },
      {
        "id": "T2B3C4D5",
        "transactionId": "TXN202601271234568",
        "type": "ADD_MONEY",
        "amount": 2000.0,
        "fee": 0.0,
        "status": "COMPLETED",
        "description": "Added money from card",
        "createdAt": "2026-01-27T10:15:30.000Z"
      }
    ]
  }
}
```

**Response Fields:**

| Field              | Type   | Description                                |
| ------------------ | ------ | ------------------------------------------ |
| availableBalance   | number | Current spendable balance                  |
| dailyLimit         | number | Maximum amount that can be spent per day   |
| monthlyLimit       | number | Maximum amount that can be spent per month |
| dailySpent         | number | Amount spent today                         |
| monthlySpent       | number | Amount spent this month                    |
| currency           | string | Currency code (BDT)                        |
| recentTransactions | array  | Last 5 transactions                        |

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **404 Not Found** - Wallet not found

---

## Transactions

Base URL: `/api/transactions`

### Add Money

Add money to wallet from a debit or credit card.

**Endpoint:** `POST /api/transactions/add-money`  
**Authentication:** Required (Consumer or Agent Token)

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "amount": 2000,
  "cardNumber": "4532123456789012",
  "cardHolderName": "John Doe",
  "expiryMonth": "12",
  "expiryYear": "28",
  "cvv": "123"
}
```

**Field Validations:**

| Field          | Type   | Required | Validation                       |
| -------------- | ------ | -------- | -------------------------------- |
| amount         | number | Yes      | Min: ৳50, Max: ৳25,000           |
| cardNumber     | string | Yes      | 16 digits                        |
| cardHolderName | string | Yes      | Min 3 characters                 |
| expiryMonth    | string | Yes      | Format: MM (01-12)               |
| expiryYear     | string | Yes      | Format: YY (must not be expired) |
| cvv            | string | Yes      | 3 digits                         |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Money added successfully",
  "data": {
    "transaction": {
      "id": "T3C4D5E6",
      "transactionId": "TXN202601271530123",
      "type": "ADD_MONEY",
      "amount": 2000.0,
      "fee": 0.0,
      "status": "COMPLETED",
      "description": "Added money from ****-****-****-9012",
      "createdAt": "2026-01-27T15:30:12.000Z"
    },
    "wallet": {
      "newBalance": 7000.0,
      "availableBalance": 7000.0
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Invalid card details, insufficient bank balance, or validation errors
- **403 Forbidden** - Account not active
- **404 Not Found** - User or wallet not found

**Bank Simulation:**

The system simulates card transactions with a mock bank account system. Cards must have sufficient balance.

---

### Send Money

Send money to another user (P2P transfer) using their phone number or email.

**Endpoint:** `POST /api/transactions/send-money`  
**Authentication:** Required (Consumer Token Only)

**Headers:**

```
Authorization: Bearer <consumer_token>
```

**Request Body:**

```json
{
  "recipientIdentifier": "01812345678",
  "amount": 500,
  "description": "Payment for lunch"
}
```

**Field Validations:**

| Field               | Type   | Required | Validation                                     |
| ------------------- | ------ | -------- | ---------------------------------------------- |
| recipientIdentifier | string | Yes      | Phone number or email of recipient             |
| amount              | number | Yes      | Min: ৳10, Max: ৳25,000                         |
| description         | string | No       | Max 500 characters                             |
| pin                 | string | No       | 4 digits (optional, for future implementation) |

**Fee Structure:**

- **₹0 - ₹1,000**: Free
- **₹1,001 - ₹5,000**: ৳5
- **₹5,001+**: ৳10

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Money sent successfully",
  "data": {
    "transaction": {
      "id": "T4D5E6F7",
      "transactionId": "TXN202601271600456",
      "type": "SEND_MONEY",
      "amount": 500.0,
      "fee": 0.0,
      "status": "COMPLETED",
      "sender": {
        "id": "A1B2C3D4",
        "name": "John Doe"
      },
      "receiver": {
        "id": "B2C3D4E5",
        "name": "Jane Smith",
        "phone": "01812345678"
      },
      "description": "Payment for lunch",
      "createdAt": "2026-01-27T16:00:45.000Z"
    },
    "wallet": {
      "newBalance": 6495.0,
      "availableBalance": 6495.0
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Insufficient balance, validation errors, or cannot send to yourself
- **403 Forbidden** - Account not active or recipient account suspended
- **404 Not Found** - Recipient not found

**Notes:**

- Both sender and receiver must have ACTIVE status
- Cannot send money to yourself
- Transaction creates ledger entries for both parties

---

### Cash Out

Withdraw cash from wallet through an agent.

**Endpoint:** `POST /api/transactions/cash-out`  
**Authentication:** Required (Consumer Token Only)

**Headers:**

```
Authorization: Bearer <consumer_token>
```

**Request Body:**

```json
{
  "agentCode": "AG1234567",
  "amount": 1000,
  "description": "Cash withdrawal"
}
```

**Field Validations:**

| Field       | Type   | Required | Validation             |
| ----------- | ------ | -------- | ---------------------- |
| agentCode   | string | Yes      | Format: AG + 7 digits  |
| amount      | number | Yes      | Min: ৳50, Max: ৳25,000 |
| description | string | No       | Max 500 characters     |

**Fee & Commission:**

- **Consumer Fee**: 1.85% of amount
- **Agent Commission**: 1.5% of amount (credited to agent)

**Example Calculation:**

```
Amount: ৳1,000
Fee: ৳18.50 (1.85%)
Total Deducted from Consumer: ৳1,018.50

Agent Receives: ৳1,015.00 (₹1,000 + ₹15 commission)
Commission: ৳15.00 (1.5%)
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Cash out successful",
  "data": {
    "transaction": {
      "id": "T5E6F7G8",
      "transactionId": "TXN202601271700789",
      "type": "CASH_OUT",
      "amount": 1000.0,
      "fee": 18.5,
      "totalDeducted": 1018.5,
      "status": "COMPLETED",
      "agent": {
        "agentCode": "AG1234567",
        "businessName": "Khan Mobile Banking"
      },
      "description": "Cash withdrawal",
      "createdAt": "2026-01-27T17:00:12.000Z"
    },
    "wallet": {
      "newBalance": 5476.5,
      "availableBalance": 5476.5
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Insufficient balance, validation errors, or invalid agent code
- **403 Forbidden** - Account not active or agent not active
- **404 Not Found** - Agent not found

**Notes:**

- Agent must have ACTIVE status
- Fee is deducted from consumer wallet
- Commission is credited to agent wallet
- Platform wallet collects the fee

---

### Cash In

Agent accepts physical cash from consumer and credits their digital wallet.

**Endpoint:** `POST /api/transactions/cash-in`  
**Authentication:** Required (Agent Token Only)

**Headers:**

```
Authorization: Bearer <agent_token>
```

**Request Body:**

```json
{
  "consumerIdentifier": "consumer@example.com",
  "amount": 1000,
  "description": "Cash deposit"
}
```

**Field Validations:**

| Field              | Type   | Required | Validation             |
| ------------------ | ------ | -------- | ---------------------- |
| consumerIdentifier | string | Yes      | Phone number or email  |
| amount             | number | Yes      | Min: ৳50, Max: ৳25,000 |
| description        | string | No       | Max 500 characters     |

**Commission:**

- **Agent Commission**: (agent_commission_rate / 10) of amount
- **Default Commission**: 0.15% (when agent_commission_rate is 1.5%)
- **No Fee for Consumer**

**Example Calculation:**

```
Amount: ৳1,000
Commission: ৳1.50 (0.15%)

Consumer Receives: ৳1,000 (full amount)
Agent Net Cost: ৳998.50 (paid ৳1,000, received ৳1.50 commission)
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Cash in successful. Consumer's wallet has been credited.",
  "data": {
    "transaction": {
      "id": "T1A2B3C4",
      "transactionId": "TXN-20260128-123456",
      "amount": 1000,
      "fee": 0,
      "commission": 1.5,
      "type": "CASH_IN",
      "status": "COMPLETED",
      "consumer": {
        "name": "John Doe",
        "phone": "01812345678"
      },
      "description": "Cash deposit",
      "createdAt": "2026-01-28T10:30:00.000Z"
    },
    "agentWallet": {
      "balance": 10001.5,
      "availableBalance": 10001.5
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Insufficient agent balance, validation errors, or cannot process to own account
- **403 Forbidden** - Agent account not active or consumer account not active
- **404 Not Found** - Consumer not found

**Notes:**

- Only agents can perform cash in operations
- Agent must have sufficient wallet balance to credit consumer
- Consumer receives full amount with no fee deduction
- Agent earns commission from platform for the service
- Commission is 1/10th of regular agent commission rate

---

### Transaction History

Get paginated transaction history with optional filters.

**Endpoint:** `GET /api/transactions/history`  
**Authentication:** Required (Consumer or Agent Token)

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                |
| --------- | ------ | -------- | ------- | -------------------------- |
| page      | number | No       | 1       | Page number                |
| limit     | number | No       | 20      | Items per page (max 100)   |
| type      | string | No       | -       | Filter by transaction type |
| status    | string | No       | -       | Filter by status           |

**Transaction Types:**

- `SEND_MONEY` - P2P transfer
- `ADD_MONEY` - Card to wallet
- `CASH_OUT` - Withdrawal through agent
- `CASH_IN` - Agent deposit
- `BILL_PAYMENT` - Utility bill payment
- `BANK_TRANSFER` - Bank withdrawal
- `CASHBACK` - Offer cashback
- `COMMISSION` - Agent commission
- `ONBOARDING_BONUS` - Welcome bonus

**Transaction Status:**

- `PENDING` - Awaiting processing
- `PROCESSING` - Being processed
- `COMPLETED` - Successfully completed
- `FAILED` - Transaction failed

**Example Request:**

```
GET /api/transactions/history?page=1&limit=10&type=SEND_MONEY&status=COMPLETED
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Transaction history retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "T1A2B3C4",
        "transactionId": "TXN202601271234567",
        "type": "SEND_MONEY",
        "amount": 500.0,
        "fee": 0.0,
        "status": "COMPLETED",
        "description": "Payment for lunch",
        "sender": {
          "id": "A1B2C3D4",
          "name": "John Doe"
        },
        "receiver": {
          "id": "B2C3D4E5",
          "name": "Jane Smith"
        },
        "createdAt": "2026-01-27T12:34:56.000Z",
        "completedAt": "2026-01-27T12:34:57.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 47,
      "limit": 10
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Invalid query parameters

---

### Transaction Details

Get detailed information about a specific transaction.

**Endpoint:** `GET /api/transactions/:id`  
**Authentication:** Required (Consumer or Agent Token)

**Headers:**

```
Authorization: Bearer <token>
```

**Path Parameters:**

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| id        | string | Yes      | Transaction ID |

**Example Request:**

```
GET /api/transactions/T1A2B3C4
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Transaction details retrieved successfully",
  "data": {
    "transaction": {
      "id": "T1A2B3C4",
      "transactionId": "TXN202601271234567",
      "type": "SEND_MONEY",
      "amount": 500.0,
      "fee": 0.0,
      "status": "COMPLETED",
      "description": "Payment for lunch",
      "sender": {
        "id": "A1B2C3D4",
        "name": "John Doe",
        "phone": "01712345678"
      },
      "receiver": {
        "id": "B2C3D4E5",
        "name": "Jane Smith",
        "phone": "01812345678"
      },
      "metadata": {},
      "createdAt": "2026-01-27T12:34:56.000Z",
      "completedAt": "2026-01-27T12:34:57.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **403 Forbidden** - Not authorized to view this transaction
- **404 Not Found** - Transaction not found

**Notes:**

- Users can only view their own transactions (sent or received)
- Admins can view all transactions

---

## Bill Payment

Base URL: `/api/transactions`

Pay utility bills like electricity, gas, water, internet, mobile, and TV subscriptions. **No fees charged for bill payments.**

### Get Billers

Get list of all active billers for bill payments.

**Endpoint:** `GET /api/transactions/billers`  
**Authentication:** Required (Consumer Token Only)

**Headers:**

```
Authorization: Bearer <consumer_token>
```

**Query Parameters:**

| Parameter | Type   | Required | Description                                                                 |
| --------- | ------ | -------- | --------------------------------------------------------------------------- |
| billType  | enum   | No       | Filter by type: ELECTRICITY, GAS, WATER, INTERNET, MOBILE, TV, ORGANIZATION |
| search    | string | No       | Search billers by name                                                      |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Billers retrieved successfully",
  "data": {
    "billers": [
      {
        "id": "BILLER01",
        "name": "Dhaka Electric Supply Company Limited (DESCO)",
        "billerCode": "DESCO-ELEC",
        "billType": "ELECTRICITY",
        "contactEmail": "info@desco.org.bd",
        "contactPhone": "01713074499",
        "description": "Electricity supply for Dhaka city area",
        "logoUrl": null
      },
      {
        "id": "BILLER02",
        "name": "Grameenphone Limited",
        "billerCode": "GP-MOBILE",
        "billType": "MOBILE",
        "contactEmail": "info@grameenphone.com",
        "contactPhone": "01713074422",
        "description": "Mobile operator - Grameenphone",
        "logoUrl": null
      },
      {
        "id": "BILLER03",
        "name": "United International University (UIU)",
        "billerCode": "UIU-ORG",
        "billType": "ORGANIZATION",
        "contactEmail": "accounts@uiu.ac.bd",
        "contactPhone": "01713074333",
        "description": "University tuition and fees",
        "logoUrl": null
      }
    ],
    "total": 3
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token

---

### Pay Bill

Make a bill payment for utilities.

**Endpoint:** `POST /api/transactions/pay-bill`  
**Authentication:** Required (Consumer Token Only)

**Headers:**

```
Authorization: Bearer <consumer_token>
```

**Request Body:**

```json
{
  "billerId": "BILLER01",
  "accountNumber": "1234567890",
  "amount": 850,
  "billingMonth": "January",
  "billingYear": 2026,
  "description": "Electricity bill for January 2026"
}
```

**Field Validations:**

| Field         | Type   | Required | Validation                                     |
| ------------- | ------ | -------- | ---------------------------------------------- |
| billerId      | string | Yes      | Valid biller ID                                |
| accountNumber | string | Yes      | 5-50 characters, alphanumeric and hyphens only |
| amount        | number | Yes      | Min: ৳10, Max: ৳100,000                        |
| billingMonth  | string | No       | Valid month name (January-December)            |
| billingYear   | number | No       | 2020-2100                                      |
| description   | string | No       | Max 500 characters                             |

**Fee Structure:**

- **৳0 fee** - No fees charged for bill payments
- Consumer pays exact bill amount

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Bill payment completed successfully",
  "data": {
    "transactionId": "TRX20260128010",
    "billerId": "BILLER01",
    "billerName": "Dhaka Electric Supply Company Limited (DESCO)",
    "billerCode": "DESCO-ELEC",
    "billType": "ELECTRICITY",
    "accountNumber": "1234567890",
    "amount": 850,
    "fee": 0,
    "totalAmount": 850,
    "status": "COMPLETED",
    "completedAt": "2026-01-28T11:00:00.000Z",
    "newBalance": 4150
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Validation errors, insufficient balance, or daily/monthly limit exceeded
- **403 Forbidden** - Account not active
- **404 Not Found** - Biller not found or biller not accepting payments

**Notes:**

- **Consumer only** - Bill payments are only available for consumers
- **No fees** - Zero transaction fees for all bill payments
- Daily and monthly spending limits apply
- All bill payments are completed immediately
- Receipt number is generated automatically upon completion

---

### Get Bill Payment History

Get paginated bill payment history for the authenticated consumer.

**Endpoint:** `GET /api/transactions/bill-payments`  
**Authentication:** Required (Consumer Token Only)

**Headers:**

```
Authorization: Bearer <consumer_token>
```

**Query Parameters:**

| Parameter | Type   | Required | Default | Description               |
| --------- | ------ | -------- | ------- | ------------------------- |
| page      | number | No       | 1       | Page number               |
| limit     | number | No       | 10      | Results per page          |
| billerId  | string | No       | -       | Filter by specific biller |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Bill payment history retrieved successfully",
  "data": {
    "payments": [
      {
        "id": "BILLPAY1",
        "transactionId": "TRX20260128010",
        "biller": {
          "id": "BILLER01",
          "name": "Dhaka Electric Supply Company Limited (DESCO)",
          "billerCode": "DESCO-ELEC",
          "billType": "ELECTRICITY"
        },
        "accountNumber": "1234567890",
        "amount": 850,
        "fee": 0,
        "totalAmount": 850,
        "status": "COMPLETED",
        "billingMonth": "January",
        "billingYear": 2026,
        "receiptNumber": "RCP-202601-12345",
        "createdAt": "2026-01-28T11:00:00.000Z",
        "updatedAt": "2026-01-28T11:00:01.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token

**Notes:**

- Consumers can only view their own bill payments
- Includes receipt numbers for completed payments

---

## Bank Transfer

Base URL: `/api/bank`

Transfer money from your UIU Cash wallet to a bank account. **Agents get bank transfers with no fee and instant completion.**

### Initiate Bank Transfer

Transfer money from your wallet to a bank account.

**Endpoint:** `POST /api/bank/transfer`  
**Authentication:** Required (Consumer or Agent Token)

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "bankName": "Dutch Bangla Bank",
  "accountNumber": "1234567890123456",
  "accountHolderName": "John Doe",
  "routingNumber": "090271044",
  "transferType": "INSTANT",
  "amount": 5000,
  "description": "Monthly savings"
}
```

**Field Validations:**

| Field             | Type   | Required | Validation              |
| ----------------- | ------ | -------- | ----------------------- |
| bankName          | string | Yes      | 2-100 characters        |
| accountNumber     | string | Yes      | 5-50 digits only        |
| accountHolderName | string | Yes      | 2-255 characters        |
| routingNumber     | string | No       | 9-20 digits             |
| transferType      | enum   | No       | `INSTANT` or `STANDARD` |
| amount            | number | Yes      | Min: ৳10, Max: ৳100,000 |
| description       | string | No       | Max 500 characters      |

**Fee Structure:**

| User Type | Fee                          | Status                    |
| --------- | ---------------------------- | ------------------------- |
| **Agent** | **৳0 (No fee)**              | **COMPLETED immediately** |
| Consumer  | 1.5% of amount (minimum ৳10) | COMPLETED immediately     |

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Bank transfer completed successfully",
  "data": {
    "transactionId": "TRX20260128005",
    "amount": 5000,
    "processingFee": 0,
    "totalAmount": 5000,
    "bankName": "Dutch Bangla Bank",
    "accountNumber": "****3456",
    "transferType": "INSTANT",
    "status": "COMPLETED",
    "completedAt": "2026-01-28T10:30:00.000Z"
  }
}
```

**Consumer Example (with fee):**

```json
{
  "success": true,
  "message": "Bank transfer completed successfully",
  "data": {
    "transactionId": "TRX20260128006",
    "amount": 5000,
    "processingFee": 75,
    "totalAmount": 5075,
    "bankName": "Dutch Bangla Bank",
    "accountNumber": "****3456",
    "transferType": "INSTANT",
    "status": "COMPLETED",
    "completedAt": "2026-01-28T10:35:00.000Z"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token
- **400 Bad Request** - Validation errors, insufficient balance, or daily/monthly limit exceeded
- **404 Not Found** - Wallet not found

**Notes:**

- **Agents receive bank transfers with no fee** - helps agents convert digital balance to cash
- **All transfers are completed immediately** after validation
- Transfer amount includes fee for consumers (amount + fee deducted from wallet)
- Daily and monthly spending limits apply
- Account number is masked in response (last 4 digits shown)
- Both INSTANT and STANDARD transfers are processed immediately in simulation

---

### Get Transfer History

Get paginated bank transfer history for the authenticated user.

**Endpoint:** `GET /api/bank/transfers`  
**Authentication:** Required (Consumer or Agent Token)

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                                              |
| --------- | ------ | -------- | ------- | -------------------------------------------------------- |
| page      | number | No       | 1       | Page number                                              |
| limit     | number | No       | 10      | Results per page                                         |
| status    | enum   | No       | -       | Filter by status: PENDING, PROCESSING, COMPLETED, FAILED |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Bank transfer history retrieved successfully",
  "data": {
    "transfers": [
      {
        "id": "TRNSF001",
        "transactionId": "TRX20260128005",
        "bankName": "Dutch Bangla Bank",
        "accountNumber": "****3456",
        "accountHolderName": "John Doe",
        "amount": 5000,
        "fee": 0,
        "totalAmount": 5000,
        "status": "COMPLETED",
        "referenceNumber": "BNK202601280001",
        "createdAt": "2026-01-28T10:30:00.000Z",
        "updatedAt": "2026-01-28T10:30:01.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token

---

### Get Transfer Details

Get detailed information about a specific bank transfer.

**Endpoint:** `GET /api/bank/transfers/:id`  
**Authentication:** Required (Consumer or Agent Token)

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| id        | string | Yes      | Bank transfer ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Bank transfer details retrieved successfully",
  "data": {
    "id": "TRNSF001",
    "transactionId": "TRX20260128005",
    "bankName": "Dutch Bangla Bank",
    "accountNumber": "****3456",
    "accountHolderName": "John Doe",
    "routingNumber": "090271044",
    "amount": 5000,
    "fee": 0,
    "totalAmount": 5000,
    "status": "COMPLETED",
    "referenceNumber": "BNK202601280001",
    "createdAt": "2026-01-28T10:30:00.000Z",
    "updatedAt": "2026-01-28T10:30:01.000Z",
    "transaction": {
      "transactionId": "TRX20260128005",
      "status": "COMPLETED",
      "description": "Bank transfer to Dutch Bangla Bank",
      "initiatedAt": "2026-01-28T10:30:00.000Z",
      "completedAt": "2026-01-28T10:30:01.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing token, or unauthorized access to transfer
- **404 Not Found** - Bank transfer not found

**Notes:**

- Users can only view their own bank transfers
- Full routing number is displayed in transfer details

---

## Admin - Consumer Management

Base URL: `/api/admin/consumers`

All consumer management endpoints require admin authentication.

### Get Paginated Consumers

Get a paginated list of consumers with advanced search and filtering capabilities.

**Endpoint:** `POST /api/admin/consumers/list`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "offset": 0,
  "limit": 20,
  "search": "john",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-28T23:59:59.999Z",
  "status": "ACTIVE"
}
```

**Field Validations:**

| Field     | Type   | Required | Validation                          |
| --------- | ------ | -------- | ----------------------------------- |
| offset    | number | Yes      | Min: 0                              |
| limit     | number | Yes      | Min: 1, Max: 100                    |
| search    | string | No       | Searches name, email, phone         |
| startDate | string | No       | ISO 8601 datetime                   |
| endDate   | string | No       | ISO 8601 datetime                   |
| status    | enum   | No       | ACTIVE, INACTIVE, SUSPENDED, LOCKED |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Consumers retrieved successfully",
  "data": {
    "consumers": [
      {
        "id": "U4R2Q9VG",
        "email": "john.doe@example.com",
        "phone": "01712345678",
        "firstName": "John",
        "lastName": "Doe",
        "role": "CONSUMER",
        "status": "ACTIVE",
        "emailVerified": true,
        "phoneVerified": true,
        "lastLoginAt": "2026-01-27T10:30:00.000Z",
        "createdAt": "2026-01-15T08:00:00.000Z",
        "walletBalance": 5000.0,
        "walletAvailableBalance": 4500.0
      }
    ],
    "pagination": {
      "offset": 0,
      "limit": 20,
      "total": 150,
      "hasMore": true
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **400 Bad Request** - Invalid pagination or filter parameters

---

### Get Consumer Details

Get detailed information about a specific consumer including wallet and transaction history.

**Endpoint:** `GET /api/admin/consumers/:id`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Consumer ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "user": {
      "id": "U4R2Q9VG",
      "email": "john.doe@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CONSUMER",
      "status": "ACTIVE",
      "dateOfBirth": "1995-05-15",
      "nidNumber": "1234567890",
      "emailVerified": true,
      "phoneVerified": true,
      "lastLoginAt": "2026-01-27T10:30:00.000Z",
      "createdAt": "2026-01-15T08:00:00.000Z",
      "updatedAt": "2026-01-27T10:30:00.000Z"
    },
    "wallet": {
      "balance": 5000.0,
      "availableBalance": 4500.0,
      "pendingBalance": 500.0,
      "currency": "BDT",
      "dailyLimit": 50000.0,
      "monthlyLimit": 200000.0,
      "dailySpent": 2000.0,
      "monthlySpent": 15000.0,
      "lastTransactionAt": "2026-01-27T09:45:00.000Z"
    },
    "recentTransactions": [
      {
        "id": "9W2QRKXY",
        "transactionId": "TXN-20260127-847345",
        "type": "SEND_MONEY",
        "amount": 500.0,
        "fee": 5.0,
        "status": "COMPLETED",
        "createdAt": "2026-01-27T09:45:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Consumer not found

---

### Update Consumer Status

Update a consumer's account status.

**Endpoint:** `PATCH /api/admin/consumers/:id/status`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Consumer ID |

**Request Body:**

```json
{
  "status": "SUSPENDED"
}
```

**Field Validations:**

| Field  | Type | Required | Validation                  |
| ------ | ---- | -------- | --------------------------- |
| status | enum | Yes      | ACTIVE, SUSPENDED, REJECTED |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "user": {
      "id": "U4R2Q9VG",
      "email": "john.doe@example.com",
      "status": "SUSPENDED"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Consumer not found
- **400 Bad Request** - Invalid status value

---

### Get Consumer Transactions

Get paginated transaction history for a specific consumer.

**Endpoint:** `GET /api/admin/consumers/:id/transactions`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Consumer ID |

**Query Parameters:**

| Parameter | Type   | Required | Default | Description    |
| --------- | ------ | -------- | ------- | -------------- |
| page      | number | No       | 1       | Page number    |
| limit     | number | No       | 20      | Items per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "9W2QRKXY",
        "transactionId": "TXN-20260127-847345",
        "type": "SEND_MONEY",
        "amount": 500.0,
        "fee": 5.0,
        "totalAmount": 505.0,
        "status": "COMPLETED",
        "description": "Money sent to Jane Doe",
        "createdAt": "2026-01-27T09:45:00.000Z",
        "completedAt": "2026-01-27T09:45:01.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 98,
      "itemsPerPage": 20
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Consumer not found

---

## Admin - Agent Management

Base URL: `/api/admin/agents`

All agent management endpoints require admin authentication.

### Get Paginated Agents

Get a paginated list of agents with advanced search and filtering capabilities.

**Endpoint:** `POST /api/admin/agents/list`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "offset": 0,
  "limit": 20,
  "search": "AG1234567",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-28T23:59:59.999Z",
  "status": "ACTIVE"
}
```

**Field Validations:**

| Field     | Type   | Required | Validation                           |
| --------- | ------ | -------- | ------------------------------------ |
| offset    | number | Yes      | Min: 0                               |
| limit     | number | Yes      | Min: 1, Max: 100                     |
| search    | string | No       | Searches agent code, business name   |
| startDate | string | No       | ISO 8601 datetime                    |
| endDate   | string | No       | ISO 8601 datetime                    |
| status    | enum   | No       | PENDING, ACTIVE, SUSPENDED, REJECTED |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agents retrieved successfully",
  "data": {
    "agents": [
      {
        "id": "AGT001",
        "userId": "U9X5K2LM",
        "agentCode": "AG1234567",
        "businessName": "Quick Cash Point",
        "businessAddress": "123 Main Street, Dhaka-1205",
        "status": "ACTIVE",
        "totalCommissionEarned": 5000.0,
        "createdAt": "2026-01-10T08:00:00.000Z",
        "approvedAt": "2026-01-11T14:30:00.000Z",
        "user": {
          "email": "agent@example.com",
          "phone": "01812345678",
          "firstName": "Ahmed",
          "lastName": "Rahman",
          "status": "ACTIVE"
        },
        "wallet": {
          "balance": 25000.0,
          "availableBalance": 24500.0
        }
      }
    ],
    "pagination": {
      "offset": 0,
      "limit": 20,
      "total": 45,
      "hasMore": true
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **400 Bad Request** - Invalid pagination or filter parameters

---

### Get Agent Details

Get detailed information about a specific agent including user details and approval status.

**Endpoint:** `GET /api/admin/agents/:id`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Agent ID    |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agent details retrieved successfully",
  "data": {
    "agent": {
      "id": "AGT001",
      "userId": "U9X5K2LM",
      "agentCode": "AG1234567",
      "businessName": "Quick Cash Point",
      "businessAddress": "123 Main Street, Dhaka-1205",
      "status": "ACTIVE",
      "totalCommissionEarned": 5000.0,
      "createdAt": "2026-01-10T08:00:00.000Z",
      "approvedAt": "2026-01-11T14:30:00.000Z",
      "approvedBy": "ADM001",
      "user": {
        "id": "U9X5K2LM",
        "email": "agent@example.com",
        "phone": "01812345678",
        "firstName": "Ahmed",
        "lastName": "Rahman",
        "status": "ACTIVE",
        "createdAt": "2026-01-10T08:00:00.000Z"
      },
      "wallet": {
        "balance": 50000.0,
        "availableBalance": 45000.0,
        "dailyLimit": 100000.0,
        "monthlyLimit": 500000.0,
        "dailySpent": 5000.0,
        "monthlySpent": 25000.0
      },
      "approver": {
        "id": "ADM001",
        "name": "Admin User",
        "email": "admin@uiucash.com"
      }
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Agent not found

---

### Approve Agent

Approve a pending agent application and activate their account.

**Endpoint:** `POST /api/admin/agents/:id/approve`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Agent ID    |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agent approved successfully",
  "data": {
    "agent": {
      "id": "AGT001",
      "agentCode": "AG1234567",
      "status": "ACTIVE",
      "approvedAt": "2026-01-27T10:30:00.000Z",
      "approvedBy": "ADM001"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Agent not found
- **400 Bad Request** - Agent is already processed (not pending)

**Note:** Approving an agent also updates the user's status to ACTIVE.

---

### Reject Agent

Reject a pending agent application with a reason.

**Endpoint:** `POST /api/admin/agents/:id/reject`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Agent ID    |

**Request Body:**

```json
{
  "reason": "Incomplete business documentation provided. Please resubmit with proper business license."
}
```

**Field Validations:**

| Field  | Type   | Required | Validation        |
| ------ | ------ | -------- | ----------------- |
| reason | string | Yes      | Min 10 characters |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agent rejected successfully",
  "data": {
    "agent": {
      "id": "AGT001",
      "agentCode": "AG1234567",
      "status": "REJECTED",
      "rejectedAt": "2026-01-27T10:30:00.000Z",
      "rejectedBy": "ADM001",
      "rejectionReason": "Incomplete business documentation provided. Please resubmit with proper business license."
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Agent not found
- **400 Bad Request** - Agent is already processed or reason too short

**Note:** Rejecting an agent also updates the user's status to REJECTED.

---

### Get Agent Transactions

Get paginated transaction history for a specific agent.

**Endpoint:** `GET /api/admin/agents/:id/transactions`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Agent ID    |

**Query Parameters:**

| Parameter | Type   | Required | Default | Description    |
| --------- | ------ | -------- | ------- | -------------- |
| page      | number | No       | 1       | Page number    |
| limit     | number | No       | 20      | Items per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agent transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "TXN12345",
        "transactionId": "TX-20260127-ABCD1234",
        "type": "CASH_OUT",
        "amount": 1000.0,
        "fee": 18.5,
        "totalAmount": 1018.5,
        "status": "COMPLETED",
        "description": "Cash withdrawal",
        "createdAt": "2026-01-27T10:30:00.000Z",
        "completedAt": "2026-01-27T10:30:15.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 98,
      "itemsPerPage": 20
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Agent not found

---

## Admin - Analytics

Base URL: `/api/admin/analytics`

All analytics endpoints require admin authentication.

### Dashboard Analytics

Get high-level overview statistics for the admin dashboard.

**Endpoint:** `GET /api/admin/analytics/dashboard`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Dashboard analytics retrieved successfully",
  "data": {
    "users": {
      "total": 1250,
      "active": 1100,
      "inactive": 50,
      "suspended": 100
    },
    "agents": {
      "total": 45,
      "active": 38,
      "pending": 5,
      "rejected": 2
    },
    "transactions": {
      "total": 15420,
      "today": 234,
      "thisWeek": 1567,
      "thisMonth": 6890
    },
    "revenue": {
      "total": 125000.0,
      "today": 2500.0,
      "thisWeek": 15000.0,
      "thisMonth": 58000.0
    },
    "platformWallet": {
      "balance": 999800.0,
      "totalBonusesGiven": 200.0,
      "totalRevenueCollected": 125000.0
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Transaction Analytics

Get detailed transaction analytics and trends.

**Endpoint:** `GET /api/admin/analytics/transactions`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type   | Required | Default     | Description           |
| --------- | ------ | -------- | ----------- | --------------------- |
| startDate | string | No       | 30 days ago | Start date (ISO 8601) |
| endDate   | string | No       | Today       | End date (ISO 8601)   |
| groupBy   | string | No       | day         | day, week, month      |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Transaction analytics retrieved successfully",
  "data": {
    "byType": {
      "SEND_MONEY": { "count": 5420, "volume": 2500000.0 },
      "ADD_MONEY": { "count": 3200, "volume": 5000000.0 },
      "CASH_OUT": { "count": 2100, "volume": 1800000.0 },
      "BANK_TRANSFER": { "count": 450, "volume": 1200000.0 }
    },
    "byStatus": {
      "COMPLETED": 14800,
      "PENDING": 420,
      "FAILED": 200
    },
    "timeline": [
      {
        "date": "2026-01-27",
        "count": 234,
        "volume": 125000.0
      }
    ],
    "averageTransactionSize": 680.45,
    "totalFees": 15420.0
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Consumer Analytics

Get consumer-specific analytics including registration trends, status breakdown, and transaction statistics.

**Endpoint:** `GET /api/admin/analytics/consumers`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| startDate | string | No       | Start date (ISO 8601 format) |
| endDate   | string | No       | End date (ISO 8601 format)   |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Consumer analytics retrieved successfully",
  "data": {
    "total": 1423,
    "byStatus": {
      "active": 1350,
      "pending": 20,
      "suspended": 8,
      "rejected": 45
    },
    "registrationTrend": [
      {
        "date": "2026-01-27",
        "count": 38
      },
      {
        "date": "2026-01-26",
        "count": 42
      }
    ],
    "verification": {
      "total": 1523,
      "emailVerified": 1400,
      "phoneVerified": 1350,
      "bothVerified": 1300
    },
    "transactions": {
      "totalSent": {
        "count": 25000,
        "amount": 12500000
      },
      "totalCashOut": {
        "count": 8000,
        "amount": 4000000
      },
      "totalAddMoney": {
        "count": 10000,
        "amount": 5000000
      }
    }
  }
}
```

**Response Fields:**

| Field             | Type   | Description                                    |
| ----------------- | ------ | ---------------------------------------------- |
| total             | number | Total number of consumers                      |
| byStatus          | object | Consumer count by status (active/pending/etc.) |
| registrationTrend | array  | Daily consumer registration count              |
| verification      | object | Email and phone verification statistics        |
| transactions      | object | Consumer transaction totals by type            |

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Agent Analytics

Get agent performance and commission analytics.

**Endpoint:** `GET /api/admin/analytics/agents`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Agent analytics retrieved successfully",
  "data": {
    "totalAgents": 45,
    "activeAgents": 38,
    "pendingApprovals": 5,
    "totalCommissionsPaid": 45000.0,
    "commissionsThisMonth": 12500.0,
    "topAgents": [
      {
        "agentCode": "AG1234567",
        "businessName": "Quick Cash Point",
        "totalCommission": 5000.0,
        "transactionsCount": 250
      }
    ],
    "agentGrowth": [
      {
        "date": "2026-01-27",
        "newAgents": 2,
        "totalAgents": 45
      }
    ]
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Revenue Analytics

Get platform revenue breakdown and trends.

**Endpoint:** `GET /api/admin/analytics/revenue`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type   | Required | Default     | Description           |
| --------- | ------ | -------- | ----------- | --------------------- |
| startDate | string | No       | 30 days ago | Start date (ISO 8601) |
| endDate   | string | No       | Today       | End date (ISO 8601)   |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Revenue analytics retrieved successfully",
  "data": {
    "totalRevenue": 125000.0,
    "revenueToday": 2500.0,
    "revenueThisWeek": 15000.0,
    "revenueThisMonth": 58000.0,
    "bySource": {
      "SEND_MONEY_FEE": 45000.0,
      "CASH_OUT_FEE": 38000.0,
      "BANK_TRANSFER_FEE": 15000.0,
      "ADD_MONEY_DEPOSIT": 5000000.0
    },
    "revenueTimeline": [
      {
        "date": "2026-01-27",
        "revenue": 2500.0,
        "fees": 850.0,
        "commissions": 650.0
      }
    ],
    "expenses": {
      "totalCommissions": 45000.0,
      "totalBonuses": 200.0
    },
    "netRevenue": 79800.0
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

## Admin - Biller Management

Base URL: `/api/admin/billers`

All biller management endpoints require admin authentication.

### Create Biller

Create a new biller for bill payment services.

**Endpoint:** `POST /api/admin/billers`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "name": "Dhaka Electric Supply Company Limited (DESCO)",
  "billerCode": "DESCO-ELEC",
  "billType": "ELECTRICITY",
  "contactEmail": "info@desco.org.bd",
  "contactPhone": "01713074499",
  "description": "Electricity supply for Dhaka city area",
  "logoUrl": "https://example.com/desco-logo.png"
}
```

**Field Validations:**

| Field        | Type   | Required | Validation                                                     |
| ------------ | ------ | -------- | -------------------------------------------------------------- |
| name         | string | Yes      | 2-255 characters                                               |
| billerCode   | string | Yes      | 2-50 characters, uppercase, numbers, hyphens, underscores only |
| billType     | enum   | Yes      | ELECTRICITY, GAS, WATER, INTERNET, MOBILE, TV, ORGANIZATION    |
| contactEmail | string | No       | Valid email format                                             |
| contactPhone | string | No       | Bangladeshi phone format: 01[3-9]XXXXXXXX                      |
| description  | string | No       | Max 1000 characters                                            |
| logoUrl      | string | No       | Valid URL format                                               |

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Biller created successfully",
  "data": {
    "biller": {
      "id": "BILLER01",
      "name": "Dhaka Electric Supply Company Limited (DESCO)",
      "billerCode": "DESCO-ELEC",
      "billType": "ELECTRICITY",
      "status": "ACTIVE",
      "contactEmail": "info@desco.org.bd",
      "contactPhone": "01713074499",
      "description": "Electricity supply for Dhaka city area",
      "logoUrl": "https://example.com/desco-logo.png",
      "balance": 0,
      "totalPayments": 0,
      "createdAt": "2026-01-28T11:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **409 Conflict** - Biller code already exists
- **400 Bad Request** - Validation errors

---

### Get All Billers (Admin)

Get paginated list of all billers with filtering options.

**Endpoint:** `GET /api/admin/billers`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                                                                 |
| --------- | ------ | -------- | ------- | --------------------------------------------------------------------------- |
| page      | number | No       | 1       | Page number                                                                 |
| limit     | number | No       | 20      | Results per page                                                            |
| billType  | enum   | No       | -       | Filter by type: ELECTRICITY, GAS, WATER, INTERNET, MOBILE, TV, ORGANIZATION |
| status    | enum   | No       | -       | Filter by status: ACTIVE, SUSPENDED, INACTIVE                               |
| search    | string | No       | -       | Search billers by name or code                                              |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Billers retrieved successfully",
  "data": {
    "billers": [
      {
        "id": "BILLER01",
        "name": "Dhaka Electric Supply Company Limited (DESCO)",
        "billerCode": "DESCO-ELEC",
        "billType": "ELECTRICITY",
        "status": "ACTIVE",
        "balance": 125000,
        "totalPayments": 450,
        "contactEmail": "info@desco.org.bd",
        "contactPhone": "01713074499",
        "description": "Electricity supply for Dhaka city area",
        "logoUrl": null,
        "createdAt": "2026-01-28T11:30:00.000Z",
        "updatedAt": "2026-01-28T11:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Get Biller Details (Admin)

Get detailed information about a specific biller including payment statistics.

**Endpoint:** `GET /api/admin/billers/:id`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Biller ID   |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Biller details retrieved successfully",
  "data": {
    "biller": {
      "id": "BILLER01",
      "name": "Dhaka Electric Supply Company Limited (DESCO)",
      "billerCode": "DESCO-ELEC",
      "billType": "ELECTRICITY",
      "status": "ACTIVE",
      "balance": 125000,
      "totalPayments": 450,
      "contactEmail": "info@desco.org.bd",
      "contactPhone": "01713074499",
      "description": "Electricity supply for Dhaka city area",
      "logoUrl": null,
      "createdAt": "2026-01-28T11:30:00.000Z",
      "updatedAt": "2026-01-28T11:30:00.000Z"
    },
    "statistics": {
      "totalPayments": 450,
      "completedPayments": 448,
      "totalRevenue": 125000
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Biller not found

---

### Update Biller

Update biller information.

**Endpoint:** `PUT /api/admin/billers/:id`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Biller ID   |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "DESCO - Updated Name",
  "contactEmail": "newemail@desco.org.bd",
  "contactPhone": "01713074400",
  "description": "Updated description",
  "status": "ACTIVE"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Biller updated successfully",
  "data": {
    "biller": {
      "id": "BILLER01",
      "name": "DESCO - Updated Name",
      "billerCode": "DESCO-ELEC",
      "billType": "ELECTRICITY",
      "status": "ACTIVE",
      "contactEmail": "newemail@desco.org.bd",
      "contactPhone": "01713074400",
      "description": "Updated description",
      "logoUrl": null,
      "balance": 125000,
      "totalPayments": 450,
      "updatedAt": "2026-01-28T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Biller not found
- **409 Conflict** - Biller code already exists (if updating code)
- **400 Bad Request** - Validation errors

---

### Update Biller Status

Update only the status of a biller (quick action).

**Endpoint:** `PATCH /api/admin/billers/:id/status`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Biller ID   |

**Request Body:**

```json
{
  "status": "SUSPENDED"
}
```

**Status Values:**

- `ACTIVE` - Biller is accepting payments
- `SUSPENDED` - Temporarily disabled
- `INACTIVE` - Permanently disabled

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Biller status updated successfully",
  "data": {
    "biller": {
      "id": "BILLER01",
      "name": "Dhaka Electric Supply Company Limited (DESCO)",
      "billerCode": "DESCO-ELEC",
      "status": "SUSPENDED",
      "updatedAt": "2026-01-28T12:10:00.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Biller not found
- **400 Bad Request** - Invalid status value

---

### Delete Biller

Deactivate a biller (sets status to INACTIVE).

**Endpoint:** `DELETE /api/admin/billers/:id`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | string | Yes      | Biller ID   |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Biller deactivated successfully"
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Biller not found
- **400 Bad Request** - Cannot delete biller with existing payment records

**Notes:**

- Billers with existing payment records cannot be deleted
- Consider using SUSPENDED or INACTIVE status instead
- DELETE operation sets status to INACTIVE rather than removing from database

---

## Admin - System Configuration

Base URL: `/api/admin/config`

All system configuration endpoints require admin authentication. Public configurations can be accessed without authentication.

### Get All System Configurations

Get all system configuration key-value pairs.

**Endpoint:** `GET /api/admin/config`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "System configurations retrieved successfully",
  "data": {
    "configs": [
      {
        "key": "agent_commission_rate",
        "value": "1.5",
        "description": "Commission percentage for agent cash out operations",
        "updatedAt": "2026-01-27T10:30:00.000Z"
      },
      {
        "key": "send_money_fee_tier1",
        "value": "0",
        "description": "Send money fee for amounts ₹0-₹1000",
        "updatedAt": "2026-01-27T10:30:00.000Z"
      },
      {
        "key": "bank_transfer_fee_rate",
        "value": "1.5",
        "description": "Bank transfer fee percentage for consumers",
        "updatedAt": "2026-01-27T10:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Get Configuration by Key

Get a specific system configuration value.

**Endpoint:** `GET /api/admin/config/:key`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| key       | string | Yes      | Configuration key |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Configuration retrieved successfully",
  "data": {
    "config": {
      "key": "agent_commission_rate",
      "value": "1.5",
      "description": "Commission percentage for agent cash out operations",
      "updatedAt": "2026-01-27T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Configuration key not found

---

### Create or Update Configuration

Create a new configuration or update an existing one.

**Endpoint:** `POST /api/admin/config`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "key": "new_feature_enabled",
  "value": "true",
  "description": "Enable new feature for all users"
}
```

**Field Validations:**

| Field       | Type   | Required | Validation                                      |
| ----------- | ------ | -------- | ----------------------------------------------- |
| key         | string | Yes      | 1-100 characters, alphanumeric with underscores |
| value       | string | Yes      | 1-1000 characters                               |
| description | string | No       | Max 500 characters                              |

**Success Response (200 OK):** _(if updating)_

```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "data": {
    "config": {
      "key": "agent_commission_rate",
      "value": "2.0",
      "description": "Commission percentage for agent cash out operations"
    }
  }
}
```

**Success Response (201 Created):** _(if creating)_

```json
{
  "success": true,
  "message": "Configuration created successfully",
  "data": {
    "config": {
      "key": "new_feature_enabled",
      "value": "true",
      "description": "Enable new feature for all users"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **400 Bad Request** - Validation errors

---

### Update Configuration

Update an existing configuration value.

**Endpoint:** `PUT /api/admin/config/:key`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**URL Parameters:**

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| key       | string | Yes      | Configuration key |

**Request Body:**

```json
{
  "value": "2.5",
  "description": "Updated commission rate for Q1 2026"
}
```

**Field Validations:**

| Field       | Type   | Required | Validation         |
| ----------- | ------ | -------- | ------------------ |
| value       | string | Yes      | 1-1000 characters  |
| description | string | No       | Max 500 characters |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "data": {
    "config": {
      "key": "agent_commission_rate",
      "value": "2.5",
      "description": "Updated commission rate for Q1 2026"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token
- **404 Not Found** - Configuration key not found
- **400 Bad Request** - Validation errors

---

### Get Public Configurations

Get non-sensitive configurations accessible to all users without authentication.

**Endpoint:** `GET /api/config/public`  
**Authentication:** None (Public)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Public configurations retrieved successfully",
  "data": {
    "configs": [
      {
        "key": "app_version",
        "value": "1.0.0"
      },
      {
        "key": "maintenance_mode",
        "value": "false"
      }
    ]
  }
}
```

**Error Responses:**

- **500 Internal Server Error** - Server error

**Notes:**

- Only safe, non-sensitive configuration values are exposed
- No authentication required
- Useful for mobile apps to check app version or maintenance status

---

## Admin - Platform Wallet Management

Base URL: `/api/admin/platform-wallet`

All platform wallet endpoints require admin authentication. These endpoints provide monitoring and reconciliation capabilities for the platform's financial operations.

### Get Platform Wallet Statistics

Get comprehensive statistics about the platform wallet including balance, fees collected, commissions paid, and net revenue.

**Endpoint:** `GET /api/admin/platform-wallet/stats`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Platform wallet statistics retrieved successfully",
  "data": {
    "balance": 1026474.25,
    "totalFeesCollected": 45320.5,
    "totalCommissionsPaid": 12450.75,
    "totalBonusesGiven": 8250.0,
    "netRevenue": 24619.75,
    "lastTransactionAt": "2026-01-28T06:15:30.000Z"
  }
}
```

**Response Fields:**

| Field                | Type   | Description                                     |
| -------------------- | ------ | ----------------------------------------------- |
| balance              | number | Current platform wallet balance                 |
| totalFeesCollected   | number | Cumulative fees collected from all transactions |
| totalCommissionsPaid | number | Cumulative commissions paid to agents           |
| totalBonusesGiven    | number | Cumulative bonuses and cashback given to users  |
| netRevenue           | number | Net revenue (fees - commissions - bonuses)      |
| lastTransactionAt    | string | Timestamp of last platform wallet transaction   |

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Perform Platform Wallet Reconciliation

Verify the integrity of the platform wallet by comparing the current balance with calculated balance from all transactions.

**Endpoint:** `GET /api/admin/platform-wallet/reconcile`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):** _(when reconciliation passes)_

```json
{
  "success": true,
  "message": "Platform wallet reconciliation successful",
  "data": {
    "success": true,
    "currentBalance": 1026474.25,
    "calculatedBalance": 1026474.25,
    "discrepancy": 0.0,
    "reconciliationTimestamp": "2026-01-28T06:20:00.000Z"
  }
}
```

**Success Response (200 OK):** _(when discrepancy detected)_

```json
{
  "success": true,
  "message": "Reconciliation failed: discrepancy of ৳15.50",
  "data": {
    "success": false,
    "currentBalance": 1026474.25,
    "calculatedBalance": 1026489.75,
    "discrepancy": 15.5,
    "reconciliationTimestamp": "2026-01-28T06:20:00.000Z"
  }
}
```

**Reconciliation Logic:**

```
calculatedBalance = SUM(CREDIT transactions) - SUM(DEBIT transactions)
discrepancy = |currentBalance - calculatedBalance|
success = discrepancy < ৳0.01 (allows tiny rounding errors)
```

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

**Notes:**

- Run this endpoint regularly (daily recommended) to detect discrepancies early
- Discrepancies may indicate missing transactions, database issues, or bugs
- Small discrepancies (<৳0.01) are tolerated due to floating-point rounding

---

### Get Platform Wallet Transaction History

Get paginated transaction history for the platform wallet with optional date filtering.

**Endpoint:** `GET /api/admin/platform-wallet/transactions`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parameter | Type   | Required | Default | Description           |
| --------- | ------ | -------- | ------- | --------------------- |
| page      | number | No       | 1       | Page number           |
| limit     | number | No       | 50      | Results per page      |
| startDate | string | No       | -       | Start date (ISO 8601) |
| endDate   | string | No       | -       | End date (ISO 8601)   |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Platform wallet transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": 1523,
        "transactionType": "FEE_COLLECTED",
        "entryType": "CREDIT",
        "amount": 18.5,
        "balanceBefore": 1026455.75,
        "balanceAfter": 1026474.25,
        "relatedTransactionId": "TRX12345",
        "relatedUserId": "USER0001",
        "relatedAgentId": null,
        "description": "Cash out fee collected from user",
        "metadata": {
          "transactionType": "CASH_OUT",
          "feeRate": 1.85
        },
        "createdAt": "2026-01-28T06:15:30.000Z"
      },
      {
        "id": 1522,
        "transactionType": "COMMISSION_PAID",
        "entryType": "DEBIT",
        "amount": 15.0,
        "balanceBefore": 1026470.75,
        "balanceAfter": 1026455.75,
        "relatedTransactionId": "TRX12345",
        "relatedUserId": "USER0001",
        "relatedAgentId": "AGENT001",
        "description": "Commission paid to agent AG1234567 for cash out",
        "metadata": {
          "agentCode": "AG1234567",
          "commissionRate": 1.5
        },
        "createdAt": "2026-01-28T06:15:30.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 31,
      "totalItems": 1523,
      "itemsPerPage": 50
    }
  }
}
```

**Transaction Types:**

| Type              | Entry Type | Description                        |
| ----------------- | ---------- | ---------------------------------- |
| FEE_COLLECTED     | CREDIT     | Transaction fees from users        |
| COMMISSION_PAID   | DEBIT      | Commissions paid to agents         |
| BONUS_GIVEN       | DEBIT      | Welcome bonuses given to new users |
| CASHBACK_GIVEN    | DEBIT      | Promotional cashback               |
| ADD_MONEY_DEPOSIT | CREDIT     | Deposits from external banks       |
| REVENUE_OTHER     | CREDIT     | Other platform revenue             |
| EXPENSE_OTHER     | DEBIT      | Other platform expenses            |
| SETTLEMENT        | BOTH       | Settlement operations              |
| ADJUSTMENT        | BOTH       | Manual adjustments                 |

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

---

### Get Platform Wallet Revenue Summary

Get comprehensive revenue summary including all-time statistics.

**Endpoint:** `GET /api/admin/platform-wallet/revenue-summary`  
**Authentication:** Required (Admin Token)

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Platform wallet revenue summary retrieved successfully",
  "data": {
    "allTime": {
      "totalFeesCollected": 45320.5,
      "totalCommissionsPaid": 12450.75,
      "totalBonusesGiven": 8250.0,
      "netRevenue": 24619.75
    },
    "currentBalance": 1026474.25,
    "lastTransactionAt": "2026-01-28T06:15:30.000Z"
  }
}
```

**Response Fields:**

| Field                        | Type   | Description                                |
| ---------------------------- | ------ | ------------------------------------------ |
| allTime.totalFeesCollected   | number | Total fees collected since platform launch |
| allTime.totalCommissionsPaid | number | Total commissions paid to agents           |
| allTime.totalBonusesGiven    | number | Total bonuses and cashback given           |
| allTime.netRevenue           | number | Net profit (fees - commissions - bonuses)  |
| currentBalance               | number | Current platform wallet balance            |
| lastTransactionAt            | string | Timestamp of most recent transaction       |

**Error Responses:**

- **401 Unauthorized** - Invalid or missing admin token

**Notes:**

- Net revenue = Total fees collected - Total commissions paid - Total bonuses given
- Use this endpoint for financial reporting and analytics dashboards
- All amounts are in BDT (৳)

---

## Common Patterns

### Response Structure

All API responses follow this consistent format:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "errors": [ ... ]
}
```

### HTTP Status Codes

| Code | Meaning               | Usage                                           |
| ---- | --------------------- | ----------------------------------------------- |
| 200  | OK                    | Successful GET, PUT, DELETE requests            |
| 201  | Created               | Successful POST requests that create resources  |
| 400  | Bad Request           | Validation errors or invalid input              |
| 401  | Unauthorized          | Invalid or missing authentication               |
| 403  | Forbidden             | Authenticated but not authorized                |
| 404  | Not Found             | Resource does not exist                         |
| 409  | Conflict              | Resource already exists (e.g., duplicate email) |
| 500  | Internal Server Error | Server-side error                               |

### User Status Values

| Status    | Description                                     |
| --------- | ----------------------------------------------- |
| PENDING   | User registered, awaiting approval (AGENT only) |
| ACTIVE    | User can access all features                    |
| SUSPENDED | User temporarily blocked                        |
| REJECTED  | User registration rejected (AGENT only)         |

### User Roles

| Role | Description |

### Consumer Types (JWT Payload)

| UserType | Description                                    |
| -------- | ---------------------------------------------- |
| User     | Regular CONSUMER user                          |
| Agent    | Approved agent user                            |
| Admin    | System administrator                           |
| CONSUMER | Regular user, auto-activated, gets ৳50 bonus   |
| AGENT    | Business user, requires admin approval         |
| ADMIN    | System administrator (separate authentication) |

---

## Error Responses

### Validation Errors

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must contain at least 8 characters"
    }
  ]
}
```

### Authentication Errors

```json
{
  "success": false,
  "message": "User authentication required"
}
```

### Authorization Errors

```json
{
  "success": false,
  "message": "Access denied. Agent credentials required."
}
```

### Resource Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

### Conflict Errors

```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

## Testing

### Test Credentials

You can use these test accounts for development:

**CONSUMER User:**

- Email: `user@test.com`
- Phone: `01712345678`
- Password: `TestUser123!`

**AGENT (After Admin Approval):**

- Email: `agent@test.com`
- Phone: `01812345678`
- Password: `TestAgent123!`
  5000/api/auth/consumer/register \
   -H "Content-Type: application/json" \
   -d '{
  "email": "test@example.com",
  "phone": "01712345678",
  "password": "SecurePass123!",
  "firstName": "Test",
  "lastName": "Consumer",
  "role": "CONSUMER"
  }'

````

**Login and Get Token:**

```bash
curl -X POST http://localhost:5000/api/auth/consumer/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "SecurePass123!"
  }'
````

**Use Token in Protected Endpoint:**

```bash
curl -X GET http://localhost:5000/api/auth/consumer/profile \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Agent Login:**

```bash
curl -X POST http://localhost:5000/api/auth/agent/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "agent@test.com",
    "password": "TestAgent123!"
  }'
```

**Admin Login:**

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uiucash.com",
    "password": "Admin123!"
  }'
```

---

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in future versions.

## Support

For API issues or questions, contact the development team or open an issue in the project repository.
