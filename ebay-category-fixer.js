/**
 * eBay Product Category Fixer
 * Removes duplicates and fixes categorization to ensure unique products per category
 */

const fs = require('fs');
const { execSync } = require('child_process');

class EbayProductCategoryFixer {
    constructor() {
        this.categoryPriority = [
            'christmas',
            'digital-diy', 
            'electronics',
            'health-fitness',
            'home-decor'
        ];
    }

    // Enhanced category detection with priority system
    detectCorrectCategory(product) {
        const name = product.name.toLowerCase();
        const description = product.description.toLowerCase();
        const fullText = `${name} ${description}`;

        // Christmas/Holiday (highest priority during season)
        if (this.isChristmasProduct(fullText)) {
            return 'christmas';
        }

        // Digital & DIY (high priority for digital items)
        if (this.isDigitalDIYProduct(fullText)) {
            return 'digital-diy';
        }

        // Electronics & Tech  
        if (this.isElectronicsProduct(fullText)) {
            return 'electronics';
        }

        // Health & Fitness
        if (this.isHealthFitnessProduct(fullText)) {
            return 'health-fitness';
        }

        // Home & Decor (default for many items)
        if (this.isHomeDecorProduct(fullText)) {
            return 'home-decor';
        }

        // Default fallback
        return 'electronics';
    }

    isChristmasProduct(text) {
        const christmasKeywords = [
            'christmas', 'holiday', 'xmas', 'santa', 'reindeer', 'snowman', 
            'festive', 'winter', 'snow', 'ornament', 'wreath', 'garland',
            'advent', 'december', 'seasonal', 'ho ho ho', 'merry', 'jolly',
            'elf', 'north pole', 'sleigh', 'mistletoe', 'candy cane'
        ];
        return christmasKeywords.some(keyword => text.includes(keyword));
    }

    isDigitalDIYProduct(text) {
        const digitalKeywords = [
            'digital download', 'printable', 'digital art', 'digital print',
            'download', 'pdf', 'jpeg file', 'digital template', 'clipart',
            'digital graphic', 'print file', 'instant download', 'svg',
            'digital scrapbook', 'printable planner', 'digital poster',
            'art print file', 'no physical item', 'digital illustration'
        ];
        
        const diyKeywords = [
            'diy', 'craft', 'handmade', 'supplies', 'button maker',
            'badge button', 'vinyl decal', 'sticker', 'decal sticker',
            'craft supplies', 'diy project', 'craft materials'
        ];

        return digitalKeywords.some(keyword => text.includes(keyword)) ||
               diyKeywords.some(keyword => text.includes(keyword));
    }

    isElectronicsProduct(text) {
        const electronicsKeywords = [
            'bluetooth', 'wireless', 'smart watch', 'fitness tracker', 'headphone',
            'earphone', 'speaker', 'charger', 'cable', 'usb', 'electronic',
            'phone', 'tablet', 'computer', 'tech', 'gadget', 'device',
            'battery', 'power bank', 'adapter', 'connector', 'audio',
            'smartphone', 'iphone', 'android', 'charging', 'cord'
        ];
        
        // Exclude if it's clearly DIY/craft related
        if (text.includes('decal') || text.includes('sticker') || text.includes('vinyl')) {
            return false;
        }
        
        return electronicsKeywords.some(keyword => text.includes(keyword));
    }

    isHealthFitnessProduct(text) {
        const healthFitnessKeywords = [
            'fitness', 'workout', 'exercise', 'gym', 'yoga', 'health',
            'protein', 'supplement', 'vitamins', 'wellness', 'sports',
            'resistance band', 'weights', 'dumbbell', 'treadmill',
            'fitness equipment', 'exercise bike', 'foam roller',
            'yoga mat', 'pilates', 'running', 'jogging', 'athletics'
        ];
        
        // But exclude if it's automotive or other non-fitness
        if (text.includes('car') || text.includes('auto') || text.includes('truck') || 
            text.includes('vehicle') || text.includes('pcv valve')) {
            return false;
        }
        
        return healthFitnessKeywords.some(keyword => text.includes(keyword));
    }

