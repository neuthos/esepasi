import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {validateRequest, registerSchoolSchema} from "@/lib/validation/schemas";
import {requireAuth} from "@/lib/auth/middleware";
import {schoolService} from "@/modules/school/school.service";
import {generateToken} from "@/lib/auth/jwt";

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const authUser = requireAuth(req);

  const data = validateRequest(registerSchoolSchema, req.body);

  const result = await schoolService.registerSchool(authUser.user_id, data);

  const newToken = generateToken({
    user_id: authUser.user_id,
    email: authUser.email,
    school_id: result.id,
    is_admin: authUser.is_admin,
  });

  res.status(201).json({
    success: true,
    message: "School registered successfully",
    data: {
      school: result,
      token: newToken,
    },
  });
});
