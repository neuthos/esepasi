import {db} from "@/lib/db/kysely";
import {hashPassword, comparePassword} from "@/lib/auth/password";
import {generateToken} from "@/lib/auth/jwt";
import {ConflictError, UnauthorizedError} from "@/lib/errors/AppError";
import {RegisterInput, LoginInput, AuthResponse} from "./auth.types";
import crypto from "crypto";
import {mailService} from "@/lib/mail/mail.service";

export class AuthService {
  /**
   * Generate password reset token
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await db
      .selectFrom("users")
      .select(["id", "name", "email"])
      .where("email", "=", email)
      .executeTakeFirst();

    console.log({user});
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000);

    await db
      .updateTable("users")
      .set({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      })
      .where("id", "=", user.id)
      .execute();

    await mailService.sendResetPasswordEmail(user.email, resetToken);
  }

  async register(data: RegisterInput): Promise<AuthResponse> {
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", data.email)
      .executeTakeFirst();

    if (existingUser) {
      throw new ConflictError("Email sudah terdaftar");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await db
      .insertInto("users")
      .values({
        email: data.email,
        name: data.name,
        password_hash: passwordHash,
        school_id: null,
        is_super_admin: true,
      })
      .returning(["id", "email", "name", "school_id", "is_super_admin"])
      .executeTakeFirstOrThrow();

    const token = generateToken({
      user_id: user.id,
      email: user.email,
      school_id: user.school_id,
      is_admin: user.is_super_admin,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        school_id: user.school_id,
        is_admin: user.is_super_admin,
      },
    };
  }

  /**
   * Authenticate user and return JWT token
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await db
      .selectFrom("users")
      .select([
        "id",
        "email",
        "name",
        "password_hash",
        "school_id",
        "is_super_admin",
        "is_active",
      ])
      .where("email", "=", data.email)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedError("Email atau password salah");
    }

    if (!user.is_active) {
      throw new UnauthorizedError(
        "Akun tidak aktif. Silakan hubungi administrator."
      );
    }

    const isPasswordValid = await comparePassword(
      data.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Email atau password salah");
    }

    const token = generateToken({
      user_id: user.id,
      email: user.email,
      school_id: user.school_id,
      is_admin: user.is_super_admin,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        school_id: user.school_id,
        is_admin: user.is_super_admin,
      },
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await db
      .selectFrom("users")
      .select(["id", "email"])
      .where("reset_token", "=", token)
      .where("reset_token_expires", ">", new Date())
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedError("Token reset tidak valid atau kadaluarsa");
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .updateTable("users")
      .set({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
      })
      .where("id", "=", user.id)
      .execute();
  }

  /**
   * Verify if reset token is valid
   */
  async verifyResetToken(token: string): Promise<boolean> {
    const user = await db
      .selectFrom("users")
      .select("id")
      .where("reset_token", "=", token)
      .where("reset_token_expires", ">", new Date())
      .executeTakeFirst();

    return !!user;
  }
}

export const authService = new AuthService();
