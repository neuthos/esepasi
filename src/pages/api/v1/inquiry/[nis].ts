import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {transactionService} from "@/modules/transaction/transaction.service";

export default apiHandler(async (req, res) => {
  const {nis} = req.query;

  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  if (!nis || Array.isArray(nis)) {
    return res.status(400).json({success: false, message: "Invalid NIS"});
  }

  // NOTE: This endpoint is public for integration (or protected by API Key later).
  // For now we allow open access or basic internal check.
  // If the user wants to hit this from external service, we might need to skip `requireAuth` or use an API Key middleware.
  // The prompt implies external service. I will make it unprotected for now but validating NIS exists.

  const result = await transactionService.getStudentInquiry(nis as string);

  return res.status(200).json({
    success: true,
    data: result,
  });
});
