import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

/**
 * JWT Payload Interface
 */
export interface JWTPayload {
  id: string;
  public_key: string;
  userType: "Consumer" | "Agent" | "Admin";
}

/**
 * Get private key from file
 */
function getPrivateKey(): string {
  const privateKeyPath = path.join(__dirname, "../../private.pem");
  return fs.readFileSync(privateKeyPath, "utf8");
}

/**
 * Get public key from file
 */
function getPublicKey(): string {
  const publicKeyPath = path.join(__dirname, "../../public.pem");
  return fs.readFileSync(publicKeyPath, "utf8");
}

/**
 * Generate unified JWT token for all user types
 */
export function generateToken(
  userId: string,
  public_key: string,
  userType: "Consumer" | "Agent" | "Admin",
): string {
  const privateKey = getPrivateKey();

  return jwt.sign(
    { id: userId, public_key, userType } as JWTPayload,
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "7d",
    },
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const publicKey = getPublicKey();
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    }) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}
