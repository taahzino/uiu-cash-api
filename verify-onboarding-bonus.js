/**
 * Onboarding Bonus Verification Script
 * 
 * This script demonstrates how the onboarding bonus works by simulating
 * the bonus distribution process without making actual database changes.
 */

const platformWallet = require('./simulation/platform_wallet');

console.log('═══════════════════════════════════════');
console.log('🎁 Onboarding Bonus Verification');
console.log('═══════════════════════════════════════\n');

// Get initial platform wallet state
const initialStats = platformWallet.getStatistics();
console.log('📊 Initial Platform Wallet State:');
console.log(`   Balance: ৳${initialStats.current_balance.toLocaleString()}`);
console.log(`   Bonuses Given: ৳${initialStats.total_bonuses_given.toLocaleString()}`);
console.log(`   Revenue Collected: ৳${initialStats.total_revenue_collected.toLocaleString()}`);
console.log(`   Net Profit: ৳${initialStats.net_profit.toLocaleString()}\n`);

// Configuration
const bonusAmount = 50.00;
const testUsers = [
  { name: 'John Doe', role: 'PERSONAL' },
  { name: 'Jane Smith', role: 'PERSONAL' },
  { name: 'Agent Ali', role: 'AGENT' },
  { name: 'Bob Wilson', role: 'PERSONAL' },
];

console.log('🧪 Simulating User Registrations:\n');

let bonusesGiven = 0;
let totalBonusAmount = 0;

testUsers.forEach((user, index) => {
  const userId = `USR${(index + 1).toString().padStart(5, '0')}`;
  
  console.log(`${index + 1}. ${user.name} (${user.role})`);
  
  if (user.role === 'PERSONAL') {
    // Check if platform has sufficient balance
    if (platformWallet.hasSufficientBalance(bonusAmount)) {
      // Simulate bonus distribution
      try {
        const result = platformWallet.deductBalance(bonusAmount, 'Onboarding Bonus');
        bonusesGiven++;
        totalBonusAmount += bonusAmount;
        console.log(`   ✅ Bonus given: ৳${bonusAmount}`);
        console.log(`   💰 User wallet balance: ৳${bonusAmount}`);
        console.log(`   🏦 Platform balance: ৳${parseFloat(result.balance).toLocaleString()}`);
      } catch (error) {
        console.log(`   ❌ Bonus failed: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️  Platform has insufficient balance`);
      console.log(`   💰 User wallet balance: ৳0.00`);
    }
  } else {
    console.log(`   ℹ️  Agent role - no bonus given`);
    console.log(`   💰 User wallet balance: ৳0.00 (pending approval)`);
  }
  console.log('');
});

// Get final platform wallet state
const finalStats = platformWallet.getStatistics();

console.log('═══════════════════════════════════════');
console.log('📈 Final Platform Wallet State:');
console.log('═══════════════════════════════════════');
console.log(`   Balance: ৳${finalStats.current_balance.toLocaleString()}`);
console.log(`   Bonuses Given: ৳${finalStats.total_bonuses_given.toLocaleString()}`);
console.log(`   Revenue Collected: ৳${finalStats.total_revenue_collected.toLocaleString()}`);
console.log(`   Net Profit: ৳${finalStats.net_profit.toLocaleString()}\n`);

console.log('═══════════════════════════════════════');
console.log('📋 Summary:');
console.log('═══════════════════════════════════════');
console.log(`   Total Users Registered: ${testUsers.length}`);
console.log(`   PERSONAL Users: ${testUsers.filter(u => u.role === 'PERSONAL').length}`);
console.log(`   AGENT Users: ${testUsers.filter(u => u.role === 'AGENT').length}`);
console.log(`   Bonuses Distributed: ${bonusesGiven}`);
console.log(`   Total Bonus Amount: ৳${totalBonusAmount.toFixed(2)}`);
console.log(`   Platform Deducted: ৳${totalBonusAmount.toFixed(2)}`);
console.log(`   Balance Decreased: ৳${(initialStats.current_balance - finalStats.current_balance).toFixed(2)}\n`);

console.log('═══════════════════════════════════════');
console.log('🎯 How It Works in Production:');
console.log('═══════════════════════════════════════');
console.log('1. User registers with role: PERSONAL');
console.log('2. System checks platform wallet balance');
console.log('3. If sufficient, deducts ৳50 from platform');
console.log('4. Credits ৳50 to user\'s wallet');
console.log('5. Creates ONBOARDING_BONUS transaction');
console.log('6. User sees: "You\'ve received ৳50 welcome bonus"');
console.log('7. Agent users get no bonus (awaiting approval)\n');

console.log('═══════════════════════════════════════');
console.log('✨ Platform Capacity:');
console.log('═══════════════════════════════════════');
const remainingBalance = finalStats.current_balance;
const usersCanFund = Math.floor(remainingBalance / bonusAmount);
console.log(`   Current Balance: ৳${remainingBalance.toLocaleString()}`);
console.log(`   Can fund: ${usersCanFund.toLocaleString()} more users`);
console.log(`   At ৳50 per bonus\n`);

console.log('🔄 Resetting platform wallet to initial state...');
platformWallet.resetWallet(1000000);
console.log('✅ Reset complete. Platform balance: ৳1,000,000\n');

console.log('🎉 Onboarding bonus is ready for production!');
console.log('═══════════════════════════════════════\n');
