import { z } from "zod";

/**
 * Bank Transfer Schema
 */
export const bankTransferSchema = z.object({
  bankName: z
    .string()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name cannot exceed 100 characters"),
  accountNumber: z
    .string()
    .min(5, "Account number must be at least 5 characters")
    .max(50, "Account number cannot exceed 50 characters")
    .regex(/^[0-9]+$/, "Account number must contain only digits"),
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters")
    .max(255, "Account holder name cannot exceed 255 characters"),
  routingNumber: z
    .string()
    .regex(/^[0-9]+$/, "Routing number must contain only digits")
    .min(9, "Routing number must be at least 9 digits")
    .max(20, "Routing number cannot exceed 20 digits")
    .optional(),
  transferType: z
    .enum(["INSTANT", "STANDARD"], {
      message: "Transfer type must be either INSTANT or STANDARD",
    })
    .optional(),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .min(10, "Minimum transfer amount is ৳10")
    .max(100000, "Maximum transfer amount is ৳100,000"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

/**
 * Get Bank Transfer History Schema
 */
export const getBankTransferHistorySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
});
