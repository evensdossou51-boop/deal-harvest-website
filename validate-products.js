/**
 * Product Validation Script
 * Run this with Node.js before committing products.json to check for duplicates
 * Usage: node validate-products.js
 */

const fs = require('fs');
const path = require('path');

// Read products.json
const productsPath = path.join(__dirname, 'products.json');
let products;

try {
    const data = fs.readFileSync(productsPath, 'utf8');
    products = JSON.parse(data);
    console.log(`✅ Successfully loaded ${products.length} products from products.json\n`);
} catch (error) {
    console.error('❌ Error reading products.json:', error.message);
    process.exit(1);
}

// Validation functions
function validateProducts(products) {
    let hasErrors = false;
    const seen = {
        ids: new Map(),
        names: new Map(),
        links: new Map()
    };
    
    console.log('🔍 Checking for duplicates...\n');
    
    products.forEach((product, index) => {
        // Check ID
        if (product.id) {
            if (seen.ids.has(product.id)) {
                console.error(`❌ DUPLICATE ID: ${product.id}`);
                console.error(`   First occurrence: Index ${seen.ids.get(product.id)} - "${products[seen.ids.get(product.id)].name}"`);
                console.error(`   Duplicate at:     Index ${index} - "${product.name}"\n`);
                hasErrors = true;
            } else {
                seen.ids.set(product.id, index);
            }
        } else {
            console.warn(`⚠️  Missing ID at index ${index}: "${product.name}"`);
        }
        
        // Check name (case-insensitive)
        const normalizedName = product.name?.toLowerCase().trim();
        if (normalizedName) {
            if (seen.names.has(normalizedName)) {
                console.error(`❌ DUPLICATE NAME: "${product.name}"`);
                console.error(`   First occurrence: Index ${seen.names.get(normalizedName)}`);
                console.error(`   Duplicate at:     Index ${index}\n`);
                hasErrors = true;
            } else {
                seen.names.set(normalizedName, index);
            }
        }
        
        // Check affiliate link
        const normalizedLink = product.affiliateLink?.toLowerCase().trim();
        if (normalizedLink) {
            if (seen.links.has(normalizedLink)) {
                console.error(`❌ DUPLICATE AFFILIATE LINK: ${product.affiliateLink}`);
                console.error(`   First occurrence: Index ${seen.links.get(normalizedLink)} - "${products[seen.links.get(normalizedLink)].name}"`);
                console.error(`   Duplicate at:     Index ${index} - "${product.name}"\n`);
                hasErrors = true;
            } else {
                seen.links.set(normalizedLink, index);
            }
        } else {
            console.warn(`⚠️  Missing affiliate link at index ${index}: "${product.name}"`);
        }
        
        // Check required fields
        const requiredFields = ['id', 'name', 'description', 'originalPrice', 'salePrice', 'store', 'category', 'image', 'affiliateLink'];
        const missingFields = requiredFields.filter(field => !product[field]);
        
        if (missingFields.length > 0) {
            console.warn(`⚠️  Index ${index}: "${product.name}" is missing fields: ${missingFields.join(', ')}`);
        }
    });
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total products: ${products.length}`);
    console.log(`Unique IDs: ${seen.ids.size}`);
    console.log(`Unique names: ${seen.names.size}`);
    console.log(`Unique links: ${seen.links.size}`);
    
    if (hasErrors) {
        console.error('\n❌ VALIDATION FAILED - Duplicates found!');
        console.error('Please remove duplicate products before committing.\n');
        process.exit(1);
    } else {
        console.log('\n✅ VALIDATION PASSED - No duplicates found!');
        console.log('Safe to commit products.json\n');
        process.exit(0);
    }
}

// Run validation
validateProducts(products);
