// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs
// UIU Cash - Mobile Financial Services Platform Database Schema

// ==================== CORE TABLES ====================

Table users {
  id CHAR(8) [pk, note: 'Unique user identifier']
  email VARCHAR(255) [unique, not null]
  phone VARCHAR(20) [unique, not null, note: 'Bangladeshi phone format']
  password_hash VARCHAR(255) [not null]
  role ENUM('PERSONAL', 'AGENT') [not null]
  status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') [not null, default: 'PENDING']
  first_name VARCHAR(100) [not null]
  last_name VARCHAR(100) [not null]
  date_of_birth DATE [null]
  nid_number VARCHAR(20) [null, note: 'National ID number']
  email_verified BOOLEAN [default: false]
  phone_verified BOOLEAN [default: false]
  last_login_at TIMESTAMP [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    email
    phone
    role
    status
    (first_name, last_name, email) [type: fulltext]
  }
}

Table wallets {
  id CHAR(8) [pk]
  user_id CHAR(8) [unique, not null, ref: > users.id]
  balance DECIMAL(15,2) [default: 0.00, note: 'Current wallet balance']
  available_balance DECIMAL(15,2) [default: 0.00]
  pending_balance DECIMAL(15,2) [default: 0.00]
  currency VARCHAR(3) [default: 'BDT']
  daily_limit DECIMAL(15,2) [default: 50000.00]
  monthly_limit DECIMAL(15,2) [default: 200000.00]
  daily_spent DECIMAL(15,2) [default: 0.00]
  monthly_spent DECIMAL(15,2) [default: 0.00]
  last_transaction_at TIMESTAMP [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    user_id
    balance
  }
}

Table transactions {
  id CHAR(8) [pk]
  transaction_id VARCHAR(50) [unique, not null, note: 'Human-readable transaction ID']
  type ENUM('SEND_MONEY', 'ADD_MONEY', 'CASH_OUT', 'CASH_IN', 'BILL_PAYMENT', 'BANK_TRANSFER', 'CASHBACK', 'COMMISSION', 'ONBOARDING_BONUS') [not null]
  sender_id CHAR(8) [null, ref: > users.id]
  receiver_id CHAR(8) [null, ref: > users.id]
  sender_wallet_id CHAR(8) [null, ref: > wallets.id]
  receiver_wallet_id CHAR(8) [null, ref: > wallets.id]
  amount DECIMAL(15,2) [not null, note: 'Transaction amount']
  fee DECIMAL(15,2) [default: 0.00, note: 'Transaction fee']
  total_amount DECIMAL(15,2) [not null, note: 'Amount + Fee']
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') [default: 'PENDING']
  description TEXT [null]
  reference_number VARCHAR(100) [null]
  metadata JSON [null, note: 'Additional transaction data']
  user_agent TEXT [null]
  initiated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  completed_at TIMESTAMP [null]
  failed_reason TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    transaction_id
    sender_id
    receiver_id
    type
    status
    created_at
    (sender_id, created_at)
    (status, created_at)
  }
}

Table ledgers {
  id CHAR(8) [pk, note: 'Double-entry bookkeeping ledger']
  transaction_id CHAR(8) [not null, ref: > transactions.id]
  wallet_id CHAR(8) [not null, ref: > wallets.id]
  entry_type ENUM('DEBIT', 'CREDIT') [not null]
  amount DECIMAL(15,2) [not null]
  balance_before DECIMAL(15,2) [not null]
  balance_after DECIMAL(15,2) [not null]
  description TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    transaction_id
    wallet_id
    entry_type
    created_at
    (wallet_id, created_at)
  }
}

// ==================== AGENT TABLES ====================

Table agents {
  id CHAR(8) [pk]
  user_id CHAR(8) [unique, not null, ref: > users.id]
  agent_code VARCHAR(20) [unique, not null, note: 'Format: AG + 7 digits']
  business_name VARCHAR(255) [not null]
  business_address TEXT [not null]
  status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') [default: 'PENDING']
  total_cashouts INT [default: 0]
  total_commission_earned DECIMAL(15,2) [default: 0.00]
  approved_by CHAR(8) [null, ref: > admins.id]
  approved_at TIMESTAMP [null]
  rejection_reason TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    user_id
    agent_code
    status
  }
}

