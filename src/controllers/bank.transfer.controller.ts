import { Request, Response } from "express";
import path from "path";
import logger from "../config/_logger";
import {
  BankTransfers,
  BankTransferStatus,
} from "../models/BankTransfers.model";
import {
  Transactions,
  TransactionType,
  TransactionStatus,
} from "../models/Transactions.model";
import { Wallets } from "../models/Wallets.model";
import { Ledgers, EntryType } from "../models/Ledgers.model";
import { SystemConfig } from "../models/SystemConfig.model";
import {
  PlatformWallet,
  PlatformTransactionType,
} from "../models/PlatformWallet.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
  STATUS_CREATED,
} from "../utilities/response";

// Import bank accounts simulation
const bankAccounts = require(
  path.join(__dirname, "../../simulation/bank_accounts"),
);

/**
 * Calculate bank transfer fee
 * Fee: 1.5% of amount with minimum ৳10
 */
const calculateTransferFee = async (amount: number): Promise<number> => {
  try {
    const feePercentageConfig = await SystemConfig.findByKey(
      "bank_transfer_fee_percentage",
    );
    const minFeeConfig = await SystemConfig.findByKey("bank_transfer_min_fee");

    const feePercentage = feePercentageConfig
      ? parseFloat(feePercentageConfig.config_value)
      : 1.5;

    const minFee = minFeeConfig ? parseFloat(minFeeConfig.config_value) : 10.0;

    const calculatedFee = (amount * feePercentage) / 100;
    return Math.max(calculatedFee, minFee);
  } catch (error: any) {
    logger.warn(
      `Error fetching bank transfer fee config: ${error.message}. Using defaults.`,
    );
    const calculatedFee = (amount * 1.5) / 100;
    return Math.max(calculatedFee, 10.0);
  }
};

/**
 * Bank Transfer - Initiate Transfer
 * POST /api/bank/transfer
 */
export const initiateTransfer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.userType;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const {
      bankName,
      accountNumber,
      accountHolderName,
      routingNumber,
      transferType,
      amount,
      description,
    } = req.body;

    console.log(
      `[Bank Transfer] User: ${userId} (${userType}), Amount: ৳${amount}, Bank: ${bankName}`,
    );

    // Get user wallet
    const wallet = await Wallets.findByUserId(userId);
    if (!wallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Wallet not found",
      });
    }

    // Calculate fee (No fee for agents)
    const processingFee =
      userType === "Agent" ? 0 : await calculateTransferFee(amount);
    const totalAmount = amount + processingFee;

    console.log(
      `[Bank Transfer] Fee calculation - Processing Fee: ৳${processingFee}, Total: ৳${totalAmount}`,
    );

    // Check available balance
    console.log(
      `[Bank Transfer] Balance check - Available: ৳${wallet.available_balance}, Required: ৳${totalAmount}`,
    );

    if (wallet.available_balance < totalAmount) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Insufficient balance",
        data: {
          required: totalAmount,
          available: wallet.available_balance,
          fee: processingFee,
        },
      });
    }

    // Check daily spending limit
    const newDailySpent =
      parseFloat(wallet.daily_spent.toString()) + totalAmount;
    if (newDailySpent > parseFloat(wallet.daily_limit.toString())) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Daily spending limit exceeded",
        data: {
          dailyLimit: wallet.daily_limit,
          currentSpent: wallet.daily_spent,
          attemptedAmount: totalAmount,
        },
      });
    }

    // Check monthly spending limit
    const newMonthlySpent =
      parseFloat(wallet.monthly_spent.toString()) + totalAmount;
    if (newMonthlySpent > parseFloat(wallet.monthly_limit.toString())) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Monthly spending limit exceeded",
        data: {
          monthlyLimit: wallet.monthly_limit,
          currentSpent: wallet.monthly_spent,
          attemptedAmount: totalAmount,
        },
      });
    }

    // Create transaction
    const transaction = await Transactions.createTransaction({
      type: TransactionType.BANK_TRANSFER,
      sender_id: userId,
      sender_wallet_id: wallet.id,
      amount: amount,
      fee: processingFee,
      description: description || `Bank transfer to ${bankName}`,
      metadata: {
        bank_name: bankName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        routing_number: routingNumber,
        transfer_type: transferType,
      },
    });

    // Create bank transfer record
    const bankTransfer = await BankTransfers.createBankTransfer({
      transaction_id: transaction.id,
      user_id: userId,
      bank_name: bankName,
      account_name: accountHolderName,
      account_number: accountNumber,
      routing_number: routingNumber || null,
      amount: amount,
      fee: processingFee,
    });

    // Deduct from wallet
    const newBalance = parseFloat(wallet.balance.toString()) - totalAmount;
    const newAvailableBalance =
      parseFloat(wallet.available_balance.toString()) - totalAmount;

    await Wallets.updateBalance(wallet.id, newBalance, newAvailableBalance);
    await Wallets.updateSpending(wallet.id, newDailySpent, newMonthlySpent);

    // Create ledger entry (DEBIT)
    await Ledgers.createLedgerEntry({
      transaction_id: transaction.id,
      wallet_id: wallet.id,
      entry_type: EntryType.DEBIT,
      amount: totalAmount,
      balance_before: parseFloat(wallet.balance.toString()),
      balance_after: newBalance,
      description:
        processingFee > 0
          ? `Bank transfer: ৳${amount} (Fee: ৳${processingFee})`
          : `Bank transfer: ৳${amount} (No fee - Agent)`,
    });

    console.log(
      `[Bank Transfer] Ledger entry created - Transaction: ${transaction.transaction_id}`,
    );

    // Credit fee to platform wallet (only if fee exists)
    if (processingFee > 0) {
      console.log(
        `[Bank Transfer] Adding ৳${processingFee} fee to platform wallet`,
      );
      await PlatformWallet.addBalance(
        processingFee,
        PlatformTransactionType.FEE_COLLECTED,
        `Bank transfer fee from user ${userId}`,
        {
          relatedTransactionId: transaction.id,
          relatedUserId: userId,
          transactionType: "BANK_TRANSFER",
        },
      );
      console.log(`[Bank Transfer] Platform wallet updated successfully`);
    }

    // Credit amount to destination bank account
    console.log(
      `[Bank Transfer] Crediting ৳${amount} to bank account ${accountNumber}`,
    );
    const bankCreditResult = bankAccounts.addToAccount(accountNumber, amount);

    if (!bankCreditResult.success) {
      console.error(
        `[Bank Transfer] Failed to credit bank account: ${bankCreditResult.message}`,
      );
      // Note: Transaction already processed in our system, log for reconciliation
      logger.error(
        `Bank account credit failed for transaction ${transaction.transaction_id}: ${bankCreditResult.message}`,
      );
    } else {
      console.log(
        `[Bank Transfer] Bank account credited - Old: ৳${bankCreditResult.transaction.old_balance}, New: ৳${bankCreditResult.transaction.new_balance}`,
      );
      logger.info(
        `Bank account credited: ${bankName} ${accountNumber} - Amount: ৳${amount}, New Balance: ৳${bankCreditResult.transaction.new_balance}`,
      );
    }

    // Mark transaction as COMPLETED immediately
    const completedAt = new Date();
    await Transactions.updateById(transaction.id, {
      status: TransactionStatus.COMPLETED,
      completed_at: completedAt,
    });

    console.log(
      `[Bank Transfer] Transaction marked as COMPLETED - ID: ${transaction.transaction_id}`,
    );

    // Mark bank transfer as COMPLETED
    await BankTransfers.updateStatus(
      bankTransfer.id,
      BankTransferStatus.COMPLETED,
    );

    console.log(
      `[Bank Transfer] Bank transfer record marked as COMPLETED - ID: ${bankTransfer.id}`,
    );

    logger.info(
      `Bank transfer completed: ${transaction.transaction_id} - User: ${userId} (${userType}), Amount: ৳${amount}, Fee: ৳${processingFee}`,
    );

    return sendResponse(res, STATUS_CREATED, {
      message: "Bank transfer completed successfully",
      data: {
        transactionId: transaction.transaction_id,
        amount: amount,
        processingFee: processingFee,
        totalAmount: totalAmount,
        bankName: bankName,
        accountNumber: `****${accountNumber.slice(-4)}`,
        transferType: transferType,
        status: "COMPLETED",
        completedAt: completedAt.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error("Bank transfer error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while processing bank transfer",
    });
  }
};

