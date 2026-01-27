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
} from "./utility.validator";

/**
 * Agent Registration Schema
 */
export const agentRegisterSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  businessName: z
    .string()
    .min(3, "Business name must be at least 3 characters")
    .max(255, "Business name cannot exceed 255 characters"),
  businessAddress: z
    .string()
    .min(10, "Business address must be at least 10 characters"),
  dateOfBirth: dateOfBirthSchema,
  nidNumber: nidNumberSchema,
});

/**
 * Agent Login Schema
 */
export const agentLoginSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
});

/**
 * Update Agent Profile Schema
 */
export const updateAgentProfileSchema = z.object({
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  businessName: z
    .string()
    .min(3, "Business name must be at least 3 characters")
    .max(255, "Business name cannot exceed 255 characters")
    .optional(),
  businessAddress: z
    .string()
    .min(10, "Business address must be at least 10 characters")
    .optional(),
  dateOfBirth: dateOfBirthSchema,
});

/**
 * Change Agent Password Schema
 */
export const changeAgentPasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
});
