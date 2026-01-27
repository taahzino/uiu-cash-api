import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  firstNameSchema,
  lastNameSchema,
  identifierSchema,
  dateOfBirthSchema,
  nidNumberSchema,
  verificationCodeSchema,
} from "./utility.validator";

/**
 * Consumer Registration Schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  role: z.enum(["CONSUMER", "AGENT"], {
    message: "Role must be either CONSUMER or AGENT",
  }),
  dateOfBirth: dateOfBirthSchema,
  nidNumber: nidNumberSchema,
});

/**
 * Consumer Login Schema
 */
export const loginSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
});

/**
 * Update Profile Schema
 */
export const updateProfileSchema = z.object({
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  dateOfBirth: dateOfBirthSchema,
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});

/**
 * Verify Email Schema
 */
export const verifyEmailSchema = z.object({
  code: verificationCodeSchema,
});

/**
 * Verify Phone Schema
 */
export const verifyPhoneSchema = z.object({
  code: verificationCodeSchema,
});
