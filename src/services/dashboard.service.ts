export interface PeriodStats {
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
  period: PeriodStats;
  all_time: AllTimeStats;
}

export const dashboardService = {
  getStats: async (period: string): Promise<DashboardStats> => {
    // Mock Delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`Fetching stats for period: ${period}`);

    // Mock Response based on period (just to show it changes)
    const isCurrentMonth = period === new Date().toISOString().slice(0, 7); // YYYY-MM

    return {
      total_active_students: 452,
      period: {
        unpaid: {
          amount: isCurrentMonth ? 15000000 : 5000000,
          student_count: isCurrentMonth ? 30 : 10,
        },
        paid: {
          amount: isCurrentMonth ? 75000000 : 85000000,
          student_count: isCurrentMonth ? 420 : 440,
        },
        expected_total: 90000000, // Fixed target for example
      },
      all_time: {
        total_paid: 1250000000,
        total_unpaid: 45000000,
      },
    };
  },
};
