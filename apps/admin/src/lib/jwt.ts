/**
 * JWT Utilities for Admin Authentication
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-in-production";
const JWT_EXPIRATION = "7d"; // 7 days

export interface JwtPayload {
  adminId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
