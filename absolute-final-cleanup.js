const fs = require('fs');

console.log('🔧 ABSOLUTE FINAL DUPLICATE ELIMINATION');
console.log('=======================================');

// Load products
let products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const nonEbayProducts = products.filter(p => p.store !== 'ebay');
let ebayProducts = products.filter(p => p.store === 'ebay');

console.log(`📊 Starting with ${ebayProducts.length} eBay products`);

// Create a map to track unique products by normalized name
const uniqueProducts = [];
const seenNames = new Set();
let removedCount = 0;

ebayProducts.forEach((product, index) => {
  const normalizedName = product.name.toLowerCase().trim();
  
  if (!seenNames.has(normalizedName)) {
    seenNames.add(normalizedName);
    uniqueProducts.push(product);
  } else {
    removedCount++;
    console.log(`🗑️  Removing duplicate #${removedCount}: ${product.name.substring(0, 50)}...`);
  }
});

console.log(`✅ Removed ${removedCount} exact duplicates`);
console.log(`📊 Unique products remaining: ${uniqueProducts.length}`);

// Group by category and ensure exactly 100 each
const byCategory = {};
uniqueProducts.forEach(p => {
  // Normalize category names
  if (p.category === 'Electronics') p.category = 'electronics';
  
  if (!byCategory[p.category]) byCategory[p.category] = [];
  byCategory[p.category].push(p);
});

console.log('📦 Distribution after deduplication:');
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ${cat}: ${byCategory[cat].length} products`);
});

// Trim to exactly 100 per category if needed
Object.keys(byCategory).forEach(category => {
  if (byCategory[category].length > 100) {
    const excess = byCategory[category].length - 100;
    console.log(`✂️  Trimming ${category}: removing ${excess} excess products`);
    byCategory[category] = byCategory[category].slice(0, 100);
  }
});

// Build final list
const finalEbayProducts = Object.values(byCategory).flat();
const finalProducts = [...nonEbayProducts, ...finalEbayProducts];

// Final validation
const finalNames = finalEbayProducts.map(p => p.name.toLowerCase().trim());
const finalUniqueNames = new Set(finalNames);
const stillHasDuplicates = finalNames.length !== finalUniqueNames.size;

console.log('✅ FINAL VALIDATION:');
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`  ✅ ${cat}: ${byCategory[cat].length} products`);
});

console.log(`🔍 Final duplicate check: ${stillHasDuplicates ? '❌ FAILED' : '✅ PASSED'}`);
console.log(`📊 Final eBay products: ${finalEbayProducts.length}`);
console.log(`📊 Final total: ${finalProducts.length}`);

const allHave100 = Object.values(byCategory).every(cat => cat.length === 100);
const hasCorrectCount = Object.keys(byCategory).length === 5;

if (!stillHasDuplicates && allHave100 && hasCorrectCount) {
  fs.writeFileSync('products.json', JSON.stringify(finalProducts, null, 2));
  console.log('💾 ✅ SAVED PERFECT FILE!');
  console.log('🎉 MISSION ACCOMPLISHED - ZERO DUPLICATES!');
  console.log('🚀 SYSTEM IS PRODUCTION READY!');
} else {
  console.log('❌ Issues detected:');
  if (stillHasDuplicates) console.log('  - Still has duplicates');
  if (!allHave100) console.log('  - Categories don\'t have 100 products');
  if (!hasCorrectCount) console.log('  - Wrong category count');
}