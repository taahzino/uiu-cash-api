const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

/**
 * Load bank accounts data from JSON file
 */
function loadBankAccounts() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading bank accounts:', error.message);
    return { bank_accounts: [] };
  }
}

/**
 * Save bank accounts data to JSON file
 */
function saveBankAccounts(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving bank accounts:', error.message);
    return false;
  }
}

/**
 * Find bank account by card number
 * @param {string} cardNumber - 16-digit card number
 * @returns {object|null} Bank account or null
 */
function findByCardNumber(cardNumber) {
  const data = loadBankAccounts();
  const account = data.bank_accounts.find(acc => acc.card && acc.card.card_number === cardNumber);
  return account || null;
}

/**
 * Find bank account by account number
 * @param {string} accountNumber - 16-digit account number
 * @returns {object|null} Bank account or null
 */
function findByAccountNumber(accountNumber) {
  const data = loadBankAccounts();
  const account = data.bank_accounts.find(acc => acc.account_number === accountNumber);
  return account || null;
}

/**
 * Find bank account by ID
 * @param {string} id - Bank account ID (e.g., BNK00001)
 * @returns {object|null} Bank account or null
 */
function findById(id) {
  const data = loadBankAccounts();
  const account = data.bank_accounts.find(acc => acc.id === id);
  return account || null;
}

/**
 * Verify card credentials
 * @param {string} cardNumber - 16-digit card number
 * @param {string} cvv - 3-digit CVV
 * @param {string} expiryMonth - 2-digit month (01-12)
 * @param {string} expiryYear - 2-digit year (YY format)
 * @returns {object} Verification result with success status and message
 */
function verifyCard(cardNumber, cvv, expiryMonth, expiryYear) {
  const account = findByCardNumber(cardNumber);
  
  if (!account) {
    return {
      success: false,
      message: 'Invalid card details',
      account: null
    };
  }

  if (account.status !== 'ACTIVE') {
    return {
      success: false,
      message: 'Account associated with this card is not active',
      account: null
    };
  }

  if (account.card.card_cvv !== cvv) {
    return {
      success: false,
      message: 'Invalid CVV',
      account: null
    };
  }

  // Validate card expiry
  const cardExpiry = account.card.card_expiry.split('/'); // Format: MM/YY
  const cardMonth = cardExpiry[0];
  const cardYear = cardExpiry[1];

  if (expiryMonth !== cardMonth || expiryYear !== cardYear) {
    return {
      success: false,
      message: 'Invalid card expiry date',
      account: null
    };
  }

  // Check if card has expired
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const expYear = parseInt(cardYear);
  const expMonth = parseInt(cardMonth);

  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return {
      success: false,
      message: 'Card has expired',
      account: null
    };
  }

  return {
    success: true,
    message: 'Card verified successfully',
    account: {
      id: account.id,
      account_number: account.account_number,
      account_holder_name: account.account_holder_name,
      bank_name: account.bank_name,
      branch_name: account.branch_name,
      account_type: account.account_type,
      balance: account.balance,
      card_type: account.card.card_type,
      card_last_4: cardNumber.slice(-4)
    }
  };
}

/**
 * Verify bank account credentials (legacy - for backwards compatibility)
 * @param {string} accountNumber - 16-digit account number
 * @param {string} pin - 4-digit PIN
 * @returns {object} Verification result with success status and message
 */
function verifyAccount(accountNumber, pin) {
  const account = findByAccountNumber(accountNumber);
  
  if (!account) {
    return {
      success: false,
      message: 'Bank account not found',
      account: null
    };
  }

  if (account.status !== 'ACTIVE') {
    return {
      success: false,
      message: 'Bank account is not active',
      account: null
    };
  }

  if (account.pin !== pin) {
    return {
      success: false,
      message: 'Invalid PIN',
      account: null
    };
  }

  return {
    success: true,
    message: 'Account verified successfully',
    account: {
      id: account.id,
      account_number: account.account_number,
      account_holder_name: account.account_holder_name,
      bank_name: account.bank_name,
      branch_name: account.branch_name,
      account_type: account.account_type,
      balance: account.balance
    }
  };
}

