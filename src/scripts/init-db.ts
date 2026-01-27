/**
 * Database Initialization Script
 * Initializes all database tables and creates first SUPER_ADMIN
 */

import { v4 as uuidv4 } from "uuid";
import logger from "../config/_logger";
import { Admins } from "../models/Admins.model";
import { AgentCashouts } from "../models/AgentCashouts.model";
import { Agents } from "../models/Agents.model";
import { AuditLogs } from "../models/AuditLogs.model";
import { BankTransfers } from "../models/BankTransfers.model";
import { Billers } from "../models/Billers.model";
import { BillPayments } from "../models/BillPayments.model";
import { Ledgers } from "../models/Ledgers.model";
import { Offers } from "../models/Offers.model";
import { PlatformWalletTransactions } from "../models/PlatformWalletTransactions.model";
import { Sessions } from "../models/Sessions.model";
import { SystemConfig } from "../models/SystemConfig.model";
import { Transactions } from "../models/Transactions.model";
import { UserOffers } from "../models/UserOffers.model";
import { Users } from "../models/Users.model";
import { Wallets } from "../models/Wallets.model";
import { hashPassword } from "../utilities/password";

async function initializeDatabase() {
  logger.info("Starting database initialization...");

  try {
    // Initialize tables in correct dependency order
    logger.info("Creating database tables...");

    // Level 1: Base tables with no dependencies
    logger.info("Initializing base tables...");
    await Users.initialize();
    await Admins.initialize();

    // Level 2: Tables dependent on Users or Admins
    logger.info("Initializing user-related tables...");
    await Wallets.initialize();
    await Billers.initialize();
    await Agents.initialize();
    await Sessions.initialize();

    // Level 3: Transactions (depends on Users and Wallets)
    logger.info("Initializing transaction tables...");
    await Transactions.initialize();

    // Level 4: Tables dependent on Transactions
    logger.info("Initializing transaction-dependent tables...");
    await Ledgers.initialize();
    await AgentCashouts.initialize();
    await BillPayments.initialize();
    await BankTransfers.initialize();
    await PlatformWalletTransactions.initialize();

    // Level 5: Offers and related tables
    logger.info("Initializing offer tables...");
    await Offers.initialize();
    await UserOffers.initialize();

    // Level 6: System tables
    logger.info("Initializing system tables...");
    await AuditLogs.initialize();
    await SystemConfig.initialize();

    logger.info("All tables created successfully!");

    // Initialize default system configuration
    logger.info("Setting up default system configurations...");

    const commissionRateConfig = await SystemConfig.findByKey(
      "agent_commission_rate",
    );
    if (!commissionRateConfig) {
      await SystemConfig.createConfig({
        config_key: "agent_commission_rate",
        config_value: "1.50",
        description:
          "Global commission rate percentage for all agents (e.g., 1.50 for 1.5%)",
      });
      logger.info("✓ Agent commission rate set to 1.50%");
    }

    const sendMoneyFeeConfig = await SystemConfig.findByKey("send_money_fee");
    if (!sendMoneyFeeConfig) {
      await SystemConfig.createConfig({
        config_key: "send_money_fee",
        config_value: "5.00",
        description: "Fixed fee for send money (P2P) transactions in BDT",
      });
      logger.info("✓ Send money fee set to ৳5.00");
    }

    const onboardingBonusConfig =
      await SystemConfig.findByKey("onboarding_bonus");
    if (!onboardingBonusConfig) {
      await SystemConfig.createConfig({
        config_key: "onboarding_bonus",
        config_value: "50.00",
        description: "Onboarding bonus amount for new CONSUMER users in BDT",
      });
      logger.info("✓ Onboarding bonus set to ৳50.00");
    }

    logger.info("System configurations initialized!");

    // Check if default admin exists
    const existingAdmin = await Admins.findByEmail("admin@uiucash.com");

    if (!existingAdmin) {
      logger.info("Creating default admin account...");

      const password = "Admin@123"; // Change this password immediately after first login
      const password_hash = await hashPassword(password);
      const public_key = uuidv4();

      await Admins.createAdmin({
        email: "admin@uiucash.com",
        password_hash,
        public_key,
        name: "System Administrator",
        created_by: null,
      });

      logger.info("Admin account created successfully!");
      logger.info("Email: admin@uiucash.com");
      logger.info("Password: Admin@123");
      logger.warn(
        "IMPORTANT: Change this password immediately after first login!",
      );
    } else {
      logger.info("Admin account already exists.");
    }

    logger.info("Database initialization complete!");
    process.exit(0);
  } catch (error: any) {
    logger.error("Error initializing database: " + error.message);
    logger.error(error);
    process.exit(1);
  }
}

initializeDatabase();
