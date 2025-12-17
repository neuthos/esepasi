/* eslint-disable @typescript-eslint/no-explicit-any */
import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {billService} from "@/modules/bill/bill.service";
import {db} from "@/lib/db/kysely";

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const user = requireAuth(req);
  if (!user.school_id) {
    return res
      .status(400)
      .json({success: false, message: "User not associated with a school"});
  }

  const {data} = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({success: false, message: "Data tidak valid"});
  }

  if (data.length > 1000) {
    return res
      .status(400)
      .json({success: false, message: "Maksimal 1000 data per upload"});
  }

  const nises = data.map((d: any) => d.nis).filter(Boolean);

  if (nises.length === 0) {
    return res
      .status(400)
      .json({success: false, message: "NIS wajib diisi di setiap baris"});
  }

  const students = await db
    .selectFrom("students")
    .select(["id", "nis"])
    .where("school_id", "=", user.school_id)
    .where("nis", "in", nises)
    .execute();

  const studentMap = new Map(students.map((s) => [s.nis, s.id]));

  const billsPayload = [];
  const errors = [];

  for (const row of data) {
    const studentId = studentMap.get(row.nis);
    if (!studentId) {
      errors.push(`NIS ${row.nis} tidak ditemukan`);
      continue;
    }

    billsPayload.push({
      type: (row.type || "spp") as "spp" | "non_spp",
      amount: Number(row.amount),
      billing_period: row.billing_period,
      description: row.description,
      due_date: row.due_date,
      student_nis: row.nis,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Beberapa data tidak valid (${errors.length} error)`,
      errors: errors.slice(0, 10),
    });
  }

  await billService.bulkCreateBills(user.school_id, user.user_id, billsPayload);

  return res.status(200).json({
    success: true,
    message: `Berhasil import ${billsPayload.length} tagihan`,
  });
});
