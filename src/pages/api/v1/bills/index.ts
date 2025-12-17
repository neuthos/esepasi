import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {billService} from "@/modules/bill/bill.service";

export default apiHandler(async (req, res) => {
  const method = req.method;
  const user = requireAuth(req);

  if (!user.school_id) {
    return res
      .status(400)
      .json({success: false, message: "User not associated with a school"});
  }

  if (method === "GET") {
    const {
      page = "1",
      limit = "10",
      search,
      status,
      period,
      student_nis,
    } = req.query;

    let studentNis: string[] | undefined;
    if (student_nis) {
      studentNis = Array.isArray(student_nis)
        ? student_nis
        : (student_nis as string).split(",");
    }

    const result = await billService.getBills({
      school_id: user.school_id,
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      status: status as string,
      period: period as string,
      student_nis: studentNis,
      include_deleted: req.query.include_deleted === "true",
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

  if (method === "POST") {
    // Create Single Bill
    const {student_nis, type, amount, billing_period, description, due_date} =
      req.body;

    // Basic validation
    if (!student_nis || !type || !amount || !due_date) {
      return res
        .status(400)
        .json({success: false, message: "Missing required fields"});
    }

    const result = await billService.createBill({
      school_id: user.school_id,
      student_nis,
      type,
      amount,
      billing_period,
      description,
      due_date,
      created_by: user.user_id,
    });

    return res.status(201).json({
      success: true,
      message: "Tagihan berhasil dibuat",
      data: result,
    });
  }

  return methodNotAllowed(res, ["GET", "POST"]);
});
