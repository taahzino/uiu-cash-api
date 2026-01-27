# UIU Cash API - Project Task List

## Based on SOP Requirements

**Project**: Full Stack Mobile Finance System (UIU Cash)  
**Team**: 02  
**Last Updated**: January 27, 2026  
**Status Legend**: 🔴 Pending | 🟡 In Progress | 🟢 Completed

---

## Phase 1: Database Setup & Configuration (SOP Section 5)

### Task 1.1: Setup MySQL Database and Connection Pool

**Status**: 🟢 Completed  
**Description**: Configure MySQL 8.0+ database with utf8mb4 charset, create connection pool with 20 connections, and test database connectivity.  
**Estimated Time**: 2 hours

### Task 1.2: Create Users Table with Indexes

**Status**: 🟢 Completed  
**Description**: Implement users table with CHAR(8) IDs, role (CONSUMER/AGENT), status (PENDING/ACTIVE/SUSPENDED/REJECTED), and all required indexes as per SOP.  
**Estimated Time**: 3 hours

### Task 1.3: Create Wallets Table with Balance Constraints

**Status**: 🟢 Completed  
**Description**: Implement wallets table with balance >= 0 constraints, daily/monthly limits, and auto-create wallet trigger on user registration.  
**Estimated Time**: 3 hours

### Task 1.4: Create Transactions Table with All Transaction Types

**Status**: 🟢 Completed  
**Description**: Implement transactions table supporting SEND_MONEY, ADD_MONEY, CASH_OUT, BILL_PAYMENT, BANK_TRANSFER, CASHBACK, COMMISSION, ONBOARDING_BONUS types.  
**Estimated Time**: 4 hours

### Task 1.5: Create Ledgers Table for Double-Entry Bookkeeping

**Status**: 🟢 Completed  
**Description**: Implement ledgers table with DEBIT/CREDIT entry types, balance tracking (before/after), and foreign keys to transactions and wallets.  
**Estimated Time**: 3 hours

### Task 1.6: Create Agents Table with Commission Tracking

**Status**: 🟢 Completed  
**Description**: Implement agents table with agent_code, business details, approval workflow (PENDING/ACTIVE/SUSPENDED), and commission tracking fields.  
**Estimated Time**: 3 hours

### Task 1.7: Create System Config Table with Default Values

**Status**: 🟢 Completed  
**Description**: Implement system_config table and seed default values (fees, limits, bonuses) for agent_commission_rate, send_money_fee, cash_out_fee, etc.  
**Estimated Time**: 2 hours

### Task 1.8: Create Admins Table for Platform Management

**Status**: 🟢 Completed  
**Description**: Implement admins table with CHAR(8) IDs, separate from users table, with status tracking and login history.  
**Estimated Time**: 2 hours

---

## Phase 2: User Authentication & Authorization (SOP Section 8.1)

### Task 2.1: Implement User Registration API

**Status**: 🟢 Completed  
**Description**: Create POST /api/auth/register endpoint with email/phone validation, password hashing (bcrypt cost 12), and automatic wallet creation with onboarding bonus.  
**Estimated Time**: 4 hours

### Task 2.2: Implement User Login API

**Status**: 🟢 Completed  
**Description**: Create POST /api/auth/login endpoint with email/phone identifier support, password verification, JWT token generation (3-hour expiry), and last login tracking.  
**Estimated Time**: 3 hours

### Task 2.3: Implement JWT Middleware for Route Protection

**Status**: 🟢 Completed  
**Description**: Create authenticateUser middleware to verify JWT tokens, extract user payload, and protect authenticated routes with proper error responses.  
**Estimated Time**: 2 hours

### Task 2.4: Implement Role-Based Authorization Middleware

**Status**: 🟢 Completed  
**Description**: Create authorizeUserRole middleware to restrict routes based on user role (CONSUMER vs AGENT) with proper permission checks.  
**Estimated Time**: 2 hours

### Task 2.5: Implement Logout API with Session Invalidation

**Status**: 🟢 Completed  
**Description**: Create POST /api/auth/logout endpoint to invalidate JWT tokens, delete sessions from database, and add tokens to blacklist until expiry.  
**Estimated Time**: 3 hours

### Task 2.6: Implement Get User Profile API

**Status**: 🟢 Completed  
**Description**: Create GET /api/auth/profile endpoint returning user details, wallet balance, daily/monthly limits, and spending tracking.  
**Estimated Time**: 2 hours

---

