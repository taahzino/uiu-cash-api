import { Router } from "express";
import {
  addMoney,
  sendMoney,
  getTransactionHistory,
  getTransactionDetails,
} from "../controllers/transaction.controller";
import { authenticateUser, authenticateConsumer } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  addMoneySchema,
  sendMoneySchema,
  getTransactionHistorySchema,
  getTransactionDetailsSchema,
} from "../validators/transaction.validator";

const router = Router();

/**
 * @route   POST /api/transactions/add-money
 * @desc    Add money to wallet from card
 * @access  Private (Consumer or Agent)
 */
router.post(
  "/add-money",
  authenticateUser,
  validateZodSchema(addMoneySchema, "body"),
  addMoney,
);

/**
 * @route   POST /api/transactions/send-money
 * @desc    Send money to another user (P2P)
 * @access  Private (Consumer only)
 */
router.post(
  "/send-money",
  authenticateConsumer,
  validateZodSchema(sendMoneySchema, "body"),
  sendMoney,
);

/**
 * @route   GET /api/transactions/history
 * @desc    Get user transaction history
 * @access  Private (Consumer or Agent)
 */
router.get(
  "/history",
  authenticateUser,
  validateZodSchema(getTransactionHistorySchema, "query"),
  getTransactionHistory,
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction details
 * @access  Private (Consumer or Agent)
 */
router.get(
  "/:id",
  authenticateUser,
  validateZodSchema(getTransactionDetailsSchema, "params"),
  getTransactionDetails,
);

export default router;
