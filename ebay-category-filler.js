/**
 * eBay Category Filler - Reaches 100 products per category
 * Fills categories that are below 100 products with additional quality items
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// Load eBay configuration
let EBAY_CONFIG = {};
try {
    const localConfig = require('./ebay-config.local.js');
    EBAY_CONFIG = { ...EBAY_CONFIG, ...localConfig };
    console.log('✅ Using local eBay configuration');
} catch (error) {
    console.log('❌ Could not load eBay configuration');
    process.exit(1);
}

class EbayCategoryFiller {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        
        // Expanded search strategies for each category
        this.fillStrategies = {
            christmas: [
                'christmas ornaments',
                'holiday decorations',
                'christmas tree',
                'holiday gifts',
                'winter decor',
                'christmas stockings',
                'holiday party',
                'christmas wreath',
                'holiday lights',
                'christmas candles',
                'festive decor',
                'santa decoration',
                'reindeer decor',
                'snowman decoration',
                'holiday wreaths',
                'christmas garland',
                'advent calendar',
                'christmas snow globe',
                'holiday table decor',
                'christmas village'
            ],
            electronics: [
                'bluetooth speaker',
                'wireless earbuds',
                'phone case',
                'charging cable',
                'power bank',
                'smart watch',
                'phone holder',
                'bluetooth headphones',
                'wireless charger',
                'phone accessories',
                'tablet case',
                'screen protector',
                'phone stand',
                'car charger',
                'usb cable',
                'bluetooth adapter',
                'phone mount',
                'tech gadgets',
                'electronic accessories',
                'portable speaker'
            ],
            'home-decor': [
                'wall decor',
                'home decor',
                'decorative pillows',
                'wall art',
                'picture frames',
                'candle holders',
                'vases',
                'home accessories',
                'decorative objects',
                'wall hangings',
                'decorative bowls',
                'home organization',
                'decorative storage',
                'accent decor',
                'seasonal decor',
                'rustic decor',
                'modern decor',
                'vintage decor',
                'minimalist decor',
                'bohemian decor'
            ],
            'health-fitness': [
                'fitness tracker',
                'yoga mat',
                'resistance bands',
                'workout gloves',
                'protein shaker',
                'fitness accessories',
                'exercise equipment',
                'yoga blocks',
                'fitness watch',
                'workout gear',
                'gym accessories',
                'fitness band',
                'exercise ball',
                'foam roller',
                'fitness equipment',
                'workout clothes',
                'sports water bottle',
                'fitness bag',
                'exercise mat',
                'health monitor'
            ],
            'digital-diy': [
                'digital download',
                'printable art',
                'craft supplies',
                'diy kit',
                'digital template',
                'printable planner',
                'craft materials',
                'digital clipart',
                'printable stickers',
                'diy project',
                'craft tools',
                'digital graphics',
                'printable cards',
                'craft paper',
                'digital prints',
                'printable wall art',
                'craft patterns',
                'digital scrapbook',
                'printable labels',
                'diy supplies'
            ]
        };
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry > Date.now()) {
            return this.accessToken;
        }

        return new Promise((resolve, reject) => {
            const credentials = Buffer.from(`${EBAY_CONFIG.APP_ID}:${EBAY_CONFIG.CERT_ID}`).toString('base64');
            const postData = 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope';

            const options = {
                hostname: 'api.ebay.com',
                path: '/identity/v1/oauth2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`,
                    'Content-Length': postData.length
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.access_token) {
                            this.accessToken = response.access_token;
                            this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000;
                            resolve(this.accessToken);
                        } else {
                            reject(new Error('Failed to get access token'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    async searchProducts(query, limit = 10) {
        const token = await this.getAccessToken();

        const params = new URLSearchParams({
            q: query,
            limit: limit.toString(),
            filter: 'buyingOptions:{AUCTION|FIXED_PRICE},conditions:{NEW|USED|REFURBISHED},price:[..75]',
            sort: 'price',
            fieldgroups: 'MATCHING_ITEMS,EXTENDED'
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.ebay.com',
                path: `/buy/browse/v1/item_summary/search?${params}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response.itemSummaries || []);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    convertEbayItem(ebayItem, category) {
        const price = ebayItem.price?.value ? parseFloat(ebayItem.price.value) : 0;
        const originalPrice = ebayItem.marketingPrice?.originalPrice?.value ? 
            parseFloat(ebayItem.marketingPrice.originalPrice.value) : null;

        const isOnSale = originalPrice && originalPrice > price;
        const discount = isOnSale ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

        return {
            id: Date.now() + Math.random(),
            name: ebayItem.title || 'eBay Product',
            description: `${ebayItem.condition || 'New'} • Sold by: ${ebayItem.seller?.username || 'eBay Seller'}${isOnSale ? ` • ${discount}% OFF!` : ''}`,
            salePrice: price,
            originalPrice: originalPrice,
            store: 'ebay',
            category: category,
            image: ebayItem.image?.imageUrl || ebayItem.thumbnailImages?.[0]?.imageUrl || '',
            affiliateLink: ebayItem.itemWebUrl || '',
            isOnSale: isOnSale,
            discount: discount
        };
    }

    loadExistingProducts() {
        try {
            if (fs.existsSync('products.json')) {
                const data = fs.readFileSync('products.json', 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('⚠️ Could not load existing products:', error.message);
        }
        return [];
    }

    async fillCategoryToTarget(category, currentCount, target = 100) {
        const needed = target - currentCount;
        if (needed <= 0) {
            console.log(`✅ ${category} already has ${currentCount} products (target: ${target})`);
            return [];
        }

        console.log(`🎯 Filling ${category}: need ${needed} more products (currently: ${currentCount})`);
        
        const searches = this.fillStrategies[category] || [];
        const newProducts = [];
        const seenTitles = new Set();
        
        // Shuffle search terms for variety
        const shuffledSearches = searches.sort(() => Math.random() - 0.5);
        
        for (const searchTerm of shuffledSearches) {
            if (newProducts.length >= needed) break;
            
            try {
                const itemsNeeded = Math.min(10, needed - newProducts.length);
                console.log(`🔍 Searching "${searchTerm}" (need ${itemsNeeded} more)`);
                
                const items = await this.searchProducts(searchTerm, itemsNeeded);
                
                for (const item of items) {
                    if (newProducts.length >= needed) break;
                    
                    // Check for duplicates
                    const titleKey = item.title.toLowerCase().substring(0, 30);
                    if (!seenTitles.has(titleKey)) {
                        seenTitles.add(titleKey);
                        const product = this.convertEbayItem(item, category);
                        newProducts.push(product);
                    }
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Error searching "${searchTerm}":`, error.message);
            }
        }
        
        console.log(`✅ Added ${newProducts.length} new products to ${category}`);
        return newProducts;
    }

    async fillAllCategoriesToTarget() {
        console.log('🚀 Filling all categories to 100 products each...\n');
        
        const existingProducts = this.loadExistingProducts();
        const ebayProducts = existingProducts.filter(p => p.store === 'ebay');
        const nonEbayProducts = existingProducts.filter(p => p.store !== 'ebay');
        
        // Count current products by category
        const categoryCounts = {};
        ebayProducts.forEach(product => {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        });
        
        console.log('📊 Current eBay product counts:');
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            console.log(`  ${cat}: ${count} products`);
        });
        console.log('');
        
        // Fill each category
        let allNewProducts = [];
        
        for (const category of Object.keys(this.fillStrategies)) {
            const currentCount = categoryCounts[category] || 0;
            const newProducts = await this.fillCategoryToTarget(category, currentCount, 100);
            allNewProducts.push(...newProducts);
        }
        
        // Combine all products
        const finalProducts = [...nonEbayProducts, ...ebayProducts, ...allNewProducts];
        
        console.log(`\n📊 FINAL SUMMARY:`);
        console.log(`- Non-eBay products: ${nonEbayProducts.length}`);
        console.log(`- Existing eBay products: ${ebayProducts.length}`);
        console.log(`- New eBay products: ${allNewProducts.length}`);
        console.log(`- Total products: ${finalProducts.length}`);
        
        // Save and push
        try {
            const jsonData = JSON.stringify(finalProducts, null, 2);
            fs.writeFileSync('products.json', jsonData);
            console.log(`💾 Saved ${finalProducts.length} products to products.json`);
            
            console.log('📤 Pushing to GitHub...');
            execSync('git add products.json', { stdio: 'inherit' });
            execSync(`git commit -m "🎯 Fill eBay categories: Added ${allNewProducts.length} products to reach 100 per category"`, { stdio: 'inherit' });
            execSync('git push origin main', { stdio: 'inherit' });
            console.log('✅ Successfully pushed to GitHub');
            
        } catch (error) {
            console.error('❌ Error saving/pushing:', error.message);
        }
        
        return finalProducts;
    }
}

// CLI Usage
if (require.main === module) {
    const filler = new EbayCategoryFiller();
    
    (async () => {
        try {
            await filler.fillAllCategoriesToTarget();
        } catch (error) {
            console.error('❌ Fill operation failed:', error.message);
        }
    })();
}

module.exports = EbayCategoryFiller;