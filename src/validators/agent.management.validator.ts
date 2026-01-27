import { z } from "zod";
import { idSchema, pageSchema, limitSchema } from "./utility.validator";

/**
 * Get Agents Paginated Schema (POST body)
 */
export const getAgentsPaginatedSchema = z.object({
  offset: z.number().int().min(0, "Offset must be a non-negative integer"),
  limit: z.number().int().min(1).max(100, "Limit must be between 1 and 100"),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
});

// Approve agent params validator
export const approveAgentParamsSchema = z.object({
  id: idSchema,
});

// Reject agent params validator
export const rejectAgentParamsSchema = z.object({
  id: idSchema,
});

// Reject agent body validator
export const rejectAgentBodySchema = z.object({
  reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

// Get agent details params validator
export const getAgentDetailsParamsSchema = z.object({
  id: idSchema,
});

// Get agent transactions params validator
export const getAgentTransactionsParamsSchema = z.object({
  id: idSchema,
});

// Get agent transactions query validator
export const getAgentTransactionsQuerySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
});
