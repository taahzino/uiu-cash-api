# UIU Cash - Database Models Documentation

## Overview

All database models use **CHAR(8)** for primary keys with custom nanoid generation using alphabet `A-Z0-9` (except `platform_wallet_transactions` which uses INT AUTO_INCREMENT).

## Model Summary (16 Total)

### ✅ Completed Models

#### **1. Users** (`users`)

- **Purpose**: Main user accounts (PERSONAL and AGENT)
- **Roles**: PERSONAL, AGENT
- **Status**: ACTIVE, INACTIVE, SUSPENDED, LOCKED
- **Features**: Email/phone verification, password, account status (ACTIVE, INACTIVE, SUSPENDED, LOCKED)
- **Key Methods**: createUser, findByEmail, findByPhone, updateLoginAttempts
- **Relationships**:
  - One-to-one → Wallets
  - One-to-many → Transactions, Sessions, AgentCashouts, BillPayments, BankTransfers

---

#### **2. Admins** (`admins`)

- **Purpose**: Separate admin system (not a role in users)
- **Status**: ACTIVE, SUSPENDED
- **Features**: Email-based login, password, self-referencing created_by
- **Key Methods**: createAdmin, findByEmail, updateLoginAttempts
- **Relationships**:
  - Self-referencing → created_by
  - One-to-many → Billers (created_by), Agents (approved_by)

---

#### **3. Wallets** (`wallets`)

- **Purpose**: Digital wallet for each user
- **Features**:
  - balance, available_balance, pending_balance
  - daily_limit (5000), monthly_limit (50000)
  - daily_spending, monthly_spending
  - spending_reset_date
- **Key Methods**: createWallet, updateBalance, incrementSpending, resetSpending, checkSpendingLimit
- **Relationships**:
  - One-to-many → Transactions (sender_wallet_id, receiver_wallet_id), Ledgers

---

#### **4. Billers** (`billers`)

- **Purpose**: Bill payment providers
- **Types**: ELECTRICITY, GAS, WATER, INTERNET, MOBILE, TV
- **Features**: name, code, balance, is_active
- **Key Methods**: createBiller, findByCode, updateBalance, toggleActive
- **Relationships**:
  - Many-to-one → Admins (created_by, SET NULL)
  - One-to-many → BillPayments

---

#### **5. Agents** (`agents`)

- **Purpose**: Manage agent network for cash-out operations
- **Status**: PENDING, ACTIVE, SUSPENDED, REJECTED
- **Features**:
  - agent_code (AG + 7 digits)
  - business_name, business_address
  - total_cashouts, total_commission_earned
- **Key Methods**: createAgent, approveAgent, rejectAgent, incrementStats, findPendingAgents
- **Relationships**:
  - One-to-one → Users (CASCADE)
  - Many-to-one → Admins (approved_by, SET NULL)
  - One-to-many → AgentCashouts

---

#### **6. Transactions** (`transactions`)

- **Purpose**: Core transaction engine for all financial operations
- **Types**:
  - SEND_MONEY, ADD_MONEY, CASH_OUT, CASH_IN, BILL_PAYMENT
- **Features**:
  - transaction_id (TXN-YYYYMMDD-XXXXXX)
  - amount, fee, description
  - sender/receiver tracking
  - wallet tracking
- **Key Methods**: createTransaction, updateStatus, findPendingTransactions, getTotalByUserAndType
- **Relationships**:
  - Many-to-one → Users (sender_id, receiver_id, SET NULL)
  - Many-to-one → Wallets (sender_wallet_id, receiver_wallet_id, SET NULL)
  - One-to-many → Ledgers, BillPayments, BankTransfers, AgentCashouts

---

#### **7. Ledgers** (`ledgers`)

- **Purpose**: Double-entry bookkeeping for financial accuracy
- **Entry Types**: DEBIT, CREDIT
- **Features**:
  - balance_before, balance_after (audit trail)
  - description
  - verifyBalance() ensures debits = credits
- **Key Methods**: createLedgerEntry, verifyBalance, getBalanceHistory, findByTransactionId
- **Relationships**:
  - Many-to-one → Transactions (CASCADE), Wallets (CASCADE)

---

#### **8. AgentCashouts** (`agent_cashouts`)

- **Purpose**: Track cash-out requests through agent network
- **Status**: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- **Features**:
  - amount, fee, commission
  - location, notes
  - links transactions to agents
- **Key Methods**: createCashout, findPendingForAgent, getTotalCommissionByAgent
- **Relationships**:
  - Many-to-one → Transactions (CASCADE), Agents (CASCADE), Users (requester_id, CASCADE)

---

#### **9. BillPayments** (`bill_payments`)

