const axios = require('axios');
const fs = require('fs').promises;
const walmartConfig = require('./walmart-config.local.js');

/**
 * Walmart Affiliate Product Importer
 * Imports products from Walmart API into products.json
 */

class WalmartImporter {
    constructor() {
        this.apiKey = walmartConfig.API_KEY;
        this.affiliateId = walmartConfig.AFFILIATE_ID;
        this.linkId = walmartConfig.LINK_ID || '';
        this.baseUrl = walmartConfig.API_BASE_URL;
        this.productsFile = 'products.json';
    }

    /**
     * Search for products using Walmart API
     */
    async searchProducts(query, category = 'all', maxResults = 100) {
        try {
            console.log(`🔍 Searching Walmart for: "${query}" (Category: ${category})`);
            
            const params = {
                query: query,
                format: 'json',
                apiKey: this.apiKey,
                numItems: Math.min(maxResults, 25), // Walmart API limit per request
                sort: walmartConfig.SORT_ORDER || 'relevance'
            };

            // Add affiliate tracking
            if (this.linkId) {
                params.linkId = this.linkId;
            }

            const response = await axios.get(`${this.baseUrl}/search`, {
                params,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.items) {
                console.log(`✅ Found ${response.data.items.length} Walmart products`);
                return this.formatProducts(response.data.items, category);
            } else {
                console.log('⚠️ No products found');
                return [];
            }

        } catch (error) {
            console.error('❌ Walmart API Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Format Walmart products to our schema
     */
    formatProducts(items, category) {
        return items.map(item => {
            // Calculate discount if applicable
            const originalPrice = item.msrp || item.salePrice;
            const salePrice = item.salePrice;
            
            // Generate affiliate link
            const affiliateLink = this.generateAffiliateLink(item.productUrl || item.itemUrl);

            return {
                name: this.cleanProductName(item.name),
                description: item.shortDescription || item.longDescription || '',
                salePrice: parseFloat(salePrice),
                originalPrice: originalPrice > salePrice ? parseFloat(originalPrice) : null,
                image: item.mediumImage || item.largeImage || item.thumbnailImage || '',
                affiliateLink: affiliateLink,
                store: 'Walmart',
                category: category,
                condition: 'New',
                shipping: item.freight ? 'Standard Shipping' : 'Free Shipping',
                rating: item.customerRating || null,
                reviews: item.numReviews || 0,
                stock: item.stock || 'Available',
                itemId: item.itemId
            };
        });
    }

    /**
     * Generate affiliate link
     */
    generateAffiliateLink(productUrl) {
        // Add your affiliate tracking parameters
        const url = new URL(productUrl);
        
        if (this.affiliateId) {
            url.searchParams.set('affcampaign', this.affiliateId);
        }
        
        if (this.linkId) {
            url.searchParams.set('affid', this.linkId);
        }
        
        return url.toString();
    }

    /**
     * Clean product names
     */
    cleanProductName(name) {
        return name
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-.,()&]/g, '')
            .trim()
            .substring(0, 150);
    }

    /**
     * Load existing products
     */
    async loadExistingProducts() {
        try {
            const data = await fs.readFile(this.productsFile, 'utf8');
            const json = JSON.parse(data);
            return Array.isArray(json) ? json : json.products || [];
        } catch (error) {
            console.log('📝 No existing products file, will create new one');
            return [];
        }
    }

    /**
     * Save products to JSON file
     */
    async saveProducts(newProducts) {
        try {
            const existing = await this.loadExistingProducts();
            
            // Remove existing Walmart products to avoid duplicates
            const nonWalmart = existing.filter(p => p.store.toLowerCase() !== 'walmart');
            
            const allProducts = [...nonWalmart, ...newProducts];
            
            await fs.writeFile(
                this.productsFile,
                JSON.stringify(allProducts, null, 2),
                'utf8'
            );

            console.log(`\n✅ Saved ${allProducts.length} total products to ${this.productsFile}`);
            console.log(`   - Walmart: ${newProducts.length}`);
            console.log(`   - Other stores: ${nonWalmart.length}`);
        } catch (error) {
            console.error('❌ Error saving products:', error);
            throw error;
        }
    }

    /**
     * Import products by search terms
     */
    async importBySearchTerms(searchTerms, category = 'all', maxPerTerm = 25) {
        console.log(`\n🚀 Starting Walmart import...`);
        console.log(`📦 Search terms: ${searchTerms.length}`);
        console.log(`🎯 Category: ${category}`);
        console.log(`📊 Max per term: ${maxPerTerm}\n`);

        let allProducts = [];

        for (const term of searchTerms) {
            try {
                const products = await this.searchProducts(term, category, maxPerTerm);
                allProducts = allProducts.concat(products);
                
                // Respect API rate limits
                await this.sleep(1000);
            } catch (error) {
                console.error(`❌ Failed to import "${term}":`, error.message);
            }
        }

        if (allProducts.length > 0) {
            await this.saveProducts(allProducts);
            console.log(`\n🎉 Import complete! Added ${allProducts.length} Walmart products`);
        } else {
            console.log('\n⚠️ No products imported');
        }

        return allProducts;
    }

    /**
     * Sleep helper for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Example usage
async function main() {
    const importer = new WalmartImporter();

    // Example: Import electronics
    const electronicsSearchTerms = [
        'laptop computer',
        'wireless headphones',
        'smart watch',
        'tablet',
        '4k monitor',
        'gaming keyboard',
        'wireless mouse',
        'webcam',
        'bluetooth speaker',
        'phone charger'
    ];

    try {
        await importer.importBySearchTerms(
            electronicsSearchTerms,
            'Electronics',
            10 // 10 products per search term
        );
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = WalmartImporter;
