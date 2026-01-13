import { z } from "zod";

/**
 * Get Users Query Schema (with pagination and filters)
 */
export const getUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default("1"),
    limit: z.string().regex(/^\d+$/).optional().default("20"),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"]).optional(),
    role: z.enum(["PERSONAL", "AGENT"]).optional(),
  }),
});

/**
 * Search Users Schema
 */
export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().min(1, "Search query is required"),
    limit: z.string().regex(/^\d+$/).optional().default("10"),
  }),
});

/**
 * Get User By ID Schema
 */
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().length(8, "User ID must be 8 characters"),
  }),
});

/**
 * Update User Status Schema
 */
export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().length(8, "User ID must be 8 characters"),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "SUSPENDED", "REJECTED"], {
      message: "Status must be ACTIVE, SUSPENDED, or REJECTED",
    }),
  }),
});

/**
 * Get User Transactions Schema
 */
export const getUserTransactionsSchema = z.object({
  params: z.object({
    id: z.string().length(8, "User ID must be 8 characters"),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default("1"),
    limit: z.string().regex(/^\d+$/).optional().default("20"),
  }),
});
