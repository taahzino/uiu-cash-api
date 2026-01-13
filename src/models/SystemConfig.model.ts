import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export interface ISystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  description?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateSystemConfig {
  config_key: string;
  config_value: string;
  description?: string | null;
}

export interface IUpdateSystemConfig {
  config_value?: string;
  description?: string | null;
}

export class SystemConfigModel extends BaseModel {
  protected tableName = "system_config";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS system_config (
      id CHAR(8) PRIMARY KEY,
      config_key VARCHAR(100) UNIQUE NOT NULL,
      config_value TEXT NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_system_config_key (config_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createConfig(configData: ICreateSystemConfig): Promise<ISystemConfig> {
    const id = await generateUniqueId(this);
    const config = {
      id,
      ...configData,
    };

    const columns = Object.keys(config).join(", ");
    const placeholders = Object.keys(config)
      .map(() => "?")
      .join(", ");
    const values = Object.values(config);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByKey(key: string): Promise<ISystemConfig | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE config_key = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [key]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async updateByKey(key: string, value: string, description?: string): Promise<ISystemConfig | null> {
    let sql = `UPDATE ${this.tableName} SET config_value = ?`;
    const params: any[] = [value];

    if (description !== undefined) {
      sql += `, description = ?`;
      params.push(description);
    }

    sql += ` WHERE config_key = ?`;
    params.push(key);

    await this.executeQuery(sql, params);
    return await this.findByKey(key);
  }

  async keyExists(key: string): Promise<boolean> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE config_key = ?`;
    const results = await this.executeQuery(sql, [key]);
    return results[0]?.count > 0;
  }

  async getAllConfigs(): Promise<ISystemConfig[]> {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY config_key ASC`;
    const results = await this.executeQuery(sql);
    return Array.isArray(results) ? results : [];
  }
}

export const SystemConfig = new SystemConfigModel();
