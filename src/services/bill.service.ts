/* eslint-disable @typescript-eslint/no-explicit-any */
export type BillType = "spp" | "non_spp";
export type BillStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Bill {
  id: string;
  student: {
    id: string;
    nis: string;
    name: string;
  };
  type: BillType;
  code: string;
  amount: number;
  paid_amount: number;
  billing_period?: string; // YYYY-MM
  description?: string;
  due_date: string;
  status: BillStatus;
  is_overdue: boolean;
}

export interface CreateBillPayload {
  student_id: string;
  type: BillType;
  amount: number;
  billing_period?: string;
  description?: string;
  due_date: string;
}

export interface GetBillsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  student_ids?: string[];
  period?: string; // YYYY-MM
}

// Mock Data
const MOCK_BILLS: Bill[] = Array.from({length: 30}).map((_, i) => ({
  id: `bill-${i + 1}`,
  student: {
    id: `student-${(i % 5) + 1}`,
    nis: `202400${(i % 5) + 1}`,
    name: `Siswa ${(i % 5) + 1}`,
  },
  type: i % 3 === 0 ? "non_spp" : "spp",
  code: `INV/2024/${String(i + 1).padStart(4, "0")}`,
  amount: i % 3 === 0 ? 150000 : 500000,
  paid_amount: i % 4 === 0 ? (i % 3 === 0 ? 150000 : 500000) : 0,
  billing_period:
    i % 3 === 0 ? undefined : `2024-${String((i % 12) + 1).padStart(2, "0")}`,
  description: i % 3 === 0 ? "Buku Paket A" : undefined,
  due_date: `2024-${String((i % 12) + 1).padStart(2, "0")}-20`,
  status: i % 4 === 0 ? "paid" : i % 5 === 0 ? "overdue" : "pending",
  is_overdue: i % 5 === 0,
}));

export const billService = {
  getBills: async (
    params: GetBillsParams
  ): Promise<{data: Bill[]; total: number}> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    let filtered = [...MOCK_BILLS];

    // Filter Search (Invoice Code or Student Name)
    if (params.search) {
      const lowerSearch = params.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.code.toLowerCase().includes(lowerSearch) ||
          b.student.name.toLowerCase().includes(lowerSearch) ||
          b.student.nis.includes(lowerSearch)
      );
    }

    // Filter Status
    if (params.status && params.status !== "all") {
      filtered = filtered.filter((b) => b.status === params.status);
    }

    // Filter Period (YYYY-MM)
    if (params.period) {
      // For SPP match billing_period, for non-spp maybe match due_date month?
      // MVP: match billing_period strict for SPP, or due_date startsWith for non-spp
      filtered = filtered.filter(
        (b) =>
          b.billing_period === params.period ||
          b.due_date.startsWith(params.period as string)
      );
    }

    // Filter Student IDs
    if (params.student_ids && params.student_ids.length > 0) {
      filtered = filtered.filter((b) =>
        params.student_ids?.includes(b.student.id)
      );
    }

    const start = ((params.page || 1) - 1) * (params.limit || 10);
    const end = start + (params.limit || 10);

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
    };
  },

  createBill: async (payload: CreateBillPayload): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Create Bill:", payload);
    const newBill: Bill = {
      id: `bill-${MOCK_BILLS.length + 1}`,
      student: {id: payload.student_id, nis: "---", name: "Mock Student"}, // Would fetch real user in BE
      type: payload.type,
      code: `INV/2024/${String(MOCK_BILLS.length + 1).padStart(4, "0")}`,
      amount: payload.amount,
      paid_amount: 0,
      billing_period: payload.billing_period,
      description: payload.description,
      due_date: payload.due_date,
      status: "pending",
      is_overdue: false,
    };
    MOCK_BILLS.unshift(newBill);
  },

  uploadBulkBills: async (payload: any): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Bulk Upload:", payload);
  },
};
