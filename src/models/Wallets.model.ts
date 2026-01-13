import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export interface IWallet {
  id: string;
  user_id: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
  currency: string;
  daily_limit: number;
  monthly_limit: number;
  daily_spent: number;
  monthly_spent: number;
  last_transaction_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateWallet {
  user_id: string;
  balance?: number;
  available_balance?: number;
  currency?: string;
  daily_limit?: number;
  monthly_limit?: number;
}

export interface IUpdateWallet {
  balance?: number;
  available_balance?: number;
  pending_balance?: number;
  daily_limit?: number;
  monthly_limit?: number;
  daily_spent?: number;
  monthly_spent?: number;
  last_transaction_at?: Date | string | null;
}

export class WalletsModel extends BaseModel {
  protected tableName = "wallets";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS wallets (
      id CHAR(8) PRIMARY KEY,
      user_id CHAR(8) UNIQUE NOT NULL,
      balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
      available_balance DECIMAL(15,2) DEFAULT 0.00 CHECK (available_balance >= 0),
      pending_balance DECIMAL(15,2) DEFAULT 0.00,
      currency VARCHAR(3) DEFAULT 'BDT',
      daily_limit DECIMAL(15,2) DEFAULT 50000.00,
      monthly_limit DECIMAL(15,2) DEFAULT 200000.00,
      daily_spent DECIMAL(15,2) DEFAULT 0.00,
      monthly_spent DECIMAL(15,2) DEFAULT 0.00,
      last_transaction_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_wallets_user_id (user_id),
      INDEX idx_wallets_balance (balance),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createWallet(walletData: ICreateWallet): Promise<IWallet> {
    const id = await generateUniqueId(this);
    const wallet = {
      id,
      ...walletData,
      balance: walletData.balance || 0.0,
      available_balance: walletData.available_balance || 0.0,
      pending_balance: 0.0,
      currency: walletData.currency || "BDT",
      daily_limit: walletData.daily_limit || 50000.0,
      monthly_limit: walletData.monthly_limit || 200000.0,
      daily_spent: 0.0,
      monthly_spent: 0.0,
    };

    const columns = Object.keys(wallet).join(", ");
    const placeholders = Object.keys(wallet)
      .map(() => "?")
      .join(", ");
    const values = Object.values(wallet);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByUserId(userId: string): Promise<IWallet | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [userId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async updateBalance(
    id: string,
    balance: number,
    availableBalance: number
  ): Promise<IWallet | null> {
    const sql = `
      UPDATE ${this.tableName}
      SET balance = ?,
          available_balance = ?,
          last_transaction_at = CURRENT_TIMESTAMP
    `;
    await this.executeQuery(sql, [balance, availableBalance, id]);
    return await this.findById(id);
  }

  async incrementSpending(
    id: string,
    amount: number,
    period: "daily" | "monthly"
  ): Promise<void> {
    const column = period === "daily" ? "daily_spent" : "monthly_spent";
    const sql = `UPDATE ${this.tableName} SET ${column} = ${column} + ? WHERE id = ?`;
    await this.executeQuery(sql, [amount, id]);
  }

  async resetSpending(period: "daily" | "monthly"): Promise<void> {
    const column = period === "daily" ? "daily_spent" : "monthly_spent";
    const sql = `UPDATE ${this.tableName} SET ${column} = 0`;
    await this.executeQuery(sql);
  }

  async checkSpendingLimit(
    id: string,
    amount: number,
    period: "daily" | "monthly"
  ): Promise<boolean> {
    const wallet = await this.findById(id);
    if (!wallet) return false;

    if (period === "daily") {
      return wallet.daily_spent + amount <= wallet.daily_limit;
    } else {
      return wallet.monthly_spent + amount <= wallet.monthly_limit;
    }
  }

  async getTotalBalance(): Promise<number> {
    const sql = "SELECT COALESCE(SUM(balance), 0) as total FROM wallets";
    const result = await this.executeQuery(sql);
    return result[0]?.total || 0;
  }
}

export const Wallets = new WalletsModel();
