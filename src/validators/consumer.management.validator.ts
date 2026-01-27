import { z } from "zod";
import { idSchema, pageSchema, limitSchema } from "./utility.validator";

/**
 * Get Consumers Query Schema (with pagination and filters)
 */
export const getConsumersSchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"]).optional(),
  role: z.enum(["CONSUMER", "AGENT"]).optional(),
});

/**
 * Search Consumers Schema
 */
export const searchConsumersSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.string().regex(/^\d+$/).optional().default("10"),
});

/**
 * Get Consumer By ID Schema
 */
export const getConsumerByIdSchema = z.object({
  id: idSchema,
});

/**
 * Update Consumer Status Schema - Params
 */
export const updateConsumerStatusParamsSchema = z.object({
  id: idSchema,
});

/**
 * Update Consumer Status Schema - Body
 */
export const updateConsumerStatusBodySchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "REJECTED"], {
    message: "Status must be ACTIVE, SUSPENDED, or REJECTED",
  }),
});

/**
 * Get Consumer Transactions Schema - Params
 */
export const getConsumerTransactionsParamsSchema = z.object({
  id: idSchema,
});

/**
 * Get Consumer Transactions Schema - Query
 */
export const getConsumerTransactionsQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
});
