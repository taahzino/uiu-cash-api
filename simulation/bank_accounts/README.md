# Bank Accounts Simulation

This module simulates bank accounts for testing UIU Cash transactions that interact with external bank accounts.

## Overview

- **20 dummy bank accounts** with realistic Bangladeshi bank details
- **File-based storage** using JSON for persistence
- **Complete CRUD operations** for bank account management
- **Transaction support** for ADD_MONEY and BANK_TRANSFER operations

## Data Structure

Each bank account contains:
- `id`: Unique identifier (BNK00001 - BNK00020)
- `account_number`: 16-digit account number
- `account_holder_name`: Account owner's name
- `bank_name`: Bangladeshi bank name
- `branch_name`: Branch location
- `account_type`: SAVINGS or CURRENT
- `balance`: Available balance in BDT
- `pin`: 4-digit PIN for authentication
- `routing_number`: Bangladesh bank routing number
- `status`: ACTIVE or INACTIVE
- `created_at`: Account creation timestamp

## Usage Examples

### 1. Import the module

```javascript
const bankAccounts = require('./simulation/bank_accounts');
```

### 2. Verify Account (for ADD_MONEY)

```javascript
// User wants to add money from their bank account
const result = bankAccounts.verifyAccount('1234567890123456', '1234');

if (result.success) {
  console.log('Account verified:', result.account);
  // Proceed with transaction
} else {
  console.log('Verification failed:', result.message);
}
```

### 3. Check Balance Before Deduction

```javascript
const balanceCheck = bankAccounts.checkBalance('1234567890123456', 5000);

if (balanceCheck.success) {
  console.log('Sufficient balance:', balanceCheck.available_balance);
} else {
  console.log('Insufficient funds:', balanceCheck.message);
  console.log('Shortfall:', balanceCheck.shortfall);
}
```

### 4. Deduct from Bank Account (ADD_MONEY Transaction)

```javascript
// When user adds money to UIU Cash wallet from bank account
const deduction = bankAccounts.deductFromAccount(
  '1234567890123456', // account number
  '1234',             // PIN
  5000                // amount to deduct
);

if (deduction.success) {
  console.log('Amount deducted:', deduction.transaction);
  // Now credit to UIU Cash wallet
} else {
  console.log('Deduction failed:', deduction.message);
}
```

### 5. Add to Bank Account (BANK_TRANSFER Transaction)

```javascript
// When agent transfers money to user's bank account
const credit = bankAccounts.addToAccount(
  '1234567890123456', // account number
  10000               // amount to credit
);

if (credit.success) {
  console.log('Amount credited:', credit.transaction);
  // Transaction successful
} else {
  console.log('Credit failed:', credit.message);
}
```

### 6. Get Account Details

```javascript
// Find by account number
const account = bankAccounts.findByAccountNumber('1234567890123456');

// Find by ID
const accountById = bankAccounts.findById('BNK00001');

// Get balance only
const balance = bankAccounts.getBalance('1234567890123456');
```

### 7. Validation

```javascript
// Validate account number format (16 digits)
const isValid = bankAccounts.isValidAccountNumber('1234567890123456');

// Validate PIN format (4 digits)
const isPinValid = bankAccounts.isValidPin('1234');
```

## Sample Test Accounts

| Account Number     | Name            | Bank Name           | PIN  | Balance    |
|--------------------|-----------------|---------------------|------|------------|
| 1234567890123456   | Ahmed Hassan    | Sonali Bank         | 1234 | ৳125,000   |
| 2345678901234567   | Fatima Rahman   | Dutch Bangla Bank   | 5678 | ৳450,000   |
| 3456789012345678   | Mohammad Ali    | Brac Bank           | 9012 | ৳89,500    |
| 4567890123456789   | Nusrat Jahan    | Eastern Bank        | 3456 | ৳215,000   |
| 5678901234567890   | Kamal Hossain   | Islami Bank         | 7890 | ৳567,000   |

*(See data.json for complete list of 20 accounts)*

## Integration with UIU Cash

### ADD_MONEY Flow

1. User provides bank account number and PIN
2. Validate credentials using `verifyAccount()`
3. Check sufficient balance using `checkBalance()`
4. Deduct from bank account using `deductFromAccount()`
5. Credit to UIU Cash wallet
6. Create transaction record

### BANK_TRANSFER Flow

1. Agent initiates bank transfer
2. Validate target account using `findByAccountNumber()`
3. Check agent has sufficient balance in UIU Cash
4. Deduct from agent's UIU Cash wallet
5. Credit to bank account using `addToAccount()`
6. Create transaction record

## Error Handling

All functions return objects with:
- `success`: Boolean indicating operation status
- `message`: Descriptive message
- `data`: Relevant data (account, transaction, etc.)

Always check `success` before proceeding:

```javascript
const result = bankAccounts.deductFromAccount(accountNumber, pin, amount);

if (!result.success) {
  // Handle error
  return res.status(400).json({ error: result.message });
}

// Proceed with success case
```

## Important Notes

- **PIN Security**: In production, PINs should be hashed, not stored in plain text
- **File Persistence**: This uses JSON file storage for simplicity. In production, use a proper database
- **Thread Safety**: File operations are synchronous. Consider using locks for concurrent access
- **Balance Updates**: Updates are immediately persisted to data.json
- **All amounts in BDT**: Bangladesh Taka currency

## Testing

You can test the module directly:

```javascript
// Test deduction
const bankAccounts = require('./simulation/bank_accounts');

console.log('Testing bank account deduction...');
const result = bankAccounts.deductFromAccount('1234567890123456', '1234', 1000);
console.log(result);

// Test credit
console.log('\nTesting bank account credit...');
const credit = bankAccounts.addToAccount('1234567890123456', 500);
console.log(credit);

// View all accounts
console.log('\nAll accounts:');
console.log(bankAccounts.getAllAccounts());
```

## Future Enhancements

- [ ] Add transaction history logging
- [ ] Implement daily transaction limits
- [ ] Add account locking after failed PIN attempts
- [ ] Add OTP verification for large transactions
- [ ] Implement inter-bank transfer delays
- [ ] Add webhook notifications for transactions