Table agent_cashouts {
  id CHAR(8) [pk]
  transaction_id CHAR(8) [unique, not null, ref: > transactions.id]
  agent_id CHAR(8) [not null, ref: > agents.id]
  requester_id CHAR(8) [not null, ref: > users.id, note: 'User requesting cashout']
  amount DECIMAL(15,2) [not null]
  fee DECIMAL(15,2) [default: 0.00]
  commission DECIMAL(15,2) [default: 0.00, note: 'Agent commission']
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') [default: 'PENDING']
  location TEXT [null]
  notes TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    transaction_id
    agent_id
    requester_id
    status
    created_at
  }
}

// ==================== BILL PAYMENT TABLES ====================

Table billers {
  id CHAR(8) [pk]
  name VARCHAR(255) [not null, note: 'Biller company name']
  biller_code VARCHAR(50) [unique, not null]
  bill_type ENUM('ELECTRICITY', 'GAS', 'WATER', 'INTERNET', 'MOBILE', 'TV') [not null]
  balance DECIMAL(15,2) [default: 0.00, note: 'Total collected from payments']
  total_payments INT [default: 0]
  status ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE') [not null, default: 'ACTIVE']
  contact_email VARCHAR(255) [null]
  contact_phone VARCHAR(20) [null]
  description TEXT [null]
  logo_url TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  created_by CHAR(8) [not null, ref: > admins.id]
  
  Indexes {
    biller_code
    bill_type
    status
  }
}

Table bill_payments {
  id CHAR(8) [pk]
  transaction_id CHAR(8) [unique, not null, ref: > transactions.id]
  biller_id CHAR(8) [not null, ref: > billers.id]
  user_id CHAR(8) [not null, ref: > users.id]
  account_number VARCHAR(50) [not null, note: 'Customer account with biller']
  amount DECIMAL(15,2) [not null]
  fee DECIMAL(15,2) [default: 0.00]
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') [default: 'PENDING']
  billing_month VARCHAR(20) [null]
  billing_year INT [null]
  receipt_number VARCHAR(50) [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    transaction_id
    biller_id
    user_id
    status
    created_at
  }
}

// ==================== BANK TRANSFER TABLE ====================

Table bank_transfers {
  id CHAR(8) [pk]
  transaction_id CHAR(8) [unique, not null, ref: > transactions.id]
  user_id CHAR(8) [not null, ref: > users.id]
  bank_name VARCHAR(100) [not null]
  account_name VARCHAR(100) [not null]
  account_number VARCHAR(50) [not null]
  routing_number VARCHAR(50) [null]
  amount DECIMAL(15,2) [not null]
  fee DECIMAL(15,2) [default: 0.00]
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') [default: 'PENDING']
  reference_number VARCHAR(50) [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    transaction_id
    user_id
    status
    created_at
  }
}

// ==================== OFFERS & PROMOTIONS ====================

Table offers {
  id CHAR(8) [pk]
  title VARCHAR(255) [not null]
  description TEXT [null]
  offer_type ENUM('CASHBACK', 'DISCOUNT', 'BONUS') [not null]
  offer_value DECIMAL(10,2) [not null, note: 'Percentage or fixed amount']
  min_transaction_amount DECIMAL(15,2) [default: 0.00]
  max_discount_amount DECIMAL(15,2) [null]
  total_usage_limit INT [null, note: 'Max total uses across all users']
  per_user_limit INT [default: 1, note: 'Max uses per user']
  valid_from TIMESTAMP [not null]
  valid_until TIMESTAMP [not null]
  status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') [default: 'ACTIVE']
  terms_conditions TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    status
    offer_type
    (valid_from, valid_until)
    created_at
  }
}