## Phase 3: Wallet & Transaction Core (SOP Section 8.3-8.4)

### Task 3.1: Implement View Wallet Balance API

**Status**: 🟢 Completed  
**Description**: Create GET /api/wallet/balance endpoint returning balance, available balance, pending balance, currency, and daily/monthly spending with limits.  
**Estimated Time**: 2 hours

### Task 3.2: Implement Transaction History API with Pagination

**Status**: 🟢 Completed  
**Description**: Create GET /api/transactions/history with page, limit, type, and status filters, returning paginated transactions where user is sender or receiver.  
**Estimated Time**: 3 hours

### Task 3.3: Implement Transaction Details API

**Status**: 🟢 Completed  
**Description**: Create GET /api/transactions/:id endpoint returning full transaction details with sender/receiver information, metadata, and authorization checks.  
**Estimated Time**: 2 hours

### Task 3.4: Implement Send Money API (P2P Transfer)

**Status**: 🟢 Completed  
**Description**: Create POST /api/transactions/send-money with recipient identifier (email/phone), amount validation (₹10-₹25,000), ₹5 fee calculation, and double-entry ledger creation.  
**Estimated Time**: 4 hours

### Task 3.5: Add Daily/Monthly Spending Limit Checks

**Status**: 🟢 Completed  
**Description**: Implement spending limit validation before transactions (Consumer: ₹50K daily, ₹200K monthly; Agent: ₹100K daily, ₹500K monthly).  
**Estimated Time**: 2 hours

### Task 3.6: Implement Balance Validation and Insufficient Balance Errors

**Status**: 🟢 Completed  
**Description**: Add balance checks before debiting wallets, return proper error responses for insufficient balance with current balance information.  
**Estimated Time**: 2 hours

### Task 3.7: Create Ledger Entries for All Transactions

**Status**: 🟢 Completed  
**Description**: Automatically create DEBIT and CREDIT ledger entries with balance_before and balance_after for every completed transaction.  
**Estimated Time**: 3 hours

---

## Phase 4: Add Money Feature (SOP Section 8.5)

### Task 4.1: Create Bank Account Simulation System

**Status**: 🟢 Completed  
**Description**: Implement simulation/bank_accounts with 20 dummy bank accounts, card details (16-digit card number, CVV, expiry), and JSON file-based storage.  
**Estimated Time**: 3 hours

### Task 4.2: Implement Card Verification Logic

**Status**: 🟢 Completed  
**Description**: Create verifyCard function to check card number existence, validate CVV, verify expiry date, and check account status is ACTIVE.  
**Estimated Time**: 3 hours

### Task 4.3: Implement Add Money API

**Status**: 🟢 Completed  
**Description**: Create POST /api/transactions/add-money endpoint validating card details, deducting from bank account, crediting to wallet, with no fees.  
**Estimated Time**: 4 hours

### Task 4.4: Add Card Balance Validation

**Status**: 🟢 Completed  
**Description**: Check linked bank account has sufficient balance before processing add money requests, return descriptive error messages.  
**Estimated Time**: 2 hours

### Task 4.5: Create Add Money Transaction Records

**Status**: 🟢 Completed  
**Description**: Store transaction type ADD_MONEY with metadata (card_type, bank_name, card_last_4), create ledger CREDIT entry to user wallet.  
**Estimated Time**: 2 hours

### Task 4.6: Implement Card Masking for Security

**Status**: 🟢 Completed  
**Description**: Mask card numbers in responses (\***\*-\*\***-\***\*-1234) and transaction records to protect sensitive card information.  
**Estimated Time\*\*: 1 hour

---

## Phase 5: Cash Out via Agents (SOP Section 8.6)

### Task 5.1: Implement Agent Registration API

**Status**: 🟢 Completed  
**Description**: Create POST /api/agents/register endpoint with business_name, business_address, auto-generate agent_code (AG + 7 digits), set status PENDING.  
**Estimated Time**: 3 hours

### Task 5.2: Implement Agent Approval Workflow API

**Status**: 🟢 Completed  
**Description**: Create admin endpoints POST /api/admin/agents/:id/approve and /reject to change agent status, record approved_by, and send notifications.  
**Estimated Time**: 4 hours

### Task 5.3: Create Agent Float Balance Management

**Status**: 🔴 Pending  
**Description**: Add float_balance field to agents, implement minimum float requirement (₹1,000), and float addition/withdrawal operations.  
**Estimated Time**: 4 hours

### Task 5.4: Implement Cash Out Initiate API (User Side)

