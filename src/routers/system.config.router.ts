import { Router } from "express";
import {
  getAllConfigs,
  getConfigByKey,
  createOrUpdateConfig,
  updateConfig,
  getPublicConfigs,
} from "../controllers/system.config.controller";
import { adminAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/app/validateRequest";
import {
  getConfigByKeySchema,
  updateConfigSchema,
  createConfigSchema,
} from "../validators/system.config.validator";

const router = Router();

// Public routes (no authentication required)
router.get("/public", getPublicConfigs);

// Admin routes (require admin authentication)
router.get("/", adminAuth, getAllConfigs);
router.get(
  "/:key",
  adminAuth,
  validateRequest(getConfigByKeySchema),
  getConfigByKey
);
router.post(
  "/",
  adminAuth,
  validateRequest(createConfigSchema),
  createOrUpdateConfig
);
router.put(
  "/:key",
  adminAuth,
  validateRequest(updateConfigSchema),
  updateConfig
);

export default router;
