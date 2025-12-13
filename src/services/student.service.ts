import {apiClient} from "./api.client";

export interface Student {
  id: string;
  nis: string;
  name: string;
  status: "active" | "inactive";
  summary: {
    total_paid: number;
    total_unpaid: number;
  };
}

export interface StudentHistoryItem {
  id: string;
  type: "bill" | "payment";
  date: string;
  description: string;
  amount: number;
  // Bill specific
  status?: "pending" | "paid" | "cancelled";
  // Payment specific
  method?: string;
}

export interface StudentDetail {
  student: {
    id: string;
    nis: string;
    name: string;
    status: "active" | "inactive";
    created_at: string;
  };
  history: StudentHistoryItem[];
}

export interface GetStudentsParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  payment_status?: string;
}

export interface CreateStudentPayload {
  nis: string;
  name: string;
  status?: "active" | "inactive";
}

export interface BulkCreatePayload {
  students: {nis: string; name: string}[];
}

export const studentService = {
  getStudents: async (
    params: GetStudentsParams
  ): Promise<{data: Student[]; total: number}> => {
    const response = await apiClient.get("/students", {params});
    return {
      data: response.data.data,
      total: response.data.meta.total,
    };
  },

  createStudent: async (payload: CreateStudentPayload): Promise<void> => {
    await apiClient.post("/students", payload);
  },

  bulkCreateStudents: async (payload: BulkCreatePayload): Promise<void> => {
    return apiClient.post("/students/bulk", payload);
  },

  getStudentDetail: async (id: string): Promise<StudentDetail> => {
    const response = await apiClient.get<{data: StudentDetail}>(
      `/students/${id}`
    );
    return response.data.data;
  },

  updateStudent: async (
    id: string,
    payload: Partial<CreateStudentPayload>
  ): Promise<void> => {
    await apiClient.put(`/students/${id}`, payload);
  },
};
