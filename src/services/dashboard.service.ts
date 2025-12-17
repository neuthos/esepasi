import {apiClient} from "./api.client";

export interface PeriodStatsDetail {
  unpaid: {
    amount: number;
    student_count: number;
  };
  paid: {
    amount: number;
    student_count: number;
  };
  expected_total: number;
}

export interface AllTimeStats {
  total_paid: number;
  total_unpaid: number;
}

export interface DashboardStats {
  total_active_students: number;
  period: {
    spp: PeriodStatsDetail;
    non_spp: PeriodStatsDetail;
  };
  all_time: AllTimeStats;
}

export const dashboardService = {
  getStats: async (period: string): Promise<DashboardStats> => {
    const response = await apiClient.get("/dashboard/stats", {
      params: {period},
    });
    return response.data;
  },
};
