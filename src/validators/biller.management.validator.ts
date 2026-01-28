import { z } from "zod";
import { BillType, BillerStatus } from "../models/Billers.model";

/**
 * Create Biller Schema
 */
export const createBillerSchema = z.object({
  name: z
    .string()
    .min(2, "Biller name must be at least 2 characters")
    .max(255, "Biller name cannot exceed 255 characters"),
  billerCode: z
    .string()
    .min(2, "Biller code must be at least 2 characters")
    .max(50, "Biller code cannot exceed 50 characters")
    .regex(
      /^[A-Z0-9\-_]+$/,
      "Biller code must contain only uppercase letters, numbers, hyphens, and underscores",
    ),
  billType: z.nativeEnum(BillType, {
    message: "Invalid bill type",
  }),
  contactEmail: z.string().email("Invalid email format").optional(),
  contactPhone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number format")
    .optional(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  logoUrl: z.string().url("Invalid URL format").optional(),
});

/**
 * Update Biller Schema
 */
export const updateBillerSchema = z.object({
  name: z
    .string()
    .min(2, "Biller name must be at least 2 characters")
    .max(255, "Biller name cannot exceed 255 characters")
    .optional(),
  billerCode: z
    .string()
    .min(2, "Biller code must be at least 2 characters")
    .max(50, "Biller code cannot exceed 50 characters")
    .regex(
      /^[A-Z0-9\-_]+$/,
      "Biller code must contain only uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  billType: z.nativeEnum(BillType).optional(),
  status: z.nativeEnum(BillerStatus).optional(),
  contactEmail: z.string().email("Invalid email format").optional(),
  contactPhone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number format")
    .optional(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  logoUrl: z.string().url("Invalid URL format").optional(),
});

/**
 * Get Billers Admin Schema
 */
export const getBillersAdminSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  billType: z.nativeEnum(BillType).optional(),
  status: z.nativeEnum(BillerStatus).optional(),
  search: z.string().optional(),
});
