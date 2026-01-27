import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
} from "./utility.validator";

/**
 * Admin Login Schema
 */
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Create Admin Schema
 */
export const createAdminSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name cannot exceed 255 characters"),
});

/**
 * Change Admin Password Schema
 */
export const changeAdminPasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});
