/* eslint-disable @typescript-eslint/no-explicit-any */
import {db} from "@/lib/db/kysely";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors/AppError";
import {sql} from "kysely";

export interface CreateStudentInput {
  nis: string;
  name: string;
  status: "active" | "inactive";
}

export interface UpdateStudentInput {
  nis?: string;
  name?: string;
  status?: "active" | "inactive";
}

export interface GetStudentsFilter {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  payment_status?: string;
}

export class StudentService {
  /**
   * Get filtered list of students with summary of bills
   */
  async getStudents(schoolId: string, filter: GetStudentsFilter) {
    const {page, limit, search, status, payment_status} = filter;
    const offset = (page - 1) * limit;

    let query = db
      .selectFrom("students")
      .innerJoin("schools", "schools.id", "students.school_id")
      .leftJoin("bills", "bills.student_id", "students.id")
      .select([
        "students.id",
        "students.nis",
        "students.name",
        "students.is_active",

        sql<string>`CASE WHEN students.is_active THEN 'active' ELSE 'inactive' END`.as(
          "status"
        ),

        sql<number>`COALESCE(SUM(bills.paid_amount), 0)`.as("total_paid"),

        sql<number>`COALESCE(SUM(CASE WHEN bills.status != 'cancelled' THEN bills.amount - bills.paid_amount ELSE 0 END), 0)`.as(
          "total_unpaid"
        ),
      ])
      .where("students.school_id", "=", schoolId)
      .groupBy([
        "students.id",
        "students.nis",
        "students.name",
        "students.is_active",
      ]);

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("students.name", "ilike", searchLower),
          eb("students.nis", "ilike", searchLower),
        ])
      );
    }

    if (status && status !== "all") {
      const isActive = status === "active";
      query = query.where("students.is_active", "=", isActive);
    }

    if (payment_status === "lunas") {
      query = query.having(
        sql`COALESCE(SUM(CASE WHEN bills.status != 'cancelled' THEN bills.amount - bills.paid_amount ELSE 0 END), 0)`,
        "=",
        0
      );
    } else if (payment_status === "belum_lunas") {
      query = query.having(
        sql`COALESCE(SUM(CASE WHEN bills.status != 'cancelled' THEN bills.amount - bills.paid_amount ELSE 0 END), 0)`,
        ">",
        0
      );
    }

    const queryWithCount = db
      .selectFrom("students")
      .innerJoin("schools", "schools.id", "students.school_id")
      .leftJoin("bills", "bills.student_id", "students.id")
      .select([
        "students.id",
        "students.nis",
        "students.name",
        "students.is_active",
        sql<string>`CASE WHEN students.is_active THEN 'active' ELSE 'inactive' END`.as(
          "status"
        ),
        sql<number>`COALESCE(SUM(bills.paid_amount), 0)`.as("total_paid"),
        sql<number>`COALESCE(SUM(CASE WHEN bills.status != 'cancelled' THEN bills.amount - bills.paid_amount ELSE 0 END), 0)`.as(
          "total_unpaid"
        ),

        sql<number>`count(*) OVER()`.as("total_count"),
      ])
      .where("students.school_id", "=", schoolId)
      .groupBy([
        "students.id",
        "students.nis",
        "students.name",
        "students.is_active",
      ]);

    let finalQuery = queryWithCount;
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      finalQuery = finalQuery.where((eb) =>
        eb.or([
          eb("students.name", "ilike", searchLower),
          eb("students.nis", "ilike", searchLower),
        ])
      );
    }
    if (status && status !== "all") {
      finalQuery = finalQuery.where(
        "students.is_active",
        "=",
        status === "active"
      );
    }
    if (payment_status === "lunas") {
      finalQuery = finalQuery.having(
        sql`COALESCE(SUM(CASE WHEN bills.status != 'cancelled' THEN bills.amount - bills.paid_amount ELSE 0 END), 0)`,
        "=",
        0
      );
    } else if (payment_status === "belum_lunas") {
      finalQuery = finalQuery.having(
        sql`COALESCE(SUM(CASE WHEN bills.status != 'cancelled' THEN bills.amount - bills.paid_amount ELSE 0 END), 0)`,
        ">",
        0
      );
    }

    const results = await finalQuery
      .orderBy("students.created_at", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const total = results.length > 0 ? Number(results[0].total_count) : 0;

    const formattedResults = results.map((r) => ({
      id: r.id,
      nis: r.nis,
      name: r.name,
      status: r.status,
      summary: {
        total_paid: Number(r.total_paid),
        total_unpaid: Number(r.total_unpaid),
      },
    }));

    return {
      data: formattedResults,
      total,
    };
  }

  /**
   * Create single student
   */
  async createStudent(schoolId: string, data: CreateStudentInput) {
    const existing = await db
      .selectFrom("students")
      .select("id")
      .where("school_id", "=", schoolId)
      .where("nis", "=", data.nis)
      .executeTakeFirst();

    if (existing) {
      throw new ConflictError(`Siswa dengan NIS ${data.nis} sudah terdaftar`);
    }

    return await db
      .insertInto("students")
      .values({
        school_id: schoolId,
        nis: data.nis,
        name: data.name,
        is_active: data.status === "active",
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Bulk create students
   */
  async bulkCreateStudents(schoolId: string, students: CreateStudentInput[]) {
    if (students.length > 1000) {
      throw new Error("Maksimal import 1000 data sekaligus");
    }

    if (students.length === 0) return [];

    const rows = students.map((s) => ({
      school_id: schoolId,
      nis: s.nis,
      name: s.name,
      is_active: true,
    }));

    return await db.transaction().execute(async (trx) => {
      const result = await trx
        .insertInto("students")
        .values(rows)
        .onConflict((oc) => oc.constraint("uq_school_nis").doNothing())
        .returning(["id", "nis", "name"])
        .execute();

      return result;
    });
  }

  /**
   * Update student details
   */
  async updateStudent(
    schoolId: string,
    studentId: string,
    data: UpdateStudentInput
  ) {
    const student = await db
      .selectFrom("students")
      .select(["id", "school_id", "is_active"])
      .where("id", "=", studentId)
      .executeTakeFirst();

    if (!student || student.school_id !== schoolId) {
      throw new NotFoundError("Siswa tidak ditemukan");
    }

    const updates: any = {updated_at: new Date()};
    if (data.name) updates.name = data.name;
    if (data.nis) {
      const existing = await db
        .selectFrom("students")
        .select("id")
        .where("school_id", "=", schoolId)
        .where("nis", "=", data.nis)
        .where("id", "!=", studentId)
        .executeTakeFirst();
      if (existing)
        throw new ConflictError(`NIS ${data.nis} sudah digunakan siswa lain`);
      updates.nis = data.nis;
    }

    if (data.status) {
      const newIsActive = data.status === "active";

      if (student.is_active && !newIsActive) {
        const unpaidBills = await db
          .selectFrom("bills")
          .select("id")
          .where("student_id", "=", studentId)
          .where("status", "!=", "cancelled")
          .where(sql`amount - paid_amount`, ">", 0)
          .execute();

        if (unpaidBills.length > 0) {
          throw new ForbiddenError(
            "Tidak dapat menonaktifkan siswa yang memiliki tagihan belum lunas"
          );
        }
      }
      updates.is_active = newIsActive;
    }

    await db
      .updateTable("students")
      .set(updates)
      .where("id", "=", studentId)
      .execute();
  }

  /**
   * Get student detail with history
   */
  async getStudentDetail(schoolId: string, studentId: string) {
    const student = await db
      .selectFrom("students")
      .select(["id", "nis", "name", "is_active", "created_at"])
      .where("id", "=", studentId)
      .where("school_id", "=", schoolId)
      .executeTakeFirst();

    if (!student) throw new NotFoundError("Siswa tidak ditemukan");

    const bills = await db
      .selectFrom("bills")
      .select([
        "id",
        "description",
        "amount",
        sql<string>`'bill'`.as("type"),
        "created_at as date",
        "status",
      ])
      .where("student_id", "=", studentId)
      .execute();

    const payments = await db
      .selectFrom("payments")
      .innerJoin("bills", "bills.id", "payments.bill_id")
      .select([
        "payments.id",
        sql<string>`COALESCE(payments.notes, CONCAT('Pembayaran ', bills.description))`.as(
          "description"
        ),
        "payments.amount",
        sql<string>`'payment'`.as("type"),
        "payments.payment_date as date",
        "payments.payment_method as method",
      ])
      .where("bills.student_id", "=", studentId)
      .execute();

    const history = [...bills, ...payments].sort(
      (a, b) =>
        new Date(b.date as unknown as string).getTime() -
        new Date(a.date as unknown as string).getTime()
    );

    return {
      student: {
        ...student,
        status: student.is_active ? "active" : "inactive",
      },
      history,
    };
  }
}

export const studentService = new StudentService();
