import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum TransactionType {
  SEND_MONEY = "SEND_MONEY",
  ADD_MONEY = "ADD_MONEY",
  CASH_OUT = "CASH_OUT",
  CASH_IN = "CASH_IN",
  BILL_PAYMENT = "BILL_PAYMENT",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASHBACK = "CASHBACK",
  COMMISSION = "COMMISSION",
  ONBOARDING_BONUS = "ONBOARDING_BONUS",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface ITransaction {
  id: string;
  transaction_id: string;
  type: TransactionType;
  sender_id?: string | null;
  receiver_id?: string | null;
  sender_wallet_id?: string | null;
  receiver_wallet_id?: string | null;
  amount: number;
  fee: number;
  total_amount: number;
  status: TransactionStatus;
  description?: string | null;
  reference_number?: string | null;
  metadata?: Record<string, any> | null;
  user_agent?: string | null;
  initiated_at: Date | string;
  completed_at?: Date | string | null;
  failed_reason?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateTransaction {
  type: TransactionType;
  sender_id?: string | null;
  receiver_id?: string | null;
  sender_wallet_id?: string | null;
  receiver_wallet_id?: string | null;
  amount: number;
  fee?: number;
  description?: string | null;
  reference_number?: string | null;
  metadata?: Record<string, any> | null;
  user_agent?: string | null;
}

export interface IUpdateTransaction {
  status?: TransactionStatus;
  completed_at?: Date | string | null;
  failed_reason?: string | null;
}

export class TransactionsModel extends BaseModel {
  protected tableName = "transactions";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS transactions (
      id CHAR(8) PRIMARY KEY,
      transaction_id VARCHAR(50) UNIQUE NOT NULL,
      type ENUM('SEND_MONEY', 'ADD_MONEY', 'CASH_OUT', 'CASH_IN', 'BILL_PAYMENT', 'BANK_TRANSFER', 'CASHBACK', 'COMMISSION', 'ONBOARDING_BONUS') NOT NULL,
      sender_id CHAR(8) NULL,
      receiver_id CHAR(8) NULL,
      sender_wallet_id CHAR(8) NULL,
      receiver_wallet_id CHAR(8) NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      fee DECIMAL(15,2) DEFAULT 0.00,
      total_amount DECIMAL(15,2) NOT NULL,
      status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
      description TEXT NULL,
      reference_number VARCHAR(100) NULL,
      metadata JSON NULL,
      user_agent TEXT NULL,
      initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      failed_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_transactions_trx_id (transaction_id),
      INDEX idx_transactions_sender (sender_id),
      INDEX idx_transactions_receiver (receiver_id),
      INDEX idx_transactions_type (type),
      INDEX idx_transactions_status (status),
      INDEX idx_transactions_date (created_at),
      INDEX idx_transactions_user_date (sender_id, created_at),
      INDEX idx_transactions_status_date (status, created_at),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id),
      FOREIGN KEY (sender_wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (receiver_wallet_id) REFERENCES wallets(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  private generateTransactionId(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    return `TXN-${year}${month}${day}-${random}`;
  }

  async createTransaction(txnData: ICreateTransaction): Promise<ITransaction> {
    const id = await generateUniqueId(this);
    const transaction_id = this.generateTransactionId();
    const fee = txnData.fee || 0;
    const total_amount = txnData.amount + fee;

    const transaction = {
      id,
      transaction_id,
      ...txnData,
      fee,
      total_amount,
      status: TransactionStatus.PENDING,
      metadata: txnData.metadata ? JSON.stringify(txnData.metadata) : null,
    };

    const columns = Object.keys(transaction).join(", ");
    const placeholders = Object.keys(transaction)
      .map(() => "?")
      .join(", ");
    const values = Object.values(transaction);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<ITransaction | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE transaction_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [transactionId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    conditions?: any,
  ): Promise<ITransaction[]> {
    let whereClause = "(sender_id = ? OR receiver_id = ?)";
    const params: any[] = [userId, userId];

    // Add optional filters
    if (conditions?.type) {
      whereClause += " AND type = ?";
      params.push(conditions.type);
    }
    if (conditions?.status) {
      whereClause += " AND status = ?";
      params.push(conditions.status);
    }

    // LIMIT and OFFSET must be integers in the SQL string, not placeholders
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit.toString())} OFFSET ${parseInt(offset.toString())}
    `;

    const results = await this.executeQuery(sql, params);
    return Array.isArray(results) ? results : [];
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    failedReason?: string,
  ): Promise<ITransaction | null> {
    let sql = `UPDATE ${this.tableName} SET status = ?`;
    const params: any[] = [status];

    if (status === TransactionStatus.COMPLETED) {
      sql += `, completed_at = CURRENT_TIMESTAMP`;
    }

    if (failedReason) {
      sql += `, failed_reason = ?`;
      params.push(failedReason);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await this.executeQuery(sql, params);
    return await this.findById(id);
  }

  async findPendingTransactions(): Promise<ITransaction[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
    `;
    const results = await this.executeQuery(sql);
    return Array.isArray(results) ? results : [];
  }

  async getTotalByUserAndType(
    userId: string,
    type: TransactionType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let sql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM ${this.tableName}
      WHERE sender_id = ? AND type = ? AND status = 'COMPLETED'
    `;
    const params: any[] = [userId, type];

    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }

    const results = await this.executeQuery(sql, params);
    return results[0]?.total || 0;
  }

  async countByUserId(userId: string, conditions?: any): Promise<number> {
    let sql = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      WHERE (sender_id = ? OR receiver_id = ?)
    `;
    const params: any[] = [userId, userId];

    if (conditions) {
      if (conditions.type) {
        sql += ` AND type = ?`;
        params.push(conditions.type);
      }
      if (conditions.status) {
        sql += ` AND status = ?`;
        params.push(conditions.status);
      }
    }

    const results = await this.executeQuery(sql, params);
    return results[0]?.count || 0;
  }

  async countByStatus(status: TransactionStatus): Promise<number> {
    return await this.count({ status });
  }

  async getTotalByType(
    type: TransactionType,
  ): Promise<{ count: number; amount: number }> {
    const sql = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM ${this.tableName}
      WHERE type = ? AND status = 'COMPLETED'
    `;
    const results = await this.executeQuery(sql, [type]);
    return results[0] || { count: 0, amount: 0 };
  }

  async getTransactionTrend(
    startDate?: string,
    endDate?: string,
    groupBy: string = "day",
  ): Promise<any[]> {
    const dateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";
    let sql = `
      SELECT 
        DATE_FORMAT(created_at, '${dateFormat}') as period,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM ${this.tableName}
      WHERE status = 'COMPLETED'
    `;
    const params: any[] = [];

    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }

    sql += ` GROUP BY period ORDER BY period DESC`;

    return await this.executeQuery(sql, params);
  }

  async getTotalFees(startDate?: string, endDate?: string): Promise<number> {
    let sql = `
      SELECT COALESCE(SUM(fee), 0) as total
      FROM ${this.tableName}
      WHERE status = 'COMPLETED'
    `;
    const params: any[] = [];

    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }

    const results = await this.executeQuery(sql, params);
    return results[0]?.total || 0;
  }

  async getFeesByType(type: TransactionType): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(fee), 0) as total
      FROM ${this.tableName}
      WHERE type = ? AND status = 'COMPLETED'
    `;
    const results = await this.executeQuery(sql, [type]);
    return results[0]?.total || 0;
  }

  async getRevenueTrend(startDate?: string, endDate?: string): Promise<any[]> {
    let sql = `
      SELECT 
        DATE(created_at) as date,
        SUM(fee) as revenue
      FROM ${this.tableName}
      WHERE status = 'COMPLETED'
    `;
    const params: any[] = [];

    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }

    sql += ` GROUP BY DATE(created_at) ORDER BY date DESC`;

    return await this.executeQuery(sql, params);
  }
}

export const Transactions = new TransactionsModel();
