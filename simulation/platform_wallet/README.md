# Platform Wallet Simulation

This module simulates the UIU Cash platform's wallet for managing bonuses, commissions, and revenue.

## Overview

The platform wallet is a single account that manages all platform finances:
- **Initial Balance**: ৳1,000,000 (10 lacs)
- **Purpose**: Fund onboarding bonuses, pay agent commissions, collect transaction fees
- **Storage**: File-based JSON simulation

## Data Structure

```json
{
  "platform_wallet": {
    "id": "PLTWLT01",
    "account_name": "UIU Cash Platform",
    "bank_name": "UIU Cash Internal",
    "account_number": "PLATFORM00000001",
    "balance": 1000000.00,
    "currency": "BDT",
    "status": "ACTIVE",
    "description": "Main platform wallet for managing bonuses, commissions, and revenue",
    "created_at": "2024-01-01T00:00:00Z",
    "last_transaction_at": "2024-01-01T00:00:00Z",
    "total_revenue_collected": 0.00,
    "total_bonuses_given": 0.00,
    "total_commissions_paid": 0.00
  }
}
```

## API Functions

### 1. getPlatformWallet()
Returns the complete platform wallet object.

```javascript
const platformWallet = require('./simulation/platform_wallet');
const wallet = platformWallet.getPlatformWallet();
console.log(wallet);
```

### 2. getBalance()
Returns the current balance as a number.

```javascript
const balance = platformWallet.getBalance();
console.log(`Platform Balance: ৳${balance}`);
```

### 3. hasSufficientBalance(amount)
Checks if platform has sufficient balance for an operation.

```javascript
const canGiveBonus = platformWallet.hasSufficientBalance(50);
if (canGiveBonus) {
  // Proceed with bonus
}
```

### 4. deductBalance(amount, reason)
Deducts amount from platform wallet.

**Parameters:**
- `amount` (number): Amount to deduct
- `reason` (string): Reason for deduction

**Returns:** Object with success status, new balance, and amount deducted

**Throws:** Error if insufficient balance

```javascript
try {
  const result = platformWallet.deductBalance(50, 'Onboarding Bonus');
  console.log(`Deducted ৳${result.amount_deducted}, New Balance: ৳${result.balance}`);
} catch (error) {
  console.error(error.message);
}
```

### 5. creditBalance(amount, reason)
Credits amount to platform wallet.

**Parameters:**
- `amount` (number): Amount to credit
- `reason` (string): Reason for credit

**Returns:** Object with success status, new balance, and amount credited

```javascript
const result = platformWallet.creditBalance(37, 'Cash Out Fee');
console.log(`Credited ৳${result.amount_credited}, New Balance: ৳${result.balance}`);
```

### 6. getStatistics()
Returns platform wallet statistics and tracking data.

```javascript
const stats = platformWallet.getStatistics();
console.log(`Revenue: ৳${stats.total_revenue_collected}`);
console.log(`Bonuses Given: ৳${stats.total_bonuses_given}`);
console.log(`Commissions Paid: ৳${stats.total_commissions_paid}`);
console.log(`Net Profit: ৳${stats.net_profit}`);
```

### 7. resetWallet(initialBalance)
Resets platform wallet to initial state (for testing only).

```javascript
platformWallet.resetWallet(1000000);
```

## Usage Examples

### Onboarding Bonus Flow

```javascript
const platformWallet = require('./simulation/platform_wallet');

async function giveOnboardingBonus(userId, walletId, bonusAmount) {
  // 1. Check if platform has sufficient balance
  if (!platformWallet.hasSufficientBalance(bonusAmount)) {
    throw new Error('Platform has insufficient balance to give onboarding bonus');
  }

  // 2. Deduct from platform wallet
  const deduction = platformWallet.deductBalance(bonusAmount, 'Onboarding Bonus');
  console.log(`Platform deducted: ৳${deduction.amount_deducted}`);

  // 3. Credit to user wallet (your existing logic)
  await Wallets.updateBalance(walletId, bonusAmount);

  // 4. Create transaction record
  await Transactions.create({
    user_id: userId,
    wallet_id: walletId,
    transaction_type: 'ONBOARDING_BONUS',
    amount: bonusAmount,
    status: 'COMPLETED'
  });

  return deduction;
}
```

### Cash Out Fee Collection

```javascript
async function processCashOutFee(amount) {
  // Cash out fee: 1.85% of amount
  const feePercentage = 1.85;
  const totalFee = (amount * feePercentage) / 100;

  // Agent commission: 0.75% of amount
  const agentCommission = (amount * 0.75) / 100;

  // Platform revenue: 1.10% of amount (1.85% - 0.75%)
  const platformRevenue = totalFee - agentCommission;

  // Credit platform wallet
  const result = platformWallet.creditBalance(platformRevenue, 'Cash Out Fee Revenue');
  console.log(`Platform collected: ৳${result.amount_credited}`);

  return { totalFee, agentCommission, platformRevenue };
}
```

### Agent Commission Payment

```javascript
async function payAgentCommission(agentId, commissionAmount) {
  // 1. Check platform balance
  if (!platformWallet.hasSufficientBalance(commissionAmount)) {
    throw new Error('Platform has insufficient balance to pay commission');
  }

  // 2. Deduct from platform
  const deduction = platformWallet.deductBalance(commissionAmount, 'Agent Commission');

  // 3. Credit to agent wallet
  await Wallets.updateBalance(agentWalletId, commissionAmount);

  return deduction;
}
```

## Tracking

The platform wallet automatically tracks:
- **total_revenue_collected**: All fees collected from users
- **total_bonuses_given**: All onboarding bonuses distributed
- **total_commissions_paid**: All commissions paid to agents

Use `getStatistics()` to monitor platform profitability.

## Error Handling

Always check for sufficient balance before deducting:

```javascript
if (!platformWallet.hasSufficientBalance(amount)) {
  // Handle insufficient balance scenario
  return { error: 'Platform wallet has insufficient balance' };
}
```

## Integration Points

1. **User Registration** - Deduct onboarding bonus
2. **Cash Out** - Credit platform fee revenue
3. **Bank Transfer** - Credit platform fee revenue
4. **Send Money** - Credit fixed fee
5. **Agent Commission** - Deduct commission payment

## Testing

Run the test suite:

```bash
node simulation/platform_wallet/test.js
```

## Notes

- This is a simulation module, not connected to a real bank account
- All amounts are in BDT (Bangladeshi Taka)
- Balance updates are persisted to data.json file
- Platform should never operate with negative balance
- Use `resetWallet()` for testing purposes only
