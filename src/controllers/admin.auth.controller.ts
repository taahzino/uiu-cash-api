import { Request, Response } from "express";
import logger from "../config/_logger";
import { Admins, AdminStatus } from "../models/Admins.model";
import {
  generateAdminToken,
} from "../utilities/jwt";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../utilities/password";
import {
  sendResponse,
  STATUS_BAD_REQUEST,
  STATUS_CONFLICT,
  STATUS_CREATED,
  STATUS_FORBIDDEN,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_OK,
  STATUS_UNAUTHORIZED,
} from "../utilities/response";

/**
 * Admin Login Controller
 * POST /api/admin/login
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admins.findByEmail(email);
    if (!admin) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Invalid credentials",
      });
    }

    // Check if account is suspended
    if (admin.status === AdminStatus.SUSPENDED) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Account is suspended. Contact system administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, admin.password_hash);
    if (!isPasswordValid) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateAdminToken({
      adminId: admin.id,
      email: admin.email,
    });

    // Update login info
    await Admins.updateLoginInfo(admin.id);

    return sendResponse(res, STATUS_OK, {
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      },
    });
  } catch (error: any) {
    logger.error("Admin login error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during login",
    });
  }
};

/**
 * Admin Register Controller (SUPER_ADMIN only)
 * POST /api/admin/register
 * POST /api/admin/register
 */
export const adminRegister = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const createdBy = res.locals.admin?.adminId; // Set by adminAuth middleware

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendResponse(res, STATUS_BAD_REQUEST, {
        message: "Password does not meet requirements",
        errors: passwordValidation.errors.map((error) => ({
          field: "password",
          message: error,
        })),
      });
    }

    // Check if email already exists
    const emailExists = await Admins.emailExists(email);
    if (emailExists) {
      return sendResponse(res, STATUS_CONFLICT, {
        message: "Email already registered",
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create admin
    const newAdmin = await Admins.createAdmin({
      email,
      password_hash,
      name,
      created_by: createdBy || null,
    });

    return sendResponse(res, STATUS_CREATED, {
      message: "Admin account created successfully",
      data: {
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          status: newAdmin.status,
        },
      },
    });
  } catch (error: any) {
    logger.error("Admin register error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred during registration",
    });
  }
};

/**
 * Get Current Admin Profile
 * GET /api/admin/profile
 */
export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = res.locals.admin?.adminId;

    if (!adminId) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Admin authentication required",
      });
    }

    const admin = await Admins.findById(adminId);
    if (!admin) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Admin not found",
      });
    }

    return sendResponse(res, STATUS_OK, {
      message: "Admin profile retrieved successfully",
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          status: admin.status,
          last_login_at: admin.last_login_at,
          created_at: admin.created_at,
        },
      },
    });
  } catch (error: any) {
    logger.error("Get admin profile error: " + error.message);
    return sendResponse(res, STATUS_INTERNAL_SERVER_ERROR, {
      message: "An error occurred while fetching profile",
    });
  }
};
