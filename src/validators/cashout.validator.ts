import { z } from "zod";
import {
  idSchema,
  pageSchema,
  limitSchema,
  descriptionSchema,
} from "./utility.validator";

// Cash out initiate validator
export const initiateCashOutSchema = z.object({
  agent_code: z.string().min(1, "Agent code is required"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(10, "Minimum cash out amount is 10 BDT")
    .max(100000, "Maximum cash out amount is 100,000 BDT"),
  location: z.string().min(1, "Location is required").max(200),
  notes: z.string().max(500).optional(),
});

// Cash out complete validator (agent confirms)
export const completeCashOutSchema = z.object({
  transaction_id: idSchema,
});

// Get cash out history validator (user side)
export const getCashOutHistorySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  start_date: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  end_date: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

// Get agent cash out history validator (agent side)
export const getAgentCashOutHistorySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  start_date: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  end_date: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});
