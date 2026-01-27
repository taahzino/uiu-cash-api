import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum CashoutStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface IAgentCashout {
  id: string;
  transaction_id: string;
  agent_id: string;
  requester_id: string;
  amount: number;
  fee: number;
  commission: number;
  status: CashoutStatus;
  location?: string | null;
  notes?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateAgentCashout {
  transaction_id: string;
  agent_id: string;
  requester_id: string;
  amount: number;
  fee: number;
  commission: number;
  location?: string | null;
  notes?: string | null;
}

export interface IUpdateAgentCashout {
  status?: CashoutStatus;
  notes?: string | null;
}

export class AgentCashoutsModel extends BaseModel {
  protected tableName = "agent_cashouts";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS agent_cashouts (
      id CHAR(8) PRIMARY KEY,
      transaction_id CHAR(8) UNIQUE NOT NULL,
      agent_id CHAR(8) NOT NULL,
      requester_id CHAR(8) NOT NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      fee DECIMAL(15,2) DEFAULT 0.00,
      commission DECIMAL(15,2) DEFAULT 0.00,
      status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
      location TEXT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cashouts_transaction (transaction_id),
      INDEX idx_cashouts_agent (agent_id),
      INDEX idx_cashouts_requester (requester_id),
      INDEX idx_cashouts_status (status),
      INDEX idx_cashouts_date (created_at),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (requester_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createCashout(
    cashoutData: ICreateAgentCashout,
  ): Promise<IAgentCashout> {
    const id = await generateUniqueId(this);
    const cashout = {
      id,
      ...cashoutData,
      status: CashoutStatus.PENDING,
    };

    const columns = Object.keys(cashout).join(", ");
    const placeholders = Object.keys(cashout)
      .map(() => "?")
      .join(", ");
    const values = Object.values(cashout);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<IAgentCashout | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE transaction_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [transactionId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async findByAgentId(
    agentId: string,
    status?: CashoutStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<IAgentCashout[]> {
    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE agent_id = ?
    `;
    const params: any[] = [agentId];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const results = await this.executeQuery(sql, params);
    return Array.isArray(results) ? results : [];
  }

  async countByAgentId(
    agentId: string,
    status?: CashoutStatus,
  ): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE agent_id = ?`;
    const params: any[] = [agentId];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    const results = await this.executeQuery(sql, params);
    return results[0]?.count || 0;
  }

  async findByRequesterId(
    requesterId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<IAgentCashout[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE requester_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const results = await this.executeQuery(sql, [requesterId, limit, offset]);
    return Array.isArray(results) ? results : [];
  }

  async findPendingForAgent(agentId: string): Promise<IAgentCashout[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE agent_id = ? AND status = 'PENDING'
      ORDER BY created_at ASC
    `;
    const results = await this.executeQuery(sql, [agentId]);
    return Array.isArray(results) ? results : [];
  }

  async updateStatus(
    id: string,
    status: CashoutStatus,
  ): Promise<IAgentCashout | null> {
    return await this.updateById(id, { status });
  }

  async getTotalCommissionByAgent(
    agentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let sql = `
      SELECT COALESCE(SUM(commission), 0) as total
      FROM ${this.tableName}
      WHERE agent_id = ? AND status = 'COMPLETED'
    `;
    const params: any[] = [agentId];

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

export const AgentCashouts = new AgentCashoutsModel();
