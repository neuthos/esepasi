import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {schoolService} from "@/modules/school/school.service";

export default apiHandler(async (req, res) => {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  // Require authentication
  const authUser = requireAuth(req);

  // Get school for authenticated user
  const school = await schoolService.getSchoolByUserId(authUser.user_id);

  if (!school) {
    return res.status(404).json({
      success: false,
      message: "School not found. Please complete school registration first.",
    });
  }

  res.status(200).json({
    success: true,
    data: school,
  });
});
