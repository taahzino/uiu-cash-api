import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum BankTransferStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IBankTransfer {
  id: string;
  transaction_id: string;
  user_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string | null;
  amount: number;
  fee: number;
  status: BankTransferStatus;
  reference_number?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateBankTransfer {
  transaction_id: string;
  user_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string | null;
  amount: number;
  fee: number;
}

export interface IUpdateBankTransfer {
  status?: BankTransferStatus;
  reference_number?: string | null;
}

export class BankTransfersModel extends BaseModel {
  protected tableName = "bank_transfers";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS bank_transfers (
      id CHAR(8) PRIMARY KEY,
      transaction_id CHAR(8) UNIQUE NOT NULL,
      user_id CHAR(8) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      account_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      routing_number VARCHAR(50) NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      fee DECIMAL(15,2) DEFAULT 0.00,
      status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
      reference_number VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bank_transfers_transaction (transaction_id),
      INDEX idx_bank_transfers_user (user_id),
      INDEX idx_bank_transfers_status (status),
      INDEX idx_bank_transfers_date (created_at),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createBankTransfer(
    transferData: ICreateBankTransfer,
  ): Promise<IBankTransfer> {
    const id = await generateUniqueId(this);
    const transfer = {
      id,
      ...transferData,
      status: BankTransferStatus.PENDING,
    };

    const columns = Object.keys(transfer).join(", ");
    const placeholders = Object.keys(transfer)
      .map(() => "?")
      .join(", ");
    const values = Object.values(transfer);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<IBankTransfer | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE transaction_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [transactionId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<IBankTransfer[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const results = await this.executeQuery(sql, [userId, limit, offset]);
    return Array.isArray(results) ? results : [];
  }

  async updateStatus(
    id: string,
    status: BankTransferStatus,
    referenceNumber?: string,
  ): Promise<IBankTransfer | null> {
    const updates: any = { status };
    if (referenceNumber) {
      updates.reference_number = referenceNumber;
    }
    return await this.updateById(id, updates);
  }

  async countByUserId(userId: string): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const results = await this.executeQuery(sql, [userId]);
    return results[0]?.count || 0;
  }

  async getTotalByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let sql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM ${this.tableName}
      WHERE user_id = ? AND status = 'COMPLETED'
    `;
    const params: any[] = [userId];

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
}

export const BankTransfers = new BankTransfersModel();