- **Purpose**: Record bill payments to billers
- **Status**: PENDING, PROCESSING, COMPLETED, FAILED
- **Features**:
  - account_number, billing_month/year
  - receipt_number (RCP-YYYYMM-XXXXX)
  - generated on completion
- **Key Methods**: createBillPayment, completePayment, getTotalByBiller
- **Relationships**:
  - Many-to-one → Transactions (CASCADE), Billers (CASCADE), Users (CASCADE)

---

#### **10. BankTransfers** (`bank_transfers`)

- **Purpose**: Bank transfer operations
- **Status**: PENDING, PROCESSING, COMPLETED, FAILED
- **Features**:
  - bank_name, account_name, account_number
  - routing_number, reference_number
  - amount, fee
- **Key Methods**: createBankTransfer, updateStatus, getTotalByUser
- **Relationships**:
  - Many-to-one → Transactions (CASCADE), Users (CASCADE)

---

#### **11. Offers** (`offers`)

- **Purpose**: Promotional offers and coupons
- **Types**: CASHBACK, DISCOUNT, BONUS
- **Status**: ACTIVE, INACTIVE, EXPIRED
- **Features**:
  - title, description, offer_value
  - min_transaction_amount, max_discount_amount
  - total_usage_limit, per_user_limit
  - validity period (valid_from, valid_until)
  - terms_conditions
- **Key Methods**: createOffer, findActiveOffers, expireOldOffers, updateStatus
- **Relationships**:
  - One-to-many → UserOffers

---

#### **12. UserOffers** (`user_offers`)

- **Purpose**: Track user offer usage
- **Features**:
  - usage_count, last_used_at
  - unique constraint (user_id, offer_id)
- **Key Methods**: createUserOffer, incrementUsage, canUseOffer
- **Relationships**:
  - Many-to-one → Users (CASCADE), Offers (CASCADE)

---

#### **13. Sessions** (`sessions`)

- **Purpose**: User session management
- **Features**:
  - token (JWT token hash for validation)
  - ip_address, user_agent
  - expires_at
- **Relationships**:
  - Many-to-one → Users (CASCADE)

---

#### **14. AuditLogs** (`audit_logs`)

- **Purpose**: System audit trail
- **Actions**:
  - CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  - TRANSACTION, STATUS_CHANGE, PASSWORD_CHANGE
  - AGENT_APPROVAL
- **Features**:
  - entity_type, entity_id
  - user_id, admin_id
  - old_values, new_values (JSON)
  - ip_address, user_agent
  - description
- **Key Methods**: createAuditLog, findByEntity, findByUser, findByAdmin, findByAction, findByDateRange
- **Relationships**:
  - Many-to-one → Users (SET NULL), Admins (SET NULL)

---

#### **15. SystemConfig** (`system_config`)

- **Purpose**: System configuration key-value store
- **Features**:
  - config_key (unique), config_value (text)
  - description
  - 13 default configurations (fees, limits, bonuses)
  - All values editable by admins
  - Auto-initialized on database setup
- **Key Methods**: createConfig, findByKey, updateByKey, getAllConfigs
- **Default Configs**: agent_commission_rate, onboarding_bonus, send_money_fee, cash_out_fee_percentage, bank_transfer_fee_percentage, bank_transfer_min_fee, max_transaction_limit, personal_daily_limit, personal_monthly_limit, agent_daily_limit, agent_monthly_limit, min_wallet_balance, agent_min_float
- **Relationships**: None

---

#### **16. PlatformWalletTransactions** (`platform_wallet_transactions`)

- **Purpose**: Track all platform wallet financial activities for admin dashboard statistics
- **Transaction Types**:
  - FEE_COLLECTED (send money, cash out, etc.)
  - COMMISSION_PAID (agent commissions)
  - BONUS_GIVEN (user bonuses)
  - CASHBACK_GIVEN (promotional cashback)
  - REVENUE_OTHER, EXPENSE_OTHER, SETTLEMENT, ADJUSTMENT
- **Entry Types**: CREDIT (money in), DEBIT (money out)
- **Features**:
  - transaction_type, entry_type
  - amount, balance_before, balance_after
  - related_transaction_id, related_user_id, related_agent_id
  - description, metadata (JSON)
  - Immutable records for audit trail
- **Key Methods**: 
  - createTransaction, findById
  - getHistory (with pagination and filters)
  - getStatistics (total fees, commissions, bonuses, net revenue)
  - findByTransactionId, findByUserId
- **Statistics Support**:
  - Total fees collected
  - Total commissions paid
  - Total bonuses given
  - Total cashback given
  - Net revenue (credits - debits)
  - Current platform wallet balance
- **Relationships**:
  - Many-to-one → Transactions (related_transaction_id, SET NULL)
  - Many-to-one → Users (related_user_id, SET NULL)
  - Many-to-one → Agents (related_agent_id, SET NULL)
