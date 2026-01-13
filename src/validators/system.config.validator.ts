import { z } from "zod";

/**
 * Get Config By Key Schema
 */
export const getConfigByKeySchema = z.object({
  params: z.object({
    key: z.string().min(1, "Config key is required"),
  }),
});

/**
 * Update Config Schema
 */
export const updateConfigSchema = z.object({
  params: z.object({
    key: z.string().min(1, "Config key is required"),
  }),
  body: z.object({
    value: z.string().min(1, "Config value is required"),
  }),
});

/**
 * Create Config Schema
 */
export const createConfigSchema = z.object({
  body: z.object({
    key: z
      .string()
      .min(1, "Config key is required")
      .regex(
        /^[a-z_]+$/,
        "Config key must be lowercase letters and underscores only"
      ),
    value: z.string().min(1, "Config value is required"),
    description: z.string().optional(),
  }),
});

/**
 * Delete Config Schema
 */
export const deleteConfigSchema = z.object({
  params: z.object({
    key: z.string().min(1, "Config key is required"),
  }),
});
