import { z } from "zod";
import {
  descriptionSchema,
  pageSchema,
  limitSchema,
  idSchema,
} from "./utility.validator";

/**
 * Add Money Schema (from debit/credit card)
 */
export const addMoneySchema = z.object({
  amount: z
    .number()
    .min(50, "Minimum add money amount is ৳50")
    .max(25000, "Maximum add money amount is ৳25,000"),
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .regex(/^\d{16}$/, "Card number must be 16 digits"),
  cardHolderName: z
    .string()
    .min(3, "Cardholder name must be at least 3 characters"),
  expiryMonth: z
    .string()
    .min(1, "Expiry month is required")
    .regex(/^(0[1-9]|1[0-2])$/, "Invalid expiry month (01-12)"),
  expiryYear: z
    .string()
    .min(1, "Expiry year is required")
    .regex(/^\d{2}$/, "Invalid expiry year (YY format)")
    .refine((year) => {
      const currentYear = new Date().getFullYear() % 100;
      const expYear = parseInt(year);
      return expYear >= currentYear;
    }, "Card has expired"),
  cvv: z
    .string()
    .min(1, "CVV is required")
    .regex(/^\d{3}$/, "CVV must be 3 digits"),
});

/**
 * Send Money Schema (P2P transfer)
 */
export const sendMoneySchema = z.object({
  recipientIdentifier: z
    .string()
    .min(1, "Recipient phone or email is required"),
  amount: z
    .number()
    .min(10, "Minimum send money amount is ৳10")
    .max(25000, "Maximum send money amount is ৳25,000"),
  description: descriptionSchema,
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN must be 4 digits")
    .optional(), // Optional for now, can be made required later
});

/**
 * Get Transaction History Schema
 */
export const getTransactionHistorySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  type: z
    .enum([
      "SEND_MONEY",
      "ADD_MONEY",
      "CASH_OUT",
      "CASH_IN",
      "BILL_PAYMENT",
      "BANK_TRANSFER",
      "CASHBACK",
      "COMMISSION",
      "ONBOARDING_BONUS",
    ])
    .optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
});

/**
 * Get Transaction Details Schema
 */
export const getTransactionDetailsSchema = z.object({
  id: idSchema,
});
