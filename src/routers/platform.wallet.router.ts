import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth";
import {
  getPlatformWalletStats,
  reconcilePlatformWallet,
  getPlatformWalletTransactions,
  getPlatformWalletRevenueSummary,
} from "../controllers/platform.wallet.controller";

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/platform-wallet/stats
 * @desc    Get platform wallet statistics
 * @access  Admin
 */
router.get("/stats", getPlatformWalletStats);

/**
 * @route   GET /api/admin/platform-wallet/reconcile
 * @desc    Perform platform wallet reconciliation
 * @access  Admin
 */
router.get("/reconcile", reconcilePlatformWallet);

/**
 * @route   GET /api/admin/platform-wallet/transactions
 * @desc    Get platform wallet transaction history
 * @access  Admin
 */
router.get("/transactions", getPlatformWalletTransactions);

/**
 * @route   GET /api/admin/platform-wallet/revenue-summary
 * @desc    Get platform wallet revenue summary
 * @access  Admin
 */
router.get("/revenue-summary", getPlatformWalletRevenueSummary);

export default router;
