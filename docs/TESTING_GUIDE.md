# Testing Guide - UIU Cash

## Test Cards for Add Money Feature

The add money feature uses debit/credit cards linked to simulated bank accounts in `/simulation/bank_accounts/data.json`.

### Available Test Cards

| Card Number | Card Type | CVV | Expiry | Card Holder | Bank | Balance |
|------------|-----------|-----|--------|-------------|------|---------|
| 4111111111111111 | VISA | 123 | 12/28 | Ahmed Hassan | Sonali Bank | ৳125,000 |
| 5500000000000004 | MASTERCARD | 456 | 06/29 | Fatima Rahman | Dutch Bangla Bank | ৳440,000 |
| 4222222222222220 | VISA | 789 | 09/27 | Mohammad Ali | Brac Bank | ৳89,500 |
| 5105105105105100 | MASTERCARD | 234 | 03/30 | Nusrat Jahan | Eastern Bank | ৳215,000 |
| 4012888888881881 | VISA | 567 | 11/28 | Kamal Hossain | Islami Bank | ৳567,000 |
| 5555555555554444 | MASTERCARD | 890 | 08/29 | Sabrina Khan | City Bank | ৳78,500 |
| 4917484589897107 | VISA | 321 | 05/28 | Rahim Uddin | Prime Bank | ৳340,000 |
| 5425233430109903 | MASTERCARD | 654 | 10/27 | Ayesha Siddique | Standard Chartered | ৳892,000 |

*See `/simulation/bank_accounts/data.json` for complete list of 20 test cards*

---

## Testing Add Money Feature

### Test Case 1: Successful Add Money

**Request**:
```bash
POST /api/transactions/add-money
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "amount": 1000,
  "cardNumber": "4111111111111111",
  "cvv": "123",
  "expiryMonth": "12",
  "expiryYear": "28",
  "cardHolderName": "Ahmed Hassan"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Money added successfully",
  "data": {
    "transaction": {
      "id": "uuid",
      "transactionId": "TRX20260114001",
      "amount": 1000,
      "fee": 0,
      "type": "ADD_MONEY",
      "status": "COMPLETED"
    },
    "card": {
      "cardType": "VISA",
      "cardNumber": "****-****-****-1111",
      "cardHolder": "Ahmed Hassan",
      "bankName": "Sonali Bank"
    },
    "bankAccount": {
      "oldBalance": 125000,
      "newBalance": 124000
    },
    "wallet": {
      "balance": "<previous + 1000>",
      "availableBalance": "<previous + 1000>"
    }
  }
}
```

**What Happens**:
1. ✅ Validates authentication token
2. ✅ Validates user is ACTIVE
3. ✅ Verifies card exists in simulation
4. ✅ Validates CVV (123) matches
5. ✅ Validates expiry date (12/28) matches and not expired
6. ✅ Checks linked bank account has ৳1000 available
7. ✅ Debits ৳1000 from bank account (125000 → 124000)
8. ✅ Credits ৳1000 to UIU Cash wallet
9. ✅ Creates transaction record
10. ✅ Creates ledger entry (CREDIT)

---

### Test Case 2: Invalid CVV

**Request**:
```json
{
  "amount": 500,
  "cardNumber": "4111111111111111",
  "cvv": "999",
  "expiryMonth": "12",
  "expiryYear": "28"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Invalid CVV"
}
```

---

### Test Case 3: Card Expired

**Request**:
```json
{
  "amount": 1000,
  "cardNumber": "4111111111111111",
  "cvv": "123",
  "expiryMonth": "01",
  "expiryYear": "25"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Card has expired"
}
```

---

### Test Case 4: Insufficient Bank Balance

**Request**:
```json
{
  "amount": 100000,
  "cardNumber": "4222222222222220",
  "cvv": "789",
  "expiryMonth": "09",
  "expiryYear": "27"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Insufficient balance"
}
```

**Note**: Brac Bank account only has ৳89,500

---

### Test Case 5: Card Not Found

**Request**:
```json
{
  "amount": 1000,
  "cardNumber": "9999999999999999",
  "cvv": "123",
  "expiryMonth": "12",
  "expiryYear": "28"
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Card not found"
}
```

