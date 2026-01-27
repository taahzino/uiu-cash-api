import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  approveAgent,
  rejectAgent,
  getAgentsPaginated,
  getAgentDetails,
  getAgentTransactions,
} from "../controllers/agent.management.controller";
import {
  approveAgentParamsSchema,
  rejectAgentParamsSchema,
  rejectAgentBodySchema,
  getAgentsPaginatedSchema,
  getAgentDetailsParamsSchema,
  getAgentTransactionsParamsSchema,
  getAgentTransactionsQuerySchema,
} from "../validators/agent.management.validator";

const router = Router();

/**
 * @route POST /api/admin/agents/list
 * @desc Get paginated agents with search and filters
 * @access Admin only
 */
router.post(
  "/list",
  authenticateAdmin,
  validateZodSchema(getAgentsPaginatedSchema, "body"),
  getAgentsPaginated,
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

/**
 * @route GET /api/admin/agents/:id/transactions
 * @desc Get paginated transaction history for a specific agent
 * @access Admin only
 */
router.get(
  "/:id/transactions",
  authenticateAdmin,
  validateZodSchema(getAgentTransactionsParamsSchema, "params"),
  validateZodSchema(getAgentTransactionsQuerySchema, "query"),
  getAgentTransactions,
);

export default router;
