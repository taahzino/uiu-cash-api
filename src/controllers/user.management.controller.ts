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
 * Get All Users (Admin)
 * GET /api/admin/users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, role, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: any = {};
    if (status) conditions.status = status;
    if (role) conditions.role = role;

    let users;
    let total;

    if (search) {
      // Full-text search
      users = await Users.searchUsers(
        search as string,
        limitNum,
        offset
      );
      total = users.length; // Approximate
    } else {
      users = await Users.findAll(conditions, limitNum, offset);
      total = await Users.count(conditions);
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
        };
      })
    );

    return sendResponse(res, STATUS_OK, {
      message: "Users retrieved successfully",
      data: {
        users: usersWithWallets,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get all users error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching users",
    });
  }
};

/**
 * Get User Details (Admin)
 * GET /api/admin/users/:id
 */
export const getUserDetails = async (req: Request, res: Response) => {
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
 * Update User Status (Admin)
 * PUT /api/admin/users/:id/status
 */
export const updateUserStatus = async (req: Request, res: Response) => {
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
      `Admin ${res.locals.admin?.adminId} updated user ${id} status to ${status}`
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
 * Search Users (Admin)
 * GET /api/admin/users/search
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Search query is required",
      });
    }

    const users = await Users.searchUsers(
      query as string,
      parseInt(limit as string)
    );

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
          walletBalance: wallet?.balance || 0,
        };
      })
    );

    return sendResponse(res, STATUS_OK, {
      message: "Search results",
      data: {
        users: usersWithWallets,
        count: usersWithWallets.length,
      },
    });
  } catch (error: any) {
    logger.error("Search users error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while searching users",
    });
  }
};

/**
 * Get User Transactions (Admin)
 * GET /api/admin/users/:id/transactions
 */
export const getUserTransactions = async (req: Request, res: Response) => {
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
