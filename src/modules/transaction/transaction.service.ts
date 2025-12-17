/* eslint-disable @typescript-eslint/no-explicit-any */
import {db} from "@/lib/db/kysely";
import {NotFoundError, ValidationError} from "@/lib/errors/AppError";
import dayjs from "dayjs";

export interface GetTransactionsFilter {
  school_id?: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  payment_method?: string;
  student_ids?: string[];
  student_nis?: string[];
  start_date?: string;
  end_date?: string;
}

export interface PaymentInput {
  bill_code?: string; // Legacy/Single Bill
  inquiry_code?: string; // New Preferred Method
  amount: number;
  payment_method: string;
  notes?: string;
  reference_number?: string;
}

export class TransactionService {
  /**
   * Get filtered list of transactions (payments)
   */
  async getTransactions(filter: GetTransactionsFilter) {
    const {
      page,
      limit,
      search,
      payment_method,
      student_ids,
      student_nis,
      start_date,
      end_date,
      school_id,
      status,
    } = filter;

    const offset = (page - 1) * limit;

    let baseQuery = db
      .selectFrom("payments")
      .innerJoin("bills", "bills.id", "payments.bill_id")
      .innerJoin("students", "students.id", "bills.student_id");

    if (school_id) {
      baseQuery = baseQuery.where("bills.school_id", "=", school_id);
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("bills.code", "ilike", searchLower),
          eb("students.name", "ilike", searchLower),
          eb("students.nis", "ilike", searchLower),
          eb("payments.payment_reference_number", "ilike", searchLower),
        ])
      );
    }

    if (status && status !== "all") {
      if (status !== "success") {
        return {data: [], total: 0};
      }
    }

    if (payment_method && payment_method !== "all") {
      baseQuery = baseQuery.where(
        "payments.payment_method",
        "=",
        payment_method
      );
    }

    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      baseQuery = baseQuery
        .where("payments.payment_date", ">=", start)
        .where("payments.payment_date", "<=", end);
    }

    if (student_ids && student_ids.length > 0) {
      baseQuery = baseQuery.where("students.id", "in", student_ids);
    }

    if (student_nis && student_nis.length > 0) {
      baseQuery = baseQuery.where("students.nis", "in", student_nis);
    }

    // Data Query
    const results = await baseQuery
      .select([
        "payments.id",
        "payments.amount",
        "payments.payment_method",
        "payments.payment_date",
        "payments.payment_reference_number",
        "payments.notes",
        "bills.code as bill_code",
        "bills.description as bill_description",
        "bills.bill_type",
        "students.id as student_id",
        "students.name as student_name",
        "students.nis as student_nis",
      ])
      .orderBy("payments.payment_date", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    // Total Count Query
    const countResult = await baseQuery
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst();

    const formatted = results.map((r) => ({
      id: r.id,
      code: r.payment_reference_number || `TRX-${r.id.substring(0, 8)}`, // Fallback code
      date: r.payment_date,
      amount: Number(r.amount), // decimal to number
      payment_method: r.payment_method,
      status: "success", // All payments in table are success
      bill_code: r.bill_code,
      description: r.bill_description || `Pembayaran ${r.bill_type}`,
      student: {
        id: r.student_id,
        nis: r.student_nis,
        name: r.student_name,
      },
    }));

    return {
      data: formatted,
      total: Number(countResult?.total || 0),
    };
  }

  /**
   * Create Inquiry (Stateful Check Tagihan)
   */
  async createInquiry(nis: string) {
    return await db.transaction().execute(async (trx) => {
      // 1. Get Student
      const student = await trx
        .selectFrom("students")
        .select(["id", "name", "school_id", "nis"])
        .where("nis", "=", nis)
        .executeTakeFirst();

      if (!student) {
        throw new NotFoundError("Siswa tidak ditemukan");
      }

      // 2. Expire old pending inquiries
      await trx
        .updateTable("inquiries")
        .set({status: "expired"}) // Force cast if strict, but 'expired' is valid
        .where("student_id", "=", student.id)
        .where("status", "=", "pending")
        .execute();

      // 3. Get Active/Unpaid Bills
      // Logic: amount > paid_amount AND status != 'cancelled'
      const bills = await trx
        .selectFrom("bills")
        .select([
          "id",
          "code",
          "amount",
          "paid_amount",
          "bill_type",
          "description",
          "billing_period",
          "due_date",
        ])
        .where("student_id", "=", student.id)
        .where("status", "!=", "cancelled")
        .where("deleted_at", "is", null)
        .execute();

      const unpaidBills = bills
        .filter((b) => Number(b.amount) > Number(b.paid_amount))
        .map((b) => ({
          ...b,
          remaining_amount: Number(b.amount) - Number(b.paid_amount),
        }));

      const totalAmount = unpaidBills.reduce(
        (sum, b) => sum + b.remaining_amount,
        0
      );

      // Generate Code
      const code = `INQ-${dayjs().format("YYYYMMDD")}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;
      const expiredAt = dayjs().add(24, "hour").toDate();

      // 4. Create Inquiry
      const inquiry = await trx
        .insertInto("inquiries")
        .values({
          student_id: student.id,
          code,
          total_amount: totalAmount.toString(),
          status: "pending",
          expired_at: expiredAt,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 5. Create Inquiry Items
      if (unpaidBills.length > 0) {
        await trx
          .insertInto("inquiry_items")
          .values(
            unpaidBills.map((b) => ({
              inquiry_id: inquiry.id,
              bill_id: b.id,
              amount: b.remaining_amount.toString(),
            }))
          )
          .execute();
      }

      return {
        ...inquiry,
        student,
        bills: unpaidBills,
      };
    });
  }

  /**
   * Process Payment (Supports Inquiry or Direct Bill)
   */
  async createPayment(input: PaymentInput, created_by_system = false) {
    return await db.transaction().execute(async (trx) => {
      // MODE 1: PAY BY INQUIRY
      if (input.inquiry_code) {
        const inquiry = await trx
          .selectFrom("inquiries")
          .selectAll()
          .where("code", "=", input.inquiry_code)
          .executeTakeFirst();

        if (!inquiry) throw new NotFoundError("Inquiry tidak ditemukan");
        if (inquiry.status !== "pending")
          throw new ValidationError(
            `Inquiry status is ${inquiry.status} (cannot pay)`
          );
        if (new Date() > inquiry.expired_at) {
          throw new ValidationError("Inquiry has expired");
        }
        if (Number(input.amount) !== Number(inquiry.total_amount)) {
          throw new ValidationError(
            `Amount mismatch. Expected ${inquiry.total_amount}`
          );
        }

        // Get Items
        const items = await trx
          .selectFrom("inquiry_items")
          .selectAll()
          .where("inquiry_id", "=", inquiry.id)
          .execute();

        // Process each item
        for (const item of items) {
          await trx
            .insertInto("payments")
            .values({
              bill_id: item.bill_id,
              amount: item.amount,
              payment_method: input.payment_method,
              payment_date: new Date(),
              payment_reference_number: input.reference_number,
              notes: input.notes || "Payment via Inquiry " + inquiry.code,
              inquiry_id: inquiry.id,
            })
            .execute();

          // Update Bill
          const bill = await trx
            .selectFrom("bills")
            .select(["paid_amount", "amount"])
            .where("id", "=", item.bill_id)
            .executeTakeFirstOrThrow();

          const newPaid = Number(bill.paid_amount) + Number(item.amount);
          const isFull = newPaid >= Number(bill.amount);

          await trx
            .updateTable("bills")
            .set({
              paid_amount: newPaid.toString(),
              status: isFull ? "paid" : "pending",
            })
            .where("id", "=", item.bill_id)
            .execute();
        }

        // Update Inquiry Status
        await trx
          .updateTable("inquiries")
          .set({status: "paid"})
          .where("id", "=", inquiry.id)
          .execute();

        return {inquiry_code: inquiry.code, status: "paid"};
      }

      // MODE 2: SINGLE BILL (Legacy/Manual)
      if (input.bill_code) {
        const bill = await trx
          .selectFrom("bills")
          .select(["id", "amount", "paid_amount", "status"])
          .where("code", "=", input.bill_code)
          .executeTakeFirst();

        if (!bill) throw new NotFoundError("Bill not found");
        if ((bill.status as string) === "paid")
          throw new ValidationError("Bill is already paid");

        const remaining = Number(bill.amount) - Number(bill.paid_amount);
        if (input.amount > remaining) {
          throw new ValidationError(
            `Overpayment. Remaining: ${remaining}, Sent: ${input.amount}`
          );
        }

        // Insert Payment
        const payment = await trx
          .insertInto("payments")
          .values({
            bill_id: bill.id,
            amount: input.amount.toString(),
            payment_method: input.payment_method,
            payment_date: new Date(),
            payment_reference_number: input.reference_number,
            notes: input.notes,
          })
          .returning("id")
          .executeTakeFirst();

        // Update Bill
        const newPaid = Number(bill.paid_amount) + input.amount;
        const isFull = newPaid >= Number(bill.amount);

        await trx
          .updateTable("bills")
          .set({
            paid_amount: newPaid.toString(),
            status: isFull ? "paid" : "pending", // safe cast
          })
          .where("id", "=", bill.id)
          .execute();

        return {payment_id: payment?.id, status: isFull ? "paid" : "pending"};
      }

      throw new ValidationError("Must provide inquiry_code or bill_code");
    });
  }

  /**
   * Get Inquiries List for Dashboard
   */
  async getInquiries(filter: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    student_nis?: string[];
  }) {
    let query = db
      .selectFrom("inquiries")
      .innerJoin("students", "students.id", "inquiries.student_id");

    if (filter.search) {
      const s = `%${filter.search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("inquiries.code", "ilike", s),
          eb("students.name", "ilike", s),
          eb("students.nis", "ilike", s),
        ])
      );
    }

    if (filter.status && filter.status !== "all") {
      query = query.where("inquiries.status", "=", filter.status as any);
    }

    if (filter.student_nis && filter.student_nis.length > 0) {
      query = query.where("students.nis", "in", filter.student_nis);
    }

    const offset = (filter.page - 1) * filter.limit;

    const data = await query
      .select([
        "inquiries.id",
        "inquiries.code",
        "inquiries.total_amount",
        "inquiries.status",
        "inquiries.created_at",
        "inquiries.expired_at",
        "students.name as student_name",
        "students.nis as student_nis",
      ])
      .orderBy("inquiries.created_at", "desc")
      .limit(filter.limit)
      .offset(offset)
      .execute();

    const count = await query
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .executeTakeFirst();

    return {
      data,
      total: Number(count?.total || 0),
    };
  }

  // Deprecated / Legacy read-only
  async getStudentInquiry(nis: string, school_id: string) {
    // Reuse logic of createInquiry but read-only?
    // Or just fetch unpaid bills.
    // Keeping it simple for backward compatibility if needed,
    // but typically we should switch to createInquiry.
    // For now, let's leave it compatible with "Unpaid Bills" view.
    const results = await db
      .selectFrom("bills")
      .innerJoin("students", "students.id", "bills.student_id")
      .select([
        "students.name as student_name",
        "students.nis",
        "students.school_id",
        "bills.id as bill_id",
        "bills.code as bill_code",
        "bills.bill_type",
        "bills.description",
        "bills.billing_period",
        "bills.amount",
        "bills.paid_amount",
        "bills.due_date",
      ])
      .where("students.nis", "=", nis)
      .where("students.school_id", "=", school_id) // Ensure school context
      .where("bills.status", "in", ["pending"]) // Only pending
      .execute();

    if (results.length === 0) {
      // Check if student exists
      const student = await db
        .selectFrom("students")
        .select("id")
        .where("nis", "=", nis)
        .executeTakeFirst();
      if (!student) throw new NotFoundError("Student not found");
      return {student, bills: [], total_amount: 0};
    }

    const bills = results.map((r) => ({
      ...r,
      remaining_amount: Number(r.amount) - Number(r.paid_amount),
    }));

    const total_amount = bills.reduce((sum, b) => sum + b.remaining_amount, 0);

    return {
      student: {
        name: results[0].student_name,
        nis: results[0].nis,
        school_id: results[0].school_id,
      },
      bills,
      total_amount,
    };
  }
}

export const transactionService = new TransactionService();