    isHomeDecorProduct(text) {
        const homeDecorKeywords = [
            'home decor', 'wall decor', 'decor', 'decoration', 'decorative',
            'wall art', 'picture frame', 'vase', 'candle', 'pillow',
            'throw', 'rug', 'curtain', 'blind', 'lamp', 'lighting',
            'furniture', 'storage', 'organization', 'kitchen', 'bathroom',
            'bedroom', 'living room', 'dining', 'home', 'house'
        ];
        
        return homeDecorKeywords.some(keyword => text.includes(keyword));
    }

    // Remove exact duplicates based on name
    removeDuplicates(products) {
        const seen = new Map();
        const unique = [];
        
        for (const product of products) {
            // Create a key based on normalized name
            const key = product.name.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (!seen.has(key)) {
                seen.set(key, true);
                unique.push(product);
            } else {
                console.log(`🗑️ Removing duplicate: "${product.name}"`);
            }
        }
        
        return unique;
    }

    // Ensure balanced distribution across categories
    balanceCategories(products, targetPerCategory = 100) {
        const categorized = {};
        
        // Initialize categories
        this.categoryPriority.forEach(cat => {
            categorized[cat] = [];
        });
        
        // First pass: categorize all products
        for (const product of products) {
            const correctCategory = this.detectCorrectCategory(product);
            product.category = correctCategory;
            categorized[correctCategory].push(product);
        }
        
        // Second pass: balance categories
        const balanced = [];
        
        for (const category of this.categoryPriority) {
            const categoryProducts = categorized[category];
            const shuffled = categoryProducts.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, targetPerCategory);
            
            console.log(`📊 ${category}: ${categoryProducts.length} → ${selected.length} products`);
            balanced.push(...selected);
        }
        
        return balanced;
    }

    async fixCategories() {
        console.log('🔧 Starting eBay category fix...\n');
        
        // Load existing products
        const allProducts = JSON.parse(fs.readFileSync('products.json', 'utf8'));
        const amazonProducts = allProducts.filter(p => p.store !== 'ebay');
        let ebayProducts = allProducts.filter(p => p.store === 'ebay');
        
        console.log(`📊 Current state:`);
        console.log(`- Amazon products: ${amazonProducts.length}`);
        console.log(`- eBay products: ${ebayProducts.length}`);
        
        // Step 1: Remove duplicates
        console.log('\n🗑️ Removing duplicates...');
        const uniqueEbayProducts = this.removeDuplicates(ebayProducts);
        console.log(`- Removed ${ebayProducts.length - uniqueEbayProducts.length} duplicates`);
        
        // Step 2: Fix categorization and balance
        console.log('\n📂 Recategorizing and balancing...');
        const balancedEbayProducts = this.balanceCategories(uniqueEbayProducts, 100);
        
        // Step 3: Combine all products
        const finalProducts = [...amazonProducts, ...balancedEbayProducts];
        
        console.log(`\n✅ FINAL RESULTS:`);
        console.log(`- Amazon products: ${amazonProducts.length}`);
        console.log(`- eBay products: ${balancedEbayProducts.length}`);
        console.log(`- Total products: ${finalProducts.length}`);
        
        // Show category distribution
        const categoryCount = {};
        balancedEbayProducts.forEach(p => {
            categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        });
        
        console.log('\n📊 eBay Category Distribution:');
        Object.entries(categoryCount).forEach(([cat, count]) => {
            console.log(`- ${cat}: ${count} products`);
        });
        
        // Save products
        fs.writeFileSync('products.json', JSON.stringify(finalProducts, null, 2));
        console.log('\n💾 Saved fixed products to products.json');
        
        // Push to GitHub
        try {
            console.log('📤 Pushing to GitHub...');
            execSync('git add products.json', { stdio: 'inherit' });
            execSync(`git commit -m "🔧 Fix eBay categories: Remove duplicates and ensure unique products per category - ${balancedEbayProducts.length} eBay products properly categorized"`, { stdio: 'inherit' });
            execSync('git push origin main', { stdio: 'inherit' });
            console.log('✅ Successfully pushed to GitHub');
        } catch (error) {
            console.error('❌ Git push failed:', error.message);
        }
        
        return finalProducts;
    }
}

// CLI Usage
if (require.main === module) {
    const fixer = new EbayProductCategoryFixer();
    
    (async () => {
        try {
            await fixer.fixCategories();
        } catch (error) {
            console.error('❌ Fix operation failed:', error.message);
        }
    })();
}

module.exports = EbayProductCategoryFixer;