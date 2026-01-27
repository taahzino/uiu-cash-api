import { Router } from "express";
import { getWalletInfo } from "../controllers/wallet.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/wallet
 * @desc    Get wallet information (balance, limits, recent transactions)
 * @access  Private (Consumer or Agent)
 */
router.get("/", authenticateUser, getWalletInfo);

export default router;
