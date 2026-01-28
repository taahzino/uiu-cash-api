/**
 * Platform Wallet Model - Database Implementation
 * Stores balance and tracks all financial operations in database
 */

import { BaseModel } from "./BaseModel";
import {
  PlatformWalletTransactions,
  PlatformTransactionType,
  PlatformEntryType,
} from "./PlatformWalletTransactions.model";
import { PoolConnection } from "mysql2/promise";

interface IPlatformWallet {
  id: number;
  balance: number;
  total_fees_collected: number;
  total_commissions_paid: number;
  total_bonuses_given: number;
  last_transaction_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface IUpdatePlatformWallet {
  balance?: number;
  total_fees_collected?: number;
  total_commissions_paid?: number;
  total_bonuses_given?: number;
  last_transaction_at?: Date;
}

export class PlatformWalletModel extends BaseModel {
  protected tableName = "platform_wallet";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS platform_wallet (
      id INT PRIMARY KEY AUTO_INCREMENT,
      balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
      total_fees_collected DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      total_commissions_paid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      total_bonuses_given DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      last_transaction_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_platform_wallet_balance (balance),
      INDEX idx_platform_wallet_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  /**
   * Get the platform wallet (singleton - should only have one record)
   */
  async getPlatformWallet(): Promise<IPlatformWallet | null> {
    const sql = `SELECT * FROM ${this.tableName} LIMIT 1`;
    const results = await this.executeQuery(sql, []);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get platform wallet with row lock (for concurrent updates)
   */
  async getPlatformWalletForUpdate(
    connection: PoolConnection,
  ): Promise<IPlatformWallet | null> {
    const sql = `SELECT * FROM ${this.tableName} LIMIT 1 FOR UPDATE`;
    const [rows] = await connection.query(sql, []);
    const results = Array.isArray(rows) ? rows : [];
    return results.length > 0 ? (results[0] as IPlatformWallet) : null;
  }

  /**
   * Initialize platform wallet (should be run once during setup)
   */
  async initializePlatformWallet(
    initialBalance: number = 0,
  ): Promise<IPlatformWallet> {
    const existing = await this.getPlatformWallet();
    if (existing) {
      console.log("[Platform Wallet] Already initialized");
      return existing;
    }

    const sql = `
      INSERT INTO ${this.tableName} 
      (balance, total_fees_collected, total_commissions_paid, total_bonuses_given)
      VALUES (?, 0.00, 0.00, 0.00)
    `;
    await this.executeQuery(sql, [initialBalance]);

    const newWallet = await this.getPlatformWallet();
    console.log("[Platform Wallet] Initialized with balance:", initialBalance);
    return newWallet!;
  }

  /**
   * Add funds to platform wallet (credit operation)
   */
  async addBalance(
    amount: number,
    transactionType: PlatformTransactionType,
    description: string,
    metadata?: {
      relatedTransactionId?: string;
      relatedUserId?: string;
      relatedAgentId?: string;
      [key: string]: any;
    },
  ): Promise<IPlatformWallet> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();

      // Lock platform wallet
      const wallet = await this.getPlatformWalletForUpdate(connection);
      if (!wallet) {
        throw new Error("Platform wallet not initialized");
      }

      const balanceBefore = parseFloat(wallet.balance.toString());
      const balanceAfter = balanceBefore + amount;

      // Update balance
      const updateSql = `
        UPDATE ${this.tableName} 
        SET balance = ?, 
            last_transaction_at = NOW()
        WHERE id = ?
      `;
      await connection.query(updateSql, [balanceAfter, wallet.id]);

      // Update fee tracking if fee collected
      if (transactionType === PlatformTransactionType.FEE_COLLECTED) {
        const feeSql = `
          UPDATE ${this.tableName}
          SET total_fees_collected = total_fees_collected + ?
          WHERE id = ?
        `;
        await connection.query(feeSql, [amount, wallet.id]);
      }

      // Record transaction
      await PlatformWalletTransactions.createTransaction({
        transaction_type: transactionType,
        entry_type: PlatformEntryType.CREDIT,
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        related_transaction_id: metadata?.relatedTransactionId || undefined,
        related_user_id: metadata?.relatedUserId
          ? String(metadata.relatedUserId)
          : undefined,
        related_agent_id: metadata?.relatedAgentId
          ? String(metadata.relatedAgentId)
          : undefined,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      await connection.commit();
      console.log(
        `[Platform Wallet] Added ৳${amount} (${transactionType}): ${balanceBefore} → ${balanceAfter}`,
      );
      const updatedWallet = await this.getPlatformWallet();
      return updatedWallet!;
    } catch (error) {
      await connection.rollback();
      console.error("[Platform Wallet] Add balance error:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Deduct funds from platform wallet (debit operation)
   */
  async deductBalance(
    amount: number,
    transactionType: PlatformTransactionType,
    description: string,
    metadata?: {
      relatedTransactionId?: string;
      relatedUserId?: string;
      relatedAgentId?: string;
      [key: string]: any;
    },
  ): Promise<IPlatformWallet> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();

      // Lock platform wallet
      const wallet = await this.getPlatformWalletForUpdate(connection);
      if (!wallet) {
        throw new Error("Platform wallet not initialized");
      }

      const balanceBefore = parseFloat(wallet.balance.toString());

      // Check sufficient balance
      if (balanceBefore < amount) {
        throw new Error(
          `Insufficient platform balance. Required: ৳${amount}, Available: ৳${balanceBefore}`,
        );
      }

      const balanceAfter = balanceBefore - amount;

      // Update balance
      const updateSql = `
        UPDATE ${this.tableName} 
        SET balance = ?, 
            last_transaction_at = NOW()
        WHERE id = ?
      `;
      await connection.query(updateSql, [balanceAfter, wallet.id]);

      // Update tracking based on transaction type
      if (transactionType === PlatformTransactionType.COMMISSION_PAID) {
        const commissionSql = `
          UPDATE ${this.tableName}
          SET total_commissions_paid = total_commissions_paid + ?
          WHERE id = ?
        `;
        await connection.query(commissionSql, [amount, wallet.id]);
      } else if (
        transactionType === PlatformTransactionType.BONUS_GIVEN ||
        transactionType === PlatformTransactionType.CASHBACK_GIVEN
      ) {
        const bonusSql = `
          UPDATE ${this.tableName}
          SET total_bonuses_given = total_bonuses_given + ?
          WHERE id = ?
        `;
        await connection.query(bonusSql, [amount, wallet.id]);
      }

      // Record transaction
      await PlatformWalletTransactions.createTransaction({
        transaction_type: transactionType,
        entry_type: PlatformEntryType.DEBIT,
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        related_transaction_id: metadata?.relatedTransactionId || undefined,
        related_user_id: metadata?.relatedUserId
          ? String(metadata.relatedUserId)
          : undefined,
        related_agent_id: metadata?.relatedAgentId
          ? String(metadata.relatedAgentId)
          : undefined,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      await connection.commit();
      console.log(
        `[Platform Wallet] Deducted ৳${amount} (${transactionType}): ${balanceBefore} → ${balanceAfter}`,
      );
      const updatedWallet = await this.getPlatformWallet();
      return updatedWallet!;
    } catch (error) {
      await connection.rollback();
      console.error("[Platform Wallet] Deduct balance error:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get current balance
   */
  async getBalance(): Promise<number> {
    const wallet = await this.getPlatformWallet();
    return wallet ? parseFloat(wallet.balance.toString()) : 0;
  }

  /**
   * Check if sufficient balance exists
   */
  async hasSufficientBalance(amount: number): Promise<boolean> {
    const balance = await this.getBalance();
    return balance >= amount;
  }

  /**
   * Get platform wallet statistics
   */
  async getStatistics(): Promise<{
    balance: number;
    totalFeesCollected: number;
    totalCommissionsPaid: number;
    totalBonusesGiven: number;
    netRevenue: number;
    lastTransactionAt: Date | null;
  }> {
    const wallet = await this.getPlatformWallet();
    if (!wallet) {
      return {
        balance: 0,
        totalFeesCollected: 0,
        totalCommissionsPaid: 0,
        totalBonusesGiven: 0,
        netRevenue: 0,
        lastTransactionAt: null,
      };
    }

    const balance = parseFloat(wallet.balance.toString());
    const totalFeesCollected = parseFloat(
      wallet.total_fees_collected.toString(),
    );
    const totalCommissionsPaid = parseFloat(
      wallet.total_commissions_paid.toString(),
    );
    const totalBonusesGiven = parseFloat(wallet.total_bonuses_given.toString());
    const netRevenue =
      totalFeesCollected - totalCommissionsPaid - totalBonusesGiven;

    return {
      balance,
      totalFeesCollected,
      totalCommissionsPaid,
      totalBonusesGiven,
      netRevenue,
      lastTransactionAt: wallet.last_transaction_at || null,
    };
  }

  /**
   * Perform reconciliation check
   */
  async reconcile(): Promise<{
    success: boolean;
    currentBalance: number;
    calculatedBalance: number;
    discrepancy: number;
    message: string;
  }> {
    const wallet = await this.getPlatformWallet();
    if (!wallet) {
      return {
        success: false,
        currentBalance: 0,
        calculatedBalance: 0,
        discrepancy: 0,
        message: "Platform wallet not initialized",
      };
    }

    // Calculate balance from transactions
    const sql = `
      SELECT 
        SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as total_debits
      FROM platform_wallet_transactions
    `;
    const results = await this.executeQuery(sql, []);
    const row = results[0];

    const totalCredits = parseFloat(row.total_credits || 0);
    const totalDebits = parseFloat(row.total_debits || 0);
    const calculatedBalance = totalCredits - totalDebits;

    const currentBalance = parseFloat(wallet.balance.toString());
    const discrepancy = Math.abs(currentBalance - calculatedBalance);

    const success = discrepancy < 0.01; // Allow for tiny rounding errors

    return {
      success,
      currentBalance,
      calculatedBalance,
      discrepancy,
      message: success
        ? "Platform wallet reconciliation successful"
        : `Reconciliation failed: discrepancy of ৳${discrepancy.toFixed(2)}`,
    };
  }
}

export const PlatformWallet = new PlatformWalletModel();
export { PlatformTransactionType, PlatformEntryType };
