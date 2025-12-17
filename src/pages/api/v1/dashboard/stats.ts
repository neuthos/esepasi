import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {requireAuth} from "@/lib/auth/middleware";
import {dashboardService} from "@/modules/dashboard/dashboard.service";

export default apiHandler(async (req, res) => {
  const method = req.method;
  const user = requireAuth(req);

  if (!user.school_id) {
    return res
      .status(400)
      .json({success: false, message: "User not associated with a school"});
  }

  if (method === "GET") {
    const {period} = req.query;

    const targetPeriod =
      (period as string) || new Date().toISOString().slice(0, 7);

    const stats = await dashboardService.getStats(user.school_id, targetPeriod);

    return res.status(200).json(stats);
  }

  return methodNotAllowed(res, ["GET"]);
});
