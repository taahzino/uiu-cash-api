import { NextFunction, Request, Response } from "express";
import {
  IAdminJWTPayload,
  IUserJWTPayload,
  verifyAdminToken,
  verifyUserToken,
} from "../utilities/jwt";
import {
  sendResponse,
  STATUS_FORBIDDEN,
  STATUS_UNAUTHORIZED,
} from "../utilities/response";

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: IUserJWTPayload;
    }
    interface Locals {
      admin?: IAdminJWTPayload;
    }
  }
}

/**
 * Middleware to authenticate user requests
 * Verifies JWT token and attaches user data to request
 */
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = verifyUserToken(token);

    req.user = decoded;
    next();
  } catch (error: any) {
    return sendResponse(res, STATUS_UNAUTHORIZED, {
      message: error.message || "Invalid or expired token",
    });
  }
};

/**
 * Middleware to check if user has specific role(s)
 * Must be used after authenticateUser middleware
 */
export const authorizeUserRole = (
  ...allowedRoles: Array<"PERSONAL" | "AGENT">
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendResponse(res, STATUS_FORBIDDEN, {
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

/**
 * Combined middleware for admin authentication and authorization
 * Verifies JWT token and ensures admin is authenticated
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAdminToken(token);

    if (!decoded) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: "Admin authentication required",
      });
    }

    res.locals.admin = decoded;
    next();
  } catch (error: any) {
    return sendResponse(res, STATUS_UNAUTHORIZED, {
      message: error.message || "Invalid or expired admin token",
    });
  }
};
