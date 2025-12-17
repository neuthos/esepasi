/* eslint-disable @typescript-eslint/no-explicit-any */
import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {transactionService} from "@/modules/transaction/transaction.service";

export default apiHandler(async (req, res) => {
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
