# Authentication System Test Guide

## Overview

The authentication system has been enhanced with:

1. **public_key field** - UUID v4 stored in database for each user/admin
2. **Unified authenticate() middleware** - Single function that validates JWT + database
3. **Logout functionality** - Regenerates public_key to invalidate all tokens
4. **Database validation** - Every request checks that JWT public_key matches database

## Test Scenarios

### 1. Consumer Registration & Login

```bash
# Register a new consumer
curl -X POST http://localhost:3001/api/auth/consumer/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "01712345678",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User",
    "role": "CONSUMER"
  }'

# Expected: 201 Created with welcome bonus message
# Note: public_key should be automatically generated

# Login
curl -X POST http://localhost:3001/api/auth/consumer/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "Test@123456"
  }'

# Expected: 200 OK with JWT token
# Save the token for next requests
```

### 2. Access Protected Route

```bash
# Get consumer profile (requires authentication)
curl -X GET http://localhost:3001/api/auth/consumer/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK with user profile
```

### 3. Logout (Token Invalidation)

```bash
# Logout - this regenerates public_key
curl -X POST http://localhost:3001/api/auth/consumer/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK with "All sessions have been terminated" message
```

### 4. Try Using Old Token After Logout

```bash
# Try to access profile with old token
curl -X GET http://localhost:3001/api/auth/consumer/profile \
  -H "Authorization: Bearer YOUR_OLD_TOKEN"

# Expected: 401 Unauthorized with "Invalid session" message
# This proves that logout invalidated the token by changing public_key
```

### 5. Agent Registration & Login

```bash
# Register an agent (will be PENDING status)
curl -X POST http://localhost:3001/api/auth/agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@example.com",
    "phone": "01787654321",
    "password": "Agent@123456",
    "firstName": "Agent",
    "lastName": "Smith",
    "businessName": "Agent Business",
    "businessAddress": "Dhaka, Bangladesh"
  }'

# Expected: 201 Created with "pending approval" message

# Note: Agent cannot login until approved by admin
```

### 6. Admin Login

```bash
# Login as admin (default credentials from init-db)
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uiucash.com",
    "password": "Admin@123"
  }'

# Expected: 200 OK with JWT token
```

### 7. Admin Logout

```bash
# Logout admin
curl -X POST http://localhost:3001/api/admin/logout \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 OK with logout message
```

## What Changed

### Models

- **Users.model.ts**: Added `public_key: string` field (CHAR(36))
- **Admins.model.ts**: Added `public_key: string` field (CHAR(36))
- Both models updated `ICreateUser` and `IUpdateUser` to include public_key

### Controllers

- **consumer.auth.controller.ts**:
  - Generates UUID v4 as public_key during registration
  - Uses user.public_key in token generation
  - Added `consumerLogout()` endpoint
- **agent.auth.controller.ts**:
  - Generates UUID v4 as public_key during registration
  - Uses user.public_key in token generation
  - Added `agentLogout()` endpoint
- **admin.auth.controller.ts**:
  - Generates UUID v4 as public_key during admin creation
  - Uses admin.public_key in token generation
  - Added `adminLogout()` endpoint

### Middleware

- **auth.ts**: Complete rewrite with unified `authenticate()` function
  - Takes array of allowed user types: `authenticate("Consumer", "Agent")`
  - Validates JWT signature
  - Checks database for matching id and public_key
  - Verifies user status is ACTIVE
  - Convenience exports: `authenticateConsumer`, `authenticateAgent`, `authenticateAdmin`, `authenticateUser`, `authenticateAny`

### Routers

All routers updated to use new middleware:

- consumer.auth.router.ts
- agent.auth.router.ts
- admin.auth.router.ts
- transaction.router.ts
- cashout.router.ts
- analytics.router.ts
- system.config.router.ts
- consumer.management.router.ts
- agent.management.router.ts

### Scripts

- **init-db.ts**: Generates public_key when creating default admin

## Security Benefits

1. **Token Invalidation**: Logout now actually invalidates tokens by changing public_key
2. **Database Validation**: Every request verifies JWT payload matches database record
3. **Session Management**: Can revoke access by updating public_key in database
4. **Unified Logic**: Single authentication function ensures consistent security checks

## Migration Notes

If you have existing data in the database, you need to:

1. Add public_key column to users and admins tables
2. Generate UUID v4 for existing records:

```sql
-- For users
UPDATE users SET public_key = UUID() WHERE public_key IS NULL;

-- For admins
UPDATE admins SET public_key = UUID() WHERE public_key IS NULL;
```

## Testing Checklist

- [ ] Consumer registration generates public_key
- [ ] Consumer login generates token with public_key
- [ ] Consumer can access protected routes
- [ ] Consumer logout invalidates token
- [ ] Old token cannot be used after logout
- [ ] Agent registration generates public_key
- [ ] Admin login uses public_key
- [ ] Admin logout invalidates token
- [ ] Wrong public_key in JWT is rejected
- [ ] Database validation prevents token replay attacks
