# Agent Authentication API Endpoints

## Base URL
```
/api/agents/auth
```

---

## 1. Agent Registration

**Endpoint**: `POST /api/agents/auth/register`

**Description**: Register a new agent account. Agent accounts require admin approval before they can log in and perform operations.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "email": "agent@example.com",
  "phone": "01712345678",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "John's Mobile Shop",
  "businessAddress": "123 Main Street, Dhaka, Bangladesh",
  "dateOfBirth": "1990-01-15",
  "nidNumber": "1234567890"
}
```

**Validation Rules**:
- `email`: Valid email format
- `phone`: Must match Bangladeshi phone pattern `01[3-9]XXXXXXXX`
- `password`: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- `firstName`: 2-100 characters
- `lastName`: 2-100 characters
- `businessName`: 3-255 characters
- `businessAddress`: Minimum 10 characters
- `dateOfBirth`: Optional, ISO date string
- `nidNumber`: Optional, 10-20 characters

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Agent registration successful. Your account is pending admin approval. You will be notified once approved.",
  "data": {
    "user": {
      "id": "A1B2C3D4",
      "email": "agent@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "AGENT",
      "status": "PENDING"
    },
    "agent": {
      "id": "E5F6G7H8",
      "agentCode": "AG1234567",
      "businessName": "John's Mobile Shop",
      "businessAddress": "123 Main Street, Dhaka, Bangladesh",
      "status": "PENDING"
    }
  }
}
```

**Error Responses**:

- **409 Conflict** - Email already exists:
```json
{
  "success": false,
  "message": "Email already registered"
}
```

- **409 Conflict** - Phone already exists:
```json
{
  "success": false,
  "message": "Phone number already registered"
}
```

- **400 Bad Request** - Validation error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

---

## 2. Agent Login

**Endpoint**: `POST /api/agents/auth/login`

**Description**: Login with agent credentials. Only approved agents can log in.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "identifier": "agent@example.com",
  "password": "SecurePass123!"
}
```

**Parameters**:
- `identifier`: Email or phone number
- `password`: Agent password

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "A1B2C3D4",
      "email": "agent@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "AGENT",
      "status": "ACTIVE",
      "emailVerified": false,
      "phoneVerified": false,
      "walletBalance": 5000.00
    },
    "agent": {
      "id": "E5F6G7H8",
      "agentCode": "AG1234567",
      "businessName": "John's Mobile Shop",
      "businessAddress": "123 Main Street, Dhaka, Bangladesh",
      "status": "ACTIVE",
      "totalCashouts": 25,
      "totalCommissionEarned": 375.50
    }
  }
}
```

**Error Responses**:

- **401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

- **403 Forbidden** - Not an agent account:
```json
{
  "success": false,
  "message": "Access denied. Agent credentials required."
}
```

- **403 Forbidden** - Account pending approval:
```json
{
  "success": false,
  "message": "Your agent account is pending approval. Please wait for admin approval."
}
```

- **403 Forbidden** - Account suspended:
```json
{
  "success": false,
  "message": "Account is suspended. Please contact support."
}
```

- **403 Forbidden** - Account rejected:
```json
{
  "success": false,
  "message": "Your agent registration was rejected. Please contact support for more information."
}
```

---

## 3. Get Agent Profile

**Endpoint**: `GET /api/agents/auth/profile`

**Description**: Get current authenticated agent's profile information.

**Authentication**: Required (Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "A1B2C3D4",
      "email": "agent@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "AGENT",
      "status": "ACTIVE",
      "dateOfBirth": "1990-01-15",
      "nidNumber": "1234567890",
      "emailVerified": false,
      "phoneVerified": false,
      "createdAt": "2026-01-10T10:30:00.000Z"
    },
    "agent": {
      "id": "E5F6G7H8",
      "agentCode": "AG1234567",
      "businessName": "John's Mobile Shop",
      "businessAddress": "123 Main Street, Dhaka, Bangladesh",
      "status": "ACTIVE",
      "totalCashouts": 25,
      "totalCommissionEarned": 375.50,
      "approvedBy": "ADMIN001",
      "approvedAt": "2026-01-11T14:20:00.000Z",
      "createdAt": "2026-01-10T10:30:00.000Z"
    },
    "wallet": {
      "balance": 5000.00,
      "availableBalance": 5000.00,
      "pendingBalance": 0.00,
      "currency": "BDT",
      "dailyLimit": 100000.00,
      "monthlyLimit": 500000.00,
      "dailySpent": 1500.00,
      "monthlySpent": 12500.00
    }
  }
}
```

**Error Responses**:

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "message": "Authentication required"
}
```

- **403 Forbidden** - Not an agent account:
```json
{
  "success": false,
  "message": "Access denied. Agent account required."
}
```

---

## 4. Update Agent Profile

**Endpoint**: `PUT /api/agents/auth/profile`

**Description**: Update agent profile information (both user and business details).

**Authentication**: Required (Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body** (all fields optional):
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "businessName": "John's Updated Mobile Shop",
  "businessAddress": "456 New Street, Dhaka, Bangladesh",
  "dateOfBirth": "1990-01-15"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "A1B2C3D4",
      "email": "agent@example.com",
      "phone": "01712345678",
      "firstName": "John",
      "lastName": "Smith",
      "dateOfBirth": "1990-01-15"
    },
    "agent": {
      "id": "E5F6G7H8",
      "agentCode": "AG1234567",
      "businessName": "John's Updated Mobile Shop",
      "businessAddress": "456 New Street, Dhaka, Bangladesh"
    }
  }
}
```

**Error Responses**:

- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Not an agent account
- **400 Bad Request** - Validation error

---

## 5. Change Agent Password

**Endpoint**: `PUT /api/agents/auth/change-password`

**Description**: Change agent account password.

**Authentication**: Required (Bearer Token)

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePass456!"
}
```

**Validation Rules**:
- `newPassword`: Same requirements as registration password

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:

- **400 Bad Request** - Current password incorrect:
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Not an agent account

---

## Agent Account Lifecycle

1. **Registration** (`PENDING` status)
   - Agent registers with business details
   - Account awaits admin approval
   - Cannot log in yet

2. **Admin Approval** (`ACTIVE` status)
   - Admin reviews and approves agent
   - Agent can now log in and perform operations

3. **Admin Rejection** (`REJECTED` status)
   - Admin rejects agent application
   - Cannot log in
   - Rejection reason provided

4. **Suspension** (`SUSPENDED` status)
   - Admin suspends agent for violations
   - Cannot log in
   - May be reactivated by admin

---

## Notes

- All agent accounts start with `PENDING` status and require admin approval
- Agent codes are automatically generated in format: `AG` + 7 digits
- Agents have higher transaction limits than personal users
- Use the token in `Authorization: Bearer <token>` header for protected routes
- Token expires after 3 hours
- Password must meet complexity requirements
