import { Router } from "express";
import { authenticateConsumer, authenticateAgent } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  initiateCashOut,
  completeCashOut,
  getCashOutHistory,
  getAgentCashOutHistory,
} from "../controllers/cashout.controller";
import {
  initiateCashOutSchema,
  completeCashOutSchema,
  getCashOutHistorySchema,
  getAgentCashOutHistorySchema,
} from "../validators/cashout.validator";

const router = Router();

/**
 * @route POST /api/cash-out/initiate
 * @desc User initiates a cash out transaction with an agent
 * @access User only
 */
router.post(
  "/initiate",
  authenticateConsumer,
  validateZodSchema(initiateCashOutSchema, "body"),
  initiateCashOut,
);

/**
 * @route POST /api/cash-out/complete
 * @desc Agent completes the cash out transaction (hands over cash)
 * @access Agent only
 */
router.post(
  "/complete",
  authenticateAgent,
  validateZodSchema(completeCashOutSchema, "body"),
  completeCashOut,
);

/**
 * @route GET /api/cash-out/history
 * @desc Get user's cash out transaction history
 * @access User only
 */
router.get(
  "/history",
  authenticateConsumer,
  validateZodSchema(getCashOutHistorySchema, "query"),
  getCashOutHistory,
);

/**
 * @route GET /api/cash-out/agent-history
 * @desc Get agent's cash out transaction history with earnings summary
 * @access Agent only
 */
router.get(
  "/agent-history",
  authenticateAgent,
  validateZodSchema(getAgentCashOutHistorySchema, "query"),
  getAgentCashOutHistory,
);

export default router;
