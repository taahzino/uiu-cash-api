import { Router } from "express";
import {
  agentRegister,
  agentLogin,
  agentLogout,
  getAgentProfile,
  updateAgentProfile,
  changeAgentPassword,
} from "../controllers/agent.auth.controller";
import { authenticateAgent } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  agentRegisterSchema,
  agentLoginSchema,
  updateAgentProfileSchema,
  changeAgentPasswordSchema,
} from "../validators/agent.auth.validator";

const router = Router();

// Public routes
router.post(
  "/register",
  validateZodSchema(agentRegisterSchema, "body"),
  agentRegister,
);

router.post("/login", validateZodSchema(agentLoginSchema, "body"), agentLogin);

// Protected routes (require authentication)
router.post("/logout", authenticateAgent, agentLogout);

router.get("/profile", authenticateAgent, getAgentProfile);

router.put(
  "/profile",
  authenticateAgent,
  validateZodSchema(updateAgentProfileSchema, "body"),
  updateAgentProfile,
);

router.put(
  "/change-password",
  authenticateAgent,
  validateZodSchema(changeAgentPasswordSchema, "body"),
  changeAgentPassword,
);

export default router;
