import { Request, Response } from "express";
import logger from "../config/_logger";
import { Users } from "../models/Users.model";
import { Wallets } from "../models/Wallets.model";
import {
  Transactions,
  TransactionType,
  TransactionStatus,
} from "../models/Transactions.model";
import { Ledgers, EntryType } from "../models/Ledgers.model";
import { SystemConfig } from "../models/SystemConfig.model";
import {
  PlatformWalletTransactions,
  PlatformTransactionType,
  PlatformEntryType,
} from "../models/PlatformWalletTransactions.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_FORBIDDEN,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
} from "../utilities/response";

// Import bank account simulation
const bankAccounts = require("../../simulation/bank_accounts");
// Import platform wallet simulation
const platformWallet = require("../../simulation/platform_wallet");

/**
 * Add Money Controller
 * POST /api/transactions/add-money
 * Simulates adding money from debit/credit card to wallet
 */
export const addMoney = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const { amount, cardNumber, cvv, expiryMonth, expiryYear, cardHolderName } = req.body;

    // Get user and wallet
    const user = await Users.findById(userId);
    if (!user) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "User not found",
      });
    }

    const wallet = await Wallets.findByUserId(userId);
    if (!wallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Wallet not found",
      });
    }

    // Check user status
    if (user.status !== "ACTIVE") {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Account is not active",
      });
    }

    // Validate amount
    if (amount <= 0) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Amount must be greater than 0",
      });
    }

    // STEP 1: Deduct from bank account simulation via card
    const bankDeduction = bankAccounts.deductFromAccountByCard(
      cardNumber,
      cvv,
      expiryMonth,
      expiryYear,
      amount
    );

    if (!bankDeduction.success) {
      logger.warn(
        `Card transaction failed for user ${userId}: ${bankDeduction.message}`
      );
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: bankDeduction.message,
      });
    }

    const maskedCard = `****-****-****-${cardNumber.slice(-4)}`;
    const bankName = bankDeduction.transaction.bank_name;
    const accountHolder = bankDeduction.transaction.account_holder_name;
    const cardType = bankDeduction.transaction.card_type;

    // Calculate new balance
    const newBalance = parseFloat(wallet.balance.toString()) + amount;
    const newAvailableBalance =
      parseFloat(wallet.available_balance.toString()) + amount;

    // STEP 2: Create transaction record in UIU Cash
    const transaction = await Transactions.createTransaction({
      type: TransactionType.ADD_MONEY,
      receiver_id: userId,
      receiver_wallet_id: wallet.id,
      amount: amount,
      fee: 0, // No fee for adding money
      description: `Added money from ${cardType} card`,
      metadata: {
        card_last_4: cardNumber.slice(-4),
        card_type: cardType,
        card_holder: accountHolder,
        bank_name: bankName,
        payment_method: "CARD",
        bank_old_balance: bankDeduction.transaction.old_balance,
        bank_new_balance: bankDeduction.transaction.new_balance,
      },
    });

    // Update transaction status to completed immediately
    await Transactions.updateById(transaction.id, {
      status: TransactionStatus.COMPLETED,
      completed_at: new Date(),
    });

    // Update wallet balance
    await Wallets.updateBalance(wallet.id, newBalance, newAvailableBalance);

    // Create ledger entries (double-entry bookkeeping)
    // Credit entry for receiver
    await Ledgers.createLedgerEntry({
      transaction_id: transaction.id,
      wallet_id: wallet.id,
      entry_type: EntryType.CREDIT,
      amount: amount,
      balance_before: parseFloat(wallet.balance.toString()),
      balance_after: newBalance,
      description: `Add money from ${cardType} card`,
    });

    // Update transaction status to completed (already done above)
    // Removed duplicate update

    logger.info(
      `Add money successful: User ${userId} added ৳${amount} from ${cardType} card ${maskedCard}`
    );

    return sendResponse(res, STATUS_OK, {
      message: "Money added successfully",
      data: {
        transaction: {
          id: transaction.id,
          transactionId: transaction.transaction_id,
          amount: amount,
          fee: 0,
          totalAmount: amount,
          type: TransactionType.ADD_MONEY,
          status: TransactionStatus.COMPLETED,
          description: transaction.description,
          createdAt: transaction.created_at,
        },
        card: {
          cardType: cardType,
          cardNumber: maskedCard,
          cardHolder: accountHolder,
          bankName: bankName,
        },
        bankAccount: {
          oldBalance: bankDeduction.transaction.old_balance,
          newBalance: bankDeduction.transaction.new_balance,
        },
        wallet: {
          balance: newBalance,
          availableBalance: newAvailableBalance,
        },
      },
    });
  } catch (error: any) {
    logger.error("Add money error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while adding money",
    });
  }
};

