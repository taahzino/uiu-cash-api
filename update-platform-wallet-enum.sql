-- Update platform_wallet_transactions table to add ADD_MONEY_DEPOSIT enum value
USE uiu_cash;

-- Alter the transaction_type column to add the new enum value
ALTER TABLE platform_wallet_transactions 
MODIFY COLUMN transaction_type ENUM(
  'ADD_MONEY_DEPOSIT',
  'FEE_COLLECTED', 
  'COMMISSION_PAID', 
  'BONUS_GIVEN', 
  'CASHBACK_GIVEN', 
  'REVENUE_OTHER', 
  'EXPENSE_OTHER', 
  'SETTLEMENT', 
  'ADJUSTMENT'
) NOT NULL;

SELECT 'Platform wallet transactions table updated successfully' AS Status;
