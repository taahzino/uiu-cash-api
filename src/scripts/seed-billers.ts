import { Billers, BillType } from "../models/Billers.model";
import { Admins } from "../models/Admins.model";
import logger from "../config/_logger";

/**
 * Seed Default Billers
 * Run this script to populate the database with default billers
 */

const defaultBillers = [
  // Electricity
  {
    name: "Dhaka Electric Supply Company Limited (DESCO)",
    biller_code: "DESCO-ELEC",
    bill_type: BillType.ELECTRICITY,
    contact_phone: "01713074499",
    contact_email: "info@desco.org.bd",
    description: "Electricity supply for Dhaka city area",
  },
  {
    name: "Dhaka Power Distribution Company Limited (DPDC)",
    biller_code: "DPDC-ELEC",
    bill_type: BillType.ELECTRICITY,
    contact_phone: "01713074488",
    contact_email: "info@dpdc.gov.bd",
    description: "Power distribution for Dhaka metropolitan area",
  },
  {
    name: "West Zone Power Distribution Company Limited",
    biller_code: "WZPDCL-ELEC",
    bill_type: BillType.ELECTRICITY,
    contact_phone: "01713074477",
    contact_email: "info@wzpdcl.gov.bd",
    description: "Electricity distribution in western zone",
  },

  // Gas
  {
    name: "Titas Gas Transmission & Distribution Company Limited",
    biller_code: "TITAS-GAS",
    bill_type: BillType.GAS,
    contact_phone: "01713074466",
    contact_email: "info@titasgas.org.bd",
    description: "Natural gas transmission and distribution",
  },
  {
    name: "Jalalabad Gas Transmission & Distribution System Ltd.",
    biller_code: "JGTDSL-GAS",
    bill_type: BillType.GAS,
    contact_phone: "01713074455",
    contact_email: "info@jgtdsl.gov.bd",
    description: "Gas distribution for Sylhet division",
  },

  // Water
  {
    name: "Dhaka Water Supply and Sewerage Authority (DWASA)",
    biller_code: "DWASA-WATER",
    bill_type: BillType.WATER,
    contact_phone: "01713074444",
    contact_email: "info@dwasa.gov.bd",
    description: "Water supply for Dhaka city",
  },
  {
    name: "Chittagong Water Supply and Sewerage Authority",
    biller_code: "CWASA-WATER",
    bill_type: BillType.WATER,
    contact_phone: "01713074433",
    contact_email: "info@cwasa.gov.bd",
    description: "Water supply for Chittagong city",
  },

  // Mobile
  {
    name: "Grameenphone Limited",
    biller_code: "GP-MOBILE",
    bill_type: BillType.MOBILE,
    contact_phone: "01713074422",
    contact_email: "info@grameenphone.com",
    description: "Mobile operator - Grameenphone",
  },
  {
    name: "Robi Axiata Limited",
    biller_code: "ROBI-MOBILE",
    bill_type: BillType.MOBILE,
    contact_phone: "01713074411",
    contact_email: "info@robi.com.bd",
    description: "Mobile operator - Robi",
  },
  {
    name: "Banglalink Digital Communications Limited",
    biller_code: "BL-MOBILE",
    bill_type: BillType.MOBILE,
    contact_phone: "01713074400",
    contact_email: "info@banglalink.net",
    description: "Mobile operator - Banglalink",
  },
  {
    name: "Teletalk Bangladesh Limited",
    biller_code: "TELETALK-MOBILE",
    bill_type: BillType.MOBILE,
    contact_phone: "01713074399",
    contact_email: "info@teletalk.com.bd",
    description: "State-owned mobile operator",
  },

  // Internet
  {
    name: "Bangladesh Telecommunication Company Limited (BTCL)",
    biller_code: "BTCL-INTERNET",
    bill_type: BillType.INTERNET,
    contact_phone: "01713074388",
    contact_email: "info@btcl.gov.bd",
    description: "Internet service provider",
  },
  {
    name: "Link3 Technologies Limited",
    biller_code: "LINK3-INTERNET",
    bill_type: BillType.INTERNET,
    contact_phone: "01713074377",
    contact_email: "info@link3.net",
    description: "Broadband internet service",
  },
  {
    name: "Aamra Networks Limited",
    biller_code: "AAMRA-INTERNET",
    bill_type: BillType.INTERNET,
    contact_phone: "01713074366",
    contact_email: "info@aamranetworks.com",
    description: "Enterprise internet solutions",
  },

  // TV
  {
    name: "Akash Digital Television",
    biller_code: "AKASH-TV",
    bill_type: BillType.TV,
    contact_phone: "01713074355",
    contact_email: "info@akash-dtth.com",
    description: "Digital satellite television",
  },
  {
    name: "Tata Sky Bangladesh",
    biller_code: "TATASKY-TV",
    bill_type: BillType.TV,
    contact_phone: "01713074344",
    contact_email: "info@tatasky.com.bd",
    description: "DTH television service",
  },

  // Organizations
  {
    name: "United International University (UIU)",
    biller_code: "UIU-ORG",
    bill_type: BillType.ORGANIZATION,
    contact_phone: "01713074333",
    contact_email: "accounts@uiu.ac.bd",
    description: "University tuition and fees",
  },
  {
    name: "Dhaka University",
    biller_code: "DU-ORG",
    bill_type: BillType.ORGANIZATION,
    contact_phone: "01713074322",
    contact_email: "accounts@du.ac.bd",
    description: "University fees and payments",
  },
  {
    name: "BUET - Bangladesh University of Engineering and Technology",
    biller_code: "BUET-ORG",
    bill_type: BillType.ORGANIZATION,
    contact_phone: "01713074311",
    contact_email: "accounts@buet.ac.bd",
    description: "University tuition and academic fees",
  },
];

async function seedBillers() {
  try {
    logger.info("Starting biller seeding process...");

    // Initialize database tables
    await Billers.initialize();
    await Admins.initialize();

    // Get or create default admin
    let admin = await Admins.findAll();
    if (admin.length === 0) {
      logger.error("No admin found. Please create an admin first.");
      process.exit(1);
    }

    const adminId = admin[0].id;

    // Check and create billers
    let created = 0;
    let skipped = 0;

    for (const billerData of defaultBillers) {
      const existing = await Billers.findByCode(billerData.biller_code);

      if (existing) {
        logger.info(`Skipping ${billerData.name} - already exists`);
        skipped++;
        continue;
      }

      await Billers.createBiller({
        ...billerData,
        created_by: adminId,
      });

      logger.info(`✓ Created biller: ${billerData.name}`);
      created++;
    }

    logger.info("\n" + "=".repeat(60));
    logger.info("Biller Seeding Completed!");
    logger.info(`Created: ${created} billers`);
    logger.info(`Skipped: ${skipped} billers (already exist)`);
    logger.info(`Total: ${defaultBillers.length} billers`);
    logger.info("=".repeat(60));

    process.exit(0);
  } catch (error: any) {
    logger.error("Error seeding billers: " + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seed script
seedBillers();
