/**
 * eBay Category Bulk Importer - Targets Best Sellers & Sale Items
 * Populates each category with 100 high-quality products
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// Load eBay configuration
let EBAY_CONFIG = {
    APP_ID: 'YOUR_APP_ID',
    DEV_ID: 'YOUR_DEV_ID',
    CERT_ID: 'YOUR_CERT_ID',
    BASE_URL: 'https://api.ebay.com',
    OAUTH_URL: 'https://api.ebay.com/identity/v1/oauth2/token',
    BROWSE_URL: 'https://api.ebay.com/buy/browse/v1',
    CAMPAIGN_ID: 'YOUR_CAMPAIGN_ID',
    AFFILIATE_ID: 'YOUR_AFFILIATE_ID'
};

try {
    const configPath = require('path').join(__dirname, 'ebay-config.local.js');
    if (require('fs').existsSync(configPath)) {
        const localConfig = require('./ebay-config.local.js');
        EBAY_CONFIG = { ...EBAY_CONFIG, ...localConfig };
        console.log('✅ Using local eBay configuration');
    }
} catch (error) {
    console.log('ℹ️ Using default eBay configuration');
}

class EbayCategoryBulkImporter {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.importedProducts = [];
        
        // Category-specific search strategies for best sellers and sales
        this.categoryStrategies = {
            christmas: [
                { query: 'christmas decorations sale', limit: 25 },
                { query: 'holiday lights deals', limit: 25 },
                { query: 'christmas gifts under 50', limit: 25 },
                { query: 'winter holiday sale', limit: 25 }
            ],
            electronics: [
                { query: 'electronics sale best seller', limit: 25 },
                { query: 'smartphone accessories deals', limit: 25 },
                { query: 'wireless headphones sale', limit: 25 },
                { query: 'smart devices discount', limit: 25 }
            ],
            'home-decor': [
                { query: 'home decor sale popular', limit: 25 },
                { query: 'wall art prints deal', limit: 25 },
                { query: 'home organization sale', limit: 25 },
                { query: 'decorative items discount', limit: 25 }
            ],
            'health-fitness': [
                { query: 'fitness tracker sale', limit: 25 },
                { query: 'workout equipment deals', limit: 25 },
                { query: 'health monitor discount', limit: 25 },
                { query: 'fitness accessories sale', limit: 25 }
            ],
            'digital-diy': [
                { query: 'digital download crafts', limit: 25 },
                { query: 'printable art sale', limit: 25 },
                { query: 'diy craft supplies deal', limit: 25 },
                { query: 'digital templates discount', limit: 25 }
            ]
        };
    }

    // Get OAuth 2.0 Access Token
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
                            this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000; // 1 minute buffer
                            resolve(this.accessToken);
                        } else {
                            reject(new Error('Failed to get access token: ' + data));
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

    // Search for products with focus on best sellers and sales
    async searchProducts(query, options = {}) {
        const token = await this.getAccessToken();
        const limit = Math.min(options.limit || 25, 200); // eBay API limit

        const params = new URLSearchParams({
            q: query,
            limit: limit.toString(),
            filter: 'buyingOptions:{AUCTION|FIXED_PRICE},conditions:{NEW|USED|REFURBISHED}',
            sort: 'price', // Sort by price to find deals
            fieldgroups: 'MATCHING_ITEMS,EXTENDED'
        });

        // Add price filter for deals (under $100 for better conversion)
        if (options.maxPrice) {
            params.append('filter', `price:[..${options.maxPrice}]`);
        } else {
            params.append('filter', 'price:[..100]'); // Default max $100 for better deals
        }

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
                        if (response.itemSummaries) {
                            console.log(`📦 Found ${response.itemSummaries.length} items for "${query}"`);
                            resolve(response.itemSummaries);
                        } else {
                            console.warn(`⚠️ No items found for "${query}"`);
                            resolve([]);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    // Convert eBay item to our format with Smart Links
    convertEbayItem(ebayItem, categoryOverride = null) {
        const price = ebayItem.price?.value ? parseFloat(ebayItem.price.value) : 0;
        const originalPrice = ebayItem.marketingPrice?.originalPrice?.value ? 
            parseFloat(ebayItem.marketingPrice.originalPrice.value) : null;

        // Determine if it's on sale
        const isOnSale = originalPrice && originalPrice > price;
        const discount = isOnSale ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

        return {
            id: Date.now() + Math.random(),
            name: ebayItem.title || 'eBay Product',
            description: `${ebayItem.condition || 'New'} • Sold by: ${ebayItem.seller?.username || 'eBay Seller'}${isOnSale ? ` • ${discount}% OFF!` : ''}`,
            salePrice: price,
            originalPrice: originalPrice,
            store: 'ebay',
            category: categoryOverride || this.mapCategory(ebayItem.categories?.[0]?.categoryName),
            image: ebayItem.image?.imageUrl || ebayItem.thumbnailImages?.[0]?.imageUrl || '',
            affiliateLink: ebayItem.itemWebUrl || '',
            isOnSale: isOnSale,
            discount: discount,
            seller: ebayItem.seller?.username || 'eBay Seller'
        };
    }

    // Map eBay categories to our categories
    mapCategory(ebayCategory) {
        if (!ebayCategory) return 'Electronics';
        
        const categoryMap = {
            'Electronics': 'Electronics',
            'Home & Garden': 'Home & Garden',
            'Health & Beauty': 'Beauty & Grooming',
            'Sporting Goods': 'Sports & Outdoors',
            'Toys & Hobbies': 'Toys & Games',
            'Automotive': 'Automotive',
            'Books': 'Books & Textbooks'
        };
        
        return categoryMap[ebayCategory] || 'Electronics';
    }

    // Import products for a specific category
    async importCategoryProducts(category) {
        console.log(`\n🎯 Importing ${category} products...`);
        
        const strategies = this.categoryStrategies[category];
        if (!strategies) {
            console.warn(`❌ No strategy defined for category: ${category}`);
            return [];
        }

        let categoryProducts = [];
        
        for (const strategy of strategies) {
            try {
                console.log(`🔍 Searching: "${strategy.query}" (limit: ${strategy.limit})`);
                const ebayItems = await this.searchProducts(strategy.query, { 
                    limit: strategy.limit,
                    maxPrice: 100 // Focus on affordable items for better conversion
                });
                
                const convertedItems = ebayItems.map(item => 
                    this.convertEbayItem(item, category)
                );
                
                categoryProducts.push(...convertedItems);
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error searching "${strategy.query}":`, error.message);
            }
        }

        // Remove duplicates and prioritize sale items
        const uniqueProducts = this.removeDuplicates(categoryProducts);
        const saleItems = uniqueProducts.filter(p => p.isOnSale).slice(0, 50);
        const regularItems = uniqueProducts.filter(p => !p.isOnSale).slice(0, 50);
        
        const finalProducts = [...saleItems, ...regularItems].slice(0, 100);
        
        console.log(`✅ Imported ${finalProducts.length} products for ${category} (${saleItems.length} on sale)`);
        return finalProducts;
    }

    // Remove duplicate products based on title similarity
    removeDuplicates(products) {
        const unique = [];
        const seenTitles = new Set();
        
        for (const product of products) {
            // Create a normalized title for comparison
            const normalizedTitle = product.name.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .substring(0, 50);
            
            if (!seenTitles.has(normalizedTitle)) {
                seenTitles.add(normalizedTitle);
                unique.push(product);
            }
        }
        
        return unique;
    }

    // Load existing products
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

    // Save products to JSON file
    saveProducts(allProducts) {
        try {
            const jsonData = JSON.stringify(allProducts, null, 2);
            fs.writeFileSync('products.json', jsonData);
            console.log(`💾 Saved ${allProducts.length} products to products.json`);
            return true;
        } catch (error) {
            console.error('❌ Error saving products:', error.message);
            return false;
        }
    }

    // Auto-commit and push to GitHub
    async pushToGitHub(message) {
        try {
            console.log('📤 Pushing to GitHub...');
            execSync('git add products.json', { stdio: 'inherit' });
            execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
            execSync('git push origin main', { stdio: 'inherit' });
            console.log('✅ Successfully pushed to GitHub');
            return true;
        } catch (error) {
            console.error('❌ Git push failed:', error.message);
            return false;
        }
    }

    // Main import function for all categories
    async importAllCategories() {
        console.log('🚀 Starting bulk import for all eBay categories...\n');
        
        const existingProducts = this.loadExistingProducts();
        const nonEbayProducts = existingProducts.filter(p => p.store !== 'ebay');
        
        console.log(`📊 Keeping ${nonEbayProducts.length} non-eBay products`);
        console.log('🔄 Replacing all eBay products with fresh imports...\n');
        
        let allNewEbayProducts = [];
        const categories = Object.keys(this.categoryStrategies);
        
        for (const category of categories) {
            const categoryProducts = await this.importCategoryProducts(category);
            allNewEbayProducts.push(...categoryProducts);
            
            console.log(`✅ Category "${category}": ${categoryProducts.length} products imported`);
        }
        
        // Combine non-eBay products with new eBay products
        const finalProducts = [...nonEbayProducts, ...allNewEbayProducts];
        
        console.log(`\n📊 FINAL SUMMARY:`);
        console.log(`- Amazon products: ${nonEbayProducts.length}`);
        console.log(`- eBay products: ${allNewEbayProducts.length}`);
        console.log(`- Total products: ${finalProducts.length}`);
        
        // Save and push to GitHub
        if (this.saveProducts(finalProducts)) {
            const message = `🛒 Bulk import: ${allNewEbayProducts.length} eBay products across ${categories.length} categories - Focus on sales & best sellers`;
            await this.pushToGitHub(message);
        }
        
        return finalProducts;
    }
}

// CLI Usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const importer = new EbayCategoryBulkImporter();

    if (args.length === 0) {
        console.log(`
🛒 eBay Category Bulk Importer - Best Sellers & Sales Focus

Usage:
  node ebay-category-bulk-importer.js all          # Import all categories (500 products)
  node ebay-category-bulk-importer.js christmas    # Import Christmas category only
  node ebay-category-bulk-importer.js electronics  # Import Electronics category only

Categories:
  - christmas (🎄 Christmas Deals - 100 products)
  - electronics (📱 Electronics & Tech - 100 products)  
  - home-decor (🏠 Home & Decor - 100 products)
  - health-fitness (💪 Health & Fitness - 100 products)
  - digital-diy (🎨 Digital & DIY - 100 products)

Features:
  ✅ Focuses on best sellers and sale items
  ✅ Prioritizes products under $100 for better conversion
  ✅ Removes duplicates automatically
  ✅ Auto-commits and pushes to GitHub
  ✅ Preserves existing Amazon products
        `);
        process.exit(0);
    }

    const command = args[0];

    (async () => {
        try {
            if (command === 'all') {
                await importer.importAllCategories();
            } else if (importer.categoryStrategies[command]) {
                const products = await importer.importCategoryProducts(command);
                console.log(`✅ Imported ${products.length} products for ${command}`);
            } else {
                console.log('❌ Unknown category. Use: all, christmas, electronics, home-decor, health-fitness, or digital-diy');
            }
        } catch (error) {
            console.error('❌ Import failed:', error.message);
        }
    })();
}

module.exports = EbayCategoryBulkImporter;