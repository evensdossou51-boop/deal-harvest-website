const fs = require('fs');

console.log('🔧 FINAL COMPREHENSIVE CLEANUP');
console.log('================================');

// Load products
let products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const nonEbayProducts = products.filter(p => p.store !== 'ebay');
let ebayProducts = products.filter(p => p.store === 'ebay');

console.log('📊 Starting with:', ebayProducts.length, 'eBay products');

// 1. Remove ALL duplicates (keep first occurrence)
console.log('🧹 Removing duplicates...');
const seen = new Set();
const uniqueProducts = [];
let duplicatesRemoved = 0;

ebayProducts.forEach(product => {
  const key = product.name.toLowerCase().trim();
  if (!seen.has(key)) {
    seen.add(key);
    uniqueProducts.push(product);
  } else {
    duplicatesRemoved++;
  }
});

console.log('✅ Removed', duplicatesRemoved, 'duplicates');
console.log('📊 Unique products:', uniqueProducts.length);

// 2. Fix category casing (electronics vs Electronics)
console.log('🔧 Standardizing categories...');
uniqueProducts.forEach(product => {
  if (product.category === 'Electronics') {
    product.category = 'electronics';
  }
});

// 3. Group by category and ensure exactly 100 each
console.log('📦 Organizing categories...');
const byCategory = {};
uniqueProducts.forEach(p => {
  if (!byCategory[p.category]) byCategory[p.category] = [];
  byCategory[p.category].push(p);
});

// Show current distribution
console.log('📊 Current distribution:');
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ${cat}: ${byCategory[cat].length} products`);
});

// Trim to exactly 100 per category
Object.keys(byCategory).forEach(category => {
  if (byCategory[category].length > 100) {
    console.log(`✂️  Trimming ${category} from ${byCategory[category].length} to 100`);
    byCategory[category] = byCategory[category].slice(0, 100);
  }
});

// 4. Rebuild final list
const finalEbayProducts = Object.values(byCategory).flat();
const finalProducts = [...nonEbayProducts, ...finalEbayProducts];

// 5. Final verification
console.log('✅ FINAL VERIFICATION:');
console.log('📊 Final distribution:');
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ✅ ${cat}: ${byCategory[cat].length} products`);
});

console.log('📈 Totals:');
console.log(`  - Amazon: ${nonEbayProducts.length}`);
console.log(`  - eBay: ${finalEbayProducts.length}`);
console.log(`  - Total: ${finalProducts.length}`);

// 6. Double-check for duplicates
const finalNames = finalEbayProducts.map(p => p.name.toLowerCase().trim());
const finalUnique = new Set(finalNames);
const stillHasDuplicates = finalNames.length !== finalUnique.size;

console.log(`🔍 Duplicate check: ${stillHasDuplicates ? '❌ FAILED' : '✅ PASSED'}`);

if (!stillHasDuplicates) {
  fs.writeFileSync('products.json', JSON.stringify(finalProducts, null, 2));
  console.log('💾 Saved clean products.json');
  console.log('🎉 CLEANUP COMPLETE - READY FOR PRODUCTION!');
} else {
  console.log('❌ Still has duplicates - manual inspection needed');
}