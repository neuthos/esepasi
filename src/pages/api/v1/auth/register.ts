import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {validateRequest, registerSchema} from "@/lib/validation/schemas";
import {authService} from "@/modules/auth/auth.service";

export default apiHandler(async (req, res, requestId) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  // Validate request body
  const data = validateRequest(registerSchema, req.body);

  // Register user
  const result = await authService.register(data);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: result,
  });
});
