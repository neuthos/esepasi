import {NextApiRequest} from "next";
import {verifyToken, JWTPayload} from "./jwt";
import {UnauthorizedError} from "../errors/AppError";

// Extend NextApiRequest to include user property
declare module "next" {
  interface NextApiRequest {
    user?: JWTPayload;
  }
}

/**
 * Middleware to require authentication
 * Extracts JWT from Authorization header and validates it
 * Attaches user data to req.user
 *
 * Usage in API route:
 *   const user = requireAuth(req)
 */
export const requireAuth = (req: NextApiRequest): JWTPayload => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError("No authorization header provided");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      "Invalid authorization format. Use: Bearer <token>"
    );
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  req.user = user;

  return user;
};

/**
 * Optional auth - doesn't throw if no token, but validates if present
 */
export const optionalAuth = (req: NextApiRequest): JWTPayload | null => {
  try {
    return requireAuth(req);
  } catch {
    return null;
  }
};