---

### Test Case 6: Amount Out of Range

**Request**:
```json
{
  "amount": 30000,
  "cardNumber": "4111111111111111",
  "cvv": "123",
  "expiryMonth": "12",
  "expiryYear": "28"
}
```

**Expected Response** (422):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "Maximum add money amount is ৳25,000"
    }
  ]
}
```

---

### Test Case 7: Invalid Card Number Format

**Request**:
```json
{
  "amount": 1000,
  "cardNumber": "411111",
  "cvv": "123",
  "expiryMonth": "12",
  "expiryYear": "28"
}
```

**Expected Response** (422):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "cardNumber",
      "message": "Card number must be 16 digits"
    }
  ]
}
```

---

## Testing Send Money Feature

### Test Case 1: Successful Send Money

**Prerequisites**:
- Two active user accounts with wallets
- Sender has sufficient balance (amount + ৳5 fee)

**Request**:
```bash
POST /api/transactions/send-money
Authorization: Bearer <sender-jwt-token>
Content-Type: application/json

{
  "recipientIdentifier": "recipient@example.com",
  "amount": 500,
  "description": "Payment for services"
}
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Money sent successfully",
  "data": {
    "transaction": {
      "transactionId": "TRX20260114002",
      "amount": 500,
      "fee": 5,
      "totalAmount": 505,
      "type": "SEND_MONEY",
      "status": "COMPLETED"
    },
    "recipient": {
      "name": "Jane Smith",
      "phone": "+8801712345679"
    },
    "wallet": {
      "balance": "<previous - 505>",
      "availableBalance": "<previous - 505>"
    }
  }
}
```

**What Happens**:
1. ✅ Sender debited: ৳505 (৳500 + ৳5 fee)
2. ✅ Recipient credited: ৳500
3. ✅ Platform wallet receives: ৳5 fee
4. ✅ Daily spending incremented: ৳505
5. ✅ Double-entry ledger: DEBIT (sender) + CREDIT (recipient)

---

### Test Case 2: Insufficient Balance

**Request**:
```json
{
  "recipientIdentifier": "recipient@example.com",
  "amount": 50000
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Insufficient balance to complete the transaction"
}
```

---

### Test Case 3: Recipient Not Found

**Request**:
```json
{
  "recipientIdentifier": "nonexistent@example.com",
  "amount": 100
}
```

**Expected Response** (404):
```json
{
  "success": false,
  "message": "Recipient not found"
}
```

---

### Test Case 4: Daily Limit Exceeded

**Request**:
```json
{
  "recipientIdentifier": "recipient@example.com",
  "amount": 25000
}
```

**Expected Response** (400):
```json
{
  "success": false,
  "message": "Daily spending limit exceeded. Limit: ৳50,000, Spent today: ৳30,000"
}
```

---

## Testing Transaction History

### Test Case: Get Filtered History

