import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {studentService} from "@/modules/student/student.service";

export default apiHandler(async (req, res) => {
  const method = req.method;

  if (method !== "GET" && method !== "POST") {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  const authUser = requireAuth(req);
  if (!authUser.school_id) {
    return res
      .status(400)
      .json({success: false, message: "User not associated with a school"});
  }

  if (method === "GET") {
    const {page = 1, limit = 10, search, status, payment_status} = req.query;

    const result = await studentService.getStudents(authUser.school_id, {
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      status: status as string,
      payment_status: payment_status as string,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        total_page: Math.ceil(result.total / Number(limit)),
      },
    });
  }

  if (method === "POST") {
    const {nis, name, status} = req.body;

    if (!nis || !name) {
      return res
        .status(400)
        .json({success: false, message: "NIS dan Nama wajib diisi"});
    }

    await studentService.createStudent(authUser.school_id, {
      nis,
      name,
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Siswa berhasil ditambahkan",
    });
  }
});
