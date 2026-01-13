const platformWallet = require('./index');

console.log('🧪 Testing Platform Wallet Module\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

// Reset wallet before testing
console.log('Resetting platform wallet to initial state...\n');
platformWallet.resetWallet(1000000);

// Test 1: Get Platform Wallet
console.log('Test 1: Get Platform Wallet');
const wallet = platformWallet.getPlatformWallet();
assert(wallet !== null, 'Should return wallet object');
assert(wallet.id === 'PLTWLT01', 'Wallet ID should be PLTWLT01');
console.log(`Wallet: ${wallet.account_name}\n`);

// Test 2: Get Balance
console.log('Test 2: Get Balance');
const balance = platformWallet.getBalance();
assert(balance === 1000000, 'Initial balance should be 1000000');
console.log(`Balance: ৳${balance}\n`);

// Test 3: Check Sufficient Balance - True
console.log('Test 3: Check Sufficient Balance (True)');
const hasSufficient = platformWallet.hasSufficientBalance(50);
assert(hasSufficient === true, 'Should have sufficient balance for ৳50');
console.log(`Has ৳50? ${hasSufficient}\n`);

// Test 4: Check Sufficient Balance - False
console.log('Test 4: Check Sufficient Balance (False)');
const hasInsufficient = platformWallet.hasSufficientBalance(2000000);
assert(hasInsufficient === false, 'Should not have sufficient balance for ৳2000000');
console.log(`Has ৳2000000? ${hasInsufficient}\n`);

// Test 5: Deduct Balance - Onboarding Bonus
console.log('Test 5: Deduct Balance - Onboarding Bonus');
try {
  const result = platformWallet.deductBalance(50, 'Onboarding Bonus');
  assert(result.success === true, 'Deduction should be successful');
  assert(parseFloat(result.balance) === 999950, 'Balance should be 999950 after deducting 50');
  console.log(`Deducted: ৳${result.amount_deducted}, New Balance: ৳${result.balance}\n`);
} catch (error) {
  assert(false, 'Should not throw error for valid deduction');
}

// Test 6: Deduct Balance - Invalid Amount (0)
console.log('Test 6: Deduct Balance - Invalid Amount (0)');
try {
  platformWallet.deductBalance(0, 'Test');
  assert(false, 'Should throw error for amount = 0');
} catch (error) {
  assert(error.message.includes('greater than 0'), 'Should throw "greater than 0" error');
  console.log(`Error caught: ${error.message}\n`);
}

// Test 7: Deduct Balance - Insufficient Balance
console.log('Test 7: Deduct Balance - Insufficient Balance');
try {
  platformWallet.deductBalance(2000000, 'Test');
  assert(false, 'Should throw error for insufficient balance');
} catch (error) {
  assert(error.message.includes('Insufficient'), 'Should throw "Insufficient" error');
  console.log(`Error caught: ${error.message}\n`);
}

// Test 8: Credit Balance - Fee Revenue
console.log('Test 8: Credit Balance - Fee Revenue');
try {
  const result = platformWallet.creditBalance(37, 'Cash Out Fee Revenue');
  assert(result.success === true, 'Credit should be successful');
  assert(parseFloat(result.balance) === 999987, 'Balance should be 999987 after crediting 37');
  console.log(`Credited: ৳${result.amount_credited}, New Balance: ৳${result.balance}\n`);
} catch (error) {
  assert(false, 'Should not throw error for valid credit');
}

// Test 9: Credit Balance - Invalid Amount
console.log('Test 9: Credit Balance - Invalid Amount');
try {
  platformWallet.creditBalance(-10, 'Test');
  assert(false, 'Should throw error for negative amount');
} catch (error) {
  assert(error.message.includes('greater than 0'), 'Should throw "greater than 0" error');
  console.log(`Error caught: ${error.message}\n`);
}

// Test 10: Get Statistics
console.log('Test 10: Get Statistics');
const stats = platformWallet.getStatistics();
assert(stats.current_balance === 999987, 'Current balance should be 999987');
assert(stats.total_bonuses_given === 50, 'Total bonuses should be 50');
assert(stats.total_revenue_collected === 37, 'Total revenue should be 37');
console.log(`Current Balance: ৳${stats.current_balance}`);
console.log(`Total Revenue: ৳${stats.total_revenue_collected}`);
console.log(`Total Bonuses: ৳${stats.total_bonuses_given}`);
console.log(`Net Profit: ৳${stats.net_profit}\n`);

// Test 11: Multiple Deductions (Simulate 10 User Registrations)
console.log('Test 11: Multiple Deductions (10 Onboarding Bonuses)');
let multipleSuccess = true;
for (let i = 0; i < 10; i++) {
  try {
    platformWallet.deductBalance(50, 'Onboarding Bonus');
  } catch (error) {
    multipleSuccess = false;
    break;
  }
}
const balanceAfterMultiple = platformWallet.getBalance();
assert(multipleSuccess === true, 'All 10 deductions should succeed');
assert(balanceAfterMultiple === 999487, 'Balance should be 999487 after 10 more bonuses');
console.log(`After 10 bonuses: ৳${balanceAfterMultiple}\n`);

// Test 12: Multiple Credits (Simulate Revenue Collection)
console.log('Test 12: Multiple Credits (Fee Collection)');
let creditSuccess = true;
for (let i = 0; i < 5; i++) {
  try {
    platformWallet.creditBalance(22, 'Cash Out Fee Revenue');
  } catch (error) {
    creditSuccess = false;
    break;
  }
}
const balanceAfterCredits = platformWallet.getBalance();
assert(creditSuccess === true, 'All 5 credits should succeed');
assert(balanceAfterCredits === 999597, 'Balance should be 999597 after collecting 110 in fees');
console.log(`After 5 fee collections: ৳${balanceAfterCredits}\n`);

// Final Statistics
console.log('═══════════════════════════════════════');
console.log('📊 Final Platform Wallet Statistics');
console.log('═══════════════════════════════════════');
const finalStats = platformWallet.getStatistics();
console.log(`Current Balance: ৳${finalStats.current_balance.toFixed(2)}`);
console.log(`Total Revenue Collected: ৳${finalStats.total_revenue_collected.toFixed(2)}`);
console.log(`Total Bonuses Given: ৳${finalStats.total_bonuses_given.toFixed(2)}`);
console.log(`Total Commissions Paid: ৳${finalStats.total_commissions_paid.toFixed(2)}`);
console.log(`Net Profit: ৳${finalStats.net_profit.toFixed(2)}`);
console.log(`Status: ${finalStats.status}`);
console.log('═══════════════════════════════════════\n');

// Test Summary
console.log('═══════════════════════════════════════');
console.log('📋 Test Summary');
console.log('═══════════════════════════════════════');
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! Platform wallet is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
}
console.log('═══════════════════════════════════════');

// Reset wallet after testing
console.log('\n🔄 Resetting platform wallet to initial state...');
platformWallet.resetWallet(1000000);
console.log('✅ Wallet reset complete.');
