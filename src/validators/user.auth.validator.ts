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
 * User Registration Schema
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number format"),
    password: passwordSchema,
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(100, "First name cannot exceed 100 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(100, "Last name cannot exceed 100 characters"),
    role: z.enum(["PERSONAL", "AGENT"], {
      message: "Role must be either PERSONAL or AGENT",
    }),
    dateOfBirth: z.string().optional(),
    nidNumber: z.string().optional(),
  }),
});

/**
 * User Login Schema
 */
export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

/**
 * Update Profile Schema
 */
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(100, "First name cannot exceed 100 characters")
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(100, "Last name cannot exceed 100 characters")
      .optional(),
    dateOfBirth: z.string().optional(),
  }),
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  }),
});

/**
 * Verify Email Schema
 */
export const verifyEmailSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Verification code is required"),
  }),
});

/**
 * Verify Phone Schema
 */
export const verifyPhoneSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Verification code is required"),
  }),
});