**Status**: 🟢 Completed  
**Description**: Create POST /api/transactions/cash-out/initiate with agentId, amount, calculate cash_out_fee (1.85%), validate user balance and agent float.  
**Estimated Time**: 4 hours

### Task 5.5: Implement Cash Out Complete API (Agent Side)

**Status**: 🟢 Completed  
**Description**: Create POST /api/agent/cash-out/complete endpoint to finalize withdrawal, deduct from agent float, credit agent commission, update transaction status.  
**Estimated Time**: 4 hours

### Task 5.6: Calculate and Credit Agent Commission

**Status**: 🟢 Completed  
**Description**: Calculate agent commission from system config (1.5%), credit to agent wallet, update agent total_commission_earned, create COMMISSION transaction.  
**Estimated Time**: 3 hours

### Task 5.7: Create Agent Cashout Records Table

**Status**: 🟢 Completed  
**Description**: Implement agent_cashouts table linking transactions to agents with cashout_status, commission_amount, and agent_float_deducted fields.  
**Estimated Time**: 2 hours

---

## Phase 6: Bill Payment System (SOP Section 8.7)

### Task 6.1: Create Billers Table and Model

**Status**: 🔴 Pending  
**Description**: Implement billers table with biller_code, biller_name, bill_type (ELECTRICITY/WATER/GAS/INTERNET/MOBILE), balance tracking, and admin creation.  
**Estimated Time**: 3 hours

### Task 6.2: Seed Default Billers

**Status**: 🔴 Pending  
**Description**: Create initialization script to seed billers (DESCO, WASA, Titas Gas, Grameenphone, Robi, etc.) with appropriate bill types and codes.  
**Estimated Time**: 2 hours

### Task 6.3: Implement Get Billers API

**Status**: 🔴 Pending  
**Description**: Create GET /api/bills/billers endpoint with optional bill_type filter returning all active billers with details.  
**Estimated Time**: 2 hours

### Task 6.4: Implement Bill Payment API

**Status**: 🔴 Pending  
**Description**: Create POST /api/bills/pay with billerId, billType, accountNumber, amount, validate biller exists, deduct from user wallet, credit to biller balance.  
**Estimated Time**: 4 hours

### Task 6.5: Create Bill Payments Records Table

**Status**: 🔴 Pending  
**Description**: Implement bill_payments table with transaction_id, user_id, biller_id, account_number, amount, bill_month, status tracking.  
**Estimated Time**: 3 hours

### Task 6.6: Add No-Fee Bill Payment Logic

**Status**: 🔴 Pending  
**Description**: Ensure bill payments have zero transaction fees, user pays exact bill amount, create appropriate BILL_PAYMENT transaction and ledger entries.  
**Estimated Time**: 2 hours

---

## Phase 7: Bank Transfer System (SOP Section 8.8)

### Task 7.1: Create Bank Transfers Table and Model

**Status**: 🟢 Completed  
**Description**: Implement bank_transfers table with bank_name, account_number, account_holder_name, transfer_type (INSTANT/STANDARD), processing_fee fields.  
**Estimated Time**: 3 hours

### Task 7.2: Implement Bank Transfer API

**Status**: 🟢 Completed  
**Description**: Create POST /api/bank/transfer with bank details, amount, calculate fee (1.5% or min ₹10), validate user balance, create transaction.  
**Estimated Time**: 4 hours

### Task 7.3: Add Bank Transfer Fee Calculation

**Status**: 🟢 Completed  
**Description**: Implement fee logic: 1.5% of amount with minimum ₹10, get rates from system_config (bank_transfer_fee_percentage, bank_transfer_min_fee).  
**Estimated Time**: 2 hours

### Task 7.4: Create Bank Transfer Transaction Records

**Status**: 🟢 Completed  
**Description**: Store BANK_TRANSFER type transactions with metadata (bank details, transfer type), create ledger DEBIT entry, update wallet.  
**Estimated Time**: 3 hours

### Task 7.5: Implement Transfer Status Tracking

**Status**: 🟢 Completed  
**Description**: Add status progression (PENDING → PROCESSING → COMPLETED/FAILED), estimated_completion timestamp, and failure_reason tracking.  
**Estimated Time**: 2 hours

---

## Phase 8: Offers & Cashback System (SOP Section 8.9)

### Task 8.1: Create Offers Table and Model

**Status**: 🔴 Pending  
**Description**: Implement offers table with offer_code, offer_type (CASHBACK/DISCOUNT), cashback_percentage, min_transaction_amount, validity dates, usage limits.  
**Estimated Time**: 3 hours

