# Backend Authentication API

## Setup

### 1. Install Dependencies

Dependencies already installed:

- `kysely` - Type-safe SQL query builder
- `pg` - PostgreSQL client
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation
- `zod` - Request validation
- `winston` - Logging
- `uuid` - UUID generation

### 2. Environment Variables

Create `.env.local` file (or add to existing):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/school_payment
JWT_SECRET=your-super-secret-key-min-32-characters-for-security
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
NODE_ENV=development
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

### 3. Database Setup

Make sure PostgreSQL is running, then run migrations:

```bash
# Set DATABASE_URL in .env.local first
pnpm migrate:up
```

To rollback migrations:

```bash
pnpm migrate:down
```

### 4. Start Development Server

```bash
pnpm dev
```

Server will start at `http://localhost:3555`

---

## API Endpoints

All endpoints return JSON with standard format:

**Success:**

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_CODE"
}
```

### POST /api/v1/auth/register

Register a new user account.

**Request:**

```json
{
  "name": "Admin Name",
  "email": "admin@school.com",
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "name": "Admin Name",
      "email": "admin@school.com",
      "isAdmin": true
    }
  }
}
```

### POST /api/v1/auth/login

Authenticate user and get JWT token.

**Request:**

```json
{
  "email": "admin@school.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "name": "Admin Name",
      "email": "admin@school.com",
      "isAdmin": true
    }
  }
}
```

**Error (401):**

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error_code": "UNAUTHORIZED"
}
```

### POST /api/v1/auth/forgot-password

Request password reset link.

**Request:**

```json
{
  "email": "admin@school.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

**Note:** In development, the reset link is printed to console. In production, implement email sending.

### POST /api/v1/auth/reset-password

Reset password using token from forgot-password.

**Request:**

```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

---

## Architecture

### Folder Structure

```
src/
├── lib/                    # Backend utilities
│   ├── db/                 # Database
│   │   ├── kysely.ts       # Kysely client singleton
│   │   └── types.ts        # Database TypeScript types
│   ├── auth/               # Auth utilities
│   │   ├── jwt.ts          # JWT generation/verification
│   │   ├── password.ts     # Password hashing
│   │   └── middleware.ts   # Auth middleware
│   ├── errors/             # Error handling
│   │   ├── AppError.ts     # Custom error classes
│   │   └── errorHandler.ts # Error response formatter
│   ├── logger/             # Logging
│   │   └── index.ts        # Winston logger setup
│   ├── validation/         # Request validation
│   │   └── schemas.ts      # Zod schemas
│   └── utils/
│       ├── apiHandler.ts   # API wrapper (logging + errors)
│       └── response.ts     # Response helpers
│
├── modules/                # Business logic
│   └── auth/
│       ├── auth.service.ts # Auth business logic
│       └── auth.types.ts   # TypeScript types
│
└── pages/api/v1/          # API routes
    └── auth/
        ├── register.ts     # POST /api/v1/auth/register
        ├── login.ts        # POST /api/v1/auth/login
        ├── forgot-password.ts
        └── reset-password.ts
```

### Key Features

✅ **No Try-Catch Hell:** `apiHandler` wrapper automatically catches errors
✅ **Structured Logging:** Winston logger with `====== /api/... ======` markers
✅ **Type Safety:** Kysely provides full TypeScript support for queries
✅ **Validation:** Zod schemas for request validation
✅ **Clean Error Handling:** Custom error classes map to HTTP status codes
✅ **JWT Authentication:** Secure token-based auth
✅ **Password Security:** Bcrypt hashing with salt rounds

### Example: Creating an API Route

```typescript
import {apiHandler, methodNotAllowed} from "@/lib/utils/apiHandler";
import {validateRequest, someSchema} from "@/lib/validation/schemas";
import {someService} from "@/modules/some/some.service";

export default apiHandler(async (req, res, requestId) => {
  // Check HTTP method
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  // Validate request (throws ValidationError if fails)
  const data = validateRequest(someSchema, req.body);

  // Call service (can throw custom errors)
  const result = await someService.doSomething(data);

  // Return success response
  res.status(200).json({
    success: true,
    data: result,
  });
});
```

**No try-catch needed!** The `apiHandler` wrapper:

1. Generates unique `requestId`
2. Logs request start: `====== POST /api/... ======`
3. Calls your handler
4. If error is thrown, formats it and sends error response
5. Logs request end: `====== END POST /api/... ======`

---

## Testing

### Manual Testing with curl

**Register:**

```bash
curl -X POST http://localhost:3555/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"test@school.com","password":"password123"}'
```

**Login:**

```bash
curl -X POST http://localhost:3555/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.com","password":"password123"}'
```

**Forgot Password:**

```bash
curl -X POST http://localhost:3555/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.com"}'
```

Check console output for reset link, then:

**Reset Password:**

```bash
curl -X POST http://localhost:3555/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_CONSOLE","password":"newpassword123"}'
```

### Check Logs

Logs are written to:

- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console (with colors)

Example log format:

```
[2024-12-11 23:30:15.123] [INFO] ====== POST /api/v1/auth/login ======
[2024-12-11 23:30:15.456] [INFO] Response: 200 (333ms)
[2024-12-11 23:30:15.457] [INFO] ====== END POST /api/v1/auth/login ======
```

---

## Next Steps

1. **Setup PostgreSQL Database**

   - Create database: `createdb school_payment`
   - Update `DATABASE_URL` in `.env.local`
   - Run migrations: `pnpm migrate:up`

2. **Test API Endpoints**

   - Use curl commands above
   - Or use Postman/Insomnia
   - Check logs in `logs/` folder

3. **Update Frontend**

   - Modify `src/services/auth.service.ts`
   - Point to real API endpoints
   - Handle JWT token storage

4. **Future Enhancements**
   - Implement email service for forgot-password
   - Add refresh token mechanism
   - Implement rate limiting
   - Add integration tests

---

## Troubleshooting

**Database connection error:**

- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env.local`
- Ensure database exists

**JWT secret warning:**

- Set `JWT_SECRET` in`.env.local`
- Use minimum 32 characters

**Migration errors:**

- Make sure migration hasn't been run already
- Use `pnpm migrate:down` to rollback
- Check `psql` is available in PATH

**Import errors:**

- Make sure all dependencies installed: `pnpm install`
- Check TypeScript paths in `tsconfig.json`
