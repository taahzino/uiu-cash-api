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
2. [Common Patterns](#common-patterns)
3. [Error Responses](#error-responses)

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
