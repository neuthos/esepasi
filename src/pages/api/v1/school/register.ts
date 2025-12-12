import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {validateRequest, registerSchoolSchema} from "@/lib/validation/schemas";
import {requireAuth} from "@/lib/auth/middleware";
import {schoolService} from "@/modules/school/school.service";

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  // Require authentication
  const authUser = requireAuth(req);

  // Validate request body
  const data = validateRequest(registerSchoolSchema, req.body);

  // Register school for user
  const result = await schoolService.registerSchool(authUser.user_id, data);

  res.status(201).json({
    success: true,
    message: "School registered successfully",
    data: result,
  });
});