/**
 * Check if bank account has sufficient balance
 * @param {string} accountNumber - 16-digit account number
 * @param {number} amount - Amount to check
 * @returns {object} Result with success status and message
 */
function checkBalance(accountNumber, amount) {
  const account = findByAccountNumber(accountNumber);
  
  if (!account) {
    return {
      success: false,
      message: 'Bank account not found',
      available_balance: 0
    };
  }

  if (account.balance < amount) {
    return {
      success: false,
      message: 'Insufficient balance',
      available_balance: account.balance,
      required_amount: amount,
      shortfall: amount - account.balance
    };
  }

  return {
    success: true,
    message: 'Sufficient balance available',
    available_balance: account.balance,
    required_amount: amount
  };
}

/**
 * Deduct amount from bank account via card (for ADD_MONEY transactions)
 * @param {string} cardNumber - 16-digit card number
 * @param {string} cvv - 3-digit CVV
 * @param {string} expiryMonth - 2-digit month
 * @param {string} expiryYear - 2-digit year
 * @param {number} amount - Amount to deduct
 * @returns {object} Transaction result
 */
function deductFromAccountByCard(cardNumber, cvv, expiryMonth, expiryYear, amount) {
  // Verify card first
  const verification = verifyCard(cardNumber, cvv, expiryMonth, expiryYear);
  if (!verification.success) {
    return verification;
  }

  // Load data and find account by card number
  const data = loadBankAccounts();
  const accountIndex = data.bank_accounts.findIndex(acc => acc.card && acc.card.card_number === cardNumber);
  
  if (accountIndex === -1) {
    return {
      success: false,
      message: 'Account not found during deduction'
    };
  }

  // Check balance
  const account = data.bank_accounts[accountIndex];
  if (account.balance < amount) {
    return {
      success: false,
      message: 'Insufficient balance',
      available_balance: account.balance,
      required_amount: amount,
      shortfall: amount - account.balance
    };
  }

  // Deduct amount
  const oldBalance = data.bank_accounts[accountIndex].balance;
  data.bank_accounts[accountIndex].balance -= amount;
  const newBalance = data.bank_accounts[accountIndex].balance;

  // Save updated data
  const saved = saveBankAccounts(data);
  if (!saved) {
    return {
      success: false,
      message: 'Failed to save transaction'
    };
  }

  return {
    success: true,
    message: 'Amount deducted successfully',
    transaction: {
      card_number: cardNumber,
      card_last_4: cardNumber.slice(-4),
      card_type: account.card.card_type,
      account_holder_name: account.account_holder_name,
      bank_name: account.bank_name,
      amount_deducted: amount,
      old_balance: oldBalance,
      new_balance: newBalance
    }
  };
}

/**
 * Deduct amount from bank account (legacy - for backwards compatibility)
 * @param {string} accountNumber - 16-digit account number
 * @param {string} pin - 4-digit PIN
 * @param {number} amount - Amount to deduct
 * @returns {object} Transaction result
 */
function deductFromAccount(accountNumber, pin, amount) {
  // Verify account first
  const verification = verifyAccount(accountNumber, pin);
  if (!verification.success) {
    return verification;
  }

  // Check balance
  const balanceCheck = checkBalance(accountNumber, amount);
  if (!balanceCheck.success) {
    return balanceCheck;
  }

  // Load data and find account index
  const data = loadBankAccounts();
  const accountIndex = data.bank_accounts.findIndex(acc => acc.account_number === accountNumber);
  
  if (accountIndex === -1) {
    return {
      success: false,
      message: 'Account not found during deduction'
    };
  }

  // Deduct amount
  const oldBalance = data.bank_accounts[accountIndex].balance;
  data.bank_accounts[accountIndex].balance -= amount;
  const newBalance = data.bank_accounts[accountIndex].balance;

  // Save updated data
  const saved = saveBankAccounts(data);
  if (!saved) {
    return {
      success: false,
      message: 'Failed to save transaction'
    };
  }

  return {
    success: true,
    message: 'Amount deducted successfully',
    transaction: {
      account_number: accountNumber,
      account_holder_name: data.bank_accounts[accountIndex].account_holder_name,
      bank_name: data.bank_accounts[accountIndex].bank_name,
      amount_deducted: amount,
      old_balance: oldBalance,
      new_balance: newBalance
    }
  };
}

