import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum EntryType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export interface ILedger {
  id: string;
  transaction_id: string;
  wallet_id: string;
  entry_type: EntryType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string | null;
  created_at: Date | string;
}

export interface ICreateLedger {
  transaction_id: string;
  wallet_id: string;
  entry_type: EntryType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string | null;
}

export class LedgersModel extends BaseModel {
  protected tableName = "ledgers";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS ledgers (
      id CHAR(8) PRIMARY KEY,
      transaction_id CHAR(8) NOT NULL,
      wallet_id CHAR(8) NOT NULL,
      entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      balance_before DECIMAL(15,2) NOT NULL,
      balance_after DECIMAL(15,2) NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ledgers_transaction (transaction_id),
      INDEX idx_ledgers_wallet (wallet_id),
      INDEX idx_ledgers_entry_type (entry_type),
      INDEX idx_ledgers_date (created_at),
      INDEX idx_ledgers_wallet_date (wallet_id, created_at),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createLedgerEntry(ledgerData: ICreateLedger): Promise<ILedger> {
    const id = await generateUniqueId(this);
    const ledger = {
      id,
      ...ledgerData,
    };

    const columns = Object.keys(ledger).join(", ");
    const placeholders = Object.keys(ledger)
      .map(() => "?")
      .join(", ");
    const values = Object.values(ledger);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByTransactionId(transactionId: string): Promise<ILedger[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE transaction_id = ? ORDER BY created_at ASC`;
    const results = await this.executeQuery(sql, [transactionId]);
    return Array.isArray(results) ? results : [];
  }

  async findByWalletId(
    walletId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ILedger[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE wallet_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const results = await this.executeQuery(sql, [walletId, limit, offset]);
    return Array.isArray(results) ? results : [];
  }

  async findByTransactionAndWallet(
    transactionId: string,
    walletId: string,
  ): Promise<ILedger | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE transaction_id = ? AND wallet_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [transactionId, walletId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async verifyBalance(transactionId: string): Promise<boolean> {
    const sql = `
      SELECT
        SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as total_debit,
        SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as total_credit
      FROM ${this.tableName}
      WHERE transaction_id = ?
    `;
    const results = await this.executeQuery(sql, [transactionId]);
    const { total_debit, total_credit } = results[0];
    return total_debit === total_credit;
  }

  async getBalanceHistory(
    walletId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ILedger[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE wallet_id = ?`;
    const params: any[] = [walletId];

    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY created_at ASC`;

    const results = await this.executeQuery(sql, params);
    return Array.isArray(results) ? results : [];
  }
}

export const Ledgers = new LedgersModel();
