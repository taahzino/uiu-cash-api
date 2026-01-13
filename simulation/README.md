# UIU Cash - Simulation Modules

This folder contains simulation-based external systems that replace complex database integrations during development and testing.

## Overview

Instead of connecting to real external systems (banks, platform accounting), we use file-based simulations that provide:
- **Fast Development**: No waiting for external API responses
- **Easy Testing**: Predictable data and full control
- **Cost Effective**: No transaction fees or API charges
- **Offline Work**: No internet connection required

## Simulation Modules

### 1. Bank Accounts (`bank_accounts/`)

**Purpose**: Simulates 20 Bangladeshi bank accounts for testing ADD_MONEY and BANK_TRANSFER transactions.

**Features**:
- 20 realistic bank accounts with unique account numbers
- Multiple banks: Sonali, Dutch Bangla, Brac, HSBC, Standard Chartered, etc.
- Balance tracking and management
- PIN-based authentication
- Routing numbers for each bank

**Initial Data**:
- Account balances: ৳45,000 - ৳892,000
- Account types: SAVINGS, CURRENT
- Status: All ACTIVE

**API Functions**:
- `findByAccountNumber(accountNumber)` - Find account by account number
- `verifyAccount(accountNumber, pin)` - Verify account credentials
- `deductFromAccount(accountNumber, pin, amount)` - Deduct money (for ADD_MONEY)
- `addToAccount(accountNumber, amount)` - Credit money (for BANK_TRANSFER)
- `checkBalance(accountNumber, amount)` - Verify sufficient balance
- `getBalance(accountNumber)` - Get current balance

**Usage Example**:
```javascript
const bankAccounts = require('./simulation/bank_accounts');

// User adding money from bank account
const account = bankAccounts.verifyAccount('1234567890123456', '1234');
if (account && bankAccounts.checkBalance(account.account_number, 5000)) {
  bankAccounts.deductFromAccount(account.account_number, '1234', 5000);
  // Now credit to user's UIU Cash wallet
}

// User transferring money to bank account
const targetAccount = bankAccounts.findByAccountNumber('1234567890123456');
if (targetAccount) {
  bankAccounts.addToAccount(targetAccount.account_number, 3000);
  // Transaction complete
}
```

**Test Accounts**:
| Bank               | Account Number   | PIN  | Balance    |
|--------------------|------------------|------|------------|
| Sonali Bank        | 1234567890123456 | 1234 | ৳450,000   |
| Dutch Bangla Bank  | 2345678901234567 | 2345 | ৳650,000   |
| Brac Bank          | 3456789012345678 | 3456 | ৳320,000   |

See `bank_accounts/README.md` for complete documentation.

---

### 2. Platform Wallet (`platform_wallet/`)

**Purpose**: Manages UIU Cash platform finances including onboarding bonuses, agent commissions, and fee collection.

**Features**:
- Single platform wallet with initial balance of ৳1,000,000 (10 lacs)
- Automatic tracking of revenue, bonuses, and commissions
- Balance validation before operations
- Transaction history and statistics

**Initial Data**:
```json
{
  "platform_wallet": {
    "id": "PLTWLT01",
    "account_name": "UIU Cash Platform",
    "balance": 1000000.00,
    "total_revenue_collected": 0.00,
    "total_bonuses_given": 0.00,
    "total_commissions_paid": 0.00
  }
}
```

**API Functions**:
- `getBalance()` - Get current platform balance
- `hasSufficientBalance(amount)` - Check if sufficient balance exists
- `deductBalance(amount, reason)` - Deduct from platform (e.g., bonuses)
- `creditBalance(amount, reason)` - Credit to platform (e.g., fees)
- `getStatistics()` - Get revenue, bonuses, commissions, net profit

**Usage Example**:
```javascript
const platformWallet = require('./simulation/platform_wallet');

// Give onboarding bonus to new user
if (platformWallet.hasSufficientBalance(50)) {
  platformWallet.deductBalance(50, 'Onboarding Bonus');
  // Credit ৳50 to user wallet
  console.log('Bonus given!');
}

// Collect cash out fee
const feeAmount = (2000 * 1.85) / 100; // ৳37
platformWallet.creditBalance(feeAmount, 'Cash Out Fee Revenue');

// Check platform profitability
const stats = platformWallet.getStatistics();
console.log(`Net Profit: ৳${stats.net_profit}`);
```

