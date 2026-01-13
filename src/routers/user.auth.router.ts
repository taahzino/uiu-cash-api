import { Router } from "express";
import {
  userRegister,
  userLogin,
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../controllers/user.auth.controller";
import { authenticateUser } from "../middleware/auth";
import { validateRequest } from "../middleware/app/validateRequest";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/user.auth.validator";

const router = Router();

// Public routes
router.post("/register", validateRequest(registerSchema), userRegister);
router.post("/login", validateRequest(loginSchema), userLogin);

// Protected routes (require authentication)
router.get("/profile", authenticateUser, getUserProfile);
router.put(
  "/profile",
  authenticateUser,
  validateRequest(updateProfileSchema),
  updateUserProfile
);
router.put(
  "/change-password",
  authenticateUser,
  validateRequest(changePasswordSchema),
  changePassword
);

export default router;
