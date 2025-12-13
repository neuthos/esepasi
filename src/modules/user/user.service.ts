/* eslint-disable @typescript-eslint/no-explicit-any */
import {db} from "@/lib/db/kysely";
import {hashPassword} from "@/lib/auth/password";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "@/lib/errors/AppError";

export interface CreateAdminInput {
  name: string;
  email: string;
  password?: string;
  school_id: string;
}

export interface UpdateAdminInput {
  name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
}

export class UserService {
  /**
   * Get all admin users for a specific school
   */
  async getUsersBySchoolId(schoolId: string) {
    return await db
      .selectFrom("users")
      .select([
        "id",
        "name",
        "email",
        "is_active",
        "is_super_admin",
        "created_at",
      ])
      .where("school_id", "=", schoolId)
      .orderBy("created_at", "desc")
      .execute();
  }

  /**
   * Create a new admin user
   */
  async createUser(data: CreateAdminInput) {
    // Check if email already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", data.email)
      .executeTakeFirst();

    if (existingUser) {
      throw new ConflictError("Email sudah terdaftar");
    }

    const passwordHash = await hashPassword(data.password || "password123"); // Default password if not provided

    const user = await db
      .insertInto("users")
      .values({
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        school_id: data.school_id,
        is_super_admin: false, // Created admins are always regular admins
        is_active: true,
      })
      .returning(["id", "name", "email", "is_super_admin"])
      .executeTakeFirstOrThrow();

    return user;
  }

  /**
   * Update user details
   */
  async updateUser(id: string, data: UpdateAdminInput, schoolId: string) {
    // Verify user belongs to school
    const user = await db
      .selectFrom("users")
      .select(["id", "school_id", "is_super_admin"])
      .where("id", "=", id)
      .executeTakeFirst();

    if (!user || user.school_id !== schoolId) {
      throw new NotFoundError("User not found");
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.is_active !== undefined) {
      // Prevent deactivating super admin
      if (user.is_super_admin && data.is_active === false) {
        throw new ForbiddenError("Tidak dapat menonaktifkan Super Admin");
      }
      updateData.is_active = data.is_active;
    }
    if (data.password) {
      updateData.password_hash = await hashPassword(data.password);
    }

    await db
      .updateTable("users")
      .set(updateData)
      .where("id", "=", id)
      .execute();
  }

  /**
   * Delete user
   */
  async deleteUser(id: string, schoolId: string) {
    // Verify user belongs to school
    const user = await db
      .selectFrom("users")
      .select(["id", "school_id", "is_super_admin"])
      .where("id", "=", id)
      .executeTakeFirst();

    if (!user || user.school_id !== schoolId) {
      throw new NotFoundError("User not found");
    }

    if (user.is_super_admin) {
      throw new ForbiddenError("Tidak dapat menghapus Super Admin");
    }

    await db.deleteFrom("users").where("id", "=", id).execute();
  }
}

export const userService = new UserService();
