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
- `status`: `paid` | `pending` | `overdue` (Optional)
- `student_ids`: `["uuid-1", "uuid-2"]` (Optional: Filter by multiple students)
- `period`: `YYYY-MM` (Optional: Filter by billing period)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-bill-101",
      "student": {"id": "sid-1", "nis": "2023001", "name": "Budi"},
      "type": "spp", // or 'non_spp'
      "code": "INV/2024/0001",
      "amount": 500000,
      "paid_amount": 0,
      "billing_period": "2024-01",
      "description": null,
      "due_date": "2024-01-20",
      "status": "pending",
      "is_overdue": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {"page": 1, "limit": 10, "total": 100}
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

### Upload Bulk Tagihan

`POST /bills/bulk`
_Requirement: Upload banyak tagihan sekaligus (Mixed SPP & Non-SPP supported via payload structure)_

**Payload:**

```json
{
  "data": [
    {
      "nis": "2023001",
      "type": "spp",
      "billing_period": "2024-02",
      "amount": 500000,
      "due_date": "2024-02-20"
    },
    {
      "nis": "2023002",
      "type": "non_spp",
      "description": "Uang Buku",
      "amount": 150000,
      "due_date": "2024-02-20"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Berhasil import 50 tagihan"
}
```

---

## 5. Transactions

### 5.1. List Transactions

Get a paginated list of transactions (payments) with filtering capabilities.

- **Endpoint**: `GET /transactions`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by TRX Code, Bill/Invoice Code, Student Name, or NIS
  - `status`: Transaction status (Always `success` for history)
  - `payment_method`: String any
  - `student_ids`: Filter by specific students (UUIDs)
  - `start_date`: Filter by date range start (YYYY-MM-DD or YYYY/MM/DD)
  - `end_date`: Filter by date range end
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "code": "TRX-12345678",
        "date": "2024-03-20T10:00:00.000Z",
        "amount": 500000,
        "payment_method": "transfer",
        "status": "success",
        "bill_code": "INV/2024/0001",
        "description": "Pembayaran SPP",
        "student": {
          "id": "uuid-student",
          "nis": "2024001",
          "name": "Budi Santoso"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50
    }
  }
  ```

### 5.2. Export Transactions

Download full transaction report as CSV.

- **Endpoint**: `GET /transactions/export`
- **Query Parameters**: Same as List Transactions.
- **Response**: CSV File download.

---

## 7. Integration API (External Systems)

API endpoints designed for integration with payment gateways or external systems (e.g., WhatsApp bot, Payment Terminal).

### 7.1. Create Inquiry (Cek Tagihan)

Create a new inquiry session for pending bills. This will **invalidate/expire** any previous pending inquiries for this student.

- **Endpoint**: `POST /external/inquiry`
- **Payload**:
  ```json
  {
    "nis": "2024001"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "inquiry_code": "INQ-20240320-ABCD",
      "student": {
        "nis": "2024001",
        "name": "Budi Santoso",
        "school_id": "uuid-school"
      },
      "total_amount": 1000000,
      "status": "pending",
      "expired_at": "2024-03-21T10:00:00.000Z",
      "created_at": "2024-03-20T10:00:00.000Z",
      "bills": [
        {
          "bill_code": "INV/2024/0001",
          "type": "spp",
          "description": "SPP Maret 2024",
          "amount": 500000,
          "billing_period": "2024-03"
        },
        {
          "bill_code": "INV/2024/0002",
          "type": "non_spp",
          "description": "Uang Buku",
          "amount": 500000,
          "billing_period": null
        }
      ]
    }
  }
  ```

### 7.2. Process Payment

Submit a payment based on Inquiry Code (Preferred) or Bill Code (Single Bill).

- **Endpoint**: `POST /external/payment`
- **Payload (via Inquiry Code - Recommended)**:

  ```json
  {
    "inquiry_code": "INQ-20240320-ABCD",
    "amount": 1000000, // Must match inquiry total
    "payment_method": "transfer",
    "reference_number": "REF123",
    "notes": "Payment via API"
  }
  ```

- **Payload (via Bill Code - Legacy/Single)**:

  ```json
  {
    "bill_code": "INV/2024/0001",
    "amount": 500000,
    "payment_method": "transfer"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Pembayaran berhasil diproses",
    "data": {
      "payment_id": "uuid-payment-or-list",
      "inquiry_code": "INQ-20240320-ABCD",
      "status": "paid"
    }
  }
  ```

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
