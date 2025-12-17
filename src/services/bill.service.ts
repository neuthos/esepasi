/* eslint-disable @typescript-eslint/no-explicit-any */
import {apiClient} from "./api.client";

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
  created_at?: string;
  deleted_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface CreateBillPayload {
  student_nis: string;
  type: "spp" | "non_spp";
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
  student_nis?: string[];
  period?: string; // YYYY-MM
}

export const billService = {
  getBills: async (
    params: GetBillsParams
  ): Promise<{data: Bill[]; total: number}> => {
    const response = await apiClient.get("/bills", {params});
    return {
      data: response.data.data,
      total: response.data.meta.total,
    };
  },

  createBill: async (payload: CreateBillPayload): Promise<void> => {
    await apiClient.post("/bills", payload);
  },

  async uploadBulkBills(data: any) {
    const res = await apiClient.post("/bills/bulk", data);
    return res.data;
  },

  async deleteBill(id: string) {
    const res = await apiClient.delete(`/bills/${id}`);
    return res.data;
  },
};
