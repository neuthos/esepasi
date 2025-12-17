import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {billService} from "@/modules/bill/bill.service";

export default apiHandler(async (req, res) => {
  const method = req.method;
  const user = requireAuth(req);
  const {id} = req.query;

  if (method === "DELETE") {
    if (!id || typeof id !== "string") {
      return res.status(400).json({success: false, message: "Invalid ID"});
    }

    const success = await billService.deleteBill(id, user.user_id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Tagihan tidak ditemukan atau sudah dihapus",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tagihan berhasil dihapus",
    });
  }

  return methodNotAllowed(res, ["DELETE"]);
});
