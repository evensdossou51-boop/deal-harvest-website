const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// Load eBay configuration from external file
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

// Try to load config from local file (for Node.js usage)
try {
    const configPath = require('path').join(__dirname, 'ebay-config.local.js');
    if (require('fs').existsSync(configPath)) {
        const localConfig = require('./ebay-config.local.js');
        EBAY_CONFIG = { ...EBAY_CONFIG, ...localConfig };
        console.log('✅ Using local eBay configuration');
    }
} catch (error) {
    console.log('ℹ️ Using default eBay configuration (update ebay-config.local.js)');
}

class EbayImporter {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
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
                            this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000; // 1 min buffer
                            console.log('✅ eBay OAuth token obtained successfully');
                            resolve(this.accessToken);
                        } else {
                            reject(new Error(`OAuth failed: ${data}`));
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

    // Search eBay products
    async searchProducts(options = {}) {
        const token = await this.getAccessToken();
        
        const params = new URLSearchParams({
            q: options.query || 'electronics',
            category_ids: options.categoryId || '',
            filter: this.buildFilters(options),
            fieldgroups: 'MATCHING_ITEMS,FULL',
            limit: options.limit || 50,
            offset: options.offset || 0,
            sort: options.sort || 'price'
        });

        // Remove empty parameters
        for (let [key, value] of params.entries()) {
            if (!value) params.delete(key);
        }

        return new Promise((resolve, reject) => {
            const options_req = {
                hostname: 'api.ebay.com',
                path: `/buy/browse/v1/item_summary/search?${params.toString()}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                }
            };

            const req = https.request(options_req, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.itemSummaries) {
                            resolve(response);
                        } else {
                            reject(new Error(`Search failed: ${data}`));
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

    // Build filter string for eBay API
    buildFilters(options) {
        const filters = [];
        
        if (options.minPrice || options.maxPrice) {
            const min = options.minPrice || '0';
            const max = options.maxPrice || '999999';
            filters.push(`price:[${min}..${max}]`);
        }
        
        if (options.condition) {
            filters.push(`conditions:{${options.condition}}`);
        }
        
        if (options.buyingOptions) {
            filters.push(`buyingOptions:{${options.buyingOptions}}`);
        }
        
        if (options.itemLocationCountry) {
            filters.push(`itemLocationCountry:${options.itemLocationCountry}`);
        }

        return filters.join(',');
    }

    // Transform eBay data to our product format
    transformProduct(ebayItem, index) {
        const getNextId = () => {
            const existingProducts = this.loadExistingProducts();
            return existingProducts.length > 0 
                ? Math.max(...existingProducts.map(p => p.id)) + 1 
                : 1;
        };

        // Generate affiliate URL
        const affiliateUrl = this.generateAffiliateUrl(ebayItem.itemWebUrl || ebayItem.itemAffiliateWebUrl);

        return {
            id: getNextId() + index,
            title: ebayItem.title || 'eBay Product',
            price: this.formatPrice(ebayItem.price),
            originalPrice: this.formatOriginalPrice(ebayItem.marketingPrice),
            image: ebayItem.image?.imageUrl || ebayItem.thumbnailImages?.[0]?.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image',
            link: affiliateUrl,
            store: 'eBay',
            category: this.mapCategory(ebayItem.categories?.[0]?.categoryName),
            rating: this.extractRating(ebayItem),
            reviews: this.extractReviews(ebayItem),
            description: this.generateDescription(ebayItem),
            features: this.extractFeatures(ebayItem),
            inStock: this.checkStock(ebayItem),
            shippingInfo: this.extractShipping(ebayItem),
            condition: ebayItem.condition || 'New',
            seller: ebayItem.seller?.username || 'eBay Seller',
            itemId: ebayItem.itemId,
            legacyItemId: ebayItem.legacyItemId
        };
    }

    // Generate eBay Partner Network affiliate URL
    generateAffiliateUrl(originalUrl) {
        if (!originalUrl) return '#';
        
        // If you have eBay Partner Network credentials, use them
        if (EBAY_CONFIG.CAMPAIGN_ID !== 'YOUR_CAMPAIGN_ID') {
            const affiliateParams = new URLSearchParams({
                campid: EBAY_CONFIG.CAMPAIGN_ID,
                customid: EBAY_CONFIG.AFFILIATE_ID,
                toolid: '10001',
                mkevt: '1',
                mkcid: '1'
            });
            
            return originalUrl.includes('?') 
                ? `${originalUrl}&${affiliateParams.toString()}`
                : `${originalUrl}?${affiliateParams.toString()}`;
        }
        
        return originalUrl;
    }

    formatPrice(priceObj) {
        if (!priceObj) return '$0.00';
        return `$${parseFloat(priceObj.value || 0).toFixed(2)}`;
    }

    formatOriginalPrice(marketingPrice) {
        if (marketingPrice?.originalPrice) {
            return `$${parseFloat(marketingPrice.originalPrice.value).toFixed(2)}`;
        }
        return null;
    }

    mapCategory(ebayCategory) {
        if (!ebayCategory) return 'Electronics';
        
        const categoryMap = {
            'Cell Phones & Smartphones': 'Electronics',
            'Computers, Tablets & Networking': 'Electronics', 
            'Consumer Electronics': 'Electronics',
            'Clothing, Shoes & Accessories': 'Fashion',
            'Home & Garden': 'Home & Garden',
            'Health & Beauty': 'Beauty',
            'Sporting Goods': 'Sports',
            'Toys & Hobbies': 'Toys',
            'Automotive': 'Automotive',
            'Books': 'Books'
        };
        
        return categoryMap[ebayCategory] || 'Electronics';
    }

    extractRating(item) {
        // eBay doesn't provide ratings in Browse API, use seller feedback
        if (item.seller?.feedbackPercentage) {
            return (item.seller.feedbackPercentage / 20).toFixed(1); // Convert 0-100 to 0-5
        }
        return '4.0'; // Default rating
    }

    extractReviews(item) {
        return item.seller?.feedbackScore || Math.floor(Math.random() * 1000) + 100;
    }

    generateDescription(item) {
        const parts = [];
        if (item.shortDescription) parts.push(item.shortDescription);
        if (item.condition) parts.push(`Condition: ${item.condition}`);
        if (item.brand) parts.push(`Brand: ${item.brand}`);
        if (item.seller?.username) parts.push(`Sold by: ${item.seller.username}`);
        
        return parts.join(' • ') || 'Quality eBay product with fast shipping and excellent customer service.';
    }

    extractFeatures(item) {
        const features = [];
        if (item.condition) features.push(`${item.condition} condition`);
        if (item.buyingOptions?.includes('FIXED_PRICE')) features.push('Buy It Now available');
        if (item.buyingOptions?.includes('AUCTION')) features.push('Auction format');
        if (item.returnsAccepted) features.push('Returns accepted');
        features.push('eBay Money Back Guarantee');
        
        return features;
    }

    checkStock(item) {
        // eBay Browse API doesn't provide stock info directly
        return item.availableQuantity ? item.availableQuantity > 0 : true;
    }

    extractShipping(item) {
        if (item.shippingOptions && item.shippingOptions.length > 0) {
            const shipping = item.shippingOptions[0];
            if (shipping.shippingCost?.value === '0.00') {
                return 'FREE shipping';
            }
            return `Shipping: ${shipping.shippingCost?.value || 'Calculated'}`;
        }
        return 'Shipping calculated at checkout';
    }

    loadExistingProducts() {
        try {
            const data = fs.readFileSync('products.json', 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    saveProducts(products) {
        fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
        console.log(`💾 Saved ${products.length} products to products.json`);
    }

    // Import products from eBay
    async importProducts(options = {}) {
        try {
            console.log('🔍 Searching eBay products...');
            const searchResults = await this.searchProducts(options);
            
            if (!searchResults.itemSummaries || searchResults.itemSummaries.length === 0) {
                console.log('❌ No products found');
                return;
            }

            console.log(`📦 Found ${searchResults.itemSummaries.length} eBay products`);
            
            const existingProducts = this.loadExistingProducts();
            const newProducts = searchResults.itemSummaries.map((item, index) => 
                this.transformProduct(item, index)
            );
            
            const allProducts = [...existingProducts, ...newProducts];
            this.saveProducts(allProducts);
            
            // Auto-push to GitHub
            if (options.autoPush !== false) {
                this.pushToGitHub();
            }
            
            return newProducts;
            
        } catch (error) {
            console.error('❌ eBay import failed:', error.message);
            throw error;
        }
    }

    pushToGitHub() {
        try {
            console.log('📤 Pushing to GitHub...');
            execSync('git add products.json');
            execSync(`git commit -m "Added eBay products via auto-importer"`);
            execSync('git push');
            console.log('✅ Successfully pushed to GitHub');
        } catch (error) {
            console.error('❌ Git push failed:', error.message);
        }
    }

    // Bulk import by category
    async importByCategory(categoryId, options = {}) {
        return this.importProducts({
            ...options,
            categoryId: categoryId
        });
    }

    // Import by search query
    async importBySearch(query, options = {}) {
        return this.importProducts({
            ...options,
            query: query
        });
    }
}

// CLI Usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const importer = new EbayImporter();

    if (args.length === 0) {
        console.log(`
🛒 eBay Auto-Importer for Deal Harvest

Usage:
  node ebay-importer.js search "electronics"
  node ebay-importer.js category "9355"  
  node ebay-importer.js import --query="phones" --limit=20

Examples:
  node ebay-importer.js search "laptop"
  node ebay-importer.js search "gaming" --min-price=50 --max-price=500
  node ebay-importer.js category "9355" --limit=30
        `);
        process.exit(0);
    }

    const command = args[0];
    const query = args[1];

    // Parse additional options
    const options = {};
    for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1]);
        if (arg.startsWith('--min-price=')) options.minPrice = arg.split('=')[1];
        if (arg.startsWith('--max-price=')) options.maxPrice = arg.split('=')[1];
        if (arg.startsWith('--condition=')) options.condition = arg.split('=')[1];
    }

    // Execute command
    (async () => {
        try {
            if (command === 'search') {
                await importer.importBySearch(query, options);
            } else if (command === 'category') {
                await importer.importByCategory(query, options);
            } else if (command === 'import') {
                await importer.importProducts(options);
            } else {
                console.log('❌ Unknown command. Use: search, category, or import');
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    })();
}

module.exports = EbayImporter;