import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {userService} from "@/modules/user/user.service";

export default apiHandler(async (req, res) => {
  const method = req.method;

  if (method !== "GET" && method !== "POST") {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  const authUser = requireAuth(req);

  if (!authUser.school_id) {
    return res.status(400).json({
      success: false,
      message: "User does not belong to a school",
    });
  }

  if (method === "GET") {
    const users = await userService.getUsersBySchoolId(authUser.school_id);
    return res.status(200).json({
      success: true,
      data: users,
    });
  }

  if (method === "POST") {
    if (!authUser.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can create users",
      });
    }

    const {name, email, password} = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, email, password)",
      });
    }

    await userService.createUser({
      name,
      email,
      password,
      school_id: authUser.school_id,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  }
});
