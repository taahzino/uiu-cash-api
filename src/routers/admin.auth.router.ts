import { Router } from "express";
import {
  adminLogin,
  adminRegister,
  getAdminProfile,
} from "../controllers/admin.auth.controller";
import { adminAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/app/validateRequest";
import {
  adminLoginSchema,
  createAdminSchema,
} from "../validators/admin.auth.validator";

const adminAuthRouter = Router();

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
adminAuthRouter.post("/login", validateRequest(adminLoginSchema), adminLogin);

/**
 * @route   POST /api/admin/register
 * @desc    Register new admin (requires existing admin)
 * @access  Private (Admin)
 */
adminAuthRouter.post(
  "/register",
  adminAuth,
  validateRequest(createAdminSchema),
  adminRegister
);

/**
 * @route   GET /api/admin/profile
 * @desc    Get current admin profile
 * @access  Private (Admin)
 */
adminAuthRouter.get("/profile", adminAuth, getAdminProfile);

export default adminAuthRouter;
