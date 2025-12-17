import {db} from "@/lib/db/kysely";
import {sql} from "kysely";

export interface PeriodStatsDetail {
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

export interface DashboardStats {
  total_active_students: number;
  period: {
    spp: PeriodStatsDetail;
    non_spp: PeriodStatsDetail;
  };
  all_time: {
    total_paid: number;
    total_unpaid: number;
  };
}

interface BillStatRow {
  amount: string;
  paid_amount: string;
  status: string;
  student_id: string;
}

export class DashboardService {
  private calculateStats(bills: BillStatRow[]) {
    let expectedTotal = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    const paidStudentIds = new Set<string>();
    const unpaidStudentIds = new Set<string>();

    for (const bill of bills) {
      const amount = Number(bill.amount);
      const paid = Number(bill.paid_amount);
      const remaining = amount - paid;

      expectedTotal += amount;
      paidAmount += paid;

      if (bill.status !== "paid") {
        unpaidAmount += remaining;
        unpaidStudentIds.add(bill.student_id);
      } else {
        paidStudentIds.add(bill.student_id);
      }
    }

    const finalUnpaidCount = unpaidStudentIds.size;
    let finalPaidCount = 0;
    for (const id of paidStudentIds) {
      if (!unpaidStudentIds.has(id)) {
        finalPaidCount++;
      }
    }

    return {
      unpaid: {
        amount: unpaidAmount,
        student_count: finalUnpaidCount,
      },
      paid: {
        amount: paidAmount,
        student_count: finalPaidCount,
      },
      expected_total: expectedTotal,
    };
  }

  async getStats(schoolId: string, period: string): Promise<DashboardStats> {
    // 1. Total Active Students
    const studentStats = await db
      .selectFrom("students")
      .select(db.fn.count("id").as("count"))
      .where("school_id", "=", schoolId)
      .where("is_active", "=", true)
      .executeTakeFirst();

    const totalActiveStudents = Number(studentStats?.count || 0);

    // 2. All Time Stats
    // Total Paid: Sum of all payments
    const totalPaidResult = await db
      .selectFrom("payments")
      .innerJoin("bills", "bills.id", "payments.bill_id")
      .select(sql<string>`sum(payments.amount)`.as("total"))
      .where("bills.school_id", "=", schoolId)
      .executeTakeFirst();

    // Total Unpaid: Sum of remaining balance on all non-cancelled/non-deleted bills
    const totalUnpaidResult = await db
      .selectFrom("bills")
      .select(sql<string>`sum(amount - paid_amount)`.as("total"))
      .where("school_id", "=", schoolId)
      .where("status", "!=", "cancelled")
      .where("status", "!=", "paid")
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    const allTimeStats = {
      total_paid: Number(totalPaidResult?.total || 0),
      total_unpaid: Number(totalUnpaidResult?.total || 0),
    };

    // 3. Period Stats

    // SPP: Filter by billing_period
    const sppBills = await db
      .selectFrom("bills")
      .select(["amount", "paid_amount", "status", "student_id"])
      .where("school_id", "=", schoolId)
      .where("billing_period", "=", period)
      .where("bill_type", "=", "spp") // Explicitly SPP
      .where("status", "!=", "cancelled")
      .where("deleted_at", "is", null)
      .execute();

    // Non-SPP: Filter by created_at month (startsMainly with YYYY-MM)
    const nonSppBills = await db
      .selectFrom("bills")
      .select(["amount", "paid_amount", "status", "student_id"])
      .where("school_id", "=", schoolId)
      .where("bill_type", "=", "non_spp")
      .where("status", "!=", "cancelled")
      .where("deleted_at", "is", null)
      .execute();

    return {
      total_active_students: totalActiveStudents,
      period: {
        spp: this.calculateStats(sppBills),
        non_spp: this.calculateStats(nonSppBills),
      },
      all_time: allTimeStats,
    };
  }
}

export const dashboardService = new DashboardService();