**Request**:
```bash
GET /api/transactions/history?page=1&limit=20&type=SEND_MONEY&status=COMPLETED
Authorization: Bearer <jwt-token>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Transaction history retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "transaction_id": "TRX20260114001",
        "type": "SEND_MONEY",
        "amount": 500,
        "fee": 5,
        "status": "COMPLETED",
        "created_at": "2026-01-14T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

## Testing Transaction Details

### Test Case: Get Transaction Details

**Request**:
```bash
GET /api/transactions/TRX20260114001
Authorization: Bearer <jwt-token>
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Transaction details retrieved successfully",
  "data": {
    "id": "uuid",
    "transaction_id": "TRX20260114001",
    "type": "SEND_MONEY",
    "amount": 500,
    "fee": 5,
    "status": "COMPLETED",
    "sender": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "receiver": {
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

---

## System Configuration

### Current Fee Structure

| Config Key | Value | Description |
|-----------|-------|-------------|
| send_money_fee | ৳5.00 | Flat fee for P2P transfers |
| agent_commission_rate | 1.5% | Agent commission percentage |
| onboarding_bonus | ৳50.00 | Bonus for new CONSUMER users |

### Transaction Limits

| Limit Type | Value |
|-----------|-------|
| Add Money (Min) | ৳50 |
| Add Money (Max) | ৳25,000 |
| Send Money (Min) | ৳10 |
| Send Money (Max) | ৳25,000 |
| Daily Spending | ৳50,000 |
| Monthly Spending | ৳200,000 |

---

## Quick Test Workflow

### 1. Setup (First Time)

```bash
# Initialize database
bun run init-db

# Start server
bun run dev
```

### 2. Register User

```bash
POST /api/auth/register
{
  "email": "test@example.com",
  "phone": "+8801712345678",
  "password": "Test1234!",
  "firstName": "Test",
  "lastName": "User",
  "dateOfBirth": "1995-01-15",
  "role": "CONSUMER"
}
```

### 3. Login

```bash
POST /api/auth/login
{
  "identifier": "test@example.com",
  "password": "Test1234!"
}
```

**Save the JWT token from response**

### 4. Add Money

```bash
POST /api/transactions/add-money
Authorization: Bearer <token>
{
  "amount": 5000,
  "cardNumber": "4111111111111111",
  "cvv": "123",
  "expiryMonth": "12",
  "expiryYear": "28",
  "cardHolderName": "Ahmed Hassan"
}
```

### 5. Send Money

```bash
POST /api/transactions/send-money
Authorization: Bearer <token>
{
  "recipientIdentifier": "recipient@example.com",
  "amount": 500,
  "description": "Test payment"
}
```

### 6. View History

```bash
GET /api/transactions/history?page=1&limit=10
Authorization: Bearer <token>
```

---

## Verification Checklist

After each transaction, verify:

- ✅ Bank account balance updated (for add money)
- ✅ Wallet balance updated correctly
- ✅ Transaction record created with correct status
- ✅ Ledger entries created (DEBIT/CREDIT)
- ✅ Daily/monthly spending tracked (for send money)
- ✅ Platform wallet receives fees (for send money)
- ✅ Response includes all required fields
- ✅ Proper error handling for edge cases

---

## Common Issues & Solutions

### Issue: "Card not found"
**Solution**: Check card number in `/simulation/bank_accounts/data.json`

### Issue: "Invalid CVV"
**Solution**: Verify CVV matches the card in data.json

### Issue: "Card has expired"
**Solution**: Use a card with future expiry date

### Issue: "Insufficient balance"
**Solution**: Check bank account balance in simulation or user wallet balance

### Issue: "Daily spending limit exceeded"
**Solution**: Wait for daily reset or test with smaller amounts

### Issue: "Recipient not found"
**Solution**: Ensure recipient is registered and use correct email/phone

---

## Bank Account Simulation Management

### View Card and Bank Details

```javascript
const bankAccounts = require('./simulation/bank_accounts');
const account = bankAccounts.findByCardNumber('4111111111111111');
console.log(account);
```

### Reset Bank Account Balance

Edit `/simulation/bank_accounts/data.json` directly:

```json
{
  "id": "BNK00001",
  "balance": 125000,
  "card": {
    "card_number": "4111111111111111",
    "card_cvv": "123",
    "card_expiry": "12/28"
  }
}
```

---

## Card Types and Networks

### VISA Cards (starting with 4)
- 4111111111111111 - Sonali Bank
- 4222222222222220 - Brac Bank
- 4012888888881881 - Islami Bank
- 4917484589897107 - Prime Bank
- 4532015112830366 - HSBC Bangladesh

### MASTERCARD Cards (starting with 5)
- 5500000000000004 - Dutch Bangla Bank
- 5105105105105100 - Eastern Bank
- 5555555555554444 - City Bank
- 5425233430109903 - Standard Chartered Bank
- 5425233430109911 - Mutual Trust Bank

---

## Notes

- All test cards have ACTIVE status
- Bank simulation persists data to JSON file
- Daily/monthly limits reset automatically (implementation pending)
- Transaction IDs are auto-generated with format: TRX + YYYYMMDD + counter
- All amounts are in BDT (৳)
- Timestamps are in UTC (ISO 8601 format)
- Card expiry format: MM/YY (e.g., 12/28 means December 2028)
- CVV is always 3 digits
