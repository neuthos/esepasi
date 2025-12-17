/* eslint-disable @typescript-eslint/no-explicit-any */
import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {transactionService} from "@/modules/transaction/transaction.service";

export default apiHandler(async (req, res) => {
  if (req.method === "GET") {
    const {page = 1, limit = 10, search, status, student_nis} = req.query;

    const result = await transactionService.getInquiries({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      status: status as string,
      student_nis: student_nis ? (student_nis as string).split(",") : [],
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
      },
    });
  }

  return methodNotAllowed(res, ["GET"]);
});
