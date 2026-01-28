import { Request, Response } from "express";
import logger from "../config/_logger";
import { Billers, BillerStatus } from "../models/Billers.model";
import { BillPayments } from "../models/BillPayments.model";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
  STATUS_CREATED,
  STATUS_CONFLICT,
} from "../utilities/response";

/**
 * Create Biller
 * POST /api/admin/billers
 */
export const createBiller = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Admin authentication required",
      });
    }

    const {
      name,
      billerCode,
      billType,
      contactEmail,
      contactPhone,
      description,
      logoUrl,
    } = req.body;

    logger.info(
      `[Create Biller] Admin ${adminId} creating biller: ${billerCode} (${name})`,
    );

    // Check if biller code already exists
    const existingBiller = await Billers.findByCode(billerCode);
    if (existingBiller) {
      return sendResponse(res, STATUS_CONFLICT, {
        message: "Biller code already exists",
      });
    }

    // Create biller
    const biller = await Billers.createBiller({
      name,
      biller_code: billerCode,
      bill_type: billType,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      description: description || null,
      logo_url: logoUrl || null,
      created_by: adminId,
    });

    logger.info(`Biller created: ${biller.biller_code} by admin ${adminId}`);

    return sendResponse(res, STATUS_CREATED, {
      message: "Biller created successfully",
      data: {
        biller: {
          id: biller.id,
          name: biller.name,
          billerCode: biller.biller_code,
          billType: biller.bill_type,
          status: biller.status,
          contactEmail: biller.contact_email,
          contactPhone: biller.contact_phone,
          description: biller.description,
          logoUrl: biller.logo_url,
          balance: biller.balance,
          totalPayments: biller.total_payments,
          createdAt: biller.created_at,
        },
      },
    });
  } catch (error: any) {
    logger.error("Create biller error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while creating biller",
    });
  }
};

/**
 * Get All Billers (Admin)
 * GET /api/admin/billers
 */
export const getAllBillers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, billType, status, search } = req.query;

    logger.info(
      `[Get All Billers] Page: ${page}, Limit: ${limit}, BillType: ${billType || "all"}, Status: ${status || "all"}, Search: ${search || "none"}`,
    );

    let billers = await Billers.findAll();

    // Apply filters
    if (billType) {
      billers = billers.filter((b) => b.bill_type === billType);
    }
    if (status) {
      billers = billers.filter((b) => b.status === status);
    }
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      billers = billers.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.biller_code.toLowerCase().includes(searchLower),
      );
    }

    // Pagination
    const total = billers.length;
    logger.info(`[Get All Billers] Found ${total} billers after filtering`);

    const offset = (Number(page) - 1) * Number(limit);
    const paginatedBillers = billers.slice(offset, offset + Number(limit));

    return sendResponse(res, STATUS_OK, {
      message: "Billers retrieved successfully",
      data: {
        billers: paginatedBillers.map((biller) => ({
          id: biller.id,
          name: biller.name,
          billerCode: biller.biller_code,
          billType: biller.bill_type,
          status: biller.status,
          balance: biller.balance,
          totalPayments: biller.total_payments,
          contactEmail: biller.contact_email,
          contactPhone: biller.contact_phone,
          description: biller.description,
          logoUrl: biller.logo_url,
          createdAt: biller.created_at,
          updatedAt: biller.updated_at,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get all billers error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching billers",
    });
  }
};

/**
 * Get Biller Details
 * GET /api/admin/billers/:id
 */
export const getBillerDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info(`[Biller Details] Fetching biller: ${id}`);

    const biller = await Billers.findById(id);
    if (!biller) {
      logger.info(`[Biller Details] Biller not found: ${id}`);
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Biller not found",
      });
    }

    logger.info(
      `[Biller Details] Biller found: ${biller.name} (${biller.biller_code})`,
    );
    logger.info(`[Biller Details] Fetching payments for biller: ${id}`);

    // Get payment statistics
    const payments = await BillPayments.findByBillerId(id, 10000, 0);
    logger.info(
      `[Biller Details] Found ${payments.length} total payments for biller ${id}`,
    );

    const completedPayments = payments.filter((p) => p.status === "COMPLETED");
    const totalRevenue = completedPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0,
    );

    return sendResponse(res, STATUS_OK, {
      message: "Biller details retrieved successfully",
      data: {
        biller: {
          id: biller.id,
          name: biller.name,
          billerCode: biller.biller_code,
          billType: biller.bill_type,
          status: biller.status,
          balance: biller.balance,
          totalPayments: biller.total_payments,
          contactEmail: biller.contact_email,
          contactPhone: biller.contact_phone,
          description: biller.description,
          logoUrl: biller.logo_url,
          createdAt: biller.created_at,
          updatedAt: biller.updated_at,
        },
        statistics: {
          totalPayments: payments.length,
          completedPayments: completedPayments.length,
          totalRevenue: totalRevenue,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get biller details error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching biller details",
    });
  }
};

