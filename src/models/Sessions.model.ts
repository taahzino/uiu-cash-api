import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export interface ISession {
  id: string;
  user_id: string;
  token: string;
  user_agent?: string | null;
  expires_at: Date | string;
  created_at: Date | string;
}

export interface ICreateSession {
  user_id: string;
  token: string;
  user_agent?: string | null;
  expires_at: Date | string;
}

export class SessionsModel extends BaseModel {
  protected tableName = "sessions";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS sessions (
      id CHAR(8) PRIMARY KEY,
      user_id CHAR(8) NOT NULL,
      token TEXT NOT NULL,
      user_agent TEXT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sessions_user (user_id),
      INDEX idx_sessions_expires (expires_at),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createSession(sessionData: ICreateSession): Promise<ISession> {
    const id = await generateUniqueId(this);
    const session = {
      id,
      ...sessionData,
    };

    const columns = Object.keys(session).join(", ");
    const placeholders = Object.keys(session)
      .map(() => "?")
      .join(", ");
    const values = Object.values(session);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByUserId(userId: string): Promise<ISession[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `;
    const results = await this.executeQuery(sql, [userId]);
    return Array.isArray(results) ? results : [];
  }
}

export const Sessions = new SessionsModel();
