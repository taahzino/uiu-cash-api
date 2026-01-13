import dotenv from "dotenv";
import mysql from "mysql2/promise";
import logger from "./_logger";

dotenv.config(
  process.env.NODE_ENV === "production"
    ? { path: ".env.production" }
    : { path: ".env.development" }
);

/**
 * Database connection pool configuration
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "uiu_cash",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "+00:00",
});

/**
 * Execute a query with the connection pool
 */
export async function query(sql: string, params?: any[]): Promise<any> {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a connection from the pool for transactions
 */
export async function getConnection(): Promise<mysql.PoolConnection> {
  return await pool.getConnection();
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await pool.execute("SELECT 1");
    return true;
  } catch (error: any) {
    logger.error("Database connection failed: " + error.message);
    return false;
  }
}

/**
 * Initialize database - Test connection and create all tables
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info("Testing database connection...");
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Database connection failed");
    }
    logger.info("Database connection successful");

    logger.info("Initializing database tables...");

    // Import models dynamically to avoid circular dependencies
    const { Admins } = await import("../models/Admins.model");
    const { AgentCashouts } = await import("../models/AgentCashouts.model");
    const { Agents } = await import("../models/Agents.model");
    const { AuditLogs } = await import("../models/AuditLogs.model");
    const { BankTransfers } = await import("../models/BankTransfers.model");
    const { Billers } = await import("../models/Billers.model");
    const { BillPayments } = await import("../models/BillPayments.model");
    const { Ledgers } = await import("../models/Ledgers.model");
    const { Offers } = await import("../models/Offers.model");
    const { Sessions } = await import("../models/Sessions.model");
    const { SystemConfig } = await import("../models/SystemConfig.model");
    const { Transactions } = await import("../models/Transactions.model");
    const { UserOffers } = await import("../models/UserOffers.model");
    const { Users } = await import("../models/Users.model");
    const { Wallets } = await import("../models/Wallets.model");

    // Level 1: Base tables with no dependencies
    await Users.initialize();
    await Admins.initialize();

    // Level 2: Tables dependent on Users or Admins
    await Wallets.initialize();
    await Billers.initialize();
    await Agents.initialize();
    await Sessions.initialize();

    // Level 3: Transactions (depends on Users and Wallets)
    await Transactions.initialize();

    // Level 4: Tables dependent on Transactions
    await Ledgers.initialize();
    await AgentCashouts.initialize();
    await BillPayments.initialize();
    await BankTransfers.initialize();

    // Level 5: Offers and related tables
    await Offers.initialize();
    await UserOffers.initialize();

    // Level 6: System tables
    await AuditLogs.initialize();
    await SystemConfig.initialize();

    logger.info("All database tables initialized successfully");

    // Initialize default system configurations if not exists
    const defaultConfigs = [
      {
        config_key: "agent_commission_rate",
        config_value: "1.50",
        description: "Global commission rate percentage for all agents (e.g., 1.50 for 1.5%)",
      },
      {
        config_key: "onboarding_bonus",
        config_value: "50.00",
        description: "Bonus amount given to new users upon registration (in BDT)",
      },
      {
        config_key: "send_money_fee",
        config_value: "5.00",
        description: "Flat fee for send money transactions (in BDT)",
      },
      {
        config_key: "cash_out_fee_percentage",
        config_value: "1.85",
        description: "Percentage fee for cash out transactions (e.g., 1.85 for 1.85%)",
      },
      {
        config_key: "bank_transfer_fee_percentage",
        config_value: "1.50",
        description: "Percentage fee for bank transfer transactions (e.g., 1.50 for 1.5%)",
      },
      {
        config_key: "bank_transfer_min_fee",
        config_value: "10.00",
        description: "Minimum fee for bank transfer transactions (in BDT)",
      },
      {
        config_key: "max_transaction_limit",
        config_value: "25000.00",
        description: "Maximum amount per single transaction (in BDT)",
      },
      {
        config_key: "personal_daily_limit",
        config_value: "50000.00",
        description: "Daily transaction limit for personal users (in BDT)",
      },
      {
        config_key: "personal_monthly_limit",
        config_value: "200000.00",
        description: "Monthly transaction limit for personal users (in BDT)",
      },
      {
        config_key: "agent_daily_limit",
        config_value: "100000.00",
        description: "Daily transaction limit for agent users (in BDT)",
      },
      {
        config_key: "agent_monthly_limit",
        config_value: "500000.00",
        description: "Monthly transaction limit for agent users (in BDT)",
      },
      {
        config_key: "min_wallet_balance",
        config_value: "0.00",
        description: "Minimum wallet balance that must be maintained (in BDT)",
      },
      {
        config_key: "agent_min_float",
        config_value: "1000.00",
        description: "Minimum float balance agents must maintain (in BDT)",
      },
    ];

    for (const config of defaultConfigs) {
      const exists = await SystemConfig.findByKey(config.config_key);
      if (!exists) {
        await SystemConfig.createConfig(config);
        logger.info(`Created default config: ${config.config_key}`);
      }
    }

    logger.info("All default system configurations initialized");

  } catch (error: any) {
    logger.error("Database initialization failed: " + error.message);
    logger.error(error);
    throw error;
  }
}

export default pool;
