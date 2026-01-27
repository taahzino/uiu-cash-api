# UIU Cash - Database Schema Documentation

## Project Information

- **Project Name**: UIU Cash (Mobile Financial Service Platform)
- **Database**: MySQL 8.0+
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB
- **Date**: January 6, 2026

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Definitions](#table-definitions)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
6. [Constraints & Validations](#constraints--validations)
7. [Triggers & Stored Procedures](#triggers--stored-procedures)

---

## Schema Overview

### Database Purpose

UIU Cash is a comprehensive digital financial services platform supporting:

- Multi-role user management (Consumer, Agent)
- Separate admin system for platform management
- Digital wallet operations with real-time balance tracking
- Peer-to-peer money transfers
- Agent-based cash-in/cash-out services
- Bill payments with biller balance management
- Bank transfers
- Promotional offers and cashback system
- Double-entry ledger accounting
- Comprehensive audit logging

### Key Design Principles

- **ACID Compliance**: All financial transactions maintain atomicity, consistency, isolation, and durability
- **Data Integrity**: Extensive use of foreign keys, check constraints, and triggers
- **Audit Trail**: Comprehensive logging of all critical operations
- **Security**: Password hashing, session management, and audit logs
- **Double-Entry Bookkeeping**: Every transaction creates corresponding ledger entries

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   users     │────1:1──│   wallets    │────1:M──│  transactions   │
└─────────────┘         └──────────────┘         └─────────────────┘
      │                        │                          │
      │1:1                     │1:M                       │1:M
      │                        │                          │
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
└─────────────┘         └──────────────┘         └─────────────────┘
                                                          │
      │                                                   │M:1
      │1:1                                                │
      │                                            ┌─────────────────┐
┌─────────────┐                                   │     agents      │
│   agents    │                                   └─────────────────┘
└─────────────┘
                        ┌──────────────┐
      ┌────────────────│    offers    │────────────┐
      │M:M             └──────────────┘            │M:M
      │                                             │
┌─────────────┐                              ┌──────────────┐
│user_offers  │                              │   sessions   │
└─────────────┘                              └──────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ bill_payments    │    │ bank_transfers   │    │  audit_logs     │
└──────────────────┘    └──────────────────┘    └─────────────────┘

┌──────────────────┐
│ system_config    │
└──────────────────┘

**Note**: Platform finances (bonuses, commissions, fees) are managed through the simulation-based Platform Wallet (`simulation/platform_wallet/`) instead of database tables.
```

---

## Table Definitions

### 1. `users` - User Account Management

**Purpose**: Core table storing all user accounts across different roles.

| Column                  | Data Type    | Constraints                                           | Description                                          |
| ----------------------- | ------------ | ----------------------------------------------------- | ---------------------------------------------------- |
| `id`                    | CHAR(36)     | PRIMARY KEY, DEFAULT UUID()                           | Unique user identifier                               |
| `email`                 | VARCHAR(255) | UNIQUE, NOT NULL                                      | User email address                                   |
| `phone`                 | VARCHAR(20)  | UNIQUE, NOT NULL                                      | User phone number                                    |
| `password_hash`         | VARCHAR(255) | NOT NULL                                              | Bcrypt hashed password                               |
| `role`                  | ENUM         | NOT NULL                                              | User role: CONSUMER, AGENT                           |
| `status`                | ENUM         | NOT NULL, DEFAULT 'PENDING'                           | Account status: PENDING, ACTIVE, SUSPENDED, REJECTED |
| `first_name`            | VARCHAR(100) | NOT NULL                                              | User's first name                                    |
| `last_name`             | VARCHAR(100) | NOT NULL                                              | User's last name                                     |
| `date_of_birth`         | DATE         | NULLABLE                                              | User's date of birth                                 |
| `nid_number`            | VARCHAR(20)  | NULLABLE                                              | National ID number                                   |
| `email_verified`        | BOOLEAN      | DEFAULT FALSE                                         | Email verification status                            |
| `phone_verified`        | BOOLEAN      | DEFAULT FALSE                                         | Phone verification status                            |
| `last_login_at`         | TIMESTAMP    | NULLABLE                                              | Last successful login timestamp                      |
| `created_at`            | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                             | Record creation timestamp                            |
| `updated_at`            | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp                                |

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `email`, `phone`
- INDEX: `idx_users_email`, `idx_users_phone`, `idx_users_role`, `idx_users_status`
- FULLTEXT: `idx_users_fulltext` (first_name, last_name, email)

**Business Rules**:

- Email and phone must be unique across the system
- Password must be bcrypt hashed (never stored in plain text)

---

### 3. `admins` - Admin Account Management

**Purpose**: Separate table for platform administrators with elevated privileges.

| Column                  | Data Type    | Constraints                                           | Description                     |
| ----------------------- | ------------ | ----------------------------------------------------- | ------------------------------- |
| `id`                    | CHAR(8)      | PRIMARY KEY                                           | Unique admin identifier         |
| `email`                 | VARCHAR(255) | UNIQUE, NOT NULL                                      | Admin email address             |
| `password_hash`         | VARCHAR(255) | NOT NULL                                              | Bcrypt hashed password          |
| `name`                  | VARCHAR(255) | NOT NULL                                              | Admin full name                 |
| `status`                | ENUM         | NOT NULL, DEFAULT 'ACTIVE'                            | ACTIVE, SUSPENDED               |
| `last_login_at`         | TIMESTAMP    | NULLABLE                                              | Last successful login timestamp |
| `created_at`            | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                             | Record creation timestamp       |
| `updated_at`            | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp           |
| `created_by`            | CHAR(8)      | FOREIGN KEY, NULLABLE                                 | Admin who created this account  |

**Relationships**:

- `created_by` → `admins(id)` (Self-referencing for audit)

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `email`
- INDEX: `idx_admins_email`, `idx_admins_status`

**Business Rules**:

- Email must be unique across admins (separate from users table)
- Password must be bcrypt hashed
- All admins have the same level of access
- Admins cannot have user wallets or perform transactions

---

### 3. `wallets` - Digital Wallet Management

**Purpose**: Manages user wallet balances, limits, and spending tracking.

| Column                | Data Type     | Constraints                                           | Description                |
| --------------------- | ------------- | ----------------------------------------------------- | -------------------------- |
| `id`                  | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique wallet identifier   |
| `user_id`             | CHAR(36)      | UNIQUE, FOREIGN KEY, NOT NULL                         | One wallet per user        |
| `balance`             | DECIMAL(15,2) | DEFAULT 0.00, CHECK >= 0                              | Total wallet balance       |
| `available_balance`   | DECIMAL(15,2) | DEFAULT 0.00, CHECK >= 0                              | Available for transactions |
| `pending_balance`     | DECIMAL(15,2) | DEFAULT 0.00                                          | Pending/processing amount  |
| `currency`            | VARCHAR(3)    | DEFAULT 'BDT'                                         | Currency code (ISO 4217)   |
| `daily_limit`         | DECIMAL(15,2) | DEFAULT 50000.00                                      | Daily transaction limit    |
| `monthly_limit`       | DECIMAL(15,2) | DEFAULT 200000.00                                     | Monthly transaction limit  |
| `daily_spent`         | DECIMAL(15,2) | DEFAULT 0.00                                          | Daily spending counter     |
| `monthly_spent`       | DECIMAL(15,2) | DEFAULT 0.00                                          | Monthly spending counter   |
| `last_transaction_at` | TIMESTAMP     | NULLABLE                                              | Last transaction timestamp |
| `created_at`          | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Wallet creation timestamp  |
| `updated_at`          | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp      |

**Relationships**:


**Indexes**:

- PRIMARY: `id`
- UNIQUE: `user_id`
- INDEX: `idx_wallets_user_id`, `idx_wallets_balance`

**Constraints**:

- CHECK: `balance >= 0` (No negative balance)
- CHECK: `available_balance >= 0`
- CHECK: `balance = available_balance + pending_balance`

**Business Rules**:

- One wallet per user (1:1 relationship)
- Automatically created when user registers (via trigger)
- Balance cannot go negative (enforced by trigger and check constraint)
- Spending limits reset daily/monthly via scheduled jobs

---

### 4. `transactions` - Transaction Records

**Purpose**: Core transaction table recording all financial operations.

| Column               | Data Type     | Constraints                                           | Description                   |
| -------------------- | ------------- | ----------------------------------------------------- | ----------------------------- |
| `id`                 | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique transaction identifier |
| `transaction_id`     | VARCHAR(50)   | UNIQUE, NOT NULL                                      | Human-readable transaction ID |
| `type`               | ENUM          | NOT NULL                                              | Transaction type              |
| `sender_id`          | CHAR(36)      | FOREIGN KEY, NULLABLE                                 | Sender user ID                |
| `receiver_id`        | CHAR(36)      | FOREIGN KEY, NULLABLE                                 | Receiver user ID              |
| `sender_wallet_id`   | CHAR(36)      | FOREIGN KEY, NULLABLE                                 | Sender wallet ID              |
| `receiver_wallet_id` | CHAR(36)      | FOREIGN KEY, NULLABLE                                 | Receiver wallet ID            |
| `amount`             | DECIMAL(15,2) | NOT NULL, CHECK > 0                                   | Transaction amount            |
| `fee`                | DECIMAL(15,2) | DEFAULT 0.00                                          | Transaction fee               |
| `total_amount`       | DECIMAL(15,2) | NOT NULL                                              | amount + fee                  |
| `status`             | ENUM          | DEFAULT 'PENDING'                                     | Transaction status            |
| `description`        | TEXT          | NULLABLE                                              | Transaction description       |
| `reference_number`   | VARCHAR(100)  | NULLABLE                                              | External reference number     |
| `metadata`           | JSON          | NULLABLE                                              | Additional metadata           |
| `user_agent`         | TEXT          | NULLABLE                                              | Client user agent             |
| `initiated_at`       | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Transaction initiation time   |
| `completed_at`       | TIMESTAMP     | NULLABLE                                              | Completion timestamp          |
| `failed_reason`      | TEXT          | NULLABLE                                              | Failure reason                |
| `created_at`         | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Record creation timestamp     |
| `updated_at`         | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp         |

**Transaction Types**:

- `SEND_MONEY`: P2P transfer between personal users
- `ADD_MONEY`: Adding money to wallet
- `CASH_OUT`: User withdrawing cash through agent
- `BILL_PAYMENT`: Utility bill payment
- `CASH_IN`: Agent depositing cash to personal user account
- `BANK_TRANSFER`: Transfer to bank account
- `CASHBACK`: Promotional cashback
- `COMMISSION`: Agent commission
- `ONBOARDING_BONUS`: New user bonus

**Transaction Status**:

- `PENDING`: Initiated but not processed
- `PROCESSING`: Currently being processed
- `COMPLETED`: Successfully completed
- `FAILED`: Failed transaction

**Relationships**:

- `sender_id` → `users(id)`
- `receiver_id` → `users(id)`
- `sender_wallet_id` → `wallets(id)`
- `receiver_wallet_id` → `wallets(id)`

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `transaction_id`
- INDEX: `idx_transactions_trx_id`, `idx_transactions_sender`, `idx_transactions_receiver`
- INDEX: `idx_transactions_type`, `idx_transactions_status`, `idx_transactions_date`
- INDEX: `idx_transactions_user_date` (sender_id, created_at)
- INDEX: `idx_transactions_status_date` (status, created_at)

**Constraints**:

- CHECK: `amount > 0`
- CHECK: `sender_id != receiver_id`

**Business Rules**:

- Immutable after completion (no direct updates to amount/status after COMPLETED)
- Every transaction creates corresponding ledger entries
- Transaction ID follows format: TXN-YYYYMMDD-XXXXXX

---

### 5. `ledgers` - Double-Entry Ledger

**Purpose**: Implements double-entry bookkeeping for all wallet transactions.

| Column           | Data Type     | Constraints                 | Description                    |
| ---------------- | ------------- | --------------------------- | ------------------------------ |
| `id`             | CHAR(36)      | PRIMARY KEY, DEFAULT UUID() | Unique ledger entry identifier |
| `transaction_id` | CHAR(36)      | FOREIGN KEY, NOT NULL       | Reference to transaction       |
| `wallet_id`      | CHAR(36)      | FOREIGN KEY, NOT NULL       | Wallet affected                |
| `entry_type`     | ENUM          | NOT NULL                    | DEBIT or CREDIT                |
| `amount`         | DECIMAL(15,2) | NOT NULL, CHECK > 0         | Entry amount                   |
| `balance_before` | DECIMAL(15,2) | NOT NULL                    | Balance before transaction     |
| `balance_after`  | DECIMAL(15,2) | NOT NULL                    | Balance after transaction      |
| `description`    | TEXT          | NULLABLE                    | Entry description              |
| `created_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP   | Entry timestamp                |

**Entry Types**:

- `DEBIT`: Decrease in balance (money out)
- `CREDIT`: Increase in balance (money in)

**Relationships**:

- `wallet_id` → `wallets(id)`

**Indexes**:

- PRIMARY: `id`
- INDEX: `idx_ledgers_transaction`, `idx_ledgers_wallet`, `idx_ledgers_date`
- INDEX: `idx_ledgers_wallet_date` (wallet_id, created_at)

**Business Rules**:

- Every transaction must have at least 2 ledger entries (debit and credit)
- Sum of debits must equal sum of credits for each transaction
- Ledger entries are immutable (never updated or deleted)
- Used for audit trail and balance reconciliation

---

### 6. `agents` - Agent Management

**Purpose**: Manages agent network for cash-in/cash-out services.

| Column                    | Data Type     | Constraints                                           | Description                 |
| ------------------------- | ------------- | ----------------------------------------------------- | --------------------------- |
| `id`                      | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique agent identifier     |
| `user_id`                 | CHAR(36)      | UNIQUE, FOREIGN KEY, NOT NULL                         | Reference to user account   |
| `agent_code`              | VARCHAR(20)   | UNIQUE, NOT NULL                                      | Unique agent code           |
| `business_name`               | VARCHAR(255)  | NOT NULL                                              | Agent shop name             |
| `business_address`            | TEXT          | NOT NULL                                              | Physical shop address       |
| `latitude`                | DECIMAL(10,8) | NULLABLE                                              | Shop latitude               |
| `longitude`               | DECIMAL(11,8) | NULLABLE                                              | Shop longitude              |
| `total_commission_earned` | DECIMAL(15,2) | DEFAULT 0.00                                          | Total earnings              |
| `float_balance`           | DECIMAL(15,2) | DEFAULT 0.00                                          | Agent's float balance       |
| `status`                  | ENUM          | DEFAULT 'PENDING'                                     | PENDING, ACTIVE, SUSPENDED  |
| `approved_by`             | CHAR(36)      | FOREIGN KEY, NULLABLE                                 | Admin who approved (admins) |
| `approved_at`             | TIMESTAMP     | NULLABLE                                              | Approval timestamp          |
| `created_at`              | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Registration timestamp      |
| `updated_at`              | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp       |

**Relationships**:

- `approved_by` → `users(id)` (Admin user)

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `user_id`, `agent_code`
- INDEX: `idx_agents_user_id`, `idx_agents_code`, `idx_agents_status`
- INDEX: `idx_agents_location` (latitude, longitude)

**Business Rules**:

- One agent profile per user
- Agent code format: AG-XXXXXX
- Must be approved by admin before becoming ACTIVE
- Commission rate can be customized per agent

---

### 7. `agent_cashouts` - Agent Cash-Out Transactions

**Purpose**: Tracks cash-out transactions through agent network.

| Column           | Data Type     | Constraints                                           | Description                            |
| ---------------- | ------------- | ----------------------------------------------------- | -------------------------------------- |
| `id`             | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique cashout identifier              |
| `transaction_id` | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | Reference to transaction               |
| `agent_id`       | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | Agent providing service                |
| `user_id`        | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | User withdrawing cash                  |
| `amount`         | DECIMAL(15,2) | NOT NULL                                              | Cash-out amount                        |
| `fee`            | DECIMAL(15,2) | NOT NULL                                              | Transaction fee                        |
| `commission`     | DECIMAL(15,2) | NOT NULL                                              | Agent commission                       |
| `status`         | ENUM          | DEFAULT 'PENDING'                                     | PENDING, APPROVED, COMPLETED, REJECTED |
| `created_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Request timestamp                      |
| `updated_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp                  |

**Relationships**:

- `transaction_id` → `transactions(id)`
- `agent_id` → `agents(id)`
- `user_id` → `users(id)`

**Indexes**:

- PRIMARY: `id`
- INDEX: `idx_agent_cashouts_agent`, `idx_agent_cashouts_user`, `idx_agent_cashouts_status`

**Business Rules**:

- Fee = amount × 1.85% (configurable)
- Agent earns commission only when status = COMPLETED

---

### 8. `offers` - Promotional Offers

**Purpose**: Manages promotional offers, cashback, and discounts.

| Column                 | Data Type     | Constraints                                           | Description                    |
| ---------------------- | ------------- | ----------------------------------------------------- | ------------------------------ |
| `id`                   | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique offer identifier        |
| `code`                 | VARCHAR(50)   | UNIQUE, NOT NULL                                      | Offer code (e.g., NEWYEAR2026) |
| `title`                | VARCHAR(255)  | NOT NULL                                              | Offer title                    |
| `description`          | TEXT          | NULLABLE                                              | Offer description              |
| `offer_type`           | ENUM          | NOT NULL                                              | CASHBACK, DISCOUNT, BONUS      |
| `transaction_type`     | ENUM          | NULLABLE                                              | Applicable transaction type    |
| `discount_type`        | ENUM          | NULLABLE                                              | PERCENTAGE or FIXED            |
| `discount_value`       | DECIMAL(10,2) | NOT NULL                                              | Discount/cashback value        |
| `min_amount`           | DECIMAL(15,2) | DEFAULT 0                                             | Minimum transaction amount     |
| `max_cashback`         | DECIMAL(15,2) | NULLABLE                                              | Maximum cashback cap           |
| `usage_limit_per_user` | INTEGER       | DEFAULT 1                                             | Times each user can use        |
| `total_usage_limit`    | INTEGER       | NULLABLE                                              | Total usage limit (all users)  |
| `current_usage_count`  | INTEGER       | DEFAULT 0                                             | Current usage counter          |
| `valid_from`           | TIMESTAMP     | NOT NULL                                              | Offer start time               |
| `valid_until`          | TIMESTAMP     | NOT NULL                                              | Offer end time                 |
| `is_active`            | BOOLEAN       | DEFAULT TRUE                                          | Active status                  |
| `created_by`           | CHAR(36)      | FOREIGN KEY, NULLABLE                                 | Admin who created (admins)     |
| `created_at`           | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Creation timestamp             |
| `updated_at`           | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp          |

**Offer Types**:

- `CASHBACK`: Returns money to wallet after transaction
- `DISCOUNT`: Reduces transaction amount
- `BONUS`: Adds bonus amount

**Transaction Types**:

- `SEND_MONEY`: Applicable on send money transactions
- `ADD_MONEY`: Applicable on add money transactions
- `CASH_OUT`: Applicable on cash-out transactions
- `BILL_PAYMENT`: Applicable on bill payments

**Relationships**:

- `created_by` → `users(id)` (Admin user)

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `code`
- INDEX: `idx_offers_code`, `idx_offers_active`, `idx_offers_validity`

**Constraints**:

- CHECK: `valid_until > valid_from`

**Business Rules**:

- Offer code must be unique and alphanumeric
- Usage limits enforced at application level
- Expired offers automatically deactivated via scheduled job

---

### 9. `user_offers` - User Offer Usage Tracking

**Purpose**: Tracks which users have used which offers and how many times.

| Column           | Data Type | Constraints                 | Description                         |
| ---------------- | --------- | --------------------------- | ----------------------------------- |
| `id`             | CHAR(36)  | PRIMARY KEY, DEFAULT UUID() | Unique record identifier            |
| `user_id`        | CHAR(36)  | FOREIGN KEY, NOT NULL       | User who used offer                 |
| `offer_id`       | CHAR(36)  | FOREIGN KEY, NOT NULL       | Offer used                          |
| `transaction_id` | CHAR(36)  | FOREIGN KEY, NULLABLE       | Transaction where offer was applied |
| `usage_count`    | INTEGER   | DEFAULT 0                   | Number of times used                |
| `last_used_at`   | TIMESTAMP | NULLABLE                    | Last usage timestamp                |
| `created_at`     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP   | First usage timestamp               |

**Relationships**:

- `user_id` → `users(id)`
- `offer_id` → `offers(id)`
- `transaction_id` → `transactions(id)`
- UNIQUE constraint on (user_id, offer_id)

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `(user_id, offer_id)`
- INDEX: `idx_user_offers_user`, `idx_user_offers_offer`

**Business Rules**:

- One record per user-offer combination
- Usage count incremented on each use
- Used to enforce per-user usage limits

---

### 10. `billers` - Utility Biller Management

**Purpose**: Manages utility companies and service providers who receive bill payments.

| Column           | Data Type     | Constraints                                           | Description                      |
| ---------------- | ------------- | ----------------------------------------------------- | -------------------------------- |
| `id`             | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique biller identifier         |
| `biller_code`    | VARCHAR(20)   | UNIQUE, NOT NULL                                      | Unique biller code (e.g., DESCO) |
| `biller_name`    | VARCHAR(255)  | NOT NULL                                              | Official biller name             |
| `bill_type`      | ENUM          | NOT NULL                                              | ELECTRICITY, WATER, GAS, etc.    |
| `balance`        | DECIMAL(15,2) | DEFAULT 0.00                                          | Total collected balance          |
| `total_payments` | INT           | DEFAULT 0                                             | Total number of payments         |
| `status`         | ENUM          | NOT NULL, DEFAULT 'ACTIVE'                            | ACTIVE, SUSPENDED, INACTIVE      |
| `contact_email`  | VARCHAR(255)  | NULLABLE                                              | Biller contact email             |
| `contact_phone`  | VARCHAR(20)   | NULLABLE                                              | Biller contact phone             |
| `description`    | TEXT          | NULLABLE                                              | Biller description               |
| `logo_url`       | TEXT          | NULLABLE                                              | Biller logo image URL            |
| `created_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Record creation timestamp        |
| `updated_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp            |
| `created_by`     | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | Admin who created (admins)       |

**Bill Types** (matching bill_payments):

- `ELECTRICITY`: Electricity providers (DESCO, DPDC, etc.)
- `WATER`: Water utility providers (WASA)
- `GAS`: Gas providers (Titas Gas, Jalalabad Gas)
- `INTERNET`: Internet service providers
- `MOBILE`: Mobile operators (Grameenphone, Robi, etc.)

**Relationships**:

- `created_by` → `admins(id)` (Admin who created)

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `biller_code`
- INDEX: `idx_billers_code`, `idx_billers_type`, `idx_billers_status`

**Business Rules**:

- Biller code must be unique and uppercase (e.g., DESCO, WASA)
- Balance automatically updated when bill payments are processed
- Only admins can create, update, or delete billers
- Active billers appear in user bill payment interface
- Balance represents total amount collected from all bill payments

---

### 11. `bill_payments` - Bill Payment Transactions

**Purpose**: Tracks bill payment transactions for utilities and services.

| Column           | Data Type     | Constraints                                           | Description                |
| ---------------- | ------------- | ----------------------------------------------------- | -------------------------- |
| `id`             | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique payment identifier  |
| `transaction_id` | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | Reference to transaction   |
| `user_id`        | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | User making payment        |
| `biller_id`      | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | Reference to biller        |
| `bill_type`      | ENUM          | NOT NULL                                              | Type of bill               |
| `account_number` | VARCHAR(100)  | NOT NULL                                              | Customer account number    |
| `amount`         | DECIMAL(15,2) | NOT NULL                                              | Bill amount                |
| `bill_month`     | VARCHAR(7)    | NULLABLE                                              | Billing month (YYYY-MM)    |
| `due_date`       | DATE          | NULLABLE                                              | Payment due date           |
| `late_fee`       | DECIMAL(10,2) | DEFAULT 0.00                                          | Late payment fee           |
| `status`         | ENUM          | DEFAULT 'PENDING'                                     | PENDING, COMPLETED, FAILED |
| `created_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Payment timestamp          |
| `updated_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp      |

**Bill Types**:

- `ELECTRICITY`: Electricity bill
- `WATER`: Water bill
- `GAS`: Gas bill
- `INTERNET`: Internet/ISP bill
- `MOBILE`: Mobile phone bill

**Relationships**:

- `transaction_id` → `transactions(id)`
- `user_id` → `users(id)`
- `biller_id` → `billers(id)` (Which biller received payment)

**Indexes**:

- PRIMARY: `id`
- INDEX: `idx_bill_payments_user`, `idx_bill_payments_biller`, `idx_bill_payments_type`, `idx_bill_payments_status`

**Business Rules**:

- Biller balance automatically credited when payment completes
- Late fee applied if paid after due date
- Transaction fee may apply based on system config (currently free)
- When payment status = COMPLETED, biller balance increases by amount

---

### 12. `bank_transfers` - Bank Transfer Transactions

**Purpose**: Tracks transfers from wallet to bank accounts.

| Column                 | Data Type     | Constraints                                           | Description                |
| ---------------------- | ------------- | ----------------------------------------------------- | -------------------------- |
| `id`                   | CHAR(36)      | PRIMARY KEY, DEFAULT UUID()                           | Unique transfer identifier |
| `transaction_id`       | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | Reference to transaction   |
| `user_id`              | CHAR(36)      | FOREIGN KEY, NOT NULL                                 | User initiating transfer   |
| `bank_name`            | VARCHAR(255)  | NOT NULL                                              | Destination bank name      |
| `account_number`       | VARCHAR(50)   | NOT NULL                                              | Bank account number        |
| `account_holder_name`  | VARCHAR(255)  | NOT NULL                                              | Account holder name        |
| `routing_number`       | VARCHAR(20)   | NULLABLE                                              | Bank routing number        |
| `amount`               | DECIMAL(15,2) | NOT NULL                                              | Transfer amount            |
| `transfer_type`        | ENUM          | NULLABLE                                              | INSTANT or STANDARD        |
| `status`               | ENUM          | DEFAULT 'PENDING'                                     | Transaction status         |
| `processing_fee`       | DECIMAL(10,2) | DEFAULT 0.00                                          | Processing fee             |
| `estimated_completion` | TIMESTAMP     | NULLABLE                                              | ETA for completion         |
| `completed_at`         | TIMESTAMP     | NULLABLE                                              | Actual completion time     |
| `failure_reason`       | TEXT          | NULLABLE                                              | Failure reason if failed   |
| `created_at`           | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                             | Request timestamp          |
| `updated_at`           | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp      |

**Transfer Types**:

- `INSTANT`: Immediate transfer (higher fee)
- `STANDARD`: 1-3 business days (lower fee)

**Status Values**:

- `PENDING`: Awaiting processing
- `PROCESSING`: Currently processing
- `COMPLETED`: Successfully completed
- `FAILED`: Transfer failed

**Relationships**:

- `transaction_id` → `transactions(id)`
- `user_id` → `users(id)`

**Indexes**:

- PRIMARY: `id`
- INDEX: `idx_bank_transfers_user`, `idx_bank_transfers_status`

**Business Rules**:

- Mock implementation (simulated bank transfers)
- Processing fee varies by transfer type
- Standard transfers have estimated completion time

---

### 13. `system_config` - System Configuration

**Purpose**: Stores system-wide configuration parameters.

| Column         | Data Type    | Constraints                                           | Description                   |
| -------------- | ------------ | ----------------------------------------------------- | ----------------------------- |
| `id`           | CHAR(8)      | PRIMARY KEY                                           | Unique config identifier      |
| `config_key`   | VARCHAR(100) | UNIQUE, NOT NULL                                      | Configuration key name        |
| `config_value` | TEXT         | NOT NULL                                              | Configuration value           |
| `description`  | TEXT         | NULLABLE                                              | Configuration description     |
| `created_at`   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                             | Creation timestamp            |
| `updated_at`   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp         |

**Relationships**:

- None

**Indexes**:

- PRIMARY: `id`
- UNIQUE: `config_key`

**Default Configurations**:

```sql
agent_commission_rate = 1.50 (Global commission rate for all agents)
onboarding_bonus = 50.00 (Bonus for new user registration)
send_money_fee = 5.00 (Flat fee for send money transactions)
cash_out_fee_percentage = 1.85 (Percentage fee for cash out)
bank_transfer_fee_percentage = 1.50 (Percentage fee for bank transfer)
bank_transfer_min_fee = 10.00 (Minimum fee for bank transfer)
max_transaction_limit = 25000.00 (Maximum per transaction)
consumer_daily_limit = 50000.00 (Daily limit for personal users)
consumer_monthly_limit = 200000.00 (Monthly limit for personal users)
agent_daily_limit = 100000.00 (Daily limit for agent users)
agent_monthly_limit = 500000.00 (Monthly limit for agent users)
min_wallet_balance = 0.00 (Minimum wallet balance)
agent_min_float = 1000.00 (Minimum float for agents)
```

**Business Rules**:

- All configuration values are editable by admins
- Changes logged to audit_logs
- Admins can update config values through admin panel

---

### 14. `platform_wallet_transactions` - Platform Wallet Transaction Tracking

**Purpose**: Tracks all platform wallet financial activities for admin dashboard statistics and auditing.

| Column                    | Data Type     | Constraints                 | Description                                                   |
| ------------------------- | ------------- | --------------------------- | ------------------------------------------------------------- |
| `id`                      | INT           | PRIMARY KEY, AUTO_INCREMENT | Unique platform transaction identifier                        |
| `transaction_type`        | ENUM          | NOT NULL                    | Type of platform transaction                                  |
| `entry_type`              | ENUM          | NOT NULL                    | CREDIT (money in) or DEBIT (money out)                        |
| `amount`                  | DECIMAL(15,2) | NOT NULL, CHECK > 0         | Transaction amount                                            |
| `balance_before`          | DECIMAL(15,2) | NOT NULL                    | Platform wallet balance before transaction                    |
| `balance_after`           | DECIMAL(15,2) | NOT NULL                    | Platform wallet balance after transaction                     |
| `related_transaction_id`  | CHAR(36)      | FOREIGN KEY, NULLABLE       | Reference to related user transaction (if applicable)         |
| `related_user_id`         | CHAR(36)      | FOREIGN KEY, NULLABLE       | Related user ID (if applicable)                               |
| `related_agent_id`        | CHAR(36)      | FOREIGN KEY, NULLABLE       | Related agent ID (if applicable)                              |
| `description`             | TEXT          | NOT NULL                    | Transaction description                                       |
| `metadata`                | JSON          | NULLABLE                    | Additional metadata                                           |
| `created_at`              | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP   | Transaction timestamp                                         |

**Transaction Types**:

- `FEE_COLLECTED`: Transaction fees (send money, cash out, etc.)
- `COMMISSION_PAID`: Agent commissions
- `BONUS_GIVEN`: User bonuses/cashback
- `CASHBACK_GIVEN`: Promotional cashback
- `REVENUE_OTHER`: Other platform revenue
- `EXPENSE_OTHER`: Other platform expenses
- `SETTLEMENT`: Settlement operations
- `ADJUSTMENT`: Manual adjustments

**Entry Types**:

- `CREDIT`: Money coming into platform wallet (fees, revenue)
- `DEBIT`: Money going out of platform wallet (commissions, bonuses)

**Relationships**:

- `related_transaction_id` → `transactions(id)`
- `related_user_id` → `users(id)`
- `related_agent_id` → `agents(id)`

**Indexes**:

- PRIMARY: `id`
- INDEX: `idx_platform_txn_type` (transaction_type)
- INDEX: `idx_platform_entry_type` (entry_type)
- INDEX: `idx_platform_related_txn` (related_transaction_id)
- INDEX: `idx_platform_user` (related_user_id)
- INDEX: `idx_platform_agent` (related_agent_id)
- INDEX: `idx_platform_date` (created_at)
- INDEX: `idx_platform_type_date` (transaction_type, created_at)

**Business Rules**:

- Every platform wallet balance change must be recorded
- Immutable records - no updates or deletes
- Used for admin dashboard statistics
- Supports double-entry accounting for platform finances
- Balance tracking synchronized with `simulation/platform_wallet/data.json`
- Fees collected from users are credited to platform wallet
- Commissions paid to agents are debited from platform wallet
- Bonuses given to users are debited from platform wallet

**SQL Schema**:

```sql
CREATE TABLE platform_wallet_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_type ENUM(
        'FEE_COLLECTED', 
        'COMMISSION_PAID', 
        'BONUS_GIVEN', 
        'CASHBACK_GIVEN', 
        'REVENUE_OTHER', 
        'EXPENSE_OTHER', 
        'SETTLEMENT', 
        'ADJUSTMENT'
    ) NOT NULL,
    entry_type ENUM('CREDIT', 'DEBIT') NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    related_transaction_id CHAR(36),
    related_user_id CHAR(36),
    related_agent_id CHAR(36),
    description TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (related_transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (related_user_id) REFERENCES users(id),
    FOREIGN KEY (related_agent_id) REFERENCES agents(id),
    
    INDEX idx_platform_txn_type (transaction_type),
    INDEX idx_platform_entry_type (entry_type),
    INDEX idx_platform_related_txn (related_transaction_id),
    INDEX idx_platform_user (related_user_id),
    INDEX idx_platform_agent (related_agent_id),
    INDEX idx_platform_date (created_at),
    INDEX idx_platform_type_date (transaction_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 15. Platform Wallet (Simulation)

**Purpose**: Manages platform finances including bonuses, commissions, and revenue collection.

**Location**: `simulation/platform_wallet/`

**Implementation**: File-based JSON simulation (not a database table)

**Initial Balance**: ৳1,000,000 (10 lacs)

**Platform Wallet Structure**:

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

**Operations**:
- Deduct: Onboarding bonuses (৳50), agent commissions
- Credit: Transaction fees, cash out fees (platform share), bank transfer fees
- All platform wallet operations are automatically recorded to `platform_wallet_transactions` table
- Check: Balance validation before operations
- Track: Revenue, bonuses, commissions separately

**API Functions**:
- `getBalance()`: Get current platform balance
- `hasSufficientBalance(amount)`: Check if sufficient balance exists
- `deductBalance(amount, reason)`: Deduct from platform (throws error if insufficient)
- `creditBalance(amount, reason)`: Credit to platform
- `getStatistics()`: Get revenue, bonuses, commissions, net profit

See `simulation/platform_wallet/README.md` for detailed usage.

**Business Rules**:

- Used for financial reconciliation and accounting
- Updated via scheduled settlement jobs
- Balance calculations must match transaction ledgers

---

### 15. `audit_logs` - Audit Trail

**Purpose**: Comprehensive audit logging for security and compliance.

| Column        | Data Type    | Constraints                 | Description                        |
| ------------- | ------------ | --------------------------- | ---------------------------------- |
| `id`          | CHAR(36)     | PRIMARY KEY, DEFAULT UUID() | Unique log identifier              |
| `user_id`     | CHAR(36)     | FOREIGN KEY, NULLABLE       | User performing action (if user)   |
| `admin_id`    | CHAR(36)     | FOREIGN KEY, NULLABLE       | Admin performing action (if admin) |
| `action`      | VARCHAR(100) | NOT NULL                    | Action performed                   |
| `entity_type` | VARCHAR(50)  | NULLABLE                    | Entity type affected               |
| `entity_id`   | CHAR(36)     | NULLABLE                    | Entity ID affected                 |
| `old_values`  | JSON         | NULLABLE                    | Previous values                    |
| `new_values`  | JSON         | NULLABLE                    | New values                         |
| `user_agent`  | TEXT         | NULLABLE                    | Client user agent                  |
| `created_at`  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP   | Action timestamp                   |

**Relationships**:

- `user_id` → `users(id)`

**Indexes**:

- PRIMARY: `id`
- INDEX: `idx_audit_logs_user`, `idx_audit_logs_action`, `idx_audit_logs_date`

**Common Actions**:

- `USER_LOGIN`, `USER_LOGOUT`, `PASSWORD_CHANGE`
- `TRANSACTION_CREATE`, `TRANSACTION_CANCEL`
- `CONFIG_UPDATE`, `ROLE_CHANGE`

**Business Rules**:

- Retention: 7 years for compliance
- Used for forensics and compliance audits

---

### 16. `sessions` - User Session Management

**Purpose**: Manages user authentication sessions and tokens.

| Column          | Data Type    | Constraints                 | Description               |
| --------------- | ------------ | --------------------------- | ------------------------- |
| `id`            | CHAR(36)     | PRIMARY KEY, DEFAULT UUID() | Unique session identifier |
| `user_id`       | CHAR(36)     | FOREIGN KEY, NOT NULL       | User owning session       |
| `token_hash`    | VARCHAR(255) | UNIQUE, NOT NULL            | Hashed session token      |
| `device_info`   | JSON         | NULLABLE                    | Device information        |
| `expires_at`    | TIMESTAMP    | NOT NULL                    | Session expiry time       |
| `last_activity` | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP   | Last activity timestamp   |
| `created_at`    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP   | Session creation time     |

**Relationships**:


**Indexes**:

- PRIMARY: `id`
- UNIQUE: `token_hash`
- INDEX: `idx_sessions_user`, `idx_sessions_token`, `idx_sessions_expires`

**Business Rules**:

- Session tokens hashed before storage (SHA-256)
- Max 5 concurrent sessions per user
- Session timeout: 24 hours of inactivity

---

## Relationships & Foreign Keys

### Foreign Key Relationships Summary

```sql
-- Admin Related
admins.created_by → admins.id (Self-referencing)
agents.approved_by → admins.id
offers.created_by → admins.id
billers.created_by → admins.id
system_config.updated_by → admins.id
audit_logs.admin_id → admins.id

-- User Related
wallets.user_id → users.id (CASCADE)
agents.user_id → users.id (CASCADE)
sessions.user_id → users.id (CASCADE)

-- Transaction Related
transactions.sender_id → users.id
transactions.receiver_id → users.id
transactions.sender_wallet_id → wallets.id
transactions.receiver_wallet_id → wallets.id

-- Ledger Related
ledgers.transaction_id → transactions.id (CASCADE)
ledgers.wallet_id → wallets.id

-- Agent Operations
agent_cashouts.transaction_id → transactions.id
agent_cashouts.agent_id → agents.id
agent_cashouts.user_id → users.id

-- Offers System
user_offers.user_id → users.id
user_offers.offer_id → offers.id
user_offers.transaction_id → transactions.id

-- Bill Payments & Billers
billers → Managed by admins
bill_payments.transaction_id → transactions.id
bill_payments.user_id → users.id
bill_payments.biller_id → billers.id (Which biller received payment)

-- Bank Transfers
bank_transfers.transaction_id → transactions.id
bank_transfers.user_id → users.id

-- Audit
audit_logs.user_id → users.id (If user action)
audit_logs.admin_id → admins.id (If admin action)
```

### Referential Integrity Rules


   - User deleted → Wallet, Sessions deleted
   - Transaction deleted → Ledger entries deleted

2. **SET NULL**: Not used (explicit handling at application level)

3. **RESTRICT**: Default behavior for financial records
   - Cannot delete user if transactions exist
   - Cannot delete wallet with balance > 0

---

## Constraints & Validations

### Check Constraints

```sql
-- Prevent negative balances
ALTER TABLE wallets
ADD CONSTRAINT check_balance CHECK (balance >= 0);

ALTER TABLE wallets
ADD CONSTRAINT check_available_balance CHECK (available_balance >= 0);

-- Balance integrity
ALTER TABLE wallets
ADD CONSTRAINT check_balance_equation
CHECK (balance = available_balance + pending_balance);

-- Transaction amount validation
ALTER TABLE transactions
ADD CONSTRAINT check_amount CHECK (amount > 0);

-- Prevent self-transfers
ALTER TABLE transactions
ADD CONSTRAINT check_different_parties
CHECK (sender_id != receiver_id);

-- Offer validity
ALTER TABLE offers
ADD CONSTRAINT check_valid_dates
CHECK (valid_until > valid_from);

-- Ledger amount validation
ALTER TABLE ledgers
ADD CONSTRAINT check_ledger_amount CHECK (amount > 0);
```

### Application-Level Validations

1. **Email Validation**: RFC 5322 compliant regex
2. **Phone Validation**: E.164 format (+8801XXXXXXXXX)
3. **Password Strength**: Min 8 chars, uppercase, lowercase, number, special char
4. **NID Validation**: 10, 13, or 17 digits
5. **Amount Precision**: Max 2 decimal places
6. **Transaction Limits**: Daily/monthly spending limits
8. **Session Token**: Secure random 64-byte token

---

## Triggers & Stored Procedures

### 1. Auto-Create Wallet Trigger

```sql
DELIMITER $$

CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.role IN ('CONSUMER', 'BUSINESS', 'AGENT') THEN
        INSERT INTO wallets (id, user_id, balance, available_balance)
        VALUES (UUID(), NEW.id, 0.00, 0.00);
    END IF;
END$$

DELIMITER ;
```

**Purpose**: Automatically creates a wallet when a new user registers (except ADMIN).

---

### 2. Prevent Negative Balance Trigger

```sql
DELIMITER $$

CREATE TRIGGER check_wallet_balance
BEFORE UPDATE ON wallets
FOR EACH ROW
BEGIN
    IF NEW.balance < 0 OR NEW.available_balance < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
END$$

DELIMITER ;
```

**Purpose**: Prevents wallet balance from going negative.

---

### 3. Transaction Ledger Creation (Application Logic)

```typescript
// Pseudo-code for creating ledger entries
async function createTransaction(txn: Transaction) {
  await db.transaction(async (trx) => {
    // Insert transaction
    await trx("transactions").insert(txn);

    // Create debit entry (sender)
    await trx("ledgers").insert({
      transaction_id: txn.id,
      wallet_id: txn.sender_wallet_id,
      entry_type: "DEBIT",
      amount: txn.total_amount,
      balance_before: senderBalance,
      balance_after: senderBalance - txn.total_amount,
    });

    // Create credit entry (receiver)
    await trx("ledgers").insert({
      transaction_id: txn.id,
      wallet_id: txn.receiver_wallet_id,
      entry_type: "CREDIT",
      amount: txn.amount,
      balance_before: receiverBalance,
      balance_after: receiverBalance + txn.amount,
    });

    // Update wallet balances
    await trx("wallets")
      .where("id", txn.sender_wallet_id)
      .decrement("balance", txn.total_amount);
    await trx("wallets")
      .where("id", txn.receiver_wallet_id)
      .increment("balance", txn.amount);
  });
}
```

---

### 3. Session Cleanup Procedure

```sql
DELIMITER $$

CREATE EVENT cleanup_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM sessions
    WHERE expires_at < NOW();
END$$

DELIMITER ;
```

**Purpose**: Automatically removes expired sessions every hour.

---

### 4. Reset Daily Spending Limits

```sql
DELIMITER $$

CREATE EVENT reset_daily_limits
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
    UPDATE wallets SET daily_spent = 0.00;
END$$

DELIMITER ;
```

**Purpose**: Resets daily spending limits at midnight every day.

---

## Database Initialization Script

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS uiu_cash
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE uiu_cash;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Create all tables (in order of dependencies)
-- 1. users
-- 3. wallets
-- 4. agents
-- 5. transactions
-- 6. ledgers
-- 7. agent_cashouts
-- 8. offers
-- 9. user_offers
-- 10. bill_payments
-- 11. bank_transfers
-- 12. system_config
-- 13. audit_logs
-- 14. sessions

-- Create triggers
-- Create events
-- Insert default data

-- Create admin user
INSERT INTO users (id, email, phone, password_hash, role, status, first_name, last_name, email_verified, phone_verified)
VALUES
  (UUID(), 'admin@uiu-cash.com', '+8801700000000', '$2b$10$...', 'ADMIN', 'ACTIVE', 'System', 'Admin', TRUE, TRUE);

-- Insert default system config
INSERT INTO system_config (config_key, config_value, description) VALUES
  ('agent_commission_rate', '1.50', 'Global commission rate percentage for all agents (e.g., 1.50 for 1.5%)'),
  ('onboarding_bonus', '50.00', 'Bonus amount given to new users upon registration (in BDT)'),
  ('send_money_fee', '5.00', 'Flat fee for send money transactions (in BDT)'),
  ('cash_out_fee_percentage', '1.85', 'Percentage fee for cash out transactions (e.g., 1.85 for 1.85%)'),
  ('bank_transfer_fee_percentage', '1.50', 'Percentage fee for bank transfer transactions (e.g., 1.50 for 1.5%)'),
  ('bank_transfer_min_fee', '10.00', 'Minimum fee for bank transfer transactions (in BDT)'),
  ('max_transaction_limit', '25000.00', 'Maximum amount per single transaction (in BDT)'),
  ('consumer_daily_limit', '50000.00', 'Daily transaction limit for personal users (in BDT)'),
  ('consumer_monthly_limit', '200000.00', 'Monthly transaction limit for personal users (in BDT)'),
  ('agent_daily_limit', '100000.00', 'Daily transaction limit for agent users (in BDT)'),
  ('agent_monthly_limit', '500000.00', 'Monthly transaction limit for agent users (in BDT)'),
  ('min_wallet_balance', '0.00', 'Minimum wallet balance that must be maintained (in BDT)'),
  ('agent_min_float', '1000.00', 'Minimum float balance agents must maintain (in BDT)');

-- Note: Platform finances (bonuses, commissions, fees) are managed through
-- the simulation-based Platform Wallet (simulation/platform_wallet/)
-- with an initial balance of ৳1,000,000
```

---

## Best Practices Implemented

### 1. Security

- ✅ Password hashing (bcrypt)
- ✅ Session token hashing (SHA-256)
- ✅ Audit logging for all critical actions
- ✅ IP address tracking
- ✅ Two-factor authentication support

### 2. Data Integrity

- ✅ Foreign key constraints
- ✅ Check constraints for business rules
- ✅ Unique constraints where applicable
- ✅ NOT NULL for required fields
- ✅ Double-entry bookkeeping
- ✅ Transaction isolation

### 4. Maintainability

- ✅ Clear naming conventions
- ✅ Comprehensive documentation
- ✅ Triggers for automated tasks
- ✅ Events for scheduled cleanup
- ✅ Audit trail for debugging

### 5. Compliance

- ✅ Financial compliance (audit logs, ledger)
- ✅ 7-year audit log retention

---



```bash
mysqldump -u root -p --single-transaction --routines --triggers \


# Upload to S3 (or cloud storage)
```

### Recovery

```bash
```

---

## Migration Strategy

### Schema Versioning

- Use migration tools: Knex.js, TypeORM, or Sequelize migrations
- Always version control migration files
- Test migrations on staging before production

### Example Migration File Structure

```
migrations/
├── 20260101_create_users_table.sql
├── 20260102_create_wallets_table.sql
├── 20260103_create_transactions_table.sql
└── ...
```

---

## Contact & Support

**Database Administrators**:

- Tahsin Ahmed Tushar (Project Lead, Backend Developer)
- Email: tahsin@uiu-cash.com

**Repository**: https://github.com/uiu-dbms/uiu-cash

**Documentation**: Internal Wiki

---

## Revision History

| Version | Date       | Author              | Changes                      |
| ------- | ---------- | ------------------- | ---------------------------- |
| 1.0     | 2026-01-06 | Tahsin Ahmed Tushar | Initial schema documentation |

---

**End of Database Schema Documentation**
