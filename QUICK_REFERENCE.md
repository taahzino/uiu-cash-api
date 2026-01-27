# Quick Reference: New Authentication System

## Middleware Usage in Routes

```typescript
import {
  authenticate, // Main function - takes allowed user types
  authenticateConsumer, // Only Consumer access
  authenticateAgent, // Only Agent access
  authenticateAdmin, // Only Admin access
  authenticateUser, // Consumer OR Agent access
  authenticateAny, // Any authenticated user
} from "../middleware/auth";

// Examples:

// Consumer only endpoint
router.get("/profile", authenticateConsumer, getProfile);

// Agent only endpoint
router.post("/complete-cashout", authenticateAgent, completeCashout);

// Admin only endpoint
router.get("/analytics", authenticateAdmin, getDashboard);

// Consumer OR Agent
router.post("/send-money", authenticateUser, sendMoney);

// Custom combinations
router.get("/some-route", authenticate("Consumer", "Admin"), handler);

// Any authenticated user
router.get("/public-info", authenticateAny, getPublicInfo);
```

## Controller Patterns

### Registration (Consumer/Agent)

```typescript
import { v4 as uuidv4 } from "uuid";

export const register = async (req: Request, res: Response) => {
  const password_hash = await hashPassword(password);
  const public_key = uuidv4(); // Generate public key

  const user = await Users.createUser({
    email,
    phone,
    password_hash,
    public_key, // Include in creation
    // ... other fields
  });
};
```

### Login (All User Types)

```typescript
export const login = async (req: Request, res: Response) => {
  const user = await Users.findByEmail(email);
  // ... password verification

  // Use public_key from database in token
  const token = generateToken(user.id, user.public_key, "Consumer");

  return sendResponse(res, STATUS_OK, { token });
};
```

### Logout (All User Types)

```typescript
import { v4 as uuidv4 } from "uuid";

export const logout = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // Generate new public key to invalidate all tokens
  const new_public_key = uuidv4();

  await Users.updateUser(userId, { public_key: new_public_key });

  return sendResponse(res, STATUS_OK, {
    message: "All sessions terminated",
  });
};
```

## JWT Payload Structure

```typescript
interface JWTPayload {
  id: string; // User/Admin ID
  public_key: string; // UUID v4 from database
  userType: "Consumer" | "Agent" | "Admin";
}
```

## Authentication Flow

```
Client Request
    ↓
Extract JWT from Authorization header
    ↓
Verify JWT signature (RS256)
    ↓
Decode payload → {id, public_key, userType}
    ↓
Check if userType is allowed
    ↓
Query database for user/admin by id
    ↓
Compare public_key from JWT with database
    ↓
Verify status is ACTIVE
    ↓
Attach user data to req.user
    ↓
next() → Proceed to route handler
```

## Logout Flow

```
Client sends logout request
    ↓
Validate JWT
    ↓
Get user id from JWT
    ↓
Generate new UUID v4
    ↓
Update public_key in database
    ↓
Return success
    ↓
All old tokens now invalid
(public_key mismatch)
```

## Database Schema

```sql
-- users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  public_key CHAR(36) NOT NULL,  -- UUID v4
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CONSUMER', 'AGENT') NOT NULL,
  status ENUM('ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED') DEFAULT 'ACTIVE',
  -- ... other fields
);

-- admins table
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  public_key CHAR(36) NOT NULL,  -- UUID v4
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  -- ... other fields
);
```

## API Endpoints

### Authentication

- `POST /api/auth/consumer/register` - Register consumer
- `POST /api/auth/consumer/login` - Login consumer
- `POST /api/auth/consumer/logout` - Logout consumer (requires auth)

- `POST /api/auth/agent/register` - Register agent
- `POST /api/auth/agent/login` - Login agent
- `POST /api/auth/agent/logout` - Logout agent (requires auth)

- `POST /api/admin/login` - Login admin
- `POST /api/admin/logout` - Logout admin (requires auth)

### Protected Routes Examples

- `GET /api/auth/consumer/profile` - Consumer only
- `GET /api/auth/agent/profile` - Agent only
- `GET /api/admin/profile` - Admin only
- `POST /api/transactions/send-money` - Consumer OR Agent
- `GET /api/admin/analytics` - Admin only

## Common Patterns

### In Controllers

```typescript
// Access authenticated user data
const userId = req.user?.id;
const userType = req.user?.userType;

if (!userId) {
  return sendResponse(res, STATUS_UNAUTHORIZED, {
    message: "Authentication required",
  });
}
```

### In Routers

```typescript
// Apply to single route
router.get("/profile", authenticateConsumer, getProfile);

// Apply to all routes
router.use(authenticateAdmin);
router.get("/users", getAllUsers);
router.get("/agents", getAllAgents);
```

## Error Messages

- "No token provided" → Missing Authorization header
- "Invalid or expired token" → JWT verification failed
- "Access denied" → Wrong userType for endpoint
- "Invalid session" → public_key mismatch or inactive user

## Testing with curl

```bash
# Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/consumer/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"Test@123"}' \
  | jq -r '.data.token')

# Use token
curl -X GET http://localhost:3001/api/auth/consumer/profile \
  -H "Authorization: Bearer $TOKEN"

# Logout
curl -X POST http://localhost:3001/api/auth/consumer/logout \
  -H "Authorization: Bearer $TOKEN"
```

## Security Checklist

✅ JWT signature verified (RS256)
✅ Token payload validated against database
✅ public_key checked on every request
✅ User status checked (ACTIVE only)
✅ Role verified for agents/consumers
✅ Logout invalidates all tokens
✅ No password in JWT payload
✅ 7-day token expiration
✅ Unified authentication logic

## Migration from Old System

Before:

```typescript
import { adminAuth, userAuth, agentAuth } from "../middleware/auth";

router.get("/profile", userAuth, getProfile);
router.get("/dashboard", adminAuth, getDashboard);
router.post("/cashout", agentAuth, completeCashout);
```

After:

```typescript
import {
  authenticateAdmin,
  authenticateUser,
  authenticateAgent,
} from "../middleware/auth";

router.get("/profile", authenticateUser, getProfile);
router.get("/dashboard", authenticateAdmin, getDashboard);
router.post("/cashout", authenticateAgent, completeCashout);
```
