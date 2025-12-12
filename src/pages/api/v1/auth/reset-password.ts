import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {validateRequest, resetPasswordSchema} from "@/lib/validation/schemas";
import {authService} from "@/modules/auth/auth.service";

export default apiHandler(async (req, res) => {
  if (req.method === "GET") {
    const {token} = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({success: false, message: "Token required"});
    }

    const isValid = await authService.verifyResetToken(token);
    if (!isValid) {
      return res
        .status(401)
        .json({success: false, message: "Token invalid or expired"});
    }

    return res.status(200).json({success: true, message: "Token valid"});
  }

  if (req.method === "POST") {
    // Validate request body
    const {token, password} = validateRequest(resetPasswordSchema, req.body);

    // Reset password
    await authService.resetPassword(token, password);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  }

  return methodNotAllowed(res, ["GET", "POST"]);
});
