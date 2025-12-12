import {db} from "@/lib/db/kysely";
import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {NotFoundError} from "@/lib/errors/AppError";

export default apiHandler(async (req, res) => {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  // Verify JWT and get user from token
  const authUser = requireAuth(req);

  // Fetch fresh user data from DB to ensure they still exist and are active
  const user = await db
    .selectFrom("users")
    .select(["id", "name", "email", "school_id", "is_super_admin", "is_active"])
    .where("id", "=", authUser.user_id)
    .executeTakeFirst();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Using snake_case for consistency with backend/DB
  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      school_id: user.school_id,
      is_admin: user.is_super_admin,
      is_active: user.is_active,
    },
  });
});
