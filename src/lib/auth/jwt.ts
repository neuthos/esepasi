/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import {UnauthorizedError} from "../errors/AppError";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-DO-NOT-USE-IN-PRODUCTION";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET not set in environment variables!");
}

export interface JWTPayload {
  user_id: string;
  email: string;
  school_id: string | null;
  is_admin: boolean;
}

/**
 * Generate JWT token from payload
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
};

/**
 * Verify and decode JWT token
 * Throws UnauthorizedError if token is invalid or expired
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid token");
    }
    throw new UnauthorizedError("Token verification failed");
  }
};
