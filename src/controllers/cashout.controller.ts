import { Request, Response } from "express";
import logger from "../config/_logger";
import { Agents, AgentStatus } from "../models/Agents.model";
import { AgentCashouts, CashoutStatus } from "../models/AgentCashouts.model";
import {
  Transactions,
  TransactionType,
  TransactionStatus,
} from "../models/Transactions.model";
import { Wallets } from "../models/Wallets.model";
import { Ledgers, EntryType } from "../models/Ledgers.model";
import { SystemConfig } from "../models/SystemConfig.model";
import { Users } from "../models/Users.model";
import { PlatformWallet } from "../models/PlatformWallet.model";
import { PlatformTransactionType } from "../models/PlatformWalletTransactions.model";
import { getConnection } from "../config/_database";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_FORBIDDEN,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_CREATED,
} from "../utilities/response";

/**
 * Initiate Cash Out (User Side)
 * POST /api/transactions/cash-out/initiate
 */
export const initiateCashOut = async (req: Request, res: Response) => {
  const connection = await getConnection();

  try {
    const { agentCode, amount, location, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "User ID not found in token",
      });
    }

    // Find agent by agent code
    const agent = await Agents.findByAgentCode(agentCode);
    if (!agent) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent not found with the provided agent code",
      });
    }

    // Check if agent is active
    if (agent.status !== AgentStatus.ACTIVE) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "This agent is not currently active",
      });
    }

    // Get user wallet
    const userWallet = await Wallets.findByUserId(userId);
    if (!userWallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User wallet not found",
      });
    }

    // Get cash out fee percentage from system config
    const feeConfig = await SystemConfig.findByKey("cash_out_fee_percentage");
    const feePercentage = parseFloat(feeConfig?.config_value || "1.85");
    const fee = (amount * feePercentage) / 100;
    const totalAmount = amount + fee;

    // Check if user has sufficient balance
    if (userWallet.balance < totalAmount) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Insufficient balance",
        data: {
          required: totalAmount,
          available: userWallet.balance,
          shortage: totalAmount - userWallet.balance,
        },
      });
    }

    // Check spending limits
    const canSpendDaily = await Wallets.checkSpendingLimit(
      userWallet.id,
      totalAmount,
      "daily",
    );
    const canSpendMonthly = await Wallets.checkSpendingLimit(
      userWallet.id,
      totalAmount,
      "monthly",
    );

    if (!canSpendDaily) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Daily spending limit exceeded",
      });
    }

    if (!canSpendMonthly) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Monthly spending limit exceeded",
      });
    }

    await connection.beginTransaction();

    try {
      // Create transaction
      const transaction = await Transactions.createTransaction({
        type: TransactionType.CASH_OUT,
        sender_id: userId,
        receiver_id: agent.user_id,
        sender_wallet_id: userWallet.id,
        amount,
        fee,
        description: notes || "Cash out request",
        metadata: {
          agent_code: agent.agent_code,
          agent_id: agent.id,
          location: location || null,
        },
      });

      // Get agent commission rate from system config
      const commissionConfig = await SystemConfig.findByKey(
        "agent_commission_rate",
      );
      const commissionRate = parseFloat(
        commissionConfig?.config_value || "1.5",
      );
      const commission = (amount * commissionRate) / 100;

      // Create agent cashout record
      await AgentCashouts.createCashout({
        transaction_id: transaction.id,
        agent_id: agent.id,
        requester_id: userId,
        amount,
        fee,
        commission,
        location: location || null,
        notes: notes || null,
      });

      await connection.commit();

      logger.info(
        `Cash out initiated: Transaction ${transaction.id} - User ${userId} -> Agent ${agent.agent_code} - Amount: ${amount} BDT`,
      );

      return sendResponse(res, STATUS_CREATED, {
        message:
          "Cash out request initiated successfully. Please visit the agent to complete the transaction.",
        data: {
          transaction: {
            id: transaction.id,
            transaction_id: transaction.transaction_id,
            amount,
            fee,
            total_amount: totalAmount,
            status: transaction.status,
          },
          agent: {
            agent_code: agent.agent_code,
            business_name: agent.business_name,
            business_address: agent.business_address,
          },
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error("Initiate cash out error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to initiate cash out",
    });
  } finally {
    connection.release();
  }
};

/**
 * Complete Cash Out (Agent Side)
 * POST /api/agent/cash-out/complete
 */
export const completeCashOut = async (req: Request, res: Response) => {
  const connection = await getConnection();

  try {
    const { transactionId } = req.body;
    const agentUserId = req.user?.id;

    if (!agentUserId) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "User ID not found in token",
      });
    }

    // Get agent profile
    const agent = await Agents.findByUserId(agentUserId);
    if (!agent) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Agent profile not found",
      });
    }

    // Check if agent is active
    if (agent.status !== AgentStatus.ACTIVE) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Your agent account is not active",
      });
    }

    // Find transaction
    const transaction = await Transactions.findById(transactionId);
    if (!transaction) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Transaction not found",
      });
    }

    // Verify transaction is for this agent
    if (transaction.receiver_id !== agentUserId) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "This transaction is not assigned to you",
      });
    }

    // Check if transaction is in pending state
    if (transaction.status !== TransactionStatus.PENDING) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: `Transaction is already ${transaction.status.toLowerCase()}`,
      });
    }

    // Get cashout record
    const cashout = await AgentCashouts.findByTransactionId(transactionId);
    if (!cashout) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Cashout record not found",
      });
    }

    // Get user wallet
    const userWallet = await Wallets.findById(
      transaction.sender_wallet_id as string,
    );
    if (!userWallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User wallet not found",
      });
    }

    // Get agent wallet
    const agentWallet = await Wallets.findByUserId(agentUserId);
    if (!agentWallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Agent wallet not found",
      });
    }

    await connection.beginTransaction();

    try {
      // Deduct from user wallet (amount + fee)
      const userNewBalance = userWallet.balance - transaction.total_amount;
      await Wallets.updateBalance(
        userWallet.id,
        userNewBalance,
        userNewBalance,
      );

      // Create ledger entry for user (DEBIT)
      await Ledgers.createLedgerEntry({
        transaction_id: transaction.id,
        wallet_id: userWallet.id,
        entry_type: EntryType.DEBIT,
        amount: transaction.total_amount,
        balance_before: userWallet.balance,
        balance_after: userNewBalance,
        description: `Cash out - ${agent.business_name}`,
      });

      // Credit commission to agent wallet
      const agentNewBalance = agentWallet.balance + cashout.commission;
      await Wallets.updateBalance(
        agentWallet.id,
        agentNewBalance,
        agentNewBalance,
      );

      // Deduct commission from platform wallet
      await PlatformWallet.deductBalance(
        cashout.commission,
        PlatformTransactionType.COMMISSION_PAID,
        `Commission paid to agent ${agent.agent_code} for cash out`,
        {
          relatedTransactionId: transaction.id,
          relatedAgentId: agent.id,
          relatedUserId: transaction.sender_id || undefined,
        },
      );

      // Create ledger entry for agent commission (CREDIT)
      await Ledgers.createLedgerEntry({
        transaction_id: transaction.id,
        wallet_id: agentWallet.id,
        entry_type: EntryType.CREDIT,
        amount: cashout.commission,
        balance_before: agentWallet.balance,
        balance_after: agentNewBalance,
        description: `Cash out commission`,
      });

      // Update transaction status
      await Transactions.updateById(transactionId, {
        status: TransactionStatus.COMPLETED,
        completed_at: new Date(),
      });

      // Update cashout status
      await AgentCashouts.updateById(cashout.id, {
        status: CashoutStatus.COMPLETED,
      });

      // Update user spending limits
      await Wallets.incrementSpending(
        userWallet.id,
        transaction.total_amount,
        "daily",
      );
      await Wallets.incrementSpending(
        userWallet.id,
        transaction.total_amount,
        "monthly",
      );

      // Update agent statistics
      await Agents.incrementStats(agent.id, cashout.commission);

      // Create COMMISSION transaction for agent
      await Transactions.createTransaction({
        type: TransactionType.COMMISSION,
        receiver_id: agentUserId,
        receiver_wallet_id: agentWallet.id,
        amount: cashout.commission,
        fee: 0,
        description: `Commission from cash out transaction ${transaction.transaction_id}`,
        reference_number: transaction.transaction_id,
      });

      await connection.commit();

      logger.info(
        `Cash out completed: Transaction ${transaction.id} - Agent ${agent.agent_code} completed cash out for ${transaction.amount} BDT - Commission: ${cashout.commission} BDT`,
      );

      // Get user details for response
      const user = await Users.findById(transaction.sender_id as string);

      return sendResponse(res, STATUS_OK, {
        message: "Cash out completed successfully",
        data: {
          transaction: {
            id: transaction.id,
            transaction_id: transaction.transaction_id,
            amount: transaction.amount,
            fee: transaction.fee,
            total_amount: transaction.total_amount,
            commission: cashout.commission,
            status: TransactionStatus.COMPLETED,
            completed_at: new Date(),
          },
          user: user
            ? {
                name: `${user.first_name} ${user.last_name}`,
                phone: user.phone,
              }
            : null,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error("Complete cash out error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to complete cash out",
    });
  } finally {
    connection.release();
  }
};

/**
 * Get Cash Out History (User Side)
 * GET /api/transactions/cash-out/history
 */
export const getCashOutHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = "1", limit = "20", status } = req.query;

    if (!userId) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "User ID not found in token",
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get cash out transactions
    const filters: any = {
      sender_id: userId,
      type: TransactionType.CASH_OUT,
    };

    if (
      status &&
      Object.values(TransactionStatus).includes(status as TransactionStatus)
    ) {
      filters.status = status;
    }

    const transactions = await Transactions.findAll({
      where: filters,
      limit: limitNum,
      offset,
      orderBy: "created_at DESC",
    });

    const total = await Transactions.count({ where: filters });

    // Enhance with cashout details
    const enhancedTransactions = await Promise.all(
      transactions.map(async (transaction: any) => {
        const cashout = await AgentCashouts.findByTransactionId(transaction.id);
        const agent = cashout ? await Agents.findById(cashout.agent_id) : null;

        return {
          ...transaction,
          cashout_details: cashout
            ? {
                commission: cashout.commission,
                location: cashout.location,
                notes: cashout.notes,
              }
            : null,
          agent: agent
            ? {
                agent_code: agent.agent_code,
                business_name: agent.business_name,
              }
            : null,
        };
      }),
    );

    return sendResponse(res, STATUS_OK, {
      message: "Cash out history retrieved successfully",
      data: {
        transactions: enhancedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get cash out history error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to retrieve cash out history",
    });
  }
};

