import jwt from "jsonwebtoken";

// Get secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const JWT_ADMIN_SECRET =
  process.env.JWT_ADMIN_SECRET || "your-admin-secret-change-this";

const TOKEN_EXPIRY = "3h"; // 3 hours

/**
 * User JWT Payload Interface
 */
export interface IUserJWTPayload {
  userId: string;
  email: string;
  role: "PERSONAL" | "AGENT";
  sessionId?: string;
}

/**
 * Admin JWT Payload Interface
 */
export interface IAdminJWTPayload {
  adminId: string;
  email: string;
  sessionId?: string;
}

/**
 * Generate JWT token for user
 */
export function generateUserToken(payload: IUserJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Generate JWT token for admin
 */
export function generateAdminToken(payload: IAdminJWTPayload): string {
  return jwt.sign(payload, JWT_ADMIN_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verify user JWT token
 */
export function verifyUserToken(token: string): IUserJWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as IUserJWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Verify admin JWT token
 */
export function verifyAdminToken(token: string): IAdminJWTPayload {
  try {
    return jwt.verify(token, JWT_ADMIN_SECRET) as IAdminJWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired admin token");
  }
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}
