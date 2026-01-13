# API Request Validation with Zod

## Overview

UIU Cash uses **Zod** for type-safe request validation across all API endpoints. Zod provides runtime validation with TypeScript type inference, ensuring data integrity and security.

## Why Zod?

- **Type Safety**: Automatic TypeScript type inference from schemas
- **Runtime Validation**: Validates data at runtime, not just compile-time
- **Better Error Messages**: Clear, customizable error messages
- **Composable**: Easy to create complex validation schemas
- **No Dependencies**: Lightweight with zero dependencies
- **Schema-First**: Define schema once, use for validation and types

## Architecture

### Validation Middleware

Location: `src/middleware/app/validateRequest.ts`

```typescript
import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          message: "Validation failed",
          errors,
        });
        return;
      }

      res.status(500).json({
        message: "Internal server error during validation",
      });
    }
  };
};
```

### Validation Schema Structure

All validation schemas follow this pattern:

```typescript
import { z } from "zod";

export const exampleSchema = z.object({
  body: z.object({
    // Body validation rules
  }),
  query: z.object({
    // Query parameter validation rules
  }),
  params: z.object({
    // URL parameter validation rules
  }),
});
```

## Validation Files

### 1. User Authentication (`user.auth.validator.ts`)

Validates user registration, login, profile updates, and password changes.

**Schemas:**
- `registerSchema` - User registration validation
- `loginSchema` - User login validation
- `updateProfileSchema` - Profile update validation
- `changePasswordSchema` - Password change validation
- `verifyEmailSchema` - Email verification
- `verifyPhoneSchema` - Phone verification

**Password Rules:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Phone Format:**
- Bangladeshi format: `01[3-9]XXXXXXXX`

### 2. Admin Authentication (`admin.auth.validator.ts`)

Validates admin login and account creation.

**Schemas:**
- `adminLoginSchema` - Admin login validation
- `createAdminSchema` - Admin account creation
- `changeAdminPasswordSchema` - Admin password change

### 3. User Management (`user.management.validator.ts`)

Validates admin operations on user accounts.

**Schemas:**
- `getUsersSchema` - Pagination and filtering for user list
- `searchUsersSchema` - User search validation
- `getUserByIdSchema` - User ID validation (8 characters)
- `updateUserStatusSchema` - Status update validation
- `getUserTransactionsSchema` - Transaction pagination
- `resetLoginAttemptsSchema` - Login attempt reset

### 4. System Configuration (`system.config.validator.ts`)

Validates system configuration operations.

**Schemas:**
- `getConfigByKeySchema` - Config key validation
- `updateConfigSchema` - Config update validation
- `createConfigSchema` - Config creation validation
- `deleteConfigSchema` - Config deletion validation

**Config Key Rules:**
- Lowercase letters and underscores only
- Pattern: `/^[a-z_]+$/`

## Usage Examples

### Example 1: User Registration

```typescript
// Route definition
router.post("/register", validateRequest(registerSchema), userRegister);

// Valid request
{
  "email": "user@example.com",
  "phone": "01712345678",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PERSONAL"
}

// Validation error response
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address"
    },
    {
      "field": "body.password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

### Example 2: Pagination Query

```typescript
// Route definition
router.get("/", validateRequest(getUsersSchema), getAllUsers);

// Valid request
GET /api/admin/users?page=1&limit=20&status=ACTIVE&role=PERSONAL

// Query validation schema
query: z.object({
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"]).optional(),
  role: z.enum(["PERSONAL", "AGENT"]).optional(),
})
```

### Example 3: URL Parameters

```typescript
// Route definition
router.get("/:id", validateRequest(getUserByIdSchema), getUserDetails);

// Valid request
GET /api/admin/users/ABC12345

// Params validation schema
params: z.object({
  id: z.string().length(8, "User ID must be 8 characters")
})

// Validation error
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "params.id",
      "message": "User ID must be 8 characters"
    }
  ]
}
```

## Validation Rules Reference

### Common Patterns

**Email Validation:**
```typescript
z.string().email("Invalid email address")
```

**Phone Validation (Bangladesh):**
```typescript
z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number format")
```

**8-Character ID:**
```typescript
z.string().length(8, "ID must be 8 characters")
```

**Numeric String:**
```typescript
z.string().regex(/^\d+$/, "Must be a number")
```

**String Length:**
```typescript
z.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters")
```

**Enum Values:**
```typescript
z.enum(["VALUE1", "VALUE2"], { message: "Must be VALUE1 or VALUE2" })
```

**Optional Field:**
```typescript
z.string().optional()
```

**Default Value:**
```typescript
z.string().optional().default("default_value")
```

## Error Handling

### Error Response Format

```typescript
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.fieldName",
      "message": "Error description"
    }
  ]
}
```

### Field Path Structure

- `body.fieldName` - Body parameter
- `query.paramName` - Query parameter
- `params.paramName` - URL parameter
- `body.nested.field` - Nested object field

## Best Practices

1. **Always validate all inputs** - Body, query, and params
2. **Use specific error messages** - Help users understand what went wrong
3. **Validate early** - Apply validation before controller logic
4. **Reuse schemas** - Create reusable validation patterns
5. **Type safety** - Use TypeScript inference from Zod schemas
6. **Document validation rules** - Keep this document updated

## Migration from Express-Validator

UIU Cash previously used express-validator but migrated to Zod for:

1. **Type Safety**: Automatic TypeScript types
2. **Better DX**: Single source of truth for validation and types
3. **Composability**: Easier to build complex schemas
4. **Performance**: Faster validation with zero dependencies
5. **Consistency**: Same validation library on frontend (React Hook Form + Zod)

### Before (Express-Validator)

```typescript
import { body, validationResult } from "express-validator";

const validateRegister = [
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
];

router.post("/register", validateRegister, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Handle request
});
```

### After (Zod)

```typescript
import { z } from "zod";
import { validateRequest } from "../middleware/app/validateRequest";

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

router.post("/register", validateRequest(registerSchema), registerController);
```

## Testing Validation

### Example Test (Using Supertest)

```typescript
import request from "supertest";
import app from "../app";

describe("POST /api/auth/register", () => {
  it("should return validation error for invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "invalid-email",
        password: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
        role: "PERSONAL",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toContainEqual({
      field: "body.email",
      message: "Invalid email address",
    });
  });
});
```

## Future Enhancements

- [ ] Custom error messages for different locales
- [ ] Validation schemas for transaction endpoints
- [ ] Validation schemas for agent endpoints
- [ ] Validation schemas for offer endpoints
- [ ] Integration with OpenAPI/Swagger documentation
- [ ] Validation performance monitoring

---

**Last Updated**: January 14, 2026  
**Status**: ✅ Complete and Production Ready
