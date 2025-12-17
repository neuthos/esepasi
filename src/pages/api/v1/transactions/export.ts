import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {transactionService} from "@/modules/transaction/transaction.service";
import dayjs from "dayjs";

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
    search,
    status,
    payment_method,
    student_ids,
    student_nis,
    start_date,
    end_date,
  } = req.query;

  let studentIds: string[] | undefined;
  if (student_ids) {
    studentIds = Array.isArray(student_ids)
      ? student_ids
      : (student_ids as string).split(",");
  }

  let studentNis: string[] | undefined;
  if (student_nis) {
    studentNis = Array.isArray(student_nis)
      ? student_nis
      : (student_nis as string).split(",");
  }

  const result = await transactionService.getTransactions({
    school_id: user.school_id,
    page: 1,
    limit: 10000, // Export limit
    search: search as string,
    status: status as string,
    payment_method: payment_method as string,
    student_ids: studentIds,
    student_nis: studentNis,
    start_date: start_date as string,
    end_date: end_date as string,
  });

  // Convert to CSV
  const header = [
    "ID Transaksi",
    "Tanggal",
    "NIS",
    "Nama Siswa",
    "Kode Tagihan",
    "Deskripsi",
    "Nominal",
    "Metode Pembayaran",
    "Referensi",
  ];

  const rows = result.data.map((t) => [
    t.code,
    dayjs(t.date).format("YYYY-MM-DD HH:mm"),
    t.student.nis,
    `"${t.student.name}"`, // Quote name
    t.bill_code,
    `"${t.description}"`,
    t.amount,
    t.payment_method,
    t.code,
  ]);

  const csvContent = [
    header.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=transactions-${dayjs().format("YYYY-MM-DD")}.csv`
  );
  return res.status(200).send(csvContent);
});
