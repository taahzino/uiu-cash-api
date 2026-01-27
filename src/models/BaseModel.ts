import mysql from "mysql2/promise";
import { getConnection, query } from "../config/_database";
import logger from "../config/_logger";

/**
 * Base Model class that all database models should extend
 * Provides common database operations and table management
 */
export abstract class BaseModel {
  protected abstract tableName: string;
  protected abstract createTableSQL: string;

  /**
   * Initialize the model by creating the table if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await query(this.createTableSQL);
      logger.info(`Table '${this.tableName}' initialized successfully`);
    } catch (error: any) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        logger.info(`Table '${this.tableName}' already exists`);
      } else {
        logger.error(
          `Failed to initialize table '${this.tableName}': ${error.message}`,
        );
        throw error;
      }
    }
  }

  /**
   * Execute a raw query
   */
  protected async executeQuery(sql: string, params?: any[]): Promise<any> {
    return await query(sql, params);
  }

  /**
   * Get a connection for transactions
   */
  protected async getConnection(): Promise<mysql.PoolConnection> {
    return await getConnection();
  }

  /**
   * Get a connection for transactions (public method)
   */
  async getConnectionPublic(): Promise<mysql.PoolConnection> {
    return await getConnection();
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<any | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [id]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  /**
   * Find all records with optional conditions
   */
  async findAll(
    conditions?: Record<string, any>,
    limit?: number,
    offset?: number,
  ): Promise<any[]> {
    console.log("[BaseModel.findAll] Input:", {
      tableName: this.tableName,
      conditions,
      limit,
      offset,
      limitType: typeof limit,
      offsetType: typeof offset,
    });
    let sql = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    let hasWhere = false;

    if (conditions && Object.keys(conditions).length > 0) {
      const conditionsArray = Object.entries(conditions).map(([key, value]) => {
        params.push(value);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditionsArray.join(" AND ")}`;
      hasWhere = true;
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    if (offset) {
      sql += ` OFFSET ${offset}`;
    }

    console.log("[BaseModel.findAll] Final SQL:", sql);
    console.log("[BaseModel.findAll] Params:", params);
    return await this.executeQuery(sql, params);
  }

  /**
   * Find one record by conditions
   */
  async findOne(conditions: Record<string, any>): Promise<any | null> {
    const conditionsArray = Object.entries(conditions).map(([key, value]) => {
      return `${key} = ?`;
    });
    const params = Object.values(conditions);

    const sql = `SELECT * FROM ${this.tableName} WHERE ${conditionsArray.join(
      " AND ",
    )} LIMIT 1`;
    const results = await this.executeQuery(sql, params);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  /**
   * Create a new record
   */
  async create(data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => "?").join(", ");

    const sql = `INSERT INTO ${this.tableName} (${columns.join(
      ", ",
    )}) VALUES (${placeholders})`;
    const result: any = await this.executeQuery(sql, values);
    return await this.findById(result.insertId || data.id);
  }

  /**
   * Update a record by ID
   */
  async updateById(id: string, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col) => `${col} = ?`).join(", ");

    const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.executeQuery(sql, [...values, id]);
    return await this.findById(id);
  }

  /**
   * Count records with optional conditions
   */
  async count(conditions?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];
    let hasWhere = false;

    if (conditions) {
      const conditionsArray = Object.entries(conditions).map(([key, value]) => {
        params.push(value);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditionsArray.join(" AND ")}`;
      hasWhere = true;
    }

    const results = await this.executeQuery(sql, params);
    return Array.isArray(results) && results.length > 0 ? results[0].count : 0;
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.getConnection();
    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
