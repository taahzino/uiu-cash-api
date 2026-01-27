import { z } from "zod";
import { idSchema, pageSchema, limitSchema } from "./utility.validator";

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

// Get all agents query validator
export const getAllAgentsQuerySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
});

// Get agent details params validator
export const getAgentDetailsParamsSchema = z.object({
  id: idSchema,
});

// Get pending agents query validator
export const getPendingAgentsQuerySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
});
