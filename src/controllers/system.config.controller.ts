import { Request, Response } from "express";
import logger from "../config/_logger";
import { SystemConfig } from "../models/SystemConfig.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_CREATED,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
} from "../utilities/response";

/**
 * Get All System Configurations (Admin)
 * GET /api/admin/config
 */
export const getAllConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await SystemConfig.getAllConfigs();

    return sendResponse(res, STATUS_OK, {
      message: "System configurations retrieved successfully",
      data: {
        configs: configs.map((config: any) => ({
          key: config.config_key,
          value: config.config_value,
          description: config.description,
          updatedAt: config.updated_at,
        })),
      },
    });
  } catch (error: any) {
    logger.error("Get all configs error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching configurations",
    });
  }
};

/**
 * Get Configuration by Key (Admin)
 * GET /api/admin/config/:key
 */
export const getConfigByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const config = await SystemConfig.findByKey(key);
    if (!config) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Configuration not found",
      });
    }

    return sendResponse(res, STATUS_OK, {
      message: "Configuration retrieved successfully",
      data: {
        config: {
          key: config.config_key,
          value: config.config_value,
          description: config.description,
          updatedAt: config.updated_at,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get config by key error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching configuration",
    });
  }
};

/**
 * Create or Update Configuration (Admin)
 * POST /api/admin/config
 */
export const createOrUpdateConfig = async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;
    const adminId = res.locals.admin?.id;

    // Check if config exists
    const existingConfig = await SystemConfig.findByKey(key);

    if (existingConfig) {
      // Update existing config
      await SystemConfig.updateByKey(key, value, description);
      logger.info(`Admin ${adminId} updated config: ${key}`);

      return sendResponse(res, STATUS_OK, {
        message: "Configuration updated successfully",
        data: {
          config: {
            key,
            value,
            description: description || existingConfig.description,
          },
        },
      });
    } else {
      // Create new config
      const newConfig = await SystemConfig.createConfig({
        config_key: key,
        config_value: value,
        description: description || null,
      });

      logger.info(`Admin ${adminId} created config: ${key}`);

      return sendResponse(res, STATUS_CREATED, {
        message: "Configuration created successfully",
        data: {
          config: {
            key: newConfig.config_key,
            value: newConfig.config_value,
            description: newConfig.description,
          },
        },
      });
    }
  } catch (error: any) {
    logger.error("Create/update config error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while saving configuration",
    });
  }
};

/**
 * Update Configuration by Key (Admin)
 * PUT /api/admin/config/:key
 */
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const adminId = res.locals.admin?.id;

    if (!value) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Value is required",
      });
    }

    const existingConfig = await SystemConfig.findByKey(key);
    if (!existingConfig) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Configuration not found",
      });
    }

    await SystemConfig.updateByKey(key, value, description);

    logger.info(`Admin ${adminId} updated config: ${key}`);

    return sendResponse(res, STATUS_OK, {
      message: "Configuration updated successfully",
      data: {
        config: {
          key,
          value,
          description: description || existingConfig.description,
        },
      },
    });
  } catch (error: any) {
    logger.error("Update config error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while updating configuration",
    });
  }
};

/**
 * Get Public Configurations (No auth required)
 * GET /api/config/public
 */
export const getPublicConfigs = async (req: Request, res: Response) => {
  try {
    // Define which configs are safe to expose publicly
    const publicKeys = [
      "SEND_MONEY_FEE",
      "CASH_OUT_FEE_PERCENTAGE",
      "MAX_TRANSACTION_LIMIT",
      "DAILY_TRANSACTION_LIMIT",
      "MONTHLY_TRANSACTION_LIMIT",
    ];

    const configs: any = {};

    for (const key of publicKeys) {
      const config = await SystemConfig.findByKey(key);
      if (config) {
        configs[key] = config.config_value;
      }
    }

    return sendResponse(res, STATUS_OK, {
      message: "Public configurations retrieved successfully",
      data: { configs },
    });
  } catch (error: any) {
    logger.error("Get public configs error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching public configurations",
    });
  }
};
