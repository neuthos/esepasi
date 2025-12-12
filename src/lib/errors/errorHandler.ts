/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextApiResponse} from "next";
import {AppError, ValidationError} from "./AppError";
import {logError} from "../logger";

export const handleError = (
  error: unknown,
  res: NextApiResponse,
  requestId: string
) => {
  logError(requestId, error);

  // Handle custom AppError instances
  if (error instanceof AppError) {
    const response: any = {
      success: false,
      message: error.message,
      error_code: error.code,
    };

    if (error instanceof ValidationError && error.errors) {
      response.errors = error.errors;
    }

    return res.status(error.statusCode).json(response);
  }

  // Handle Zod validation errors
  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as any).issues;
    const firstIssue = issues[0];
    const message = firstIssue ? firstIssue.message : "Validation failed";

    return res.status(400).json({
      success: false,
      message: message,
      error_code: "VALIDATION_ERROR",
      errors: issues,
    });
  }

  // Handle PostgreSQL/Kysely errors
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as any;

    // Unique violation (duplicate key)
    if (pgError.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Resource already exists",
        error_code: "DUPLICATE_ENTRY",
      });
    }

    // Foreign key violation
    if (pgError.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Referenced resource does not exist",
        error_code: "FOREIGN_KEY_VIOLATION",
      });
    }
  }

  // Default internal server error
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : (error as Error)?.message || "Unknown error",
    error_code: "INTERNAL_ERROR",
  });
};
