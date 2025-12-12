import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {validateRequest, loginSchema} from "@/lib/validation/schemas";
import {authService} from "@/modules/auth/auth.service";

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const data = validateRequest(loginSchema, req.body);

  const result = await authService.login(data);

  res.status(200).json({
    success: true,
    data: result,
  });
});
