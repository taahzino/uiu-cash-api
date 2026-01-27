import { z } from "zod";
import { idSchema, pageSchema, limitSchema } from "./utility.validator";

/**
 * Get Consumers Paginated Schema (POST body)
 */
export const getConsumersPaginatedSchema = z.object({
  offset: z.number().int().min(0, "Offset must be a non-negative integer"),
  limit: z.number().int().min(1).max(100, "Limit must be between 1 and 100"),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"]).optional(),
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
