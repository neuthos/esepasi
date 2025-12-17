/* eslint-disable @typescript-eslint/no-explicit-any */
import {db} from "@/lib/db/kysely";
import {sql, Insertable} from "kysely";
import {BillTable} from "@/lib/db/types";
import {NotFoundError, ValidationError} from "@/lib/errors/AppError";

export interface CreateBillInput {
  school_id: string;
  student_nis: string; // Changed from student_id
  type: "spp" | "non_spp";
  amount: number;
  billing_period?: string;
  description?: string;
  due_date: string;
  created_by: string;
}

export interface GetBillsFilter {
  school_id: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  period?: string;
  student_nis?: string[]; // Changed from student_ids
  include_deleted?: boolean;
}

export class BillService {
  /**
   * Get filtered list of bills
   */
  async getBills(filter: GetBillsFilter) {
    const {page, limit, search, status, period, student_nis, school_id} =
      filter;
    const offset = (page - 1) * limit;

    // 1. Build Base Query (Joins & Filters only, NO Selects yet)
    let baseQuery = db
      .selectFrom("bills")
      .innerJoin("students", "students.id", "bills.student_id")
      .leftJoin("users as creator", "creator.id", "bills.created_by")
      .leftJoin("users as updater", "updater.id", "bills.updated_by")
      .where("students.school_id", "=", school_id);

    const isDeletedFilter = status === "deleted";

    if (!filter.include_deleted && !isDeletedFilter) {
      baseQuery = baseQuery.where("bills.deleted_at", "is", null);
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("bills.code", "ilike", searchLower),
          eb("students.name", "ilike", searchLower),
          eb("students.nis", "ilike", searchLower),
        ])
      );
    }

    if (status === "overdue") {
      baseQuery = baseQuery
        .where("bills.due_date", "<", sql<Date>`CURRENT_DATE`)
        .where("bills.status", "!=", "paid")
        .where("bills.status", "!=", "cancelled");
    } else if (status === "deleted") {
      baseQuery = baseQuery.where("bills.deleted_at", "is not", null);
    } else if (status && status !== "all") {
      baseQuery = baseQuery.where("bills.status", "=", status as any);
    }

    if (period) {
      if (period.match(/^\d{4}-\d{2}$/)) {
        baseQuery = baseQuery.where((eb) =>
          eb.or([
            eb("bills.billing_period", "=", period),
            sql<boolean>`TO_CHAR(bills.due_date, 'YYYY-MM') = ${period}`,
          ])
        );
      }
    }

    if (student_nis && student_nis.length > 0) {
      baseQuery = baseQuery.where("students.nis", "in", student_nis);
    }

    // 2. Data Query
    const results = await baseQuery
      .select([
        "bills.id",
        "bills.code",
        "bills.bill_type",
        "bills.amount",
        "bills.paid_amount",
        "bills.billing_period",
        "bills.description",
        "bills.due_date",
        "bills.status",
        "bills.created_at",
        "bills.deleted_at",
        "students.id as student_id",
        "students.nis as student_nis",
        "students.name as student_name",
        "creator.name as created_by_name",
        "updater.name as updated_by_name",
        sql<boolean>`bills.due_date < CURRENT_DATE AND bills.status != 'paid'`.as(
          "is_overdue"
        ),
      ])
      .orderBy("bills.created_at", "desc")
      .orderBy("bills.code", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    // 3. Count Query
    const resultsCount = await baseQuery
      .select(sql<number>`count(*)`.as("count"))
      .executeTakeFirst();
    const total = Number(resultsCount?.count || 0);

    const formatted = results.map((r): any => ({
      id: r.id,
      code: r.code,
      type: r.bill_type,
      amount: Number(r.amount),
      paid_amount: Number(r.paid_amount),
      billing_period: r.billing_period,
      description: r.description,
      due_date: r.due_date,
      status: r.deleted_at
        ? "deleted"
        : r.is_overdue && r.status === "pending"
        ? "overdue"
        : r.status,
      is_overdue: r.is_overdue,
      student: {
        id: r.student_id,
        nis: r.student_nis,
        name: r.student_name,
      },
      created_at: r.created_at,
      deleted_at: r.deleted_at,
      created_by_name: r.created_by_name,
      updated_by_name: r.updated_by_name,
    }));

    return {
      data: formatted,
      total,
    };
  }

  /**
   * Create a single bill
   */
  async createBill(data: CreateBillInput) {
    // 1. Resolve Student ID from NIS
    const student = await db
      .selectFrom("students")
      .select("id")
      .where("nis", "=", data.student_nis)
      .where("school_id", "=", data.school_id)
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError(
        `Siswa dengan NIS ${data.student_nis} tidak ditemukan`
      );
    }

    // 2. Duplicate Check for SPP
    if (data.type === "spp" && data.billing_period) {
      const existingBill = await db
        .selectFrom("bills")
        .select("id")
        .where("student_id", "=", student.id)
        .where("bill_type", "=", "spp")
        .where("billing_period", "=", data.billing_period)
        .where("status", "!=", "cancelled")
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (existingBill) {
        throw new ValidationError(
          `Tagihan SPP untuk periode ${data.billing_period} sudah ada untuk siswa ini.`
        );
      }
    }

    const year = new Date().getFullYear();
    const prefix = `INV/${year}/`;

    const lastBill = await db
      .selectFrom("bills")
      .select("code")
      .where("code", "like", `${prefix}%`)
      .orderBy("code", "desc")
      .limit(1)
      .executeTakeFirst();

    let sequence = 1;
    if (lastBill) {
      const parts = lastBill.code.split("/");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    const code = `${prefix}${String(sequence).padStart(4, "0")}`;

    return await db
      .insertInto("bills")
      .values({
        school_id: data.school_id,
        student_id: student.id,
        code,
        bill_type: data.type,
        amount: String(data.amount),
        billing_period: data.billing_period,
        description: data.description,
        bill_date: new Date(),
        due_date: (() => {
          const d = new Date(data.due_date);
          if (isNaN(d.getTime()))
            throw new Error("Tanggal jatuh tempo tidak valid");
          return d;
        })(),
        status: "pending",
        paid_amount: "0",
        created_by: data.created_by,
        updated_by: data.created_by,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Bulk Create Bills
   */
  async bulkCreateBills(
    school_id: string,
    created_by: string,
    inputs: Omit<CreateBillInput, "school_id" | "created_by">[]
  ) {
    // 1. Get all relevant students in one query
    const nises = inputs.map((i) => i.student_nis);
    if (nises.length === 0) return;

    const students = await db
      .selectFrom("students")
      .select(["id", "nis"])
      .where("nis", "in", nises)
      .where("school_id", "=", school_id)
      .execute();

    const studentMap = new Map(students.map((s) => [s.nis, s.id]));

    // Prefetch duplicate checks for SPP bills
    const sppInputs = inputs.filter(
      (i) => i.type === "spp" && i.billing_period
    );
    const existingBillsMap = new Set<string>();

    if (sppInputs.length > 0) {
      const periods = [
        ...new Set(sppInputs.map((i) => i.billing_period as string)),
      ];
      const studentIds = students.map((s) => s.id);

      const existing = await db
        .selectFrom("bills")
        .select(["student_id", "billing_period"])
        .where("student_id", "in", studentIds)
        .where("bill_type", "=", "spp")
        .where("billing_period", "in", periods)
        .where("status", "!=", "cancelled")
        .where("deleted_at", "is", null)
        .execute();

      existing.forEach((b) =>
        existingBillsMap.add(`${b.student_id}:${b.billing_period}`)
      );
    }

    const year = new Date().getFullYear();
    const prefix = `INV/${year}/`;

    const lastBill = await db
      .selectFrom("bills")
      .select("code")
      .where("code", "like", `${prefix}%`)
      .orderBy("code", "desc")
      .limit(1)
      .executeTakeFirst();

    let sequence = 1;
    if (lastBill) {
      const parts = lastBill.code.split("/");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    const rows: Insertable<BillTable>[] = [];
    let skippedCount = 0;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const studentId = studentMap.get(input.student_nis);

      if (!studentId) {
        console.warn(`Skipping bill for NIS ${input.student_nis}: Not found`);
        skippedCount++;
        continue;
      }

      if (
        input.type === "spp" &&
        input.billing_period &&
        existingBillsMap.has(`${studentId}:${input.billing_period}`)
      ) {
        console.warn(
          `Skipping SPP duplicate for NIS ${input.student_nis} period ${input.billing_period}`
        );
        skippedCount++;
        continue;
      }

      const dueDate = new Date(input.due_date);
      if (isNaN(dueDate.getTime())) {
        console.warn(
          `Skipping bill for NIS ${input.student_nis}: Invalid Date`
        );
        skippedCount++;
        continue;
      }

      rows.push({
        school_id,
        created_by,
        updated_by: created_by,
        student_id: studentId,
        code: `${prefix}${String(sequence + i - skippedCount).padStart(
          4,
          "0"
        )}`,
        bill_type: input.type,
        amount: String(input.amount),
        billing_period: input.billing_period,
        description: input.description,
        bill_date: new Date(),
        due_date: dueDate,
        status: "pending" as const,
        paid_amount: "0",
      });
    }

    if (rows.length === 0) return;

    await db.transaction().execute(async (trx) => {
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await trx.insertInto("bills").values(chunk).execute();
      }
    });
  }

  /**
   * Soft Delete Bill
   */
  async deleteBill(billId: string, deletedBy: string) {
    const result = await db
      .updateTable("bills")
      .set({
        deleted_at: new Date(),
        deleted_by: deletedBy,
      })
      .where("id", "=", billId)
      .where("deleted_at", "is", null) // Validasi belum dihapus
      .where("status", "!=", "paid") // Validasi belum dibayar
      .executeTakeFirst();

    return result.numUpdatedRows > 0;
  }
}

export const billService = new BillService();
