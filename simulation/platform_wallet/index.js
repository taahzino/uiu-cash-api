const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

/**
 * Load platform wallet data from JSON file
 * @returns {Object} Platform wallet object
 */
function loadData() {
  const data = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(data);
}

/**
 * Save platform wallet data to JSON file
 * @param {Object} data - Platform wallet object
 */
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Get platform wallet details
 * @returns {Object} Platform wallet object
 */
function getPlatformWallet() {
  const data = loadData();
  return data.platform_wallet;
}

/**
 * Get current platform wallet balance
 * @returns {number} Current balance
 */
function getBalance() {
  const wallet = getPlatformWallet();
  return parseFloat(wallet.balance);
}

/**
 * Check if platform has sufficient balance for an operation
 * @param {number} amount - Amount to check
 * @returns {boolean} True if sufficient balance exists
 */
function hasSufficientBalance(amount) {
  const balance = getBalance();
  return balance >= parseFloat(amount);
}

/**
 * Deduct amount from platform wallet (for bonuses, commissions, etc.)
 * @param {number} amount - Amount to deduct
 * @param {string} reason - Reason for deduction
 * @param {Object} transactionData - Optional data to record in database
 * @returns {Object} Updated wallet with new balance
 * @throws {Error} If insufficient balance
 */
async function deductBalance(
  amount,
  reason = "Platform Operation",
  transactionData = null,
) {
  const data = loadData();
  const wallet = data.platform_wallet;
  const amountNum = parseFloat(amount);

  if (amountNum <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const currentBalance = parseFloat(wallet.balance);

  if (currentBalance < amountNum) {
    throw new Error(
      `Insufficient platform balance. Required: ${amountNum}, Available: ${currentBalance}`,
    );
  }

  const oldBalance = currentBalance;
  const newBalance = (currentBalance - amountNum).toFixed(2);

  // Update balance and tracking
  wallet.balance = newBalance;
  wallet.last_transaction_at = new Date().toISOString();

  // Track specific deduction types
  if (reason.toLowerCase().includes("bonus")) {
    wallet.total_bonuses_given = (
      parseFloat(wallet.total_bonuses_given) + amountNum
    ).toFixed(2);
  } else if (reason.toLowerCase().includes("commission")) {
    wallet.total_commissions_paid = (
      parseFloat(wallet.total_commissions_paid) + amountNum
    ).toFixed(2);
  }

  data.platform_wallet = wallet;
  saveData(data);

  // Record transaction in database if data provided
  if (transactionData) {
    try {
      console.log("[PLATFORM WALLET] Recording debit transaction:", {
        transaction_type: transactionData.transaction_type,
        amount: amountNum,
        related_transaction_id: transactionData.related_transaction_id,
        related_user_id: transactionData.related_user_id,
      });

      const {
        PlatformWalletTransactions,
        PlatformTransactionType,
        PlatformEntryType,
      } = require("../../dist/models/PlatformWalletTransactions.model");

      const txnRecord = await PlatformWalletTransactions.createTransaction({
        transaction_type:
          transactionData.transaction_type ||
          PlatformTransactionType.EXPENSE_OTHER,
        entry_type: PlatformEntryType.DEBIT,
        amount: amountNum,
        balance_before: oldBalance,
        balance_after: parseFloat(newBalance),
        related_transaction_id: transactionData.related_transaction_id || null,
        related_user_id: transactionData.related_user_id || null,
        related_agent_id: transactionData.related_agent_id || null,
        description: reason,
        metadata: transactionData.metadata || null,
      });

      console.log(
        "[PLATFORM WALLET] Transaction recorded successfully:",
        txnRecord?.id,
      );
    } catch (error) {
      console.error(
        "[PLATFORM WALLET] Failed to record platform wallet debit transaction:",
        error,
      );
      console.error("[PLATFORM WALLET] Error details:", error.message);
      console.error("[PLATFORM WALLET] Error stack:", error.stack);
      // Don't throw - balance update succeeded, just log the error
    }
  }

  return {
    success: true,
    balance: newBalance,
    old_balance: oldBalance.toFixed(2),
    amount_deducted: amountNum.toFixed(2),
    reason: reason,
  };
}

/**
 * Credit amount to platform wallet (for fees, revenue, etc.)
 * @param {number} amount - Amount to credit
 * @param {string} reason - Reason for credit
 * @param {Object} transactionData - Optional data to record in database
 * @returns {Object} Updated wallet with new balance
 */
async function creditBalance(
  amount,
  reason = "Platform Revenue",
  transactionData = null,
) {
  const data = loadData();
  const wallet = data.platform_wallet;
  const amountNum = parseFloat(amount);

  if (amountNum <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const currentBalance = parseFloat(wallet.balance);
  const oldBalance = currentBalance;
  const newBalance = (currentBalance + amountNum).toFixed(2);

  // Update balance and tracking
  wallet.balance = newBalance;
  wallet.last_transaction_at = new Date().toISOString();

  // Track revenue
  if (
    reason.toLowerCase().includes("fee") ||
    reason.toLowerCase().includes("revenue")
  ) {
    wallet.total_revenue_collected = (
      parseFloat(wallet.total_revenue_collected) + amountNum
    ).toFixed(2);
  }

  data.platform_wallet = wallet;
  saveData(data);

  // Record transaction in database if data provided
  if (transactionData) {
    try {
      console.log("[PLATFORM WALLET] Recording credit transaction:", {
        transaction_type: transactionData.transaction_type,
        amount: amountNum,
        related_transaction_id: transactionData.related_transaction_id,
        related_user_id: transactionData.related_user_id,
      });

      const {
        PlatformWalletTransactions,
        PlatformTransactionType,
        PlatformEntryType,
      } = require("../../dist/models/PlatformWalletTransactions.model");

      const txnRecord = await PlatformWalletTransactions.createTransaction({
        transaction_type:
          transactionData.transaction_type ||
          PlatformTransactionType.REVENUE_OTHER,
        entry_type: PlatformEntryType.CREDIT,
        amount: amountNum,
        balance_before: oldBalance,
        balance_after: parseFloat(newBalance),
        related_transaction_id: transactionData.related_transaction_id || null,
        related_user_id: transactionData.related_user_id || null,
        related_agent_id: transactionData.related_agent_id || null,
        description: reason,
        metadata: transactionData.metadata || null,
      });

      console.log(
        "[PLATFORM WALLET] Transaction recorded successfully:",
        txnRecord?.id,
      );
    } catch (error) {
      console.error(
        "[PLATFORM WALLET] Failed to record platform wallet credit transaction:",
        error,
      );
      console.error("[PLATFORM WALLET] Error details:", error.message);
      console.error("[PLATFORM WALLET] Error stack:", error.stack);
      // Don't throw - balance update succeeded, just log the error
    }
  }

  return {
    success: true,
    balance: newBalance,
    old_balance: oldBalance.toFixed(2),
    amount_credited: amountNum.toFixed(2),
    reason: reason,
  };
}

/**
 * Get platform wallet statistics
 * @returns {Object} Platform wallet statistics
 */
function getStatistics() {
  const wallet = getPlatformWallet();

  return {
    current_balance: parseFloat(wallet.balance),
    total_revenue_collected: parseFloat(wallet.total_revenue_collected),
    total_bonuses_given: parseFloat(wallet.total_bonuses_given),
    total_commissions_paid: parseFloat(wallet.total_commissions_paid),
    net_profit:
      parseFloat(wallet.total_revenue_collected) -
      parseFloat(wallet.total_bonuses_given) -
      parseFloat(wallet.total_commissions_paid),
    status: wallet.status,
    last_transaction_at: wallet.last_transaction_at,
  };
}

/**
 * Reset platform wallet to initial state (for testing only)
 * @param {number} initialBalance - Initial balance (default: 1000000)
 */
function resetWallet(initialBalance = 1000000) {
  const data = loadData();
  const wallet = data.platform_wallet;

  wallet.balance = initialBalance.toFixed(2);
  wallet.total_revenue_collected = "0.00";
  wallet.total_bonuses_given = "0.00";
  wallet.total_commissions_paid = "0.00";
  wallet.last_transaction_at = new Date().toISOString();

  data.platform_wallet = wallet;
  saveData(data);

  return {
    success: true,
    message: "Platform wallet reset successfully",
    balance: wallet.balance,
  };
}

module.exports = {
  getPlatformWallet,
  getBalance,
  hasSufficientBalance,
  deductBalance,
  creditBalance,
  getStatistics,
  resetWallet,
};
