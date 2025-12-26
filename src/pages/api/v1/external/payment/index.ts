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
    const payload = req.body;

    if (!payload.inquiry_code && !payload.bill_code) {
      return res.status(400).json({
        success: false,
        message: "Must provide inquiry_code or bill_code",
      });
    }

    const result = await transactionService.createPayment(payload, true);

    return res.status(200).json({
      success: true,
      message: "Pembayaran berhasil diproses",
      data: result,
    });
  }

  return methodNotAllowed(res, ["POST"]);
});
