// Database types generated from schema
// This file defines the TypeScript types for all database tables

import type {ColumnType} from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface SchoolTable {
  id: Generated<string>;
  name: string;
  code: string;
  address: string | null;
  logo_url: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface UserTable {
  id: Generated<string>;
  school_id: string | null;
  email: string;
  password_hash: string;
  name: string;
  is_active: Generated<boolean>;
  is_super_admin: Generated<boolean>;
  reset_token: string | null;
  reset_token_expires: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface StudentTable {
  id: Generated<string>;
  school_id: string;
  nis: string;
  name: string;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface BillTable {
  id: Generated<string>;
  school_id: string;
  student_id: string;
  code: string;
  bill_type: "spp" | "non_spp";
  amount: string; // Decimal stored as string
  paid_amount: Generated<string>; // Decimal stored as string
  description: string | null;
  billing_period: string | null;
  bill_date: Date;
  due_date: Date;
  status: Generated<"pending" | "paid" | "cancelled">;
  cancelled_at: Date | null;
  cancelled_by: string | null;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
  deleted_by: string | null;
  updated_by: string | null;
}

export interface PaymentTable {
  id: Generated<string>;
  bill_id: string;
  amount: string; // Decimal stored as string
  payment_method: string;
  payment_date: Date;
  payment_reference_number: string | null;
  notes: string | null;
  created_at: Generated<Date>;
  inquiry_id: string | null;
}

// Database interface for Kysely
export interface Database {
  schools: SchoolTable;
  users: UserTable;
  students: StudentTable;
  bills: BillTable;
  payments: PaymentTable;
  inquiries: InquiryTable;
  inquiry_items: InquiryItemTable;
}

export interface InquiryTable {
  id: Generated<string>;
  student_id: string;
  code: string;
  total_amount: string; // decimal
  status: Generated<"pending" | "paid" | "expired" | "cancelled">;
  expired_at: Date;
  created_at: Generated<Date>;
}

export interface InquiryItemTable {
  id: Generated<string>;
  inquiry_id: string;
  bill_id: string;
  amount: string; // decimal
}