### Task 8.2: Create User Offers Redemption Table

**Status**: 🔴 Pending  
**Description**: Implement user_offers table tracking redemption count, last_redeemed_at, first_redeemed_at for each user-offer combination.  
**Estimated Time**: 2 hours

### Task 8.3: Implement Get Available Offers API

**Status**: 🔴 Pending  
**Description**: Create GET /api/offers endpoint returning active offers with validity checks, usage limits, and eligibility based on user transaction history.  
**Estimated Time**: 3 hours

### Task 8.4: Implement Apply Offer Code API

**Status**: 🔴 Pending  
**Description**: Create POST /api/offers/apply with offer_code, validate code exists, check user eligibility, verify transaction meets min_amount, calculate cashback.  
**Estimated Time**: 4 hours

### Task 8.5: Auto-Apply Cashback to Transactions

**Status**: 🔴 Pending  
**Description**: Integrate offer validation in transaction processing, automatically apply cashback, create CASHBACK transaction, credit to user wallet.  
**Estimated Time**: 4 hours

### Task 8.6: Track Offer Redemption and Usage Limits

**Status**: 🔴 Pending  
**Description**: Increment redemption count, update last_redeemed_at, enforce max_redemptions_per_user limit, prevent duplicate redemptions.  
**Estimated Time**: 3 hours

---

## Phase 9: Admin Dashboard & Management (SOP Section 8.10)

### Task 9.1: Implement Admin Authentication System

**Status**: 🟢 Completed  
**Description**: Create separate admin login POST /api/admin/auth/login with JWT tokens using JWT_ADMIN_SECRET, separate from user authentication.  
**Estimated Time**: 3 hours

### Task 9.2: Create Admin Middleware for Route Protection

**Status**: 🟢 Completed  
**Description**: Implement adminAuth middleware verifying admin JWT tokens, checking admin status is ACTIVE, protecting admin-only routes.  
**Estimated Time**: 2 hours

### Task 9.3: Implement Get All Users API (Admin)

**Status**: 🟢 Completed  
**Description**: Create POST /api/admin/consumers/list and POST /api/admin/agents/list with pagination (offset/limit), filters (status, dates), search by name/email/phone/agent code, returning user list with wallet balances.  
**Estimated Time**: 3 hours

### Task 9.4: Implement Suspend/Activate User API (Admin)

**Status**: 🟢 Completed  
**Description**: Create PATCH /api/admin/consumers/:id/status endpoint updating user status (ACTIVE/SUSPENDED/REJECTED), preventing further transactions for suspended users.  
**Estimated Time**: 3 hours

### Task 9.5: Implement View User Details API (Admin)

**Status**: 🟢 Completed  
**Description**: Create GET /api/admin/consumers/:id and GET /api/admin/agents/:id returning complete user profile, wallet details, recent transactions, agent info if applicable.  
**Estimated Time**: 2 hours

### Task 9.6: Implement System Config Management APIs

**Status**: 🔴 Pending  
**Description**: Create GET /api/admin/config and PUT /api/admin/config/:key endpoints for viewing and updating system configurations (fees, limits, rates).  
**Estimated Time**: 4 hours

### Task 9.7: Implement Agent Approval Dashboard APIs

**Status**: 🟢 Completed  
**Description**: Create GET /api/admin/agents/pending listing pending agent applications, with approve/reject endpoints recording admin decisions.  
**Estimated Time**: 3 hours

### Task 9.8: Create Audit Logs Table and Recording

**Status**: 🔴 Pending  
**Description**: Implement audit_logs table tracking user_id, admin_id, action, entity_type, old_values, new_values for all sensitive operations.  
**Estimated Time**: 4 hours

---

## Phase 10: Analytics & Reporting (SOP Section 8.11)

### Task 10.1: Implement Platform Statistics API

**Status**: 🟢 Completed  
**Description**: Create GET /api/admin/analytics/dashboard returning total users, active users, total transactions by type/status, transaction volume, platform balance, recent transactions.  
**Estimated Time**: 3 hours

### Task 10.2: Implement Transaction Trend Analysis API

**Status**: 🟢 Completed  
**Description**: Create GET /api/admin/analytics/transactions with date range filters, groupBy parameter (day/week/month), returning transaction counts and volumes by status/type with trends.  
**Estimated Time**: 4 hours

### Task 10.3: Implement User Growth Analytics API

