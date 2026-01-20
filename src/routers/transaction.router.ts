import { Router } from "express";
import {
  addMoney,
  sendMoney,
  getTransactionHistory,
  getTransactionDetails,
} from "../controllers/transaction.controller";
import { authenticateUser } from "../middleware/auth";
import { validateRequest } from "../middleware/app/validateRequest";
import {
  addMoneySchema,
  sendMoneySchema,
  getTransactionHistorySchema,
  getTransactionDetailsSchema,
} from "../validators/transaction.validator";

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

/**
 * @route   POST /api/transactions/add-money
 * @desc    Add money to wallet from card
 * @access  Private (User)
 */
router.post("/add-money", validateRequest(addMoneySchema), addMoney);

/**
 * @route   POST /api/transactions/send-money
 * @desc    Send money to another user (P2P)
 * @access  Private (User)
 */
router.post("/send-money", validateRequest(sendMoneySchema), sendMoney);

/**
 * @route   GET /api/transactions/history
 * @desc    Get user transaction history
 * @access  Private (User)
 */
router.get(
  "/history",
  validateRequest(getTransactionHistorySchema),
  getTransactionHistory
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction details
 * @access  Private (User)
 */
router.get(
  "/:id",
  validateRequest(getTransactionDetailsSchema),
  getTransactionDetails
);

export default router;
