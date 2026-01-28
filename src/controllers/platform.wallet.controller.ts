import { Request, Response } from "express";
import logger from "../config/_logger";
import { PlatformWallet } from "../models/PlatformWallet.model";
import {
  PlatformWalletTransactions,
  PlatformTransactionType,
} from "../models/PlatformWalletTransactions.model";
import {
  sendResponse,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_OK,
} from "../utilities/response";

/**
 * Get Platform Wallet Statistics (Admin)
 * GET /api/admin/platform-wallet/stats
 */
export const getPlatformWalletStats = async (req: Request, res: Response) => {
  try {
    const stats = await PlatformWallet.getStatistics();

    return sendResponse(res, STATUS_OK, {
      message: "Platform wallet statistics retrieved successfully",
      data: {
        balance: stats.balance,
        totalFeesCollected: stats.totalFeesCollected,
        totalCommissionsPaid: stats.totalCommissionsPaid,
        totalBonusesGiven: stats.totalBonusesGiven,
        netRevenue: stats.netRevenue,
        lastTransactionAt: stats.lastTransactionAt,
      },
    });
  } catch (error: any) {
    logger.error("Get platform wallet stats error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching platform wallet statistics",
    });
  }
};

/**
 * Perform Platform Wallet Reconciliation (Admin)
 * GET /api/admin/platform-wallet/reconcile
 */
export const reconcilePlatformWallet = async (req: Request, res: Response) => {
  try {
    const result = await PlatformWallet.reconcile();

    const statusCode = result.success ? STATUS_OK : STATUS_OK; // Still return 200 but with error details

    return sendResponse(res, statusCode, {
      message: result.message,
      data: {
        success: result.success,
        currentBalance: result.currentBalance,
        calculatedBalance: result.calculatedBalance,
        discrepancy: result.discrepancy,
        reconciliationTimestamp: new Date(),
      },
    });
  } catch (error: any) {
    logger.error("Platform wallet reconciliation error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during platform wallet reconciliation",
    });
  }
};

/**
 * Get Platform Wallet Transaction History (Admin)
 * GET /api/admin/platform-wallet/transactions
 */
export const getPlatformWalletTransactions = async (
  req: Request,
  res: Response,
) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    console.log(
      `[Platform Wallet Transactions] Fetching page ${pageNum}, limit ${limitNum}`,
    );
    if (startDate || endDate) {
      console.log(
        `[Platform Wallet Transactions] Date filter - Start: ${startDate}, End: ${endDate}`,
      );
    }

    const filters: any = {};
    if (startDate) {
      filters.start_date = new Date(startDate as string);
    }
    if (endDate) {
      filters.end_date = new Date(endDate as string);
    }

    const { transactions, total } = await PlatformWalletTransactions.getHistory(
      pageNum,
      limitNum,
      filters,
    );

    console.log(
      `[Platform Wallet Transactions] Retrieved ${transactions.length} transactions out of ${total} total`,
    );

    return sendResponse(res, STATUS_OK, {
      message: "Platform wallet transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get platform wallet transactions error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching platform wallet transactions",
    });
  }
};

/**
 * Get Platform Wallet Revenue Summary (Admin)
 * GET /api/admin/platform-wallet/revenue-summary
 */
export const getPlatformWalletRevenueSummary = async (
  req: Request,
  res: Response,
) => {
  try {
    const stats = await PlatformWallet.getStatistics();

    return sendResponse(res, STATUS_OK, {
      message: "Platform wallet revenue summary retrieved successfully",
      data: {
        allTime: {
          totalFeesCollected: stats.totalFeesCollected,
          totalCommissionsPaid: stats.totalCommissionsPaid,
          totalBonusesGiven: stats.totalBonusesGiven,
          netRevenue: stats.netRevenue,
        },
        currentBalance: stats.balance,
        lastTransactionAt: stats.lastTransactionAt,
      },
    });
  } catch (error: any) {
    logger.error("Get platform wallet revenue summary error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message:
        "An error occurred while fetching platform wallet revenue summary",
    });
  }
};
