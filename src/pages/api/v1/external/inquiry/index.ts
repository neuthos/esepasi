import {
  apiHandler,
  methodNotAllowed,
  checkServiceKey,
  unauthorized,
} from "@/lib/utils/apiHandler";
import {transactionService} from "@/modules/transaction/transaction.service";

export default apiHandler(async (req, res) => {
  if (!checkServiceKey(req)) {
    return unauthorized(res);
  }

  if (req.method === "POST") {
    const {nis} = req.body;

    if (!nis) {
      return res.status(400).json({
        success: false,
        message: "NIS is required",
      });
    }

    const inquiry = await transactionService.createInquiry(nis);

    return res.status(200).json({
      success: true,
      data: inquiry,
    });
  }

  return methodNotAllowed(res, ["POST"]);
});
