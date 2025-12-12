export interface StudentSummary {
  total_paid: number;
  total_unpaid: number;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  status: "active" | "inactive";
  created_at?: string;
  summary: StudentSummary;
}

export interface StudentHistoryItem {
  id: string;
  type: "bill" | "payment";
  date: string;
  description: string;
  amount: number;
  status?: string; // for bills
  method?: string; // for payments
}

export interface StudentDetail {
  student: Student;
  history: StudentHistoryItem[];
}

export interface CreateStudentPayload {
  name: string;
  nis: string;
  status: "active" | "inactive";
}

export interface BulkCreateStudentPayload {
  students: {name: string; nis: string}[];
}

// Mock Data
let MOCK_STUDENTS: Student[] = Array.from({length: 25}).map((_, i) => ({
  id: `student-${i + 1}`,
  nis: `2024${String(i + 1).padStart(3, "0")}`,
  name: `Siswa ${i + 1}`,
  status: i % 10 === 0 ? "inactive" : "active",
  created_at: new Date(2024, 0, i + 1).toISOString(),
  summary: {
    total_paid: (i + 1) * 100000,
    total_unpaid: (i % 3) * 50000,
  },
}));

export const studentService = {
  getStudents: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    payment_status?: string;
  }): Promise<{data: Student[]; total: number}> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    let filtered = [...MOCK_STUDENTS];

    if (params.search) {
      const lowerSearch = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerSearch) ||
          s.nis.includes(lowerSearch)
      );
    }

    // Filter by Account Status (active/inactive)
    if (params.status && params.status !== "all") {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    // Filter by Payment Status (lunas/belum_lunas)
    if (params.payment_status && params.payment_status !== "all") {
      if (params.payment_status === "lunas") {
        filtered = filtered.filter((s) => s.summary.total_unpaid === 0);
      } else if (params.payment_status === "belum_lunas") {
        filtered = filtered.filter((s) => s.summary.total_unpaid > 0);
      }
    }

    const start = ((params.page || 1) - 1) * (params.limit || 10);
    const end = start + (params.limit || 10);

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
    };
  },

  getStudentDetail: async (id: string): Promise<StudentDetail> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const student = MOCK_STUDENTS.find((s) => s.id === id);
    if (!student) throw new Error("Student not found");

    return {
      student,
      history: [
        {
          id: "bill-1",
          type: "bill",
          date: "2024-01-01",
          description: "SPP Januari 2024",
          amount: 150000,
          status: "paid",
        },
        {
          id: "pay-1",
          type: "payment",
          date: "2024-01-05",
          description: "Pembayaran SPP Januari",
          amount: 150000,
          method: "transfer",
        },
        {
          id: "bill-2",
          type: "bill",
          date: "2024-02-01",
          description: "SPP Februari 2024",
          amount: 150000,
          status: "pending",
        },
      ],
    };
  },

  createStudent: async (payload: CreateStudentPayload): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newStudent: Student = {
      id: `student-${MOCK_STUDENTS.length + 1}`,
      ...payload,
      created_at: new Date().toISOString(),
      summary: {total_paid: 0, total_unpaid: 0},
    };
    MOCK_STUDENTS = [newStudent, ...MOCK_STUDENTS];
  },

  bulkCreateStudents: async (
    payload: BulkCreateStudentPayload
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const newStudents = payload.students.map((s, i) => ({
      id: `student-${MOCK_STUDENTS.length + i + 1}`,
      ...s,
      status: "active" as const,
      created_at: new Date().toISOString(),
      summary: {total_paid: 0, total_unpaid: 0},
    }));
    MOCK_STUDENTS = [...newStudents, ...MOCK_STUDENTS];
  },
};
