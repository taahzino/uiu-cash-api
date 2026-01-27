import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

/**
 * Admin Status Enum
 */
export enum AdminStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

/**
 * Admin interface matching the database schema
 */
export interface IAdmin {
  id: string;
  email: string;
  password_hash: string;
  public_key: string;
  name: string;
  status: AdminStatus;
  last_login_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  created_by?: string | null;
}

/**
 * Admin creation input
 */
export interface ICreateAdmin {
  email: string;
  password_hash: string;
  public_key: string;
  name: string;
  status?: AdminStatus;
  created_by?: string | null;
}

/**
 * Admin update input
 */
export interface IUpdateAdmin {
  email?: string;
  password_hash?: string;
  public_key?: string;
  name?: string;
  status?: AdminStatus;
  last_login_at?: Date | string | null;
}

/**
 * Admins Model Class
 */
export class AdminsModel extends BaseModel {
  protected tableName = "admins";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS admins (
      id CHAR(8) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      public_key CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_by CHAR(8) NULL,
      INDEX idx_admins_email (email),
      INDEX idx_admins_status (status),
      FOREIGN KEY (created_by) REFERENCES admins(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createAdmin(adminData: ICreateAdmin): Promise<IAdmin> {
    const id = await generateUniqueId(this);
    const admin = {
      id,
      ...adminData,
      status: adminData.status || AdminStatus.ACTIVE,
    };

    const columns = Object.keys(admin).join(", ");
    const placeholders = Object.keys(admin)
      .map(() => "?")
      .join(", ");
    const values = Object.values(admin);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByEmail(email: string): Promise<IAdmin | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [email]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async updateAdmin(id: string, updates: IUpdateAdmin): Promise<IAdmin | null> {
    return await this.updateById(id, updates);
  }

  async updateLoginInfo(id: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.executeQuery(sql, [id]);
  }

  async updateStatus(id: string, status: AdminStatus): Promise<IAdmin | null> {
    return await this.updateById(id, { status });
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = ?`;
    const params: any[] = [email];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const results = await this.executeQuery(sql, params);
    return results[0]?.count > 0;
  }
}

export const Admins = new AdminsModel();
