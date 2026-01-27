import { Router } from "express";
import {
  getAllConfigs,
  getConfigByKey,
  createOrUpdateConfig,
  updateConfig,
  getPublicConfigs,
} from "../controllers/system.config.controller";
import { authenticateAdmin } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  getConfigByKeySchema,
  updateConfigParamsSchema,
  updateConfigBodySchema,
  createConfigSchema,
} from "../validators/system.config.validator";

const router = Router();

// Public routes (no authentication required)
router.get("/public", getPublicConfigs);

// Admin routes (require admin authentication)
router.get("/", authenticateAdmin, getAllConfigs);
router.get(
  "/:key",
  authenticateAdmin,
  validateZodSchema(getConfigByKeySchema, "params"),
  getConfigByKey,
);
router.post(
  "/",
  authenticateAdmin,
  validateZodSchema(createConfigSchema, "body"),
  createOrUpdateConfig,
);
router.put(
  "/:key",
  authenticateAdmin,
  validateZodSchema(updateConfigParamsSchema, "params"),
  validateZodSchema(updateConfigBodySchema, "body"),
  updateConfig,
);

export default router;
