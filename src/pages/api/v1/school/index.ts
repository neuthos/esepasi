import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {schoolService} from "@/modules/school/school.service";

export default apiHandler(async (req, res) => {
  const method = req.method;

  if (method !== "GET" && method !== "PUT") {
    return methodNotAllowed(res, ["GET", "PUT"]);
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

  if (method === "GET") {
    return res.status(200).json({
      success: true,
      data: school,
    });
  }

  if (method === "PUT") {
    const {name, code, address, logo_url} = req.body;

    // Simple validation
    if (!name || !code || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, code, address)",
      });
    }

    await schoolService.updateSchool(school.id, {
      name,
      code,
      address,
      logo_url,
    });

    return res.status(200).json({
      success: true,
      message: "School identity updated successfully",
    });
  }
});
