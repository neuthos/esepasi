# API Documentation - School Payment System

Version: 1.1.0
Base URL: `/api/v1`

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... } // Object or Array
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total_items": 50,
    "total_pages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_CODE", // Optional internal code
  "errors": { ... } // Optional validation details
}
```

---

## 1. Authentication & Onboarding

### 1.1. Register User (Step 1)

Create a new admin account.

- **Endpoint**: `POST /auth/register`
- **Payload**:
  ```json
  {
    "name": "Admin Utama",
    "email": "admin@sekolah.com",
    "password": "securepassword123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "token": "jwt-token-xyz",
      "user": {
        "id": "uuid-user-123",
        "name": "Admin Utama",
        "email": "admin@sekolah.com",
        "school_id": null,
        "is_admin": true
      }
    }
  }
  ```

### 1.2. Register School (Step 2)

Register school details for the authenticated user.

- **Endpoint**: `POST /school/register`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "school_name": "SMA Negeri 1 Jakarta",
    "phone": "021-12345678",
    "address": "Jl. Pendidikan No. 1"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "School registered successfully",
    "data": {
      "school_id": "uuid-school-456",
      "name": "SMA Negeri 1 Jakarta"
    }
  }
  ```

### 1.3. Login

Authenticate user and get token.

- **Endpoint**: `POST /auth/login`
- **Payload**:
  ```json
  {
    "email": "admin@sekolah.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt-token-xyz",
      "user": {
        "id": "uuid-user-123",
        "name": "Admin Utama",
        "email": "admin@sekolah.com",
        "school_id": "uuid-school-456",
        "is_admin": true
      }
    }
  }
  ```

**Note:** `school_id` akan `null` jika user belum melengkapi data sekolah (Step 2). Frontend harus cek field ini dan redirect ke school registration jika null.

### 1.4. Forgot Password

Request a password reset link.

- **Endpoint**: `POST /auth/forgot-password`
- **Payload**:
  ```json
  {
    "email": "admin@sekolah.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset link sent to email"
  }
  ```

### 1.5. Verify Reset Token

Check if the reset token is valid.

- **Endpoint**: `GET /auth/reset-password`
- **Query Params**:
  - `token`: The reset token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Token valid"
  }
  ```
- **Response (401 Unauthorized):**
  ```json
  {
    "success": false,
    "message": "Token invalid or expired"
  }
  ```

### 1.6. Reset Password

Reset password using the token sent to email.

- **Endpoint**: `POST /auth/reset-password`
- **Payload**:
  ```json
  {
    "token": "reset-token-xyz",
    "password": "newsecurepassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully"
  }
  ```

---

## 2. User Management (Admin)

### List Users

`GET /users`
_Requirement: List daftar admin sekolah_

**Query Params:**

- `page`: 1
- `limit`: 10
- `search`: "Admin Name" (Optional)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-user-123",
      "name": "Admin Utama",
      "email": "admin@sekolah.com",
      "is_active": true,
      "is_super_admin": true, // Determines edit/delete access
      "role": "Super Admin"
    },
    {
       "id": "uuid-user-456",
       "name": "Staff TU",
       "email": "tu@sekolah.com",
       "is_active": true,
       "is_super_admin": false,
       "role": "Admin"
    }
  ],
  "meta": { ... }
}
```

### Create User

`POST /users`

**Payload:**

```json
{
  "name": "Staff Tata Usaha",
  "email": "staff@sekolah.com",
  "password": "password123"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User created successfully"
}
```

### Update User

`PUT /users/:id`

**Payload:**

```json
{
  "name": "Staff Tata Usaha Updated",
  "email": "staff_new@sekolah.com", // Optional
  "is_active": false // Optional (suspend user)
}
```

### Delete User

`DELETE /users/:id`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 3. Sekolah (School Identity)

### Get School Details

`GET /school`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-school-456",
    "name": "SMA Negeri 1 Jakarta",
    "code": "SMAN1JKT",
    "address": "Jl. Pendidikan No. 1",
    "logo_url": "https://storage.com/logo.png"
  }
}
```

### Update School Details

`PUT /school`
_Requirement: Admin sekolah pada saat pertama kali register harus melengkapi identitas sekolah_

**Payload:**

```json
{
  "name": "SMA Negeri 1 Jakarta Updated",
  "code": "SMAN1JKT",
  "address": "Jl. Pendidikan No. 1",
  "logo_url": "https://storage.com/new-logo.png" // Optional
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "School identity updated successfully"
}
```

---

## 3. Siswa (Students)

### List Students

`GET /students`
_Requirement: List daftar siswa dengan nominal tagihan belum di bayar dan sudah di bayar_

**Query Params:**

- `page`: 1
- `limit`: 10
- `search`: "John Doe" (Optional - filters by Name or NIS)
- `payment_status`: `lunas` | `belum_lunas` | `all` (Optional)
- `status`: `active` | `inactive` | `all` (Optional - Account Status)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-student-001",
      "nis": "2023001",
      "name": "Budi Santoso",
      "status": "active",
      "summary": {
        "total_paid": 1500000,
        "total_unpaid": 500000
      }
    }
  ],
  "meta": { ... }
}
```

### Create Student (Single)

`POST /students`

**Payload:**

```json
{
  "nis": "2024001",
  "name": "Siswa Baru",
  "status": "active"
}
```

### Bulk Create Students

`POST /students/bulk`

**Payload:**

```json
{
  "students": [
    {"nis": "2024002", "name": "Siswa A"},
    {"nis": "2024003", "name": "Siswa B"}
  ]
}
```

### Get Student Detail & History