**Status**: 🟢 Completed  
**Description**: Create GET /api/admin/analytics/consumers with date range, returning consumer registrations by day, status breakdown, verification stats, and transaction totals.  
**Estimated Time**: 3 hours

### Task 10.4: Implement Agent Performance Analytics API

**Status**: 🟢 Completed  
**Description**: Create GET /api/admin/analytics/agents returning total/active/pending/suspended agents, top agents by commission earned, total commissions paid to platform.  
**Estimated Time**: 3 hours

### Task 10.5: Implement Revenue Reports API

**Status**: 🟢 Completed  
**Description**: Create GET /api/admin/analytics/revenue with date range, returning total fees, fees by transaction type (send money, cash out, bank transfer), commissions paid, net revenue, and revenue trend.  
**Estimated Time**: 4 hours

### Task 10.6: Implement Platform Wallet Statistics API

**Status**: 🟢 Completed  
**Description**: Platform wallet statistics integrated into GET /api/admin/analytics/dashboard returning current balance, total bonuses given, total revenue collected.  
**Estimated Time**: 2 hours

---

## Phase 11: Platform Wallet & Financial Operations (SOP Section 9)

### Task 11.1: Create Platform Wallet Transactions Table

**Status**: 🟢 Completed  
**Description**: Implement platform_wallet_transactions table with transaction_type (FEE_COLLECTED/COMMISSION_PAID/BONUS_GIVEN), entry_type (CREDIT/DEBIT), balance tracking.  
**Estimated Time**: 3 hours

### Task 11.2: Migrate Platform Wallet to Database

**Status**: 🔴 Pending  
**Description**: Replace file-based platform_wallet with database table, implement SELECT FOR UPDATE locking, migrate initialization data.  
**Estimated Time**: 4 hours

### Task 11.3: Integrate Platform Wallet with Fee Collection

**Status**: 🟢 Completed  
**Description**: Credit all transaction fees (send money, cash out, bank transfer) to platform wallet, create platform_wallet_transactions records.  
**Estimated Time**: 3 hours

### Task 11.4: Integrate Platform Wallet with Bonus Distribution

**Status**: 🟢 Completed  
**Description**: Debit onboarding bonuses and cashback from platform wallet, create BONUS_GIVEN/CASHBACK_GIVEN platform wallet transactions.  
**Estimated Time**: 2 hours

### Task 11.5: Integrate Platform Wallet with Commission Payments

**Status**: 🔴 Pending  
**Description**: Debit agent commissions from platform wallet when cash outs completed, create COMMISSION_PAID platform wallet transactions.  
**Estimated Time**: 3 hours

### Task 11.6: Implement Platform Wallet Reconciliation

**Status**: 🔴 Pending  
**Description**: Create reconciliation script verifying SUM(credits) - SUM(debits) = current_balance, detecting discrepancies, generating reports.  
**Estimated Time**: 4 hours

---

## Summary Statistics

**Total Tasks**: 91  
**Completed Tasks**: 61  
**Pending Tasks**: 30  
**Estimated Remaining Time**: ~138 hours (~3.5 weeks)

**Completion by Phase**:

- Phase 1: Database Setup (8/8) 🟢 100%
- Phase 2: Authentication (7/7) 🟢 100%
- Phase 3: Wallet & Transactions (7/7) 🟢 100%
- Phase 4: Add Money (6/6) 🟢 100%
- Phase 5: Cash Out (6/7) 🟡 85.7%
- Phase 6: Bill Payments (0/6) 🔴 0%
- Phase 7: Bank Transfers (5/5) 🟢 100%
- Phase 8: Offers & Cashback (0/6) 🔴 0%
- Phase 9: Admin Dashboard (6/8) 🟡 75%
- Phase 10: Analytics (6/6) 🟢 100%
- Phase 11: Platform Wallet (4/6) 🟡 67%

**Priority Next Steps**:

1. Complete Admin Dashboard (Phase 9 - Tasks 9.6, 9.8)
2. Build Bill Payment System (Phase 6 - All tasks)
3. Implement Offers & Cashback System (Phase 8 - All tasks)
4. Complete Cash Out Feature (Phase 5 - Task 5.3)
5. Finalize Platform Wallet (Phase 11 - Tasks 11.2, 11.5, 11.6)

---

**Created**: January 27, 2026  
**Team**: 03 (Tahsin Ahmed Tushar, Forhad Hassan, Md. Saif Al Islam)
**Based On**: Technical SOP v1.0