/**
 * Send Money Controller
 * POST /api/transactions/send-money
 * P2P money transfer between users
 */
export const sendMoney = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId;
    if (!senderId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const { recipientIdentifier, amount, description } = req.body;

    // Get sender
    const sender = await Users.findById(senderId);
    if (!sender) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Sender not found",
      });
    }

    // Check sender status
    if (sender.status !== "ACTIVE") {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Your account is not active",
      });
    }

    // Get sender wallet
    const senderWallet = await Wallets.findByUserId(senderId);
    if (!senderWallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Sender wallet not found",
      });
    }

    // Find recipient by email or phone
    const recipient = await Users.findByEmailOrPhone(recipientIdentifier);
    if (!recipient) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Recipient not found",
      });
    }

    // Check if sending to self
    if (sender.id === recipient.id) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Cannot send money to yourself",
      });
    }

    // Check recipient status
    if (recipient.status !== "ACTIVE") {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Recipient account is not active",
      });
    }

    // Get recipient wallet
    const recipientWallet = await Wallets.findByUserId(recipient.id);
    if (!recipientWallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Recipient wallet not found",
      });
    }

    // Get transaction fee from system config
    const feeConfig = await SystemConfig.findByKey("send_money_fee");
    const feeAmount = feeConfig ? parseFloat(feeConfig.config_value) : 5.0;

    const totalAmount = amount + feeAmount;

    // Check if sender has sufficient balance
    if (parseFloat(senderWallet.available_balance.toString()) < totalAmount) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Insufficient balance",
      });
    }

    // Check daily spending limit
    const dailySpent = parseFloat(senderWallet.daily_spent.toString());
    const dailyLimit = parseFloat(senderWallet.daily_limit.toString());
    if (dailySpent + totalAmount > dailyLimit) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: `Daily transaction limit exceeded. Limit: ৳${dailyLimit}, Spent: ৳${dailySpent}`,
      });
    }

    // Calculate new balances
    const senderNewBalance =
      parseFloat(senderWallet.balance.toString()) - totalAmount;
    const senderNewAvailable =
      parseFloat(senderWallet.available_balance.toString()) - totalAmount;
    const recipientNewBalance =
      parseFloat(recipientWallet.balance.toString()) + amount;
    const recipientNewAvailable =
      parseFloat(recipientWallet.available_balance.toString()) + amount;

    // Create transaction record
    const transaction = await Transactions.createTransaction({
      type: TransactionType.SEND_MONEY,
      sender_id: senderId,
      receiver_id: recipient.id,
      sender_wallet_id: senderWallet.id,
      receiver_wallet_id: recipientWallet.id,
      amount: amount,
      fee: feeAmount,
      description: description || `Money sent to ${recipient.first_name}`,
      metadata: {
        recipient_phone: recipient.phone,
        recipient_email: recipient.email,
      },
    });

    // Transaction starts in PENDING status by default

    // Update sender wallet
    await Wallets.updateBalance(
      senderWallet.id,
      senderNewBalance,
      senderNewAvailable
    );

    // Update sender spending
    await Wallets.incrementSpending(senderWallet.id, totalAmount, "daily");

    // Create ledger entry for sender (debit)
    await Ledgers.createLedgerEntry({
      transaction_id: transaction.id,
      wallet_id: senderWallet.id,
      entry_type: EntryType.DEBIT,
      amount: totalAmount,
      balance_before: parseFloat(senderWallet.balance.toString()),
      balance_after: senderNewBalance,
      description: `Send money to ${recipient.first_name} ${recipient.last_name}`,
    });

    // Update recipient wallet
    await Wallets.updateBalance(
      recipientWallet.id,
      recipientNewBalance,
      recipientNewAvailable
    );

    // Create ledger entry for recipient (credit)
    await Ledgers.createLedgerEntry({
      transaction_id: transaction.id,
      wallet_id: recipientWallet.id,
      entry_type: EntryType.CREDIT,
      amount: amount,
      balance_before: parseFloat(recipientWallet.balance.toString()),
      balance_after: recipientNewBalance,
      description: `Received money from ${sender.first_name} ${sender.last_name}`,
    });

    // STEP 3: Credit transaction fee to platform wallet
    try {
      await platformWallet.creditBalance(
        feeAmount,
        `Send money fee from transaction ${transaction.transaction_id}`,
        {
          transaction_type: PlatformTransactionType.FEE_COLLECTED,
          related_transaction_id: transaction.id,
          related_user_id: senderId,
          metadata: {
            transaction_id: transaction.transaction_id,
            fee_type: "SEND_MONEY_FEE",
            sender_name: `${sender.first_name} ${sender.last_name}`,
            recipient_name: `${recipient.first_name} ${recipient.last_name}`,
            amount_sent: amount,
          },
        }
      );

      logger.info(
        `Platform wallet credited with ৳${feeAmount} fee from transaction ${transaction.transaction_id}`
      );
    } catch (platformError: any) {
      logger.error(
        `Failed to credit platform wallet for transaction ${transaction.transaction_id}: ${platformError.message}`
      );
      // Continue - transaction succeeded, platform wallet update is supplementary
    }

    // Update transaction status to completed
    await Transactions.updateById(transaction.id, {
      status: TransactionStatus.COMPLETED,
      completed_at: new Date(),
    });

    logger.info(
      `Send money successful: ${senderId} sent ৳${amount} to ${recipient.id} (Fee: ৳${feeAmount})`
    );

    return sendResponse(res, STATUS_OK, {
      message: "Money sent successfully",
      data: {
        transaction: {
          id: transaction.id,
          transactionId: transaction.transaction_id,
          amount: amount,
          fee: feeAmount,
          totalAmount: totalAmount,
          type: TransactionType.SEND_MONEY,
          status: TransactionStatus.COMPLETED,
          recipient: {
            name: `${recipient.first_name} ${recipient.last_name}`,
            phone: recipient.phone,
          },
          description: transaction.description,
          createdAt: transaction.created_at,
        },
        wallet: {
          balance: senderNewBalance,
          availableBalance: senderNewAvailable,
        },
      },
    });
  } catch (error: any) {
    logger.error("Send money error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while sending money",
    });
  }
};

