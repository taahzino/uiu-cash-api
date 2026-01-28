# Platform Wallet Migration Guide

## Overview

The platform wallet has been migrated from a file-based system to a robust database implementation with proper transaction tracking, reconciliation, and admin management APIs.

## What Changed

### Before (File-Based)

- Balance stored in `simulation/platform_wallet/data.json`
- Manual file reads/writes for every operation
- No transaction history
- No locking mechanism for concurrent operations
- Limited tracking capabilities

### After (Database)

- Single `platform_wallet` table with balance and statistics
- Complete `platform_wallet_transactions` table for audit trail
- Row-level locking with `SELECT FOR UPDATE` for concurrency
- Automated reconciliation checks
- Admin APIs for monitoring and reporting

## New Database Tables

### platform_wallet

```sql
- id (Primary Key)
- balance (Current platform balance)
- total_fees_collected (Cumulative fees from users)
- total_commissions_paid (Cumulative commissions to agents)
- total_bonuses_given (Cumulative bonuses/cashback)
- last_transaction_at
- created_at, updated_at
```

### platform_wallet_transactions

```sql
- id (Auto-increment)
- transaction_type (FEE_COLLECTED, COMMISSION_PAID, BONUS_GIVEN, etc.)
- entry_type (CREDIT or DEBIT)
- amount
- balance_before, balance_after
- related_transaction_id, related_user_id, related_agent_id
- description
- metadata (JSON)
- created_at
```

## Migration Steps

### 1. Run Migration Script

```bash
bun run migrate:platform-wallet
```

This script will:

- Check if platform wallet already exists in database
- Read current balance from `simulation/platform_wallet/data.json`
- Initialize database with existing balance
- Verify migration success

### 2. Update package.json

Add script to `package.json`:

```json
{
  "scripts": {
    "migrate:platform-wallet": "bun run src/scripts/migrate-platform-wallet.ts"
  }
}
```

## New Features

### 1. Platform Wallet Model (`PlatformWallet`)

**Methods:**

- `getPlatformWallet()` - Get current wallet state
- `initializePlatformWallet(balance)` - Initialize with balance
- `addBalance(amount, type, description, metadata)` - Credit operation
- `deductBalance(amount, type, description, metadata)` - Debit operation
- `getBalance()` - Get current balance
- `hasSufficientBalance(amount)` - Check if sufficient funds
- `getStatistics()` - Get comprehensive statistics
- `reconcile()` - Perform reconciliation check

### 2. Admin APIs

All routes require admin authentication: `/api/admin/platform-wallet`

#### Get Statistics

```
GET /api/admin/platform-wallet/stats
```

Returns: balance, fees collected, commissions paid, bonuses given, net revenue

#### Perform Reconciliation

```
GET /api/admin/platform-wallet/reconcile
```

Returns: success status, current balance, calculated balance, discrepancy

#### Get Transaction History

```
GET /api/admin/platform-wallet/transactions?page=1&limit=50&type=FEE_COLLECTED&startDate=2025-01-01&endDate=2025-01-31
```

Returns: Paginated transaction history with filters

#### Get Revenue Summary

```
GET /api/admin/platform-wallet/revenue-summary?startDate=2025-01-01&endDate=2025-01-31
```

Returns: All-time and period-specific revenue breakdown

## Integration Points

### Cash Out Controller

When agent commission is paid:

```typescript
await PlatformWallet.deductBalance(
  commission,
  PlatformTransactionType.COMMISSION_PAID,
  `Commission paid to agent ${agentCode}`,
  { relatedTransactionId, relatedAgentId, relatedUserId },
);
```

### Fee Collection (Already Integrated)

Transaction fees automatically credited to platform wallet via `PlatformWalletTransactions.createTransaction()`

### Bonus Distribution (Already Integrated)

Bonuses automatically debited from platform wallet

## Reconciliation

The reconciliation feature ensures data integrity:

```typescript
const result = await PlatformWallet.reconcile();
// Returns:
// {
//   success: true/false,
//   currentBalance: 50000.00,
//   calculatedBalance: 50000.00,
//   discrepancy: 0.00,
//   message: "Platform wallet reconciliation successful"
// }
```

**Formula:**

```
calculatedBalance = SUM(CREDIT transactions) - SUM(DEBIT transactions)
discrepancy = |currentBalance - calculatedBalance|
success = discrepancy < 0.01 (allowing tiny rounding errors)
```

## Transaction Types

### Credits (Money IN)

- `FEE_COLLECTED` - Transaction fees from users
- `ADD_MONEY_DEPOSIT` - Deposits from external banks
- `REVENUE_OTHER` - Other platform revenue
- `SETTLEMENT` - Settlement operations
- `ADJUSTMENT` - Manual adjustments

### Debits (Money OUT)

- `COMMISSION_PAID` - Agent commissions
- `BONUS_GIVEN` - User bonuses
- `CASHBACK_GIVEN` - Promotional cashback
- `EXPENSE_OTHER` - Other platform expenses

## Error Handling

The system prevents:

- **Negative Balance:** `CHECK (balance >= 0)` constraint
- **Insufficient Funds:** Pre-check before deduction
- **Concurrent Updates:** Row locking with `FOR UPDATE`
- **Transaction Failures:** Automatic rollback on errors

## Monitoring & Maintenance

### Daily Checks

1. Run reconciliation: `GET /api/admin/platform-wallet/reconcile`
2. Check statistics: `GET /api/admin/platform-wallet/stats`
3. Review recent transactions: `GET /api/admin/platform-wallet/transactions?page=1`

### Monthly Reports

1. Revenue summary: `GET /api/admin/platform-wallet/revenue-summary?startDate=YYYY-MM-01&endDate=YYYY-MM-31`
2. Transaction trends by type
3. Commission vs. fee analysis

## Troubleshooting

### Reconciliation Fails

If discrepancy detected:

1. Check `platform_wallet_transactions` for missing/duplicate entries
2. Review recent COMMISSION_PAID transactions
3. Verify FEE_COLLECTED amounts match transaction records
4. Check for manual database edits

### Balance Mismatch

```sql
-- Verify calculated balance
SELECT
  SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as credits,
  SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as debits,
  SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END) as net
FROM platform_wallet_transactions;

-- Compare with current balance
SELECT balance FROM platform_wallet LIMIT 1;
```

## Benefits

✅ **Concurrency Safe:** Row locking prevents race conditions  
✅ **Audit Trail:** Complete transaction history  
✅ **Reconciliation:** Automatic balance verification  
✅ **Statistics:** Real-time revenue tracking  
✅ **Admin Control:** Full monitoring and reporting APIs  
✅ **Scalable:** Database-backed for production use

## Next Steps

1. Run migration script to transfer file-based balance
2. Test all endpoints with Postman/Thunder Client
3. Set up daily reconciliation cron job
4. Monitor platform wallet balance growth
5. Generate monthly revenue reports

---

**Migration Date:** January 2025  
**Status:** ✅ Complete  
**Phase:** 11 - Platform Wallet & Financial Operations
