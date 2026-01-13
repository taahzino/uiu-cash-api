import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  TRANSACTION = "TRANSACTION",
  STATUS_CHANGE = "STATUS_CHANGE",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  AGENT_APPROVAL = "AGENT_APPROVAL",
}

export interface IAuditLog {
  id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string | null;
  user_id?: string | null;
  admin_id?: string | null;
  user_agent?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  description?: string | null;
  created_at: Date | string;
}

export interface ICreateAuditLog {
  action: AuditAction;
  entity_type: string;
  entity_id?: string | null;
  user_id?: string | null;
  admin_id?: string | null;
  user_agent?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  description?: string | null;
}

export class AuditLogsModel extends BaseModel {
  protected tableName = "audit_logs";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id CHAR(8) PRIMARY KEY,
      action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'TRANSACTION', 'STATUS_CHANGE', 'PASSWORD_CHANGE', 'AGENT_APPROVAL') NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id CHAR(8) NULL,
      user_id CHAR(8) NULL,
      admin_id CHAR(8) NULL,
      user_agent TEXT NULL,
      old_values JSON NULL,
      new_values JSON NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_logs_action (action),
      INDEX idx_audit_logs_entity (entity_type, entity_id),
      INDEX idx_audit_logs_user (user_id),
      INDEX idx_audit_logs_admin (admin_id),
      INDEX idx_audit_logs_date (created_at),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createAuditLog(logData: ICreateAuditLog): Promise<IAuditLog> {
    const id = await generateUniqueId(this);
    const log = {
      id,
      ...logData,
      old_values: logData.old_values
        ? JSON.stringify(logData.old_values)
        : null,
      new_values: logData.new_values
        ? JSON.stringify(logData.new_values)
        : null,
    };

    const columns = Object.keys(log).join(", ");
    const placeholders = Object.keys(log)
      .map(() => "?")
      .join(", ");
    const values = Object.values(log);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<IAuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const results = await this.executeQuery(sql, [entityType, entityId, limit]);
    return Array.isArray(results) ? results : [];
  }

  async findByUser(userId: string, limit: number = 100): Promise<IAuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const results = await this.executeQuery(sql, [userId, limit]);
    return Array.isArray(results) ? results : [];
  }

  async findByAdmin(
    adminId: string,
    limit: number = 100
  ): Promise<IAuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE admin_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const results = await this.executeQuery(sql, [adminId, limit]);
    return Array.isArray(results) ? results : [];
  }

  async findByAction(
    action: AuditAction,
    limit: number = 100
  ): Promise<IAuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE action = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const results = await this.executeQuery(sql, [action, limit]);
    return Array.isArray(results) ? results : [];
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<IAuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const results = await this.executeQuery(sql, [startDate, endDate, limit]);
    return Array.isArray(results) ? results : [];
  }
}

export const AuditLogs = new AuditLogsModel();
