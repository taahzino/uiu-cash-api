import { Router } from "express";
import {
  addMoney,
  sendMoney,
  cashOut,
  cashIn,
  getTransactionHistory,
  getTransactionDetails,
} from "../controllers/transaction.controller";
import {
  getBillers,
  payBill,
  getBillPaymentHistory,
} from "../controllers/bill.payment.controller";
import {
  authenticateUser,
  authenticateConsumer,
  authenticateAgent,
} from "../middleware/auth";
import validateZodSchema from "../middleware/app/validateZodSchema";
import {
  addMoneySchema,
  sendMoneySchema,
  cashOutSchema,
  cashInSchema,
  getTransactionHistorySchema,
  getTransactionDetailsSchema,
} from "../validators/transaction.validator";
import {
  payBillSchema,
  getBillersSchema,
  getBillPaymentHistorySchema,
} from "../validators/bill.payment.validator";

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
 * @route   POST /api/transactions/cash-out
 * @desc    Cash out from wallet through agent
 * @access  Private (Consumer only)
 */
router.post(
  "/cash-out",
  authenticateConsumer,
  validateZodSchema(cashOutSchema, "body"),
  cashOut,
);

/**
 * @route   POST /api/transactions/cash-in
 * @desc    Agent accepts cash from consumer and credits their wallet
 * @access  Private (Agent only)
 */
router.post(
  "/cash-in",
  authenticateAgent,
  validateZodSchema(cashInSchema, "body"),
  cashIn,
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
 * @route   GET /api/transactions/billers
 * @desc    Get list of all active billers
 * @access  Private (Consumer only)
 */
router.get(
  "/billers",
  authenticateConsumer,
  validateZodSchema(getBillersSchema, "query"),
  getBillers,
);

/**
 * @route   GET /api/transactions/bill-payments
 * @desc    Get bill payment history
 * @access  Private (Consumer only)
 */
router.get(
  "/bill-payments",
  authenticateConsumer,
  validateZodSchema(getBillPaymentHistorySchema, "query"),
  getBillPaymentHistory,
);

/**
 * @route   POST /api/transactions/pay-bill
 * @desc    Pay a bill (electricity, gas, water, internet, mobile, TV)
 * @access  Private (Consumer only)
 */
router.post(
  "/pay-bill",
  authenticateConsumer,
  validateZodSchema(payBillSchema, "body"),
  payBill,
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
