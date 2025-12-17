import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {transactionService} from "@/modules/transaction/transaction.service";

interface PaymentApiInput {
  bill_code: string;
  amount: number;
  payment_method: string;
  notes?: string;
  reference_number?: string;
}

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const payload = req.body as PaymentApiInput;

  if (!payload.bill_code || !payload.amount || !payload.payment_method) {
    return res
      .status(400)
      .json({success: false, message: "Missing required fields"});
  }

  const result = await transactionService.createPayment(payload, true);

  return res.status(200).json({
    success: true,
    message: "Pembayaran berhasil diproses",
    data: result,
  });
});
