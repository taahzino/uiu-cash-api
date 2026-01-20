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
 * Agent Registration Schema
 */
export const agentRegisterSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
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
    businessName: z
      .string()
      .min(3, "Business name must be at least 3 characters")
      .max(255, "Business name cannot exceed 255 characters"),
    businessAddress: z
      .string()
      .min(10, "Business address must be at least 10 characters"),
    dateOfBirth: z.string().optional(),
    nidNumber: z
      .string()
      .min(10, "NID number must be at least 10 characters")
      .max(20, "NID number cannot exceed 20 characters")
      .optional(),
  }),
});

/**
 * Agent Login Schema
 */
export const agentLoginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

/**
 * Update Agent Profile Schema
 */
export const updateAgentProfileSchema = z.object({
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
    businessName: z
      .string()
      .min(3, "Business name must be at least 3 characters")
      .max(255, "Business name cannot exceed 255 characters")
      .optional(),
    businessAddress: z
      .string()
      .min(10, "Business address must be at least 10 characters")
      .optional(),
    dateOfBirth: z.string().optional(),
  }),
});

/**
 * Change Agent Password Schema
 */
export const changeAgentPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  }),
});
