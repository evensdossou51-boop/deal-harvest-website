const fs = require('fs');

console.log('🔧 ULTIMATE FINAL CLEANUP - NO COMPROMISES');
console.log('==========================================');

// Load and separate products
let products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const nonEbayProducts = products.filter(p => p.store !== 'ebay');
let ebayProducts = products.filter(p => p.store === 'ebay');

console.log(`📊 Starting: ${ebayProducts.length} eBay products`);

// 1. Fix ALL category casing issues
console.log('🔧 Standardizing ALL category names...');
ebayProducts.forEach(product => {
  if (product.category === 'Electronics') {
    product.category = 'electronics';
  }
});

// 2. Remove ALL duplicates by name (case-insensitive)
console.log('🧹 Removing ALL duplicates...');
const uniqueMap = new Map();
const cleanProducts = [];

ebayProducts.forEach(product => {
  const key = product.name.toLowerCase().trim();
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, true);
    cleanProducts.push(product);
  }
});

const duplicatesRemoved = ebayProducts.length - cleanProducts.length;
console.log(`✅ Removed ${duplicatesRemoved} duplicates`);
console.log(`📊 Clean unique products: ${cleanProducts.length}`);

// 3. Group by category
const byCategory = {};
cleanProducts.forEach(p => {
  if (!byCategory[p.category]) byCategory[p.category] = [];
  byCategory[p.category].push(p);
});

console.log('📦 Current distribution after cleanup:');
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ${cat}: ${byCategory[cat].length} products`);
});

// 4. Ensure exactly 100 per category (trim if needed)
Object.keys(byCategory).forEach(category => {
  if (byCategory[category].length > 100) {
    console.log(`✂️  Trimming ${category} from ${byCategory[category].length} to 100`);
    byCategory[category] = byCategory[category].slice(0, 100);
  }
});

// 5. Build final list
const finalEbayProducts = Object.values(byCategory).flat();
const finalProducts = [...nonEbayProducts, ...finalEbayProducts];

// 6. Final verification
console.log('✅ FINAL VERIFICATION:');
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ✅ ${cat}: ${byCategory[cat].length} products`);
});

// Check for duplicates one more time
const finalNames = finalEbayProducts.map(p => p.name.toLowerCase().trim());
const uniqueNames = new Set(finalNames);
const hasDuplicates = finalNames.length !== uniqueNames.size;

console.log(`🔍 Final duplicate check: ${hasDuplicates ? '❌ FAILED' : '✅ PASSED'}`);
console.log(`📊 Final totals:`);
console.log(`  - Amazon: ${nonEbayProducts.length}`);
console.log(`  - eBay: ${finalEbayProducts.length}`);
console.log(`  - Total: ${finalProducts.length}`);

// 7. Save if perfect
const allHave100 = Object.values(byCategory).every(cat => cat.length === 100);
const hasExpectedCategories = Object.keys(byCategory).length === 5;

if (!hasDuplicates && allHave100 && hasExpectedCategories) {
  fs.writeFileSync('products.json', JSON.stringify(finalProducts, null, 2));
  console.log('💾 ✅ SAVED PERFECT CLEAN FILE!');
  console.log('🎉 MISSION ACCOMPLISHED - READY FOR PRODUCTION!');
} else {
  console.log('❌ Issues remain:');
  if (hasDuplicates) console.log('  - Has duplicates');
  if (!allHave100) console.log('  - Not all categories have 100 products');
  if (!hasExpectedCategories) console.log('  - Wrong number of categories');
}