/* eslint-disable @typescript-eslint/no-explicit-any */
import {apiClient} from "./api.client";

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
  student_ids?: string[]; // Actually filtering by IDs or NIS? Backend uses IDs for list. Frontend page usually uses IDs or NIS select.
  student_nis?: string[];
  start_date?: string;
  end_date?: string;
}

export interface GetInquiriesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  student_nis?: string[];
}

export const transactionService = {
  getTransactions: async (
    params: GetTransactionsParams
  ): Promise<{data: Transaction[]; total: number}> => {
    const response = await apiClient.get("/transactions", {params});
    return {
      data: response.data.data,
      total: response.data.meta.total,
    };
  },

  getInquiries: async (
    params: GetInquiriesParams
  ): Promise<{data: any[]; total: number}> => {
    const response = await apiClient.get("/inquiries", {params});
    return {
      data: response.data.data,
      total: response.data.meta.total,
    };
  },

  exportTransactions: async (params: GetTransactionsParams): Promise<void> => {
    const response = await apiClient.get("/transactions/export", {
      params,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Get filename from header if available
    let filename = `laporan-transaksi-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2)
        filename = fileNameMatch[1];
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
