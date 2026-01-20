import { Router } from "express";
import {
  agentRegister,
  agentLogin,
  getAgentProfile,
  updateAgentProfile,
  changeAgentPassword,
} from "../controllers/agent.auth.controller";
import { authenticateUser } from "../middleware/auth";
import { validateRequest } from "../middleware/app/validateRequest";
import {
  agentRegisterSchema,
  agentLoginSchema,
  updateAgentProfileSchema,
  changeAgentPasswordSchema,
} from "../validators/agent.auth.validator";

const router = Router();

// Public routes
router.post("/register", validateRequest(agentRegisterSchema), agentRegister);
router.post("/login", validateRequest(agentLoginSchema), agentLogin);

// Protected routes (require authentication)
router.get("/profile", authenticateUser, getAgentProfile);
router.put(
  "/profile",
  authenticateUser,
  validateRequest(updateAgentProfileSchema),
  updateAgentProfile
);
router.put(
  "/change-password",
  authenticateUser,
  validateRequest(changeAgentPasswordSchema),
  changeAgentPassword
);

export default router;