/**
 * Get Bank Transfer History
 * GET /api/bank/transfers
 */
export const getTransferHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    logger.info(
      `[Bank Transfer History] User: ${userId}, Page: ${pageNum}, Limit: ${limitNum}, Offset: ${offset}`,
    );

    let transfers = await BankTransfers.findByUserId(userId, limitNum, offset);

    // Filter by status if provided
    if (status) {
      transfers = transfers.filter((t) => t.status === status);
    }

    logger.info(
      `[Bank Transfer History] Found ${transfers.length} transfers for user ${userId}`,
    );

    const total = await BankTransfers.countByUserId(userId);

    return sendResponse(res, STATUS_OK, {
      message: "Bank transfer history retrieved successfully",
      data: {
        transfers: transfers.map((transfer: any) => ({
          id: transfer.id,
          transactionId: transfer.transaction_id,
          bankName: transfer.bank_name,
          accountNumber: `****${transfer.account_number.slice(-4)}`,
          accountHolderName: transfer.account_name,
          amount: transfer.amount,
          fee: transfer.fee,
          totalAmount: parseFloat(transfer.amount) + parseFloat(transfer.fee),
          status: transfer.status,
          referenceNumber: transfer.reference_number,
          createdAt: transfer.created_at,
          updatedAt: transfer.updated_at,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get bank transfer history error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching transfer history",
    });
  }
};

/**
 * Get Bank Transfer Details
 * GET /api/bank/transfers/:id
 */
export const getTransferDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const { id } = req.params;

    logger.info(`[Bank Transfer Details] User: ${userId}, Transfer ID: ${id}`);

    const transfer = await BankTransfers.findById(id);
    if (!transfer) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Bank transfer not found",
      });
    }

    // Verify ownership
    if (transfer.user_id !== userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Unauthorized access to this transfer",
      });
    }

    const transaction = await Transactions.findById(transfer.transaction_id);

    return sendResponse(res, STATUS_OK, {
      message: "Bank transfer details retrieved successfully",
      data: {
        id: transfer.id,
        transactionId: transfer.transaction_id,
        bankName: transfer.bank_name,
        accountNumber: `****${transfer.account_number.slice(-4)}`,
        accountHolderName: transfer.account_name,
        routingNumber: transfer.routing_number,
        amount: transfer.amount,
        fee: transfer.fee,
        totalAmount: parseFloat(transfer.amount) + parseFloat(transfer.fee),
        status: transfer.status,
        referenceNumber: transfer.reference_number,
        createdAt: transfer.created_at,
        updatedAt: transfer.updated_at,
        transaction: transaction
          ? {
              transactionId: transaction.transaction_id,
              status: transaction.status,
              description: transaction.description,
              initiatedAt: transaction.initiated_at,
              completedAt: transaction.completed_at,
            }
          : null,
      },
    });
  } catch (error: any) {
    logger.error("Get bank transfer details error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching transfer details",
    });
  }
};
