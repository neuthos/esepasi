import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {studentService} from "@/modules/student/student.service";

export default apiHandler(async (req, res) => {
  const method = req.method;
  const {id} = req.query;
  const studentId = Array.isArray(id) ? id[0] : id;

  if (!studentId) {
    return res
      .status(400)
      .json({success: false, message: "Student ID missing"});
  }

  if (method !== "GET" && method !== "PUT") {
    return methodNotAllowed(res, ["GET", "PUT"]);
  }

  const authUser = requireAuth(req);
  if (!authUser.school_id) {
    return res
      .status(400)
      .json({success: false, message: "User not associated with a school"});
  }

  if (method === "GET") {
    const data = await studentService.getStudentDetail(
      authUser.school_id,
      studentId
    );
    return res.status(200).json({
      success: true,
      data,
    });
  }

  if (method === "PUT") {
    const {name, nis, status} = req.body;

    await studentService.updateStudent(authUser.school_id, studentId, {
      name,
      nis,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Data siswa berhasil diperbarui",
    });
  }
});
