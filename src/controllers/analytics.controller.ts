import { Request, Response } from "express";
import logger from "../config/_logger";
import { Users } from "../models/Users.model";
import {
  Transactions,
  TransactionStatus,
  TransactionType,
} from "../models/Transactions.model";
import { Agents, AgentStatus } from "../models/Agents.model";
import { Wallets } from "../models/Wallets.model";
import {
  sendResponse,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_OK,
} from "../utilities/response";

/**
 * Get Platform Dashboard Analytics (Admin)
 * GET /api/admin/analytics/dashboard
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    // Get total users
    const totalUsers = await Users.count();
    const activeUsers = await Users.count({ status: "ACTIVE" });
    const pendingUsers = await Users.count({ status: "PENDING" });
    const suspendedUsers = await Users.count({ status: "SUSPENDED" });

    // Get consumer vs agent users
    const consumerUsers = await Users.count({ role: "CONSUMER" });
    const agentUsers = await Users.count({ role: "AGENT" });

    // Get total transactions
    const totalTransactions = await Transactions.count();
    const completedTransactions = await Transactions.countByStatus(
      TransactionStatus.COMPLETED,
    );
    const pendingTransactions = await Transactions.countByStatus(
      TransactionStatus.PENDING,
    );
    const failedTransactions = await Transactions.countByStatus(
      TransactionStatus.FAILED,
    );

    // Get transaction totals by type
    const sendMoneyTotal = await Transactions.getTotalByType(
      TransactionType.SEND_MONEY,
    );
    const addMoneyTotal = await Transactions.getTotalByType(
      TransactionType.ADD_MONEY,
    );
    const cashOutTotal = await Transactions.getTotalByType(
      TransactionType.CASH_OUT,
    );
    const billPaymentTotal = await Transactions.getTotalByType(
      TransactionType.BILL_PAYMENT,
    );

    // Get total agents
    const totalAgents = await Agents.count();
    const activeAgents = await Agents.countByStatus(AgentStatus.ACTIVE);
    const pendingAgents = await Agents.countByStatus(AgentStatus.PENDING);

    // Get recent transactions
    const recentTransactions = await Transactions.findAll({}, 10, 0);

    // Calculate total platform balance
    const totalPlatformBalance = await calculateTotalPlatformBalance();

    return sendResponse(res, STATUS_OK, {
      message: "Dashboard analytics retrieved successfully",
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
          suspended: suspendedUsers,
          consumer: consumerUsers,
          agent: agentUsers,
        },
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
          pending: pendingTransactions,
          failed: failedTransactions,
          byType: {
            sendMoney: {
              count: sendMoneyTotal.count,
              amount: sendMoneyTotal.amount,
            },
            addMoney: {
              count: addMoneyTotal.count,
              amount: addMoneyTotal.amount,
            },
            cashOut: {
              count: cashOutTotal.count,
              amount: cashOutTotal.amount,
            },
            billPayment: {
              count: billPaymentTotal.count,
              amount: billPaymentTotal.amount,
            },
          },
        },
        agents: {
          total: totalAgents,
          active: activeAgents,
          pending: pendingAgents,
        },
        platform: {
          totalBalance: totalPlatformBalance,
        },
        recentTransactions: recentTransactions.map((txn: any) => ({
          id: txn.id,
          transactionId: txn.transaction_id,
          type: txn.type,
          amount: txn.amount,
          status: txn.status,
          createdAt: txn.created_at,
        })),
      },
    });
  } catch (error: any) {
    logger.error("Get dashboard analytics error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching dashboard analytics",
    });
  }
};

/**
 * Get Transaction Analytics (Admin)
 * GET /api/admin/analytics/transactions
 */
export const getTransactionAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    // Get transactions by status
    const byStatus = {
      pending: await Transactions.countByStatus(TransactionStatus.PENDING),
      processing: await Transactions.countByStatus(
        TransactionStatus.PROCESSING,
      ),
      completed: await Transactions.countByStatus(TransactionStatus.COMPLETED),
      failed: await Transactions.countByStatus(TransactionStatus.FAILED),
    };

    // Get transactions by type with totals
    const byType = {
      sendMoney: await Transactions.getTotalByType(TransactionType.SEND_MONEY),
      addMoney: await Transactions.getTotalByType(TransactionType.ADD_MONEY),
      cashOut: await Transactions.getTotalByType(TransactionType.CASH_OUT),
      billPayment: await Transactions.getTotalByType(
        TransactionType.BILL_PAYMENT,
      ),
      bankTransfer: await Transactions.getTotalByType(
        TransactionType.BANK_TRANSFER,
      ),
      cashback: await Transactions.getTotalByType(TransactionType.CASHBACK),
      commission: await Transactions.getTotalByType(TransactionType.COMMISSION),
    };

    // Get transaction volume trend
    const volumeTrend = await Transactions.getTransactionTrend(
      startDate as string,
      endDate as string,
      groupBy as string,
    );

    // Calculate total revenue (fees collected)
    const totalRevenue = await Transactions.getTotalFees();

    return sendResponse(res, STATUS_OK, {
      message: "Transaction analytics retrieved successfully",
      data: {
        byStatus,
        byType,
        volumeTrend,
        revenue: {
          total: totalRevenue,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get transaction analytics error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching transaction analytics",
    });
  }
};