- **Primary Key**: INT AUTO_INCREMENT (different from other models)
- **Synchronized With**: `simulation/platform_wallet/data.json` for balance tracking

---

## Platform Wallet (Simulation-Based)

Platform finances are managed through a simulation module instead of a database table:

- **Location**: `simulation/platform_wallet/`
- **Initial Balance**: ৳1,000,000 (10 lacs)
- **Purpose**: Fund onboarding bonuses, pay agent commissions, collect transaction fees
- **Operations**: Deduct (৳50 bonuses), Credit (fees), Balance validation
- **Tracking**: Total revenue, total bonuses given, total commissions paid
- **API**: `getBalance()`, `hasSufficientBalance()`, `deductBalance()`, `creditBalance()`, `getStatistics()`
- **Database Integration**: All operations now automatically recorded to `platform_wallet_transactions` table
- **See**: `simulation/platform_wallet/README.md` for detailed documentation

---

## Initialization Order (Respects Foreign Key Dependencies)

1. **Level 1 - Base Tables**: Users, Admins
2. **Level 2 - User-Related**: Wallets, Billers, Agents, Sessions
3. **Level 3 - Transactions**: Transactions
4. **Level 4 - Transaction-Dependent**: Ledgers, AgentCashouts, BillPayments, BankTransfers, PlatformWalletTransactions
5. **Level 5 - Offers**: Offers, UserOffers
6. **Level 6 - System**: AuditLogs, SystemConfig, SettlementAccounts

---

### Foreign Key Cascade Rules

**CASCADE DELETE**:

- wallets.user_id → users.id
- agents.user_id → users.id
- sessions.user_id → users.id
- ledgers.transaction_id → transactions.id
- ledgers.wallet_id → wallets.id
- agent_cashouts.transaction_id → transactions.id
- agent_cashouts.agent_id → agents.id
- agent_cashouts.requester_id → users.id
- bill_payments.transaction_id → transactions.id
- bill_payments.biller_id → billers.id
- bill_payments.user_id → users.id
- bank_transfers.transaction_id → transactions.id
- bank_transfers.user_id → users.id
- user_offers.user_id → users.id
- user_offers.offer_id → offers.id

**SET NULL**:

- billers.created_by → admins.id
- agents.approved_by → admins.id
- transactions.sender_id → users.id
- transactions.receiver_id → users.id
- transactions.sender_wallet_id → wallets.id
- transactions.receiver_wallet_id → wallets.id
- audit_logs.user_id → users.id
- audit_logs.admin_id → admins.id
- platform_wallet_transactions.related_transaction_id → transactions.id
- platform_wallet_transactions.related_user_id → users.id
- platform_wallet_transactions.related_agent_id → agents.id

---

## Common Patterns

### All Models Include:

- ✅ CHAR(8) primary keys with nanoid (alphabet: A-Z0-9)
- ✅ generateUniqueId() for collision-free ID generation
- ✅ created_at, updated_at timestamps
- ✅ Logger integration (no console.log)
- ✅ Proper database indexes
- ✅ CHECK constraints for data integrity
- ✅ Enum types for status fields


- Not implemented in all tables (only where needed)

---

## Database Status

✅ **All 18 tables successfully initialized**
✅ **Foreign key relationships working correctly**
✅ **Default admin account created** (admin@uiucash.com)
✅ **TypeScript compilation successful**
✅ **Logger integration complete**
✅ **Platform wallet transaction tracking implemented**

---

## Next Steps

1. ✅ Create remaining models
2. ✅ Update init-db.ts
3. ✅ Initialize all tables
4. ✅ Implement transaction services (add money, send money)
5. ⏳ Implement wallet services
6. ⏳ Implement user authentication APIs
7. ⏳ Implement admin APIs
8. ⏳ Implement agent APIs
9. ⏳ Implement platform wallet statistics dashboard
10. ⏳ Add API documentation

---

## Model Files Location

```
src/models/
├── BaseModel.ts
├── Users.model.ts
├── Admins.model.ts
├── Wallets.model.ts
├── Billers.model.ts
├── Agents.model.ts
├── Transactions.model.ts
├── Ledgers.model.ts
├── AgentCashouts.model.ts
├── BillPayments.model.ts
├── BankTransfers.model.ts
├── Offers.model.ts
├── UserOffers.model.ts
├── Sessions.model.ts
├── AuditLogs.model.ts
├── SystemConfig.model.ts
├── SettlementAccounts.model.ts
└── PlatformWalletTransactions.model.ts
```

---

## Database Schema Verification

Run this command to verify all tables:

```bash
mysql -u root -p uiu_cash_db -e "SHOW TABLES;"
```

Expected output: 18 tables
