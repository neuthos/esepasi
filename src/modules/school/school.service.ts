import {db} from "@/lib/db/kysely";
import {NotFoundError, ConflictError} from "@/lib/errors/AppError";
import {RegisterSchoolInput, SchoolResponse} from "./school.types";

export class SchoolService {
  /**
   * Register school for authenticated user (Step 2 of onboarding)
   * Updates user's school_id after creating school
   */
  async registerSchool(
    userId: string,
    data: RegisterSchoolInput
  ): Promise<SchoolResponse> {
    // Get user
    const user = await db
      .selectFrom("users")
      .select(["id", "school_id", "email"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if user already has a school
    if (user.school_id !== null) {
      throw new ConflictError("School already registered for this user");
    }

    // Generate unique school code
    const schoolCode = this.generateSchoolCode(data.school_name);

    // Create school
    const school = await db
      .insertInto("schools")
      .values({
        name: data.school_name,
        code: schoolCode,
        address: data.address,
      })
      .returning(["id", "name", "code", "address", "logo_url"])
      .executeTakeFirstOrThrow();

    // Update user's school_id
    await db
      .updateTable("users")
      .set({school_id: school.id})
      .where("id", "=", userId)
      .execute();

    return {
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address || "",
      logo_url: school.logo_url || "",
    };
  }

  /**
   * Get school details by user ID
   */
  async getSchoolByUserId(userId: string): Promise<SchoolResponse | null> {
    const user = await db
      .selectFrom("users")
      .select("school_id")
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!user || !user.school_id) {
      return null;
    }

    const school = await db
      .selectFrom("schools")
      .select(["id", "name", "code", "address", "logo_url"])
      .where("id", "=", user.school_id)
      .executeTakeFirst();

    if (!school) {
      return null;
    }

    return {
      id: school.id,
      name: school.name,
      code: school.code,
      address: school.address || "",
      logo_url: school.logo_url || "",
    };
  }

  /**
   * Generate unique school code from school name
   */
  private generateSchoolCode(schoolName: string): string {
    // Take first letters of each word, uppercase
    const words = schoolName.trim().split(/\s+/);
    const initials = words
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 6);

    // Add timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-4);

    return `${initials}${timestamp}`;
  }

  /**
   * Update school details
   */
  async updateSchool(
    schoolId: string,
    data: {name: string; code: string; address: string; logo_url?: string}
  ): Promise<void> {
    await db
      .updateTable("schools")
      .set({
        name: data.name,
        code: data.code,
        address: data.address,
        logo_url: data.logo_url,
        updated_at: new Date(),
      })
      .where("id", "=", schoolId)
      .execute();
  }
}

export const schoolService = new SchoolService();