/**
 * Add amount to bank account (for BANK_TRANSFER transactions)
 * @param {string} accountNumber - 16-digit account number
 * @param {number} amount - Amount to add
 * @returns {object} Transaction result
 */
function addToAccount(accountNumber, amount) {
  const account = findByAccountNumber(accountNumber);
  
  if (!account) {
    return {
      success: false,
      message: 'Bank account not found'
    };
  }

  if (account.status !== 'ACTIVE') {
    return {
      success: false,
      message: 'Bank account is not active'
    };
  }

  // Load data and find account index
  const data = loadBankAccounts();
  const accountIndex = data.bank_accounts.findIndex(acc => acc.account_number === accountNumber);
  
  if (accountIndex === -1) {
    return {
      success: false,
      message: 'Account not found during credit'
    };
  }

  // Add amount
  const oldBalance = data.bank_accounts[accountIndex].balance;
  data.bank_accounts[accountIndex].balance += amount;
  const newBalance = data.bank_accounts[accountIndex].balance;

  // Save updated data
  const saved = saveBankAccounts(data);
  if (!saved) {
    return {
      success: false,
      message: 'Failed to save transaction'
    };
  }

  return {
    success: true,
    message: 'Amount credited successfully',
    transaction: {
      account_number: accountNumber,
      account_holder_name: data.bank_accounts[accountIndex].account_holder_name,
      bank_name: data.bank_accounts[accountIndex].bank_name,
      amount_credited: amount,
      old_balance: oldBalance,
      new_balance: newBalance
    }
  };
}

/**
 * Get all bank accounts (for admin/testing purposes)
 * @returns {array} Array of bank accounts
 */
function getAllAccounts() {
  const data = loadBankAccounts();
  return data.bank_accounts.map(acc => ({
    id: acc.id,
    account_number: acc.account_number,
    account_holder_name: acc.account_holder_name,
    bank_name: acc.bank_name,
    branch_name: acc.branch_name,
    account_type: acc.account_type,
    balance: acc.balance,
    status: acc.status
  }));
}

/**
 * Get account balance (without PIN, for display purposes)
 * @param {string} accountNumber - 16-digit account number
 * @returns {object} Balance information
 */
function getBalance(accountNumber) {
  const account = findByAccountNumber(accountNumber);
  
  if (!account) {
    return {
      success: false,
      message: 'Bank account not found'
    };
  }

  return {
    success: true,
    account_number: accountNumber,
    account_holder_name: account.account_holder_name,
    bank_name: account.bank_name,
    balance: account.balance,
    status: account.status
  };
}

/**
 * Validate account number format
 * @param {string} accountNumber - Account number to validate
 * @returns {boolean} True if valid format
 */
function isValidAccountNumber(accountNumber) {
  return /^\d{16}$/.test(accountNumber);
}

/**
 * Validate PIN format
 * @param {string} pin - PIN to validate
 * @returns {boolean} True if valid format
 */
function isValidPin(pin) {
  return /^\d{4}$/.test(pin);
}

module.exports = {
  findByCardNumber,
  findByAccountNumber,
  findById,
  verifyCard,
  verifyAccount,
  checkBalance,
  deductFromAccountByCard,
  deductFromAccount,
  addToAccount,
  getAllAccounts,
  getBalance,
  isValidAccountNumber,
  isValidPin
};
