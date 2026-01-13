import { z } from "zod";

/**
 * Password validation schema
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

/**
 * Admin Login Schema
 */
export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

/**
 * Create Admin Schema
 */
export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(255, "Name cannot exceed 255 characters"),
  }),
});

/**
 * Change Admin Password Schema
 */
export const changeAdminPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  }),
});
