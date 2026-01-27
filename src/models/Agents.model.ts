import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum AgentStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  REJECTED = "REJECTED",
}

export interface IAgent {
  id: string;
  user_id: string;
  agent_code: string;
  business_name: string;
  business_address: string;
  status: AgentStatus;
  total_cashouts: number;
  total_commission_earned: number;
  approved_by?: string | null;
  approved_at?: Date | string | null;
  rejection_reason?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateAgent {
  user_id: string;
  business_name: string;
  business_address: string;
}

export interface IUpdateAgent {
  business_name?: string;
  business_address?: string;
  status?: AgentStatus;
  approved_by?: string | null;
  approved_at?: Date | string | null;
  rejection_reason?: string | null;
}

export class AgentsModel extends BaseModel {
  protected tableName = "agents";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS agents (
      id CHAR(8) PRIMARY KEY,
      user_id CHAR(8) UNIQUE NOT NULL,
      agent_code VARCHAR(20) UNIQUE NOT NULL,
      business_name VARCHAR(255) NOT NULL,
      business_address TEXT NOT NULL,
      status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') DEFAULT 'PENDING',
      total_cashouts INT DEFAULT 0,
      total_commission_earned DECIMAL(15,2) DEFAULT 0.00,
      approved_by CHAR(8) NULL,
      approved_at TIMESTAMP NULL,
      rejection_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agents_user_id (user_id),
      INDEX idx_agents_code (agent_code),
      INDEX idx_agents_status (status),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES admins(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  private generateAgentCode(): string {
    const random = Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(7, "0");
    return `AG${random}`;
  }

  async createAgent(agentData: ICreateAgent): Promise<IAgent> {
    const id = await generateUniqueId(this);
    const agent_code = this.generateAgentCode();
    const agent = {
      id,
      agent_code,
      ...agentData,
      status: AgentStatus.PENDING,
      total_cashouts: 0,
      total_commission_earned: 0.0,
    };

    const columns = Object.keys(agent).join(", ");
    const placeholders = Object.keys(agent)
      .map(() => "?")
      .join(", ");
    const values = Object.values(agent);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByUserId(userId: string): Promise<IAgent | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [userId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async findByAgentCode(agentCode: string): Promise<IAgent | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE agent_code = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [agentCode]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async findPendingAgents(): Promise<IAgent[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE status = 'PENDING' ORDER BY created_at ASC`;
    const results = await this.executeQuery(sql);
    return Array.isArray(results) ? results : [];
  }

  async approveAgent(id: string, approvedBy: string): Promise<IAgent | null> {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'ACTIVE',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP,
          rejection_reason = NULL
      WHERE id = ?
    `;
    await this.executeQuery(sql, [approvedBy, id]);
    return await this.findById(id);
  }

  async rejectAgent(
    id: string,
    approvedBy: string,
    reason: string,
  ): Promise<IAgent | null> {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'REJECTED',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP,
          rejection_reason = ?
      WHERE id = ?
    `;
    await this.executeQuery(sql, [approvedBy, reason, id]);
    return await this.findById(id);
  }

  async incrementStats(id: string, commission: number): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET total_cashouts = total_cashouts + 1,
          total_commission_earned = total_commission_earned + ?
      WHERE id = ?
    `;
    await this.executeQuery(sql, [commission, id]);
  }

  async updateStatus(id: string, status: AgentStatus): Promise<IAgent | null> {
    return await this.updateById(id, { status });
  }

  async agentCodeExists(agentCode: string): Promise<boolean> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE agent_code = ?`;
    const results = await this.executeQuery(sql, [agentCode]);
    return results[0]?.count > 0;
  }

  async getTopAgentsByCommission(limit: number = 10): Promise<IAgent[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'ACTIVE'
      ORDER BY total_commission_earned DESC
      LIMIT ${limit}
    `;
    return await this.executeQuery(sql);
  }

  async getTotalCommissions(): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(total_commission_earned), 0) as total
      FROM ${this.tableName}
      WHERE status = 'ACTIVE'
    `;
    const results = await this.executeQuery(sql);
    return results[0]?.total || 0;
  }

  async countByStatus(status: AgentStatus): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`;
    const results = await this.executeQuery(sql, [status]);
    return results[0]?.count || 0;
  }

  async count(conditions?: any): Promise<number> {
    if (!conditions || Object.keys(conditions).length === 0) {
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const results = await this.executeQuery(sql);
      return results[0]?.count || 0;
    }

    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];
    const whereClauses: string[] = [];

    for (const [key, value] of Object.entries(conditions)) {
      if (key === "created_at_range" && typeof value === "object") {
        whereClauses.push(`created_at BETWEEN ? AND ?`);
        params.push((value as any).start, (value as any).end);
      } else if (key === "created_at_gte") {
        whereClauses.push(`created_at >= ?`);
        params.push(value);
      } else if (key === "created_at_lte") {
        whereClauses.push(`created_at <= ?`);
        params.push(value);
      } else {
        whereClauses.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const results = await this.executeQuery(sql, params);
    return results[0]?.count || 0;
  }
}

export const Agents = new AgentsModel();