`GET /students/:id`
_Requirement: detail siswa beserta history export data per siswa dan all siswa_

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid-student-001",
      "nis": "2023001",
      "name": "Budi Santoso",
      "status": "active",
      "created_at": "2024-01-01T10:00:00Z"
    },
    "history": [
      // Mixed Bills and Payments
      {
        "type": "bill",
        "date": "2024-01-01",
        "description": "SPP Januari 2024",
        "amount": 500000,
        "status": "paid"
      },
      {
        "type": "payment",
        "date": "2024-01-10",
        "description": "Pembayaran SPP Januari",
        "amount": 500000,
        "method": "transfer"
      }
    ]
  }
}
```

---

## 4. Tagihan (Bills)

### List Tagihan (General)

`GET /bills`
_Requirement: admin melihat riwayat, ringkasan, tagihan belum bayar lewat jatuh tempo_

**Query Params:**

- `page`: 1
- `limit`: 10
- `search`: "INV/2024" (Optional - Invoice Code)
- `status`: `paid` | `unpaid` | `overdue` (Optional)
- `student_ids`: `["uuid-1", "uuid-2"]` (Optional: Filter by multiple students)
- `period`: `YYYY-MM` (Optional: Filter by billing period)
- `start_date`, `end_date`: `YYYY-MM-DD` (Optional)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
     {
       "id": "uuid-bill-101",
       "student": { "nis": "2023001", "name": "Budi" },
       "type": "spp", // or 'non_spp'
       "code": "INV/2024/001",
       "amount": 500000,
       "paid_amount": 0,
       "billing_period": "2024-01", // For SPP
       "description": "Uang Gedung", // For Non-SPP
       "due_date": "2024-01-20",
       "status": "pending", // pending, paid, overdue, cancelled
       "is_overdue": false // Computed field
     }
  ],
  "meta": { ... }
}
```

### Create Bill (Single)

`POST /bills`

**Payload:**

```json
{
  "student_id": "uuid-student-001",
  "type": "spp", // spp | non_spp
  "amount": 500000,
  "billing_period": "2024-03", // Required if type is spp
  "description": "Lab Fee", // Required if type is non_spp
  "due_date": "2024-03-20"
}
```

### Upload Bulk Tagihan (SPP)

`POST /bills/upload/spp`
_Requirement: upload tagihan spp bulan dengan required field NIS, Nama siswa, bulan, tagihan, jatuh tempo_

**Payload:**

```json
{
  "data": [
    {
      "nis": "2023001",
      "student_name": "Budi", // Used for validation check
      "billing_period": "2024-02", // YYYY-MM
      "amount": 500000,
      "due_date": "2024-02-20"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Processed 50 bills successfully",
  "data": {
    "total_processed": 50,
    "total_failed": 0,
    "failed_rows": []
  }
}
```

### Upload Tagihan Non-SPP

`POST /bills/upload/non-spp`
_Requirement: upload tagihan dengan nominal khusus / non spp_

**Payload:**

```json
{
  "data": [
    {
      "nis": "2023001",
      "student_name": "Budi",
      "amount": 150000,
      "description": "Uang Buku Paket A",
      "bill_date": "2024-01-15",
      "due_date": "2024-01-30"
    }
  ]
}
```

### Inquiry Tagihan (Public/Parent API)

`GET /inquiry/:nis`
_Requirement: API untuk inquiry berdasarkan NIS dengan menghasilkan info list tagihan dan total tagihan_

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "student": {"nis": "2023001", "name": "Budi"},
    "summary": {
      "total_outstanding": 1000000,
      "overdue_count": 1
    },
    "bills": [
      {
        "id": "uuid-bill-102",
        "description": "SPP Februari 2024",
        "amount": 500000,
        "due_date": "2024-02-20",
        "status": "pending"
      }
    ]
  }
}
```

### Void / Cancel Tagihan

`POST /bills/:id/cancel`
_Requirement: void / cancle tagihan_

**Payload:**

```json
{
  "reason": "Salah input nominal"
}
```

---

## 5. Transactions

### 5.1. List Transactions

Get a paginated list of transactions with extensive filtering.

- **Endpoint**: `GET /transactions`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by TRX Code, Invoice Code, or Student Name/NIS
  - `status`: Transaction status (`success`, `pending`, `failed`)
  - `payment_method`: Payment method (`transfer`, `cash`, `manual`)
  - `student_ids`: Filter by specific students (comma-separated UUIDs)
  - `start_date`: Filter start date (YYYY-MM-DD)
  - `end_date`: Filter end date (YYYY-MM-DD)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "code": "TRX/2024/0001",
        "date": "2024-03-20T10:00:00Z",
        "amount": 500000,
        "payment_method": "transfer",
        "status": "success",
        "description": "Pembayaran SPP Maret",
        "student": {
          "id": "uuid",
          "name": "Budi Santoso",
          "nis": "2024001"
        },
        "bill_code": "INV/2024/0001"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
  ```

### 5.2. Export Transactions

Download transactions report as Excel/CSV.

- **Endpoint**: `GET /transactions/export`
- **Query Parameters**: Same as List Transactions.
- **Response**: Blob/File download.

---

## 6. Dashboard

### 6.1. Get Dashboard Stats

Get aggregated statistics for the dashboard.

- **Endpoint**: `GET /dashboard/stats`
- **Query Parameters**:
  - `period`: Filter period (format: YYYY-MM)
- **Response**:
  ```json
  {
    "total_active_students": 450,
    "all_time": {
      "total_paid": 1500000000,
      "total_unpaid": 50000000
    },
    "period": {
      "unpaid": {
        "amount": 15000000,
        "student_count": 30
      },
      "paid": {
        "amount": 75000000,
        "student_count": 420
      },
      "expected_total": 90000000
    }
  }
  ```