**Financial Operations**:
| Operation           | Action       | Amount              |
|---------------------|--------------|---------------------|
| Onboarding Bonus    | Deduct       | ৳50                 |
| Cash Out Fee        | Credit       | 1.10% of transaction|
| Bank Transfer Fee   | Credit       | 1.50% of transaction|
| Send Money Fee      | Credit       | ৳5                  |
| Agent Commission    | Deduct       | 1.50% of transaction|

See `platform_wallet/README.md` for complete documentation.

---

## Integration with Main Application

### Database Initialization

The main database initialization (`src/config/_database.ts`) creates 15 tables:

**Level 1**: users, admins  
**Level 2**: wallets, billers, agents, sessions  
**Level 3**: transactions  
**Level 4**: ledgers, agent_cashouts, bill_payments, bank_transfers  
**Level 5**: offers, user_offers  
**Level 6**: audit_logs, system_config  

Platform finances and external bank accounts are **not** in the database—they're simulated.

### Transaction Flow Examples

#### ADD_MONEY (From Bank to UIU Cash)

1. User provides bank account number and PIN
2. Verify with `bankAccounts.verifyAccount(accountNumber, pin)`
3. Check sufficient balance with `bankAccounts.checkBalance(accountNumber, amount)`
4. Deduct from bank: `bankAccounts.deductFromAccount(accountNumber, pin, amount)`
5. Credit to user's UIU Cash wallet
6. Create transaction record in database

#### BANK_TRANSFER (From UIU Cash to Bank)

1. Deduct from user's UIU Cash wallet
2. Calculate fee (1.50% or ৳10 minimum)
3. Credit fee to platform: `platformWallet.creditBalance(fee, 'Bank Transfer Fee')`
4. Credit to bank account: `bankAccounts.addToAccount(accountNumber, amount - fee)`
5. Create transaction record in database

#### CASH_OUT (User withdraws at Agent)

1. Deduct from user's wallet
2. Calculate total fee (1.85% = 0.75% agent + 1.10% platform)
3. Credit agent commission to agent wallet
4. Credit platform share: `platformWallet.creditBalance(platformShare, 'Cash Out Fee')`
5. Credit cash to agent wallet (agent gives physical cash to user)
6. Create transaction record

#### User Registration (With Onboarding Bonus)

1. Create user account
2. Create wallet
3. Check platform balance: `platformWallet.hasSufficientBalance(50)`
4. If sufficient, deduct: `platformWallet.deductBalance(50, 'Onboarding Bonus')`
5. Credit ৳50 to user wallet
6. Create ONBOARDING_BONUS transaction record

---

## Testing

Each simulation module has its own test suite:

```bash
# Test bank accounts
node simulation/bank_accounts/test.js

# Test platform wallet
node simulation/platform_wallet/test.js
```

All tests should pass before deploying or making major changes.

---

## File Structure

```
simulation/
├── README.md                     # This file
├── bank_accounts/
│   ├── data.json                 # 20 bank accounts with balances
│   ├── index.js                  # Bank accounts API
│   ├── README.md                 # Detailed documentation
│   └── test.js                   # Test suite (12 tests)
└── platform_wallet/
    ├── data.json                 # Platform wallet state
    ├── index.js                  # Platform wallet API
    ├── README.md                 # Detailed documentation
    └── test.js                   # Test suite (12 tests)
```

---

## Data Persistence

All simulation data is stored in JSON files:
- `bank_accounts/data.json` - Persists account balances
- `platform_wallet/data.json` - Persists platform balance and statistics

Changes are automatically saved to disk, so balance updates persist across server restarts.

---

## Future Migration

When ready to integrate with real systems:

1. **Bank Accounts**: Replace simulation with actual bank API integration (BEFTN, NPSB)
2. **Platform Wallet**: Replace with real accounting system or blockchain

The simulation modules use the same interfaces, so migration requires minimal code changes in controllers—just swap the import statements.

---

## Best Practices

1. **Always check balance** before deducting (both bank and platform)
2. **Use try-catch blocks** to handle insufficient balance errors
3. **Log all transactions** to the database for auditing
4. **Run tests** after modifying simulation data
5. **Reset wallets** to initial state after testing using `resetWallet()` functions

---

## Support

For questions or issues with simulation modules:
- Check individual README.md files in each module folder
- Review test.js files for usage examples
- See main documentation: SCHEMA.md, SOP.md, MODELS.md

---

## Notes

- Simulation modules use CommonJS (`require`/`module.exports`)
- Main application uses ES6 modules (`import`/`export`)
- This separation is intentional for easier testing and portability
- All amounts are in BDT (Bangladeshi Taka)
- PIN storage in simulation is for testing only—never store PINs in plain text in production
