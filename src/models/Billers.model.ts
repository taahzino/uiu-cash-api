import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum BillType {
  ELECTRICITY = "ELECTRICITY",
  GAS = "GAS",
  WATER = "WATER",
  INTERNET = "INTERNET",
  MOBILE = "MOBILE",
  TV = "TV",
}

export enum BillerStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  INACTIVE = "INACTIVE",
}

export interface IBiller {
  id: string;
  name: string;
  biller_code: string;
  bill_type: BillType;
  balance: number;
  total_payments: number;
  status: BillerStatus;
  contact_email?: string | null;
  contact_phone?: string | null;
  description?: string | null;
  logo_url?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string;
}

export interface ICreateBiller {
  name: string;
  biller_code: string;
  bill_type: BillType;
  status?: BillerStatus;
  contact_email?: string | null;
  contact_phone?: string | null;
  description?: string | null;
  logo_url?: string | null;
  created_by: string;
}

export interface IUpdateBiller {
  name?: string;
  biller_code?: string;
  bill_type?: BillType;
  status?: BillerStatus;
  contact_email?: string | null;
  contact_phone?: string | null;
  description?: string | null;
  logo_url?: string | null;
}

export class BillersModel extends BaseModel {
  protected tableName = "billers";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS billers (
      id CHAR(8) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      biller_code VARCHAR(50) UNIQUE NOT NULL,
      bill_type ENUM('ELECTRICITY', 'GAS', 'WATER', 'INTERNET', 'MOBILE', 'TV') NOT NULL,
      balance DECIMAL(15,2) DEFAULT 0.00,
      total_payments INT DEFAULT 0,
      status ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      contact_email VARCHAR(255) NULL,
      contact_phone VARCHAR(20) NULL,
      description TEXT NULL,
      logo_url TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_by CHAR(8) NOT NULL,
      INDEX idx_billers_code (biller_code),
      INDEX idx_billers_type (bill_type),
      INDEX idx_billers_status (status),
      FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createBiller(billerData: ICreateBiller): Promise<IBiller> {
    const id = await generateUniqueId(this);
    const biller = {
      id,
      ...billerData,
      status: billerData.status || BillerStatus.ACTIVE,
      balance: 0.0,
      total_payments: 0,
    };

    const columns = Object.keys(biller).join(", ");
    const placeholders = Object.keys(biller)
      .map(() => "?")
      .join(", ");
    const values = Object.values(biller);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByCode(billerCode: string): Promise<IBiller | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE biller_code = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [billerCode]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async updateBiller(
    id: string,
    updates: IUpdateBiller
  ): Promise<IBiller | null> {
    return await this.updateById(id, updates);
  }

  async updateStatus(
    id: string,
    status: BillerStatus
  ): Promise<IBiller | null> {
    return await this.updateById(id, { status });
  }

  async getBillersByType(billType: BillType): Promise<IBiller[]> {
    return await this.findAll({ bill_type: billType });
  }

  async getActiveBillers(): Promise<IBiller[]> {
    return await this.findAll({ status: BillerStatus.ACTIVE });
  }

  async updateBalance(
    id: string,
    amount: number,
    connection?: any
  ): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET balance = balance + ?,
          total_payments = total_payments + 1
      WHERE id = ?
    `;
    if (connection) {
      await connection.query(sql, [amount, id]);
    } else {
      await this.executeQuery(sql, [amount, id]);
    }
  }

  async getBalance(id: string): Promise<number> {
    const sql = `SELECT balance FROM ${this.tableName} WHERE id = ?`;
    const results = await this.executeQuery(sql, [id]);
    return results[0]?.balance || 0;
  }

  async codeExists(billerCode: string, excludeId?: string): Promise<boolean> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE biller_code = ?`;
    const params: any[] = [billerCode];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const results = await this.executeQuery(sql, params);
    return results[0]?.count > 0;
  }

  async searchBillers(
    searchTerm: string,
    limit: number = 20
  ): Promise<IBiller[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE name LIKE ?
      ORDER BY name ASC
      LIMIT ?
    `;
    return await this.executeQuery(sql, [`%${searchTerm}%`, limit]);
  }
}

export const Billers = new BillersModel();
