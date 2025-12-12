export type PaymentMethod = "cash" | "transfer" | "manual";
export type TransactionStatus = "success" | "pending" | "failed";

export interface Transaction {
  id: string;
  code: string; // TRX/2024/...
  date: string; // ISO date string
  student: {
    id: string;
    nis: string;
    name: string;
  };
  bill_code: string; // INV/2024/...
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
}

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  search?: string; // TRX Code, Bill Code, or Student Name
  status?: string;
  payment_method?: string;
  student_ids?: string[];
  start_date?: string;
  end_date?: string;
}

// Mock Data
const MOCK_TRANSACTIONS: Transaction[] = Array.from({length: 40}).map(
  (_, i) => ({
    id: `trx-${i + 1}`,
    code: `TRX/2024/${String(i + 1).padStart(4, "0")}`,
    date: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    student: {
      id: `student-${(i % 5) + 1}`,
      nis: `202400${(i % 5) + 1}`,
      name: `Siswa ${(i % 5) + 1}`,
    },
    bill_code: `INV/2024/${String(i + 101).padStart(4, "0")}`,
    description:
      i % 2 === 0
        ? `Pembayaran SPP Bulan ${(i % 12) + 1}`
        : "Pembayaran Uang Buku",
    amount: i % 2 === 0 ? 500000 : 150000,
    payment_method: i % 3 === 0 ? "transfer" : "cash",
    status: i % 10 === 0 ? "failed" : i % 5 === 0 ? "pending" : "success",
  })
);

export const transactionService = {
  getTransactions: async (
    params: GetTransactionsParams
  ): Promise<{data: Transaction[]; total: number}> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    let filtered = [...MOCK_TRANSACTIONS];

    // Filter Search
    if (params.search) {
      const lowerSearch = params.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.code.toLowerCase().includes(lowerSearch) ||
          t.bill_code.toLowerCase().includes(lowerSearch) ||
          t.student.name.toLowerCase().includes(lowerSearch) ||
          t.student.nis.includes(lowerSearch)
      );
    }

    // Filter Status
    if (params.status && params.status !== "all") {
      filtered = filtered.filter((t) => t.status === params.status);
    }

    // Filter Payment Method
    if (params.payment_method && params.payment_method !== "all") {
      filtered = filtered.filter(
        (t) => t.payment_method === params.payment_method
      );
    }

    // Filter Student IDs
    if (params.student_ids && params.student_ids.length > 0) {
      filtered = filtered.filter((t) =>
        params.student_ids?.includes(t.student.id)
      );
    }

    // Filter Date Range (Simple Implementation)
    if (params.start_date || params.end_date) {
      filtered = filtered.filter((t) => {
        const tDate = t.date.split("T")[0];
        const afterStart = params.start_date
          ? tDate >= params.start_date
          : true;
        const beforeEnd = params.end_date ? tDate <= params.end_date : true;
        return afterStart && beforeEnd;
      });
    }

    // Sort by Date Descending
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const start = ((params.page || 1) - 1) * (params.limit || 10);
    const end = start + (params.limit || 10);

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
    };
  },

  exportTransactions: async (params: GetTransactionsParams): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Exporting transactions with params:", params);
  },
};