/**
 * Get Agent Cash Out History (Agent Side)
 * GET /api/agent/cash-out/history
 */
export const getAgentCashOutHistory = async (req: Request, res: Response) => {
  try {
    const agentUserId = req.user?.id;
    const { page = "1", limit = "20", status } = req.query;

    if (!agentUserId) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "User ID not found in token",
      });
    }

    // Get agent profile
    const agent = await Agents.findByUserId(agentUserId);
    if (!agent) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Agent profile not found",
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get cashouts by agent
    const cashouts = await AgentCashouts.findByAgentId(
      agent.id,
      status as CashoutStatus,
      limitNum,
      offset,
    );

    const total = await AgentCashouts.countByAgentId(
      agent.id,
      status as CashoutStatus,
    );

    // Enhance with transaction and user details
    const enhancedCashouts = await Promise.all(
      cashouts.map(async (cashout: any) => {
        const transaction = await Transactions.findById(cashout.transaction_id);
        const user = transaction
          ? await Users.findById(transaction.sender_id as string)
          : null;

        return {
          ...cashout,
          transaction: transaction
            ? {
                transaction_id: transaction.transaction_id,
                amount: transaction.amount,
                fee: transaction.fee,
                total_amount: transaction.total_amount,
                status: transaction.status,
                created_at: transaction.created_at,
                completed_at: transaction.completed_at,
              }
            : null,
          user: user
            ? {
                name: `${user.first_name} ${user.last_name}`,
                phone: user.phone,
              }
            : null,
        };
      }),
    );

    return sendResponse(res, STATUS_OK, {
      message: "Cash out history retrieved successfully",
      data: {
        cashouts: enhancedCashouts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        summary: {
          total_cashouts: agent.total_cashouts,
          total_commission_earned: agent.total_commission_earned,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get agent cash out history error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "Failed to retrieve cash out history",
    });
  }
};
