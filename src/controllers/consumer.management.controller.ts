import { Request, Response } from "express";
import logger from "../config/_logger";
import { Users, UserStatus } from "../models/Users.model";
import { Wallets } from "../models/Wallets.model";
import { Transactions } from "../models/Transactions.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
} from "../utilities/response";

/**
 * Get Consumers Paginated with Search and Filters (Admin)
 * POST /api/admin/consumers/list
 */
export const getConsumersPaginated = async (req: Request, res: Response) => {
  try {
    const { offset, limit, search, startDate, endDate, status } = req.body;
    console.log("[CONSUMER PAGINATED] Request body:", {
      offset,
      limit,
      search,
      startDate,
      endDate,
      status,
    });

    let conditions: any = { role: "CONSUMER" };
    if (status) conditions.status = status;

    // Add date range filter if provided
    if (startDate && endDate) {
      conditions.created_at_range = { start: startDate, end: endDate };
    } else if (startDate) {
      conditions.created_at_gte = startDate;
    } else if (endDate) {
      conditions.created_at_lte = endDate;
    }

    let users;
    let total;

    if (search && search.trim()) {
      // Search by name, email, or phone
      console.log("[CONSUMER PAGINATED] Calling searchUsers with:", {
        search,
        limit,
        offset,
      });
      users = await Users.searchUsers(search, limit, offset);
      console.log(
        "[CONSUMER PAGINATED] Search returned:",
        users.length,
        "users",
      );
      // Filter by role and conditions after search
      users = users.filter((user: any) => {
        if (user.role !== "CONSUMER") return false;
        if (status && user.status !== status) return false;
        if (startDate && new Date(user.created_at) < new Date(startDate))
          return false;
        if (endDate && new Date(user.created_at) > new Date(endDate))
          return false;
        return true;
      });
      total = users.length;
    } else {
      console.log("[CONSUMER PAGINATED] Calling findAll with:", {
        conditions,
        limit,
        offset,
      });
      users = await Users.findAll(conditions, limit, offset);
      total = await Users.count(conditions);
      console.log(
        "[CONSUMER PAGINATED] FindAll returned:",
        users.length,
        "users, total:",
        total,
      );
    }

    // Get wallet info for each user
    const usersWithWallets = await Promise.all(
      users.map(async (user: any) => {
        const wallet = await Wallets.findByUserId(user.id);
        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          walletBalance: wallet?.balance || 0,
          walletAvailableBalance: wallet?.available_balance || 0,
        };
      }),
    );

    return sendResponse(res, STATUS_OK, {
      message: "Consumers retrieved successfully",
      data: {
        consumers: usersWithWallets,
        pagination: {
          offset,
          limit,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get consumers paginated error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching consumers",
    });
  }
};

/**
 * Get Consumer Details (Admin)
 * GET /api/admin/consumers/:id
 */
export const getConsumerDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await Users.findById(id);
    if (!user) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User not found",
      });
    }

    const wallet = await Wallets.findByUserId(id);

    // Get recent transactions
    const recentTransactions = await Transactions.findByUserId(id, 10, 0);

    return sendResponse(res, STATUS_OK, {
      message: "User details retrieved successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          dateOfBirth: user.date_of_birth,
          nidNumber: user.nid_number,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        wallet: wallet
          ? {
              balance: wallet.balance,
              availableBalance: wallet.available_balance,
              pendingBalance: wallet.pending_balance,
              currency: wallet.currency,
              dailyLimit: wallet.daily_limit,
              monthlyLimit: wallet.monthly_limit,
              dailySpent: wallet.daily_spent,
              monthlySpent: wallet.monthly_spent,
              lastTransactionAt: wallet.last_transaction_at,
            }
          : null,
        recentTransactions: recentTransactions.map((txn: any) => ({
          id: txn.id,
          transactionId: txn.transaction_id,
          type: txn.type,
          amount: txn.amount,
          fee: txn.fee,
          status: txn.status,
          createdAt: txn.created_at,
        })),
      },
    });
  } catch (error: any) {
    logger.error("Get user details error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching user details",
    });
  }
};

/**
 * Update Consumer Status (Admin)
 * PUT /api/admin/consumers/:id/status
 */
export const updateConsumerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Status is required",
      });
    }

    // Validate status
    const validStatuses = [
      UserStatus.ACTIVE,
      UserStatus.SUSPENDED,
      UserStatus.REJECTED,
    ];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Invalid status",
      });
    }

    const user = await Users.findById(id);
    if (!user) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User not found",
      });
    }

    const updatedUser = await Users.updateStatus(id, status);

    logger.info(
      `Admin ${res.locals.admin?.id} updated user ${id} status to ${status}`,
    );

    return sendResponse(res, STATUS_OK, {
      message: "User status updated successfully",
      data: {
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          status: updatedUser!.status,
        },
      },
    });
  } catch (error: any) {
    logger.error("Update user status error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while updating user status",
    });
  }
};

/**
 * Get Consumer Transactions (Admin)
 * GET /api/admin/consumers/:id/transactions
 */
export const getConsumerTransactions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const user = await Users.findById(id);
    if (!user) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User not found",
      });
    }

    const transactions = await Transactions.findByUserId(id, limitNum, offset);
    const total = await Transactions.countByUserId(id);

    return sendResponse(res, STATUS_OK, {
      message: "User transactions retrieved successfully",
      data: {
        transactions: transactions.map((txn: any) => ({
          id: txn.id,
          transactionId: txn.transaction_id,
          type: txn.type,
          amount: txn.amount,
          fee: txn.fee,
          totalAmount: txn.total_amount,
          status: txn.status,
          description: txn.description,
          createdAt: txn.created_at,
          completedAt: txn.completed_at,
        })),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get user transactions error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching user transactions",
    });
  }
};
