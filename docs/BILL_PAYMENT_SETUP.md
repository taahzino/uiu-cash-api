# Bill Payment System - Setup Guide

## Overview

The Bill Payment System allows consumers to pay utility bills for electricity, gas, water, internet, mobile, and TV services through UIU Cash.

## Features

✅ **Consumer Bill Payments** - Pay bills with zero fees  
✅ **Admin Biller Management** - Full CRUD operations for billers  
✅ **15 Default Billers** - Pre-seeded with major service providers  
✅ **Receipt Generation** - Automatic receipt numbers for completed payments  
✅ **Status Tracking** - Real-time payment status updates

## Setup

### 1. Initialize Database Tables

The Billers and BillPayments tables are automatically created when you run the application.

### 2. Seed Default Billers

Run the seed script to populate the database with 15 default billers:

```bash
bun run seed:billers
```

**Default Billers Include:**

- **Electricity:** DESCO, DPDC, WZPDCL
- **Gas:** Titas Gas, Jalalabad Gas
- **Water:** DWASA, Chittagong WASA
- **Mobile:** Grameenphone, Robi, Banglalink, Teletalk
- **Internet:** BTCL, Link3, Aamra Networks
- **TV:** Akash Digital, Tata Sky

### 3. Admin Access Required

You need an admin account to manage billers. The seed script will fail if no admin exists.

## API Endpoints

### Consumer Endpoints

**Get Billers**

```http
GET /api/transactions/billers
Authorization: Bearer <consumer_token>
```

**Pay Bill**

```http
POST /api/transactions/pay-bill
Authorization: Bearer <consumer_token>
Content-Type: application/json

{
  "billerId": "BILLER01",
  "accountNumber": "1234567890",
  "amount": 850,
  "billingMonth": "January",
  "billingYear": 2026
}
```

**Get Bill Payment History**

```http
GET /api/transactions/bill-payments?page=1&limit=10
Authorization: Bearer <consumer_token>
```

### Admin Endpoints

**Create Biller**

```http
POST /api/admin/billers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Biller",
  "billerCode": "NEW-BILL",
  "billType": "ELECTRICITY",
  "contactEmail": "info@newbiller.com",
  "contactPhone": "01712345678"
}
```

**Get All Billers**

```http
GET /api/admin/billers?page=1&limit=20&status=ACTIVE
Authorization: Bearer <admin_token>
```

**Update Biller**

```http
PUT /api/admin/billers/:id
Authorization: Bearer <admin_token>
```

**Update Biller Status**

```http
PATCH /api/admin/billers/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "SUSPENDED"
}
```

**Delete Biller**

```http
DELETE /api/admin/billers/:id
Authorization: Bearer <admin_token>
```

## Features

### Zero Fees

All bill payments have **zero transaction fees**. Consumers pay the exact bill amount.

### Instant Completion

Bill payments are marked as **COMPLETED** immediately after validation.

### Biller Status Management

- **ACTIVE** - Accepting payments
- **SUSPENDED** - Temporarily disabled
- **INACTIVE** - Permanently disabled

### Payment Validation

- Amount: ৳10 - ৳100,000
- Account number: 5-50 characters
- Daily/monthly spending limits apply
- Biller must be ACTIVE

### Receipt Numbers

Automatic receipt number generation in format: `RCP-YYYYMM-XXXXX`

## Database Schema

### billers

```sql
- id: CHAR(8)
- name: VARCHAR(255)
- biller_code: VARCHAR(50) UNIQUE
- bill_type: ENUM(ELECTRICITY, GAS, WATER, INTERNET, MOBILE, TV)
- balance: DECIMAL(15,2)
- total_payments: INT
- status: ENUM(ACTIVE, SUSPENDED, INACTIVE)
- contact_email, contact_phone, description, logo_url
```

### bill_payments

```sql
- id: CHAR(8)
- transaction_id: CHAR(8)
- biller_id: CHAR(8)
- user_id: CHAR(8)
- account_number: VARCHAR(50)
- amount: DECIMAL(15,2)
- fee: DECIMAL(15,2) - Always 0
- status: ENUM(PENDING, PROCESSING, COMPLETED, FAILED)
- billing_month, billing_year
- receipt_number: VARCHAR(50)
```

## Transaction Flow

1. Consumer selects biller and enters account details
2. System validates:
   - Biller is ACTIVE
   - Sufficient wallet balance
   - Within daily/monthly limits
3. Creates BILL_PAYMENT transaction (fee = 0)
4. Deducts amount from consumer wallet
5. Creates ledger DEBIT entry
6. Credits amount to biller balance
7. Generates receipt number
8. Marks transaction as COMPLETED
9. Returns transaction details

## Testing

### Test Bill Payment

```bash
# Get billers
curl -X GET http://localhost:5000/api/transactions/billers \
  -H "Authorization: Bearer <consumer_token>"

# Pay bill
curl -X POST http://localhost:5000/api/transactions/pay-bill \
  -H "Authorization: Bearer <consumer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "billerId": "BILLER01",
    "accountNumber": "1234567890",
    "amount": 850
  }'
```

### Test Admin Operations

```bash
# Create biller
curl -X POST http://localhost:5000/api/admin/billers \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Biller",
    "billerCode": "TEST-BILL",
    "billType": "ELECTRICITY"
  }'

# List all billers
curl -X GET http://localhost:5000/api/admin/billers \
  -H "Authorization: Bearer <admin_token>"
```

## Troubleshooting

### Seed Script Fails

**Error:** "No admin found"
**Solution:** Create an admin account first using the admin registration endpoint

### Payment Fails

**Error:** "Biller not accepting payments"
**Solution:** Check biller status is ACTIVE in admin panel

### Cannot Delete Biller

**Error:** "Cannot delete biller with existing payment records"
**Solution:** Use status update to SUSPENDED or INACTIVE instead

## Notes

- **Consumer Only:** Bill payments are restricted to consumer accounts
- **No Fees:** Zero transaction fees for all bill payments
- **Instant Processing:** All payments completed immediately
- **Receipt Tracking:** Every completed payment gets a unique receipt number
- **Admin Management:** Full CRUD operations available for admins
- **Audit Trail:** Complete ledger entries for all transactions

## Related Documentation

- [API Documentation](../api/api_doc.md) - Complete API reference
- [TASKS.md](TASKS.md) - Phase 6 implementation status
- [SOP.md](SOP.md) - Technical specifications

---

**Phase 6: Bill Payment System - ✅ 100% Complete**

All 6 tasks completed:

- ✅ Task 6.1: Billers Table and Model
- ✅ Task 6.2: Seed Default Billers
- ✅ Task 6.3: Get Billers API
- ✅ Task 6.4: Bill Payment API
- ✅ Task 6.5: Bill Payments Records Table
- ✅ Task 6.6: No-Fee Bill Payment Logic + Admin Management
