/**
 * Script to migrate platform wallet from file-based system to database
 * Run this once to transfer existing balance to database
 */

import { PlatformWallet } from "../models/PlatformWallet.model";
import logger from "../config/_logger";

const fs = require("fs");
const path = require("path");

async function migratePlatformWallet() {
  try {
    console.log("=== Platform Wallet Migration ===");

    // Ensure tables exist
    console.log("→ Creating tables if not exist...");
    await PlatformWallet.initialize();
    console.log("✓ Platform wallet table ready");

    // Check if platform wallet already exists in database
    const existingWallet = await PlatformWallet.getPlatformWallet();
    if (existingWallet) {
      console.log(
        "✓ Platform wallet already exists in database with balance:",
        existingWallet.balance,
      );
      console.log(
        "  Total fees collected:",
        existingWallet.total_fees_collected,
      );
      console.log(
        "  Total commissions paid:",
        existingWallet.total_commissions_paid,
      );
      console.log("  Total bonuses given:", existingWallet.total_bonuses_given);
      console.log("  Last transaction:", existingWallet.last_transaction_at);
      return;
    }

    // Read from file-based system
    const dataFilePath = path.join(
      __dirname,
      "../../simulation/platform_wallet/data.json",
    );

    if (!fs.existsSync(dataFilePath)) {
      console.log("✗ Platform wallet data file not found");
      console.log("→ Initializing with balance 0");
      await PlatformWallet.initializePlatformWallet(0);
      console.log("✓ Platform wallet initialized successfully");
      return;
    }

    const fileData = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    const fileWallet = fileData.platform_wallet;

    console.log("Found file-based platform wallet:");
    console.log("  Balance:", fileWallet.balance);
    console.log(
      "  Total fees collected:",
      fileWallet.total_fees_collected || 0,
    );
    console.log(
      "  Total commissions paid:",
      fileWallet.total_commissions_paid || 0,
    );
    console.log("  Total bonuses given:", fileWallet.total_bonuses_given || 0);

    // Initialize database with file data
    const initialBalance = parseFloat(fileWallet.balance || 0);
    await PlatformWallet.initializePlatformWallet(initialBalance);

    console.log("✓ Platform wallet migrated to database successfully");
    console.log("→ Balance transferred:", initialBalance);

    // Verify
    const newWallet = await PlatformWallet.getPlatformWallet();
    console.log("✓ Verification: Database balance =", newWallet?.balance);

    logger.info("Platform wallet migrated from file to database");
  } catch (error: any) {
    console.error("✗ Migration failed:", error.message);
    logger.error("Platform wallet migration error: " + error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migratePlatformWallet()
    .then(() => {
      console.log("\n=== Migration Complete ===");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n=== Migration Failed ===");
      console.error(error);
      process.exit(1);
    });
}

export default migratePlatformWallet;
