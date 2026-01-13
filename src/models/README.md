# Database Models

This directory contains OOP-based database models following the schema defined in `SCHEMA.md`.

## Architecture

- **BaseModel**: Abstract base class providing common database operations
- **UsersModel**: User account management model

## Usage Example

### Initialize Models

```typescript
import { Users } from "./models/Users.model";

// Initialize the Users table (creates table if not exists)
await Users.initialize();
```

### Create a User

```typescript
import { Users, UserRole, UserStatus } from "./models/Users.model";

const newUser = await Users.createUser({
  email: "user@example.com",
  phone: "+8801700000000",
  password_hash: "$2b$10$...", // bcrypt hashed password
  role: UserRole.PERSONAL,
  first_name: "John",
  last_name: "Doe",
  date_of_birth: "1990-01-01",
  nid_number: "1234567890",
});

console.log(newUser.id); // Generated UUID
```

### Find Users

```typescript
// Find by ID
const user = await Users.findById("user-uuid");

// Find by email
const user = await Users.findByEmail("user@example.com");

// Find by phone
const user = await Users.findByPhone("+8801700000000");

// Find by email or phone
const user = await Users.findByEmailOrPhone("user@example.com");

// Find all active users
const activeUsers = await Users.getUsersByRole(UserRole.PERSONAL, 10, 0);
```

### Update User

```typescript
// Update user information
await Users.updateUser(userId, {
  first_name: "Jane",
  last_name: "Smith",
});

// Verify email

// Update login info
await Users.updateLoginInfo(userId, "192.168.1.1");
```

### Account Management

```typescript
// Check if account is locked
const isLocked = await Users.isAccountLocked(userId);

// Increment failed login attempts (locks after 5 attempts)
await Users.incrementFailedLoginAttempts(userId);

// Reset failed login attempts
await Users.resetFailedLoginAttempts(userId);

// Activate/Suspend/Reject user
await Users.activateUser(userId);
await Users.suspendUser(userId);
await Users.rejectUser(userId);
```

### Search and Filter

```typescript
// Full-text search
const results = await Users.searchUsers("John Doe", 20, 0);

// Get users by role
const agents = await Users.getUsersByRole(UserRole.AGENT);

// Get users by status
const pendingUsers = await Users.getUsersByStatus(UserStatus.PENDING);

// Check if email/phone exists
const emailExists = await Users.emailExists("user@example.com");
const phoneExists = await Users.phoneExists("+8801700000000", excludeUserId);
```

### Transactions

```typescript
// Execute operations in a transaction
await Users.transaction(async (connection) => {
  const user = await Users.createUser({...});
  // Other operations using the same connection
  // All operations will be rolled back if any fails
});
```

## Environment Variables

Make sure to set these environment variables in your `.env.development` or `.env.production`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=uiu_cash
```

## Model Methods

### BaseModel Methods (Available in all models)

- `initialize()` - Create table if not exists
- `findById(id)` - Find record by ID
- `findAll(conditions?, limit?, offset?)` - Find all records
- `findOne(conditions)` - Find one record
- `create(data)` - Create new record
- `updateById(id, data)` - Update record by ID
- `count(conditions?)` - Count records
- `transaction(callback)` - Execute operations in transaction

### UsersModel Specific Methods

- `createUser(userData)` - Create new user with validation
- `findByEmail(email)` - Find user by email
- `findByPhone(phone)` - Find user by phone
- `findByEmailOrPhone(identifier)` - Find by email or phone
- `updateUser(id, userData)` - Update user
- `updateLoginInfo(id)` - Update login information
- `incrementFailedLoginAttempts(id)` - Increment failed attempts
- `resetFailedLoginAttempts(id)` - Reset failed attempts
- `isAccountLocked(id)` - Check if account is locked
- `updateStatus(id, status)` - Update user status
- `activateUser(id)` - Activate user
- `suspendUser(id)` - Suspend user
- `rejectUser(id)` - Reject user
- `searchUsers(searchTerm, limit, offset)` - Full-text search
- `getUsersByRole(role, limit?, offset?)` - Get users by role
- `getUsersByStatus(status, limit?, offset?)` - Get users by status
- `emailExists(email, excludeId?)` - Check if email exists
- `phoneExists(phone, excludeId?)` - Check if phone exists
- `getActiveUsersCount()` - Get count of active users
- `getPendingUsersCount()` - Get count of pending users
