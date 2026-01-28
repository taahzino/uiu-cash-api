import { Request, Response } from "express";
import path from "path";
import logger from "../config/_logger";
import { Billers, BillerStatus } from "../models/Billers.model";
import { BillPayments, BillPaymentStatus } from "../models/BillPayments.model";
import {
  Transactions,
  TransactionType,
  TransactionStatus,
} from "../models/Transactions.model";
import { Wallets } from "../models/Wallets.model";
import { Ledgers, EntryType } from "../models/Ledgers.model";
import { Users } from "../models/Users.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
  STATUS_CREATED,
  STATUS_FORBIDDEN,
} from "../utilities/response";

/**
 * Get Billers - List all active billers
 * GET /api/transactions/billers
 */
export const getBillers = async (req: Request, res: Response) => {
  try {
    const { billType, search } = req.query;

    logger.info(
      `[Get Billers] BillType: ${billType || "all"}, Search: ${search || "none"}`,
    );

    let billers;

    if (search && typeof search === "string") {
      billers = await Billers.searchBillers(search, 50);
      // Filter by status
      billers = billers.filter((b) => b.status === BillerStatus.ACTIVE);
      // Filter by bill type if provided
      if (billType) {
        billers = billers.filter((b) => b.bill_type === billType);
      }
    } else if (billType) {
      billers = await Billers.getBillersByType(billType as any);
      billers = billers.filter((b) => b.status === BillerStatus.ACTIVE);
    } else {
      billers = await Billers.getActiveBillers();
    }

    logger.info(`[Get Billers] Found ${billers.length} active billers`);

    return sendResponse(res, STATUS_OK, {
      message: "Billers retrieved successfully",
      data: {
        billers: billers.map((biller) => ({
          id: biller.id,
          name: biller.name,
          billerCode: biller.biller_code,
          billType: biller.bill_type,
          contactEmail: biller.contact_email,
          contactPhone: biller.contact_phone,
          description: biller.description,
          logoUrl: biller.logo_url,
        })),
        total: billers.length,
      },
    });
  } catch (error: any) {
    logger.error("Get billers error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching billers",
    });
  }
};

/**
 * Pay Bill - Make a bill payment
 * POST /api/transactions/pay-bill
 */
export const payBill = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const {
      billerId,
      accountNumber,
      amount,
      billingMonth,
      billingYear,
      description,
    } = req.body;

    logger.info(
      `[Pay Bill] User: ${userId}, Biller: ${billerId}, Amount: ৳${amount}, Account: ${accountNumber}`,
    );

    // Get user with status check
    const user = await Users.findById(userId);
    if (!user || user.status !== "ACTIVE") {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Account not active. Cannot process bill payment.",
      });
    }

    // Get and validate biller
    const biller = await Billers.findById(billerId);
    if (!biller) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Biller not found",
      });
    }

    if (biller.status !== BillerStatus.ACTIVE) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "This biller is currently not accepting payments",
      });
    }

    // Get user wallet
    const wallet = await Wallets.findByUserId(userId);
    if (!wallet) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Wallet not found",
      });
    }

    // No fee for bill payments
    const fee = 0;
    const totalAmount = amount;

    // Check available balance
    if (wallet.available_balance < totalAmount) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Insufficient balance",
        data: {
          required: totalAmount,
          available: wallet.available_balance,
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
      type: TransactionType.BILL_PAYMENT,
      sender_id: userId,
      sender_wallet_id: wallet.id,
      amount: amount,
      fee: fee,
      description:
        description ||
        `Bill payment to ${biller.name} for account ${accountNumber}`,
      metadata: {
        biller_id: billerId,
        biller_name: biller.name,
        biller_code: biller.biller_code,
        bill_type: biller.bill_type,
        account_number: accountNumber,
        billing_month: billingMonth || null,
        billing_year: billingYear || null,
      },
    });

    // Create bill payment record
    const billPayment = await BillPayments.createBillPayment({
      transaction_id: transaction.id,
      biller_id: billerId,
      user_id: userId,
      account_number: accountNumber,
      amount: amount,
      fee: fee,
      billing_month: billingMonth || null,
      billing_year: billingYear || null,
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
      description: `Bill payment: ৳${amount} to ${biller.name}`,
    });

    // Update biller balance
    await Billers.updateBalance(billerId, amount);

    // Complete transaction and bill payment
    const completedAt = new Date();
    await Transactions.updateById(transaction.id, {
      status: TransactionStatus.COMPLETED,
      completed_at: completedAt,
    });

    const completedPayment = await BillPayments.completePayment(billPayment.id);

    logger.info(
      `Bill payment completed: ${transaction.transaction_id} - User: ${userId}, Biller: ${biller.name}, Amount: ৳${amount}`,
    );

    return sendResponse(res, STATUS_CREATED, {
      message: "Bill payment completed successfully",
      data: {
        transactionId: transaction.transaction_id,
        billerId: biller.id,
        billerName: biller.name,
        billerCode: biller.biller_code,
        billType: biller.bill_type,
        accountNumber: accountNumber,
        amount: amount,
        fee: fee,
        totalAmount: totalAmount,
        status: "COMPLETED",
        completedAt: completedAt.toISOString(),
        receiptNumber: completedPayment?.receipt_number,
        newBalance: newBalance,
      },
    });
  } catch (error: any) {
    logger.error("Bill payment error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while processing bill payment",
    });
  }
};

/**
 * Get Bill Payment History
 * GET /api/transactions/bill-payments
 */
export const getBillPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "User authentication required",
      });
    }

    const { page = 1, limit = 10, billerId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    logger.info(
      `[Bill Payment History] User: ${userId}, Page: ${page}, Limit: ${limit}, BillerId: ${billerId || "all"}`,
    );

    let payments = await BillPayments.findByUserId(
      userId,
      Number(limit),
      offset,
    );

    // Filter by biller if provided
    if (billerId) {
      payments = payments.filter((p) => p.biller_id === billerId);
    }

    logger.info(
      `[Bill Payment History] Found ${payments.length} payments for user ${userId}`,
    );

    // Get biller details for each payment
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const biller = await Billers.findById(payment.biller_id);
        return {
          id: payment.id,
          transactionId: payment.transaction_id,
          biller: biller
            ? {
                id: biller.id,
                name: biller.name,
                billerCode: biller.biller_code,
                billType: biller.bill_type,
              }
            : null,
          accountNumber: payment.account_number,
          amount: payment.amount,
          fee: payment.fee,
          totalAmount:
            parseFloat(payment.amount.toString()) +
            parseFloat(payment.fee.toString()),
          status: payment.status,
          billingMonth: payment.billing_month,
          billingYear: payment.billing_year,
          receiptNumber: payment.receipt_number,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        };
      }),
    );

    // Count total for pagination
    const allPayments = await BillPayments.findByUserId(userId, 10000, 0);
    const total = billerId
      ? allPayments.filter((p) => p.biller_id === billerId).length
      : allPayments.length;

    return sendResponse(res, STATUS_OK, {
      message: "Bill payment history retrieved successfully",
      data: {
        payments: paymentsWithDetails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get bill payment history error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching bill payment history",
    });
  }
};
