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
    .min(1, "Cardholder name is required")
    .max(50, "Cardholder name must not exceed 50 characters")
    .regex(
      /^[a-zA-Z]+(\s[a-zA-Z]+)+$/,
      "Cardholder name must contain at least first and last name with only letters and spaces",
    )
    .refine((name) => {
      const trimmed = name.trim();
      return (
        trimmed.length >= 3 &&
        trimmed !== name.toLowerCase() &&
        trimmed !== name.toUpperCase()
      );
    }, "Cardholder name must be at least 3 characters and properly formatted")
    .refine((name) => {
      const words = name.trim().split(/\s+/);
      return words.length >= 2 && words.every((word) => word.length >= 2);
    }, "Cardholder name must have at least 2 words, each with minimum 2 characters"),
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
    }, "Invalid card details"),
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
 * Cash Out Schema (through agent)
 */
export const cashOutSchema = z.object({
  agentCode: z
    .string()
    .min(1, "Agent code is required")
    .regex(/^AG\d{7}$/, "Invalid agent code format (AG + 7 digits)"),
  amount: z
    .number()
    .min(50, "Minimum cash out amount is ৳50")
    .max(25000, "Maximum cash out amount is ৳25,000"),
  description: descriptionSchema,
});

/**
 * Cash In Schema (agent accepts cash from consumer)
 */
export const cashInSchema = z.object({
  consumerIdentifier: z.string().min(1, "Consumer phone or email is required"),
  amount: z
    .number()
    .min(50, "Minimum cash in amount is ৳50")
    .max(25000, "Maximum cash in amount is ৳25,000"),
  description: descriptionSchema,
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