Table user_offers {
  id CHAR(8) [pk, note: 'Tracks user offer usage']
  user_id CHAR(8) [not null, ref: > users.id]
  offer_id CHAR(8) [not null, ref: > offers.id]
  usage_count INT [default: 0]
  last_used_at TIMESTAMP [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    (user_id, offer_id) [unique]
    user_id
    offer_id
    created_at
  }
}

// ==================== ADMIN & SYSTEM TABLES ====================

Table admins {
  id CHAR(8) [pk]
  email VARCHAR(255) [unique, not null]
  password_hash VARCHAR(255) [not null]
  name VARCHAR(255) [not null]
  status ENUM('ACTIVE', 'SUSPENDED') [not null, default: 'ACTIVE']
  last_login_at TIMESTAMP [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  created_by CHAR(8) [null, ref: > admins.id, note: 'Self-referencing for admin hierarchy']
  
  Indexes {
    email
    status
  }
}

Table system_config {
  id CHAR(8) [pk]
  config_key VARCHAR(100) [unique, not null, note: 'e.g., send_money_fee, onboarding_bonus']
  config_value TEXT [not null]
  description TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    config_key
  }
}

Table platform_wallet_transactions {
  id INT [pk, increment, note: 'Platform revenue/expense tracking']
  transaction_type ENUM('FEE_COLLECTED', 'COMMISSION_PAID', 'BONUS_GIVEN', 'CASHBACK_GIVEN', 'REVENUE_OTHER', 'EXPENSE_OTHER', 'SETTLEMENT', 'ADJUSTMENT') [not null]
  entry_type ENUM('CREDIT', 'DEBIT') [not null, note: 'CREDIT = money in, DEBIT = money out']
  amount DECIMAL(15,2) [not null]
  balance_before DECIMAL(15,2) [not null]
  balance_after DECIMAL(15,2) [not null]
  related_transaction_id CHAR(8) [null, ref: > transactions.id]
  related_user_id CHAR(8) [null, ref: > users.id]
  related_agent_id CHAR(8) [null, ref: > agents.id]
  description TEXT [not null]
  metadata JSON [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    transaction_type
    entry_type
    related_transaction_id
    related_user_id
    related_agent_id
    created_at
    (transaction_type, created_at)
  }
}

Table sessions {
  id CHAR(8) [pk]
  user_id CHAR(8) [not null, ref: > users.id]
  token TEXT [not null]
  user_agent TEXT [null]
  expires_at TIMESTAMP [not null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    user_id
    expires_at
  }
}

Table audit_logs {
  id CHAR(8) [pk, note: 'System-wide audit trail']
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'TRANSACTION', 'STATUS_CHANGE', 'PASSWORD_CHANGE', 'AGENT_APPROVAL') [not null]
  entity_type VARCHAR(50) [not null, note: 'e.g., users, transactions, agents']
  entity_id CHAR(8) [null]
  user_id CHAR(8) [null, ref: > users.id]
  admin_id CHAR(8) [null, ref: > admins.id]
  user_agent TEXT [null]
  old_values JSON [null, note: 'Before state']
  new_values JSON [null, note: 'After state']
  description TEXT [null]
  created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
  
  Indexes {
    action
    (entity_type, entity_id)
    user_id
    admin_id
    created_at
  }
}

// ==================== RELATIONSHIPS SUMMARY ====================
// Core Flow:
// users (1) -> (1) wallets
// users (1) -> (0..1) agents (only if role = AGENT)
// users (many) <-> (many) transactions (as sender or receiver)
// transactions (1) -> (many) ledgers (double-entry bookkeeping)
// wallets (1) -> (many) ledgers

// Agent Flow:
// agents (1) -> (many) agent_cashouts
// agents (1) <- (1) admins (approved_by)

// Bill Payments:
// billers (1) -> (many) bill_payments
// users (1) -> (many) bill_payments

// Bank Transfers:
// users (1) -> (many) bank_transfers

// Offers:
// offers (1) -> (many) user_offers
// users (1) -> (many) user_offers

// Audit & Platform:
// users/admins -> audit_logs (tracking all actions)
// transactions -> platform_wallet_transactions (revenue tracking)
