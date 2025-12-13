import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {studentService} from "@/modules/student/student.service";

export default apiHandler(async (req, res) => {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const authUser = requireAuth(req);
  if (!authUser.school_id) {
    return res
      .status(400)
      .json({success: false, message: "User not associated with a school"});
  }

  const {students} = req.body; // Expecting { students: [{nis, name}, ...]}

  if (!students || !Array.isArray(students)) {
    return res
      .status(400)
      .json({success: false, message: "Format data tidak valid"});
  }

  const result = await studentService.bulkCreateStudents(
    authUser.school_id,
    students
  );

  return res.status(201).json({
    success: true,
    message: `Berhasil mengimport ${result.length} siswa`,
    data: result,
  });
});
