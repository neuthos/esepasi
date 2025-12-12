import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {validateRequest, forgotPasswordSchema} from "@/lib/validation/schemas";
import {authService} from "@/modules/auth/auth.service";

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const {email} = validateRequest(forgotPasswordSchema, req.body);

  await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    message: "Password reset link sent to email",
  });
});
