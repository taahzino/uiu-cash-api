import { Router } from "express";
import {
  consumerRegister,
  consumerLogin,
  consumerLogout,
  getConsumerProfile,
  updateConsumerProfile,
  changePassword,
} from "../controllers/consumer.auth.controller";
import { authenticateConsumer } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/consumer.auth.validator";

const router = Router();

// Public routes
router.post(
  "/register",
  validateZodSchema(registerSchema, "body"),
  consumerRegister,
);

router.post("/login", validateZodSchema(loginSchema, "body"), consumerLogin);

// Protected routes (require authentication)
router.post("/logout", authenticateConsumer, consumerLogout);

router.get("/profile", authenticateConsumer, getConsumerProfile);

router.put(
  "/profile",
  authenticateConsumer,
  validateZodSchema(updateProfileSchema, "body"),
  updateConsumerProfile,
);

router.put(
  "/change-password",
  authenticateConsumer,
  validateZodSchema(changePasswordSchema, "body"),
  changePassword,
);

export default router;
