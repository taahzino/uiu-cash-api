import { Request, Response } from "express";
import logger from "../config/_logger";
import { Wallets } from "../models/Wallets.model";
import { Transactions } from "../models/Transactions.model";
import {
  sendResponse,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
} from "../utilities/response";

/**
 * Get Wallet Information
 * GET /api/wallet
 */
export const getWalletInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    // Get wallet
    const wallet = await Wallets.findByUserId(userId);
    if (!wallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Wallet not found",
      });
    }

    // Get last 5 transactions
    const recentTransactions = await Transactions.findByUserId(userId, 5, 0);

    return sendResponse(res, STATUS_OK, {
      message: "Wallet information retrieved successfully",
      data: {
        availableBalance: wallet.available_balance,
        dailyLimit: wallet.daily_limit,
        monthlyLimit: wallet.monthly_limit,
        dailySpent: wallet.daily_spent,
        monthlySpent: wallet.monthly_spent,
        currency: wallet.currency,
        recentTransactions: recentTransactions.map((txn: any) => ({
          id: txn.id,
          transactionId: txn.transaction_id,
          type: txn.type,
          amount: txn.amount,
          fee: txn.fee,
          status: txn.status,
          description: txn.description,
          createdAt: txn.created_at,
        })),
      },
    });
  } catch (error: any) {
    logger.error("Get wallet info error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching wallet information",
    });
  }
};