/**
 * Get Transaction History
 * GET /api/transactions/history
 */
export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const { page = 1, limit = 20, type, status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const conditions: any = {};
    if (type) conditions.type = type;
    if (status) conditions.status = status;

    // Get transactions where user is sender or receiver
    const transactions = await Transactions.findByUserId(
      userId,
      limitNum,
      offset,
      conditions
    );
    const total = await Transactions.countByUserId(userId, conditions);

    return sendResponse(res, STATUS_OK, {
      message: "Transaction history retrieved successfully",
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
          senderId: txn.sender_id,
          receiverId: txn.receiver_id,
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
    logger.error("Get transaction history error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching transaction history",
    });
  }
};

/**
 * Get Transaction Details
 * GET /api/transactions/:id
 */
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const { id } = req.params;

    const transaction = await Transactions.findById(id);
    if (!transaction) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Transaction not found",
      });
    }

    // Check if user is authorized to view this transaction
    if (
      transaction.sender_id !== userId &&
      transaction.receiver_id !== userId
    ) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "You are not authorized to view this transaction",
      });
    }

    // Get sender and receiver details if applicable
    let senderDetails: any = null;
    let receiverDetails: any = null;

    if (transaction.sender_id) {
      const sender = await Users.findById(transaction.sender_id);
      if (sender) {
        senderDetails = {
          id: sender.id,
          name: `${sender.first_name} ${sender.last_name}`,
          phone: sender.phone,
          email: sender.email,
        };
      }
    }

    if (transaction.receiver_id) {
      const receiver = await Users.findById(transaction.receiver_id);
      if (receiver) {
        receiverDetails = {
          id: receiver.id,
          name: `${receiver.first_name} ${receiver.last_name}`,
          phone: receiver.phone,
          email: receiver.email,
        };
      }
    }

    return sendResponse(res, STATUS_OK, {
      message: "Transaction details retrieved successfully",
      data: {
        transaction: {
          id: transaction.id,
          transactionId: transaction.transaction_id,
          type: transaction.type,
          amount: transaction.amount,
          fee: transaction.fee,
          totalAmount: transaction.total_amount,
          status: transaction.status,
          description: transaction.description,
          referenceNumber: transaction.reference_number,
          metadata: transaction.metadata,
          sender: senderDetails,
          receiver: receiverDetails,
          initiatedAt: transaction.initiated_at,
          completedAt: transaction.completed_at,
          failedReason: transaction.failed_reason,
          createdAt: transaction.created_at,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get transaction details error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching transaction details",
    });
  }
};
