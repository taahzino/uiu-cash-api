import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

/**
 * User Role Enum
 */
export enum UserRole {
  CONSUMER = "CONSUMER",
  AGENT = "AGENT",
}

/**
 * User Status Enum
 */
export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REJECTED = "REJECTED",
}

/**
 * User interface matching the database schema
 */
export interface IUser {
  id: string;
  email: string;
  phone: string;
  password_hash: string;
  public_key: string;
  role: UserRole;
  status: UserStatus;
  first_name: string;
  last_name: string;
  date_of_birth?: Date | string | null;
  nid_number?: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * User creation input (without auto-generated fields)
 */
export interface ICreateUser {
  email: string;
  phone: string;
  password_hash: string;
  public_key: string;
  role: UserRole;
  status?: UserStatus;
  first_name: string;
  last_name: string;
  date_of_birth?: Date | string | null;
  nid_number?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
}

/**
 * User update input (all fields optional except id)
 */
export interface IUpdateUser {
  email?: string;
  phone?: string;
  password_hash?: string;
  public_key?: string;
  role?: UserRole;
  status?: UserStatus;
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date | string | null;
  nid_number?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  last_login_at?: Date | string | null;
}

/**
 * Users Model Class
 * Manages user accounts with OOP pattern
 */
export class UsersModel extends BaseModel {
  protected tableName = "users";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(8) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      public_key CHAR(36) NOT NULL,
      role ENUM('CONSUMER', 'AGENT') NOT NULL,
      status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      date_of_birth DATE NULL,
      nid_number VARCHAR(20) NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      phone_verified BOOLEAN DEFAULT FALSE,
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_email (email),
      INDEX idx_users_phone (phone),
      INDEX idx_users_role (role),
      INDEX idx_users_status (status),
      FULLTEXT INDEX idx_users_fulltext (first_name, last_name, email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  /**
   * Create a new user
   */
  async createUser(userData: ICreateUser): Promise<IUser> {
    const userId = await generateUniqueId(this);
    const user: any = {
      id: userId,
      ...userData,
      status: userData.status || UserStatus.PENDING,
      email_verified: userData.email_verified ?? false,
      phone_verified: userData.phone_verified ?? false,
    };

    return await this.create(user);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return await this.findOne({ email });
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<IUser | null> {
    return await this.findOne({ phone });
  }

  /**
   * Find user by email or phone
   */
  async findByEmailOrPhone(identifier: string): Promise<IUser | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE (email = ? OR phone = ?) 
      LIMIT 1
    `;
    const results = await this.executeQuery(sql, [identifier, identifier]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  /**
   * Update user by ID
   */
  async updateUser(id: string, userData: IUpdateUser): Promise<IUser | null> {
    return await this.updateById(id, userData);
  }

  /**
   * Update login information
   */
  async updateLoginInfo(id: string): Promise<IUser | null> {
    return await this.updateById(id, {
      last_login_at: new Date(),
    });
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<IUser | null> {
    return await this.updateById(id, { status });
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<IUser | null> {
    return await this.updateStatus(id, UserStatus.ACTIVE);
  }

  /**
   * Suspend user
   */
  async suspendUser(id: string): Promise<IUser | null> {
    return await this.updateStatus(id, UserStatus.SUSPENDED);
  }

  /**
   * Reject user
   */
  async rejectUser(id: string): Promise<IUser | null> {
    return await this.updateStatus(id, UserStatus.REJECTED);
  }

  /**
   * Search users by name or email (full-text search)
   */
  async searchUsers(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<IUser[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE MATCH(first_name, last_name, email) AGAINST(? IN NATURAL LANGUAGE MODE)
      LIMIT ? OFFSET ?
    `;
    return await this.executeQuery(sql, [searchTerm, limit, offset]);
  }

  /**
   * Get users by role
   */
  async getUsersByRole(
    role: UserRole,
    limit?: number,
    offset?: number,
  ): Promise<IUser[]> {
    return await this.findAll({ role }, limit, offset);
  }

  /**
   * Get users by status
   */
  async getUsersByStatus(
    status: UserStatus,
    limit?: number,
    offset?: number,
  ): Promise<IUser[]> {
    return await this.findAll({ status }, limit, offset);
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = ?`;
    const params: any[] = [email];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    const results = await this.executeQuery(sql, params);
    return Array.isArray(results) && results.length > 0
      ? results[0].count > 0
      : false;
  }

  /**
   * Check if phone exists
   */
  async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE phone = ?`;
    const params: any[] = [phone];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    const results = await this.executeQuery(sql, params);
    return Array.isArray(results) && results.length > 0
      ? results[0].count > 0
      : false;
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(): Promise<number> {
    return await this.count({ status: UserStatus.ACTIVE });
  }

  /**
   * Get pending users count
   */
  async getPendingUsersCount(): Promise<number> {
    return await this.count({ status: UserStatus.PENDING });
  }

  /**
   * Get registration trend
   */
  async getRegistrationTrend(
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    let sql = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ${this.tableName}
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

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as emailVerified,
        SUM(CASE WHEN phone_verified = 1 THEN 1 ELSE 0 END) as phoneVerified,
        SUM(CASE WHEN email_verified = 1 AND phone_verified = 1 THEN 1 ELSE 0 END) as bothVerified
      FROM ${this.tableName}
    `;

    const results = await this.executeQuery(sql);
    return Array.isArray(results) && results.length > 0 ? results[0] : {};
  }
}

// Export a singleton instance
export const Users = new UsersModel();
