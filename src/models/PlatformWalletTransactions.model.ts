import { BaseModel } from "./BaseModel";

// Platform wallet transaction types
export enum PlatformTransactionType {
  ADD_MONEY_DEPOSIT = "ADD_MONEY_DEPOSIT", // User deposits from external banks
  FEE_COLLECTED = "FEE_COLLECTED", // Transaction fees (send money, cash out, etc.)
  COMMISSION_PAID = "COMMISSION_PAID", // Agent commissions
  BONUS_GIVEN = "BONUS_GIVEN", // User bonuses/cashback
  CASHBACK_GIVEN = "CASHBACK_GIVEN", // Promotional cashback
  REVENUE_OTHER = "REVENUE_OTHER", // Other platform revenue
  EXPENSE_OTHER = "EXPENSE_OTHER", // Other platform expenses
  SETTLEMENT = "SETTLEMENT", // Settlement operations
  ADJUSTMENT = "ADJUSTMENT", // Manual adjustments
}

// Entry type for double-entry tracking
export enum PlatformEntryType {
  CREDIT = "CREDIT", // Money coming into platform wallet
  DEBIT = "DEBIT", // Money going out of platform wallet
}

interface PlatformWalletTransaction {
  id?: number;
  transaction_type: PlatformTransactionType;
  entry_type: PlatformEntryType;
  amount: number;
  balance_before: number;
  balance_after: number;
  related_transaction_id?: number; // FK to transactions table
  related_user_id?: string; // User involved
  related_agent_id?: string; // Agent involved
  description: string;
  metadata?: any;
  created_at?: Date;
}

interface PlatformWalletStatistics {
  total_fees_collected: number;
  total_commissions_paid: number;
  total_bonuses_given: number;
  total_cashback_given: number;
  net_revenue: number;
  transaction_count: number;
  current_balance: number;
}

