import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  adminRegister,
  getAdminProfile,
  changeAdminPassword,
} from "../controllers/admin.auth.controller";
import { authenticateAdmin } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  adminLoginSchema,
  createAdminSchema,
  changeAdminPasswordSchema,
} from "../validators/admin.auth.validator";

const adminAuthRouter = Router();

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
adminAuthRouter.post(
  "/login",
  validateZodSchema(adminLoginSchema, "body"),
  adminLogin,
);

/**
 * @route   POST /api/admin/logout
 * @desc    Admin logout (invalidates all tokens)
 * @access  Private (Admin)
 */
adminAuthRouter.post("/logout", authenticateAdmin, adminLogout);

/**
 * @route   POST /api/admin/register
 * @desc    Register new admin (requires existing admin)
 * @access  Private (Admin)
 */
adminAuthRouter.post(
  "/register",
  authenticateAdmin,
  validateZodSchema(createAdminSchema, "body"),
  adminRegister,
);

/**
 * @route   GET /api/admin/profile
 * @desc    Get current admin profile
 * @access  Private (Admin)
 */
adminAuthRouter.get("/profile", authenticateAdmin, getAdminProfile);

/**
 * @route   PUT /api/admin/change-password
 * @desc    Change admin password
 * @access  Private (Admin)
 */
adminAuthRouter.put(
  "/change-password",
  authenticateAdmin,
  validateZodSchema(changeAdminPasswordSchema, "body"),
  changeAdminPassword,
);

export default adminAuthRouter;
