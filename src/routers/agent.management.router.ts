import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  getPendingAgents,
  approveAgent,
  rejectAgent,
  getAllAgents,
  getAgentDetails,
} from "../controllers/agent.management.controller";
import {
  approveAgentParamsSchema,
  rejectAgentParamsSchema,
  rejectAgentBodySchema,
  getAllAgentsQuerySchema,
  getAgentDetailsParamsSchema,
  getPendingAgentsQuerySchema,
} from "../validators/agent.management.validator";

const router = Router();

/**
 * @route GET /api/admin/agents/pending
 * @desc Get all pending agents awaiting approval
 * @access Admin only
 */
router.get(
  "/pending",
  authenticateAdmin,
  validateZodSchema(getPendingAgentsQuerySchema, "query"),
  getPendingAgents,
);

/**
 * @route GET /api/admin/agents
 * @desc Get all agents with optional status filter
 * @access Admin only
 */
router.get(
  "/",
  authenticateAdmin,
  validateZodSchema(getAllAgentsQuerySchema, "query"),
  getAllAgents,
);

/**
 * @route GET /api/admin/agents/:id
 * @desc Get detailed agent information
 * @access Admin only
 */
router.get(
  "/:id",
  authenticateAdmin,
  validateZodSchema(getAgentDetailsParamsSchema, "params"),
  getAgentDetails,
);

/**
 * @route POST /api/admin/agents/:id/approve
 * @desc Approve a pending agent
 * @access Admin only
 */
router.post(
  "/:id/approve",
  authenticateAdmin,
  validateZodSchema(approveAgentParamsSchema, "params"),
  approveAgent,
);

/**
 * @route POST /api/admin/agents/:id/reject
 * @desc Reject a pending agent with reason
 * @access Admin only
 */
router.post(
  "/:id/reject",
  authenticateAdmin,
  validateZodSchema(rejectAgentParamsSchema, "params"),
  validateZodSchema(rejectAgentBodySchema, "body"),
  rejectAgent,
);

export default router;