export class PlatformWalletTransactionsModel extends BaseModel {
  protected tableName = "platform_wallet_transactions";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS platform_wallet_transactions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      transaction_type ENUM(
        'ADD_MONEY_DEPOSIT',
        'FEE_COLLECTED', 
        'COMMISSION_PAID', 
        'BONUS_GIVEN', 
        'CASHBACK_GIVEN', 
        'REVENUE_OTHER', 
        'EXPENSE_OTHER', 
        'SETTLEMENT', 
        'ADJUSTMENT'
      ) NOT NULL,
      entry_type ENUM('CREDIT', 'DEBIT') NOT NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      balance_before DECIMAL(15,2) NOT NULL,
      balance_after DECIMAL(15,2) NOT NULL,
      related_transaction_id CHAR(36),
      related_user_id CHAR(36),
      related_agent_id CHAR(36),
      description TEXT NOT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
      FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (related_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
      
      INDEX idx_platform_txn_type (transaction_type),
      INDEX idx_platform_entry_type (entry_type),
      INDEX idx_platform_related_txn (related_transaction_id),
      INDEX idx_platform_user (related_user_id),
      INDEX idx_platform_agent (related_agent_id),
      INDEX idx_platform_date (created_at),
      INDEX idx_platform_type_date (transaction_type, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  /**
   * Create a new platform wallet transaction record
   */
  async createTransaction(
    data: Omit<PlatformWalletTransaction, "id" | "created_at">,
  ): Promise<PlatformWalletTransaction | null> {
    const sql = `
      INSERT INTO ${this.tableName} 
      (transaction_type, entry_type, amount, balance_before, balance_after, 
       related_transaction_id, related_user_id, related_agent_id, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result: any = await this.executeQuery(sql, [
      data.transaction_type,
      data.entry_type,
      data.amount,
      data.balance_before,
      data.balance_after,
      data.related_transaction_id || null,
      data.related_user_id || null,
      data.related_agent_id || null,
      data.description,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]);

    return await this.findByPlatformId(result.insertId);
  }

  /**
   * Find platform wallet transaction by ID
   * Uses custom method name to avoid conflict with BaseModel
   */
  async findByPlatformId(
    id: number,
  ): Promise<PlatformWalletTransaction | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.executeQuery(sql, [id]);

    if (!Array.isArray(results) || results.length === 0) return null;

    const row = results[0];
    if (row.metadata && typeof row.metadata === "string") {
      row.metadata = JSON.parse(row.metadata);
    }

    return row;
  }

  /**
   * Get platform wallet transaction history with pagination
   */
  async getHistory(
    page: number = 1,
    limit: number = 20,
    filters?: {
      transaction_type?: PlatformTransactionType;
      entry_type?: PlatformEntryType;
      start_date?: Date;
      end_date?: Date;
    },
  ): Promise<{ transactions: PlatformWalletTransaction[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (filters?.transaction_type) {
      whereConditions.push("transaction_type = ?");
      params.push(filters.transaction_type);
    }

    if (filters?.entry_type) {
      whereConditions.push("entry_type = ?");
      params.push(filters.entry_type);
    }

    if (filters?.start_date) {
      whereConditions.push("created_at >= ?");
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      whereConditions.push("created_at <= ?");
      params.push(filters.end_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const countResults = await this.executeQuery(countSql, params);
    const total =
      Array.isArray(countResults) && countResults.length > 0
        ? countResults[0].total
        : 0;

    // Get transactions
    const sql = `
      SELECT * FROM ${this.tableName} 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const results = await this.executeQuery(sql, [...params, limit, offset]);

    const rows = Array.isArray(results) ? results : [];

    // Parse metadata
    rows.forEach((row) => {
      if (row.metadata && typeof row.metadata === "string") {
        row.metadata = JSON.parse(row.metadata);
      }
    });

    return {
      transactions: rows,
      total,
    };
  }

  /**
   * Get platform wallet statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PlatformWalletStatistics> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (startDate) {
      whereConditions.push("created_at >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push("created_at <= ?");
      params.push(endDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const sql = `
      SELECT 
        SUM(CASE WHEN transaction_type = 'FEE_COLLECTED' AND entry_type = 'CREDIT' THEN amount ELSE 0 END) as total_fees_collected,
        SUM(CASE WHEN transaction_type = 'COMMISSION_PAID' AND entry_type = 'DEBIT' THEN amount ELSE 0 END) as total_commissions_paid,
        SUM(CASE WHEN transaction_type = 'BONUS_GIVEN' AND entry_type = 'DEBIT' THEN amount ELSE 0 END) as total_bonuses_given,
        SUM(CASE WHEN transaction_type = 'CASHBACK_GIVEN' AND entry_type = 'DEBIT' THEN amount ELSE 0 END) as total_cashback_given,
        SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as net_revenue,
        COUNT(*) as transaction_count
      FROM ${this.tableName}
      ${whereClause}
    `;

    const results = await this.executeQuery(sql, params);
    const stats =
      Array.isArray(results) && results.length > 0 ? results[0] : {};

    // Get current platform balance from simulation
    const platformWallet = require("../../simulation/platform_wallet");
    const currentBalance = platformWallet.getBalance();

    return {
      total_fees_collected: parseFloat(stats.total_fees_collected || 0),
      total_commissions_paid: parseFloat(stats.total_commissions_paid || 0),
      total_bonuses_given: parseFloat(stats.total_bonuses_given || 0),
      total_cashback_given: parseFloat(stats.total_cashback_given || 0),
      net_revenue: parseFloat(stats.net_revenue || 0),
      transaction_count: parseInt(stats.transaction_count || 0),
      current_balance: currentBalance,
    };
  }

  /**
   * Get transactions by related transaction ID
   */
  async findByTransactionId(
    transactionId: number,
  ): Promise<PlatformWalletTransaction[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE related_transaction_id = ? 
      ORDER BY created_at DESC
    `;

    const results = await this.executeQuery(sql, [transactionId]);
    const rows = Array.isArray(results) ? results : [];

    // Parse metadata
    rows.forEach((row) => {
      if (row.metadata && typeof row.metadata === "string") {
        row.metadata = JSON.parse(row.metadata);
      }
    });

    return rows;
  }

  /**
   * Get transactions by user ID
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ transactions: PlatformWalletTransaction[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE related_user_id = ?`;
    const countResults = await this.executeQuery(countSql, [userId]);
    const total =
      Array.isArray(countResults) && countResults.length > 0
        ? countResults[0].total
        : 0;

    // Get transactions
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE related_user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const results = await this.executeQuery(sql, [userId, limit, offset]);

    const rows = Array.isArray(results) ? results : [];

    // Parse metadata
    rows.forEach((row) => {
      if (row.metadata && typeof row.metadata === "string") {
        row.metadata = JSON.parse(row.metadata);
      }
    });

    return {
      transactions: rows,
      total,
    };
  }
}

export const PlatformWalletTransactions = new PlatformWalletTransactionsModel();
