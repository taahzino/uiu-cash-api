import { NextFunction, Request, Response } from "express";
import { JWTPayload, verifyToken } from "../utilities/jwt";
import { Users } from "../models/Users.model";
import { Admins } from "../models/Admins.model";
import {
  sendResponse,
  STATUS_FORBIDDEN,
  STATUS_UNAUTHORIZED,
} from "../utilities/response";

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userType?: "Consumer" | "Agent" | "Admin";
    }
  }
}

/**
 * Unified authentication middleware
 * Validates JWT, checks database for matching id and public_key, and verifies userType
 * @param allowedUserTypes - Array of allowed user types: "Consumer", "Agent", "Admin"
 */
export const authenticate = (
  ...allowedUserTypes: Array<"Consumer" | "Agent" | "Admin">
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendResponse(res, STATUS_UNAUTHORIZED, {
          message:
            "No token provided. Please include Authorization header with Bearer token.",
        });
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      // Verify and decode JWT
      let decoded: JWTPayload;
      try {
        decoded = verifyToken(token);
      } catch (error: any) {
        return sendResponse(res, STATUS_UNAUTHORIZED, {
          message: "Invalid or expired token. Please login again.",
        });
      }

      // Check if userType is allowed
      if (!allowedUserTypes.includes(decoded.userType)) {
        return sendResponse(res, STATUS_FORBIDDEN, {
          message: `Access denied. This endpoint requires ${allowedUserTypes.join(" or ")} access.`,
        });
      }

      // Validate against database based on userType
      let isValid = false;

      if (decoded.userType === "Admin") {
        // Check admin in database
        const admin = await Admins.findById(decoded.id);
        if (
          admin &&
          admin.public_key === decoded.public_key &&
          admin.status === "ACTIVE"
        ) {
          isValid = true;
          // Set admin data in res.locals for admin-specific operations
          res.locals.admin = admin;
        }
      } else if (
        decoded.userType === "Consumer" ||
        decoded.userType === "Agent"
      ) {
        // Check user in database
        const user = await Users.findById(decoded.id);
        if (user && user.public_key === decoded.public_key) {
          // For Agent, also verify role matches
          if (decoded.userType === "Agent" && user.role !== "AGENT") {
            isValid = false;
          } else if (
            decoded.userType === "Consumer" &&
            user.role !== "CONSUMER"
          ) {
            isValid = false;
          } else if (user.status === "ACTIVE") {
            isValid = true;
          }
        }
      }

      if (!isValid) {
        return sendResponse(res, STATUS_UNAUTHORIZED, {
          message: "Invalid session. Please login again.",
        });
      }

      console.log(`${decoded.userType} authenticated: ID=${decoded.id}`);

      // Attach decoded user data to request
      req.user = decoded;
      req.userType = decoded.userType;
      next();
    } catch (error: any) {
      return sendResponse(res, STATUS_UNAUTHORIZED, {
        message: error.message || "Authentication failed",
      });
    }
  };
};

// Convenience exports for common use cases
export const authenticateConsumer = authenticate("Consumer");
export const authenticateAgent = authenticate("Agent");
export const authenticateAdmin = authenticate("Admin");
export const authenticateUser = authenticate("Consumer", "Agent");
export const authenticateAny = authenticate("Consumer", "Agent", "Admin");
