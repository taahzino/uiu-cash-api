import { Router } from "express";
import {
  createBiller,
  getAllBillers,
  getBillerDetails,
  updateBiller,
  updateBillerStatus,
  deleteBiller,
} from "../controllers/biller.management.controller";
import { authenticateAdmin } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  createBillerSchema,
  updateBillerSchema,
  getBillersAdminSchema,
} from "../validators/biller.management.validator";

const router = Router();

/**
 * @route   POST /api/admin/billers
 * @desc    Create new biller
 * @access  Private (Admin)
 */
router.post(
  "/",
  authenticateAdmin,
  validateZodSchema(createBillerSchema, "body"),
  createBiller,
);

/**
 * @route   GET /api/admin/billers
 * @desc    Get all billers with filters
 * @access  Private (Admin)
 */
router.get(
  "/",
  authenticateAdmin,
  validateZodSchema(getBillersAdminSchema, "query"),
  getAllBillers,
);

/**
 * @route   GET /api/admin/billers/:id
 * @desc    Get biller details
 * @access  Private (Admin)
 */
router.get("/:id", authenticateAdmin, getBillerDetails);

/**
 * @route   PUT /api/admin/billers/:id
 * @desc    Update biller
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authenticateAdmin,
  validateZodSchema(updateBillerSchema, "body"),
  updateBiller,
);

/**
 * @route   PATCH /api/admin/billers/:id/status
 * @desc    Update biller status
 * @access  Private (Admin)
 */
router.patch("/:id/status", authenticateAdmin, updateBillerStatus);

/**
 * @route   DELETE /api/admin/billers/:id
 * @desc    Delete biller
 * @access  Private (Admin)
 */
router.delete("/:id", authenticateAdmin, deleteBiller);

export default router;
