import {z} from "zod";
import {ValidationError} from "../errors/AppError";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must not exceed 255 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),
});

export const registerSchoolSchema = z.object({
  school_name: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(255, "School name must not exceed 255 characters"),
  phone: z
    .string()
    .min(8, "Phone number must be at least 8 characters")
    .max(20, "Phone number must not exceed 20 characters"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(1000, "Address must not exceed 1000 characters"),
});

/**
 * Helper function to validate request data against a Zod schema
 * Throws ValidationError with formatted errors if validation fails
 */
export const validateRequest = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formattedErrors = result.error.format();
    const firstIssue = result.error.issues[0];
    const errorMessage = firstIssue ? firstIssue.message : "Validation failed";
    throw new ValidationError(errorMessage, formattedErrors);
  }

  return result.data;
};
