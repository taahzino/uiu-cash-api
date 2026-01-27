import z from "zod";

/**
 * Password validation schema
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character",
  );

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email({ message: "Invalid email address" });

/**
 * Phone number validation schema (Bangladeshi format)
 */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number format");

/**
 * First name validation schema
 */
export const firstNameSchema = z
  .string()
  .min(2, "First name must be at least 2 characters")
  .max(100, "First name cannot exceed 100 characters");

/**
 * Last name validation schema
 */
export const lastNameSchema = z
  .string()
  .min(2, "Last name must be at least 2 characters")
  .max(100, "Last name cannot exceed 100 characters");

/**
 * Identifier schema (email or phone for login)
 */
export const identifierSchema = z.string().min(1, "Email or phone is required");

/**
 * Date of birth schema
 */
export const dateOfBirthSchema = z.string().optional();

/**
 * NID number schema
 */
export const nidNumberSchema = z
  .string()
  .min(10, "NID number must be at least 10 characters")
  .max(20, "NID number cannot exceed 20 characters")
  .optional();

/**
 * Verification code schema (6 digits)
 */
export const verificationCodeSchema = z
  .string()
  .min(1, "Verification code is required")
  .length(6, "Verification code must be 6 digits");

/**
 * ID schema (8 character nanoid)
 */
export const idSchema = z
  .string()
  .min(1, "ID is required")
  .length(8, "ID must be 8 characters");

/**
 * Pagination - Page number schema
 */
export const pageSchema = z.string().regex(/^\d+$/).optional().default("1");

/**
 * Pagination - Limit schema
 */
export const limitSchema = z.string().regex(/^\d+$/).optional().default("20");

/**
 * Description schema
 */
export const descriptionSchema = z
  .string()
  .max(200, "Description cannot exceed 200 characters")
  .optional();
