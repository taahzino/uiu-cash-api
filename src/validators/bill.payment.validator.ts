import { z } from "zod";
import { BillType } from "../models/Billers.model";

/**
 * Pay Bill Schema
 */
export const payBillSchema = z.object({
  billerId: z.string().min(1, "Biller ID is required"),
  accountNumber: z
    .string()
    .min(5, "Account number must be at least 5 characters")
    .max(50, "Account number cannot exceed 50 characters")
    .regex(
      /^[0-9A-Za-z\-]+$/,
      "Account number can only contain letters, numbers, and hyphens",
    ),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .min(10, "Minimum bill payment amount is ৳10")
    .max(100000, "Maximum bill payment amount is ৳100,000"),
  billingMonth: z
    .string()
    .regex(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)$/,
      "Invalid month",
    )
    .optional(),
  billingYear: z
    .number()
    .min(2020, "Year must be 2020 or later")
    .max(2100, "Year cannot exceed 2100")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

/**
 * Get Billers Schema
 */
export const getBillersSchema = z.object({
  billType: z.nativeEnum(BillType).optional(),
  search: z.string().optional(),
});

/**
 * Get Bill Payment History Schema
 */
export const getBillPaymentHistorySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  billerId: z.string().optional(),
});