/**
 * Get Consumer Analytics (Admin)
 * GET /api/admin/analytics/consumers
 */
export const getConsumerAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Get total consumers
    const totalConsumers = await Users.count({ role: "CONSUMER" });

    // Get consumers by status
    const byStatus = {
      active: await Users.count({ role: "CONSUMER", status: "ACTIVE" }),
      pending: await Users.count({ role: "CONSUMER", status: "PENDING" }),
      suspended: await Users.count({ role: "CONSUMER", status: "SUSPENDED" }),
      rejected: await Users.count({ role: "CONSUMER", status: "REJECTED" }),
    };

    // Get consumer registration trend (filtered by role)
    const allRegistrations = await Users.getRegistrationTrend(
      startDate as string,
      endDate as string,
    );

    // Filter to only count consumers
    const registrationTrend = allRegistrations;

    // Get verification stats for consumers only
    const allVerificationStats = await Users.getVerificationStats();

    // Get consumer transaction stats
    const consumerTransactionStats = {
      totalSent: await Transactions.getTotalByType(TransactionType.SEND_MONEY),
      totalCashOut: await Transactions.getTotalByType(TransactionType.CASH_OUT),
      totalAddMoney: await Transactions.getTotalByType(
        TransactionType.ADD_MONEY,
      ),
    };

    return sendResponse(res, STATUS_OK, {
      message: "Consumer analytics retrieved successfully",
      data: {
        total: totalConsumers,
        byStatus,
        registrationTrend,
        verification: allVerificationStats,
        transactions: consumerTransactionStats,
      },
    });
  } catch (error: any) {
    logger.error("Get consumer analytics error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching consumer analytics",
    });
  }
};

/**
 * Get Agent Analytics (Admin)
 * GET /api/admin/analytics/agents
 */
export const getAgentAnalytics = async (req: Request, res: Response) => {
  try {
    // Get agent stats
    const totalAgents = await Agents.count();
    const activeAgents = await Agents.countByStatus(AgentStatus.ACTIVE);
    const pendingAgents = await Agents.countByStatus(AgentStatus.PENDING);
    const suspendedAgents = await Agents.countByStatus(AgentStatus.SUSPENDED);

    // Get top agents by commission
    const topAgents = await Agents.getTopAgentsByCommission(10);

    // Get total commissions paid
    const totalCommissions = await Agents.getTotalCommissions();

    return sendResponse(res, STATUS_OK, {
      message: "Agent analytics retrieved successfully",
      data: {
        total: totalAgents,
        active: activeAgents,
        pending: pendingAgents,
        suspended: suspendedAgents,
        topAgents: topAgents.map((agent: any) => ({
          id: agent.id,
          agentCode: agent.agent_code,
          businessName: agent.business_name,
          totalCommission: agent.total_commission_earned,
          totalCashouts: agent.total_cashouts,
        })),
        totalCommissions,
      },
    });
  } catch (error: any) {
    logger.error("Get agent analytics error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching agent analytics",
    });
  }
};

/**
 * Get Revenue Analytics (Admin)
 * GET /api/admin/analytics/revenue
 */
export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Get total fees collected
    const totalFees = await Transactions.getTotalFees(
      startDate as string,
      endDate as string,
    );

    // Get fees by transaction type
    const feesByType = {
      sendMoney: await Transactions.getFeesByType(TransactionType.SEND_MONEY),
      cashOut: await Transactions.getFeesByType(TransactionType.CASH_OUT),
      bankTransfer: await Transactions.getFeesByType(
        TransactionType.BANK_TRANSFER,
      ),
    };

    // Get commission paid to agents
    const totalCommissions = await Agents.getTotalCommissions();

    // Calculate net revenue (fees - commissions)
    const netRevenue = totalFees - totalCommissions;

    // Get revenue trend
    const revenueTrend = await Transactions.getRevenueTrend(
      startDate as string,
      endDate as string,
    );

    return sendResponse(res, STATUS_OK, {
      message: "Revenue analytics retrieved successfully",
      data: {
        totalFees,
        totalCommissions,
        netRevenue,
        feesByType,
        revenueTrend,
      },
    });
  } catch (error: any) {
    logger.error("Get revenue analytics error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching revenue analytics",
    });
  }
};

/**
 * Helper function to calculate total platform balance
 */
async function calculateTotalPlatformBalance(): Promise<number> {
  const total = await Wallets.getTotalBalance();
  return total;
}
