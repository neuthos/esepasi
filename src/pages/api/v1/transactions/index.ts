import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {transactionService} from "@/modules/transaction/transaction.service";

export default apiHandler(async (req, res) => {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const user = requireAuth(req);
  if (!user.school_id) {
    return res
      .status(400)
      .json({success: false, message: "User not associated with a school"});
  }

  const {
    page = "1",
    limit = "10",
    search,
    status,
    payment_method,
    student_ids,
    start_date,
    end_date,
  } = req.query;

  let studentIds: string[] | undefined;
  if (student_ids) {
    studentIds = Array.isArray(student_ids)
      ? student_ids
      : (student_ids as string).split(",");
  }

  const result = await transactionService.getTransactions({
    school_id: user.school_id,
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    status: status as string,
    payment_method: payment_method as string,
    student_ids: studentIds,
    start_date: start_date as string,
    end_date: end_date as string,
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
});
