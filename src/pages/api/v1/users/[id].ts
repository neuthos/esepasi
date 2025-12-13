import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {userService} from "@/modules/user/user.service";

export default apiHandler(async (req, res) => {
  const method = req.method;
  const {id} = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing user ID",
    });
  }

  if (method !== "PUT" && method !== "DELETE") {
    return methodNotAllowed(res, ["PUT", "DELETE"]);
  }

  // Require authentication
  const authUser = requireAuth(req);

  // Only Super Admin can manage users
  if (!authUser.is_admin) {
    return res.status(403).json({
      success: false,
      message: "Only Super Admin can manage users",
    });
  }

  if (!authUser.school_id) {
    return res.status(400).json({
      success: false,
      message: "User does not belong to a school",
    });
  }

  if (method === "PUT") {
    const {name, email, password, is_active} = req.body;

    await userService.updateUser(
      userId,
      {
        name,
        email,
        password,
        is_active,
      },
      authUser.school_id
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  }

  if (method === "DELETE") {
    await userService.deleteUser(userId, authUser.school_id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }
});