/**
 * Update Biller
 * PUT /api/admin/billers/:id
 */
export const updateBiller = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      billerCode,
      billType,
      status,
      contactEmail,
      contactPhone,
      description,
      logoUrl,
    } = req.body;

    logger.info(`[Update Biller] Updating biller: ${id}`);

    const biller = await Billers.findById(id);
    if (!biller) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Biller not found",
      });
    }

    // Check if new biller code conflicts with existing
    if (billerCode && billerCode !== biller.biller_code) {
      const codeExists = await Billers.codeExists(billerCode, id);
      if (codeExists) {
        return sendResponse(res, STATUS_CONFLICT, {
          message: "Biller code already exists",
        });
      }
    }

    // Update biller
    const updates: any = {};
    if (name) updates.name = name;
    if (billerCode) updates.biller_code = billerCode;
    if (billType) updates.bill_type = billType;
    if (status) updates.status = status;
    if (contactEmail !== undefined) updates.contact_email = contactEmail;
    if (contactPhone !== undefined) updates.contact_phone = contactPhone;
    if (description !== undefined) updates.description = description;
    if (logoUrl !== undefined) updates.logo_url = logoUrl;

    const updatedBiller = await Billers.updateBiller(id, updates);

    logger.info(`Biller updated: ${id}`);

    return sendResponse(res, STATUS_OK, {
      message: "Biller updated successfully",
      data: {
        biller: {
          id: updatedBiller!.id,
          name: updatedBiller!.name,
          billerCode: updatedBiller!.biller_code,
          billType: updatedBiller!.bill_type,
          status: updatedBiller!.status,
          contactEmail: updatedBiller!.contact_email,
          contactPhone: updatedBiller!.contact_phone,
          description: updatedBiller!.description,
          logoUrl: updatedBiller!.logo_url,
          balance: updatedBiller!.balance,
          totalPayments: updatedBiller!.total_payments,
          updatedAt: updatedBiller!.updated_at,
        },
      },
    });
  } catch (error: any) {
    logger.error("Update biller error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while updating biller",
    });
  }
};

/**
 * Update Biller Status
 * PATCH /api/admin/billers/:id/status
 */
export const updateBillerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info(`[Update Biller Status] Biller: ${id}, New Status: ${status}`);

    if (!status || !Object.values(BillerStatus).includes(status)) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Valid status is required (ACTIVE, SUSPENDED, INACTIVE)",
      });
    }

    const biller = await Billers.findById(id);
    if (!biller) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Biller not found",
      });
    }

    const updatedBiller = await Billers.updateStatus(id, status);

    logger.info(`Biller status updated: ${id} to ${status}`);

    return sendResponse(res, STATUS_OK, {
      message: "Biller status updated successfully",
      data: {
        biller: {
          id: updatedBiller!.id,
          name: updatedBiller!.name,
          billerCode: updatedBiller!.biller_code,
          status: updatedBiller!.status,
          updatedAt: updatedBiller!.updated_at,
        },
      },
    });
  } catch (error: any) {
    logger.error("Update biller status error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while updating biller status",
    });
  }
};

/**
 * Delete Biller
 * DELETE /api/admin/billers/:id
 */
export const deleteBiller = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info(
      `[Delete Biller] Attempting to delete/deactivate biller: ${id}`,
    );

    const biller = await Billers.findById(id);
    if (!biller) {
      return sendResponse(res, STATUS_NOT_FOUND, {
        message: "Biller not found",
      });
    }

    // Check if biller has any payments
    const payments = await BillPayments.findByBillerId(id, 1, 0);
    if (payments.length > 0) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message:
          "Cannot delete biller with existing payment records. Consider suspending instead.",
      });
    }

    // Instead of deleting, set status to INACTIVE
    await Billers.updateStatus(id, BillerStatus.INACTIVE);

    logger.info(`Biller deactivated: ${id}`);

    return sendResponse(res, STATUS_OK, {
      message: "Biller deactivated successfully",
    });
  } catch (error: any) {
    logger.error("Delete biller error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while deleting biller",
    });
  }
};
