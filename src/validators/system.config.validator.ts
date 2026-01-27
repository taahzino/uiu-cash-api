import { z } from "zod";

/**
 * Get Config By Key Schema
 */
export const getConfigByKeySchema = z.object({
  key: z.string().min(1, "Config key is required"),
});

/**
 * Update Config Schema - Params
 */
export const updateConfigParamsSchema = z.object({
  key: z.string().min(1, "Config key is required"),
});

/**
 * Update Config Schema - Body
 */
export const updateConfigBodySchema = z.object({
  value: z.string().min(1, "Config value is required"),
});

/**
 * Create Config Schema
 */
export const createConfigSchema = z.object({
  key: z
    .string()
    .min(1, "Config key is required")
    .regex(
      /^[a-z_]+$/,
      "Config key must be lowercase letters and underscores only",
    ),
  value: z.string().min(1, "Config value is required"),
  description: z.string().optional(),
});

/**
 * Delete Config Schema
 */
export const deleteConfigSchema = z.object({
  key: z.string().min(1, "Config key is required"),
});
