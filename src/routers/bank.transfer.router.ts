import { Router } from "express";
import {
  initiateTransfer,
  getTransferHistory,
  getTransferDetails,
} from "../controllers/bank.transfer.controller";
import { authenticateUser } from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  bankTransferSchema,
  getBankTransferHistorySchema,
} from "../validators/bank.transfer.validator";

const router = Router();

/**
 * @route   POST /api/bank/transfer
 * @desc    Initiate bank transfer
 * @access  Private (Consumer or Agent)
 */
router.post(
  "/transfer",
  authenticateUser,
  validateZodSchema(bankTransferSchema, "body"),
  initiateTransfer,
);

/**
 * @route   GET /api/bank/transfers
 * @desc    Get bank transfer history
 * @access  Private (Consumer or Agent)
 */
router.get(
  "/transfers",
  authenticateUser,
  validateZodSchema(getBankTransferHistorySchema, "query"),
  getTransferHistory,
);

/**
 * @route   GET /api/bank/transfers/:id
 * @desc    Get bank transfer details
 * @access  Private (Consumer or Agent)
 */
router.get("/transfers/:id", authenticateUser, getTransferDetails);

export default router;
