/**
 * Real-time Search API for Deal Harvest
 * Integrates Amazon (static) and eBay (live API) search
 */

// eBay API Configuration (placeholder - update with your credentials)
const EBAY_CONFIG = {
    APP_ID: 'YOUR_APP_ID',
    DEV_ID: 'YOUR_DEV_ID', 
    CERT_ID: 'YOUR_CERT_ID',
    BASE_URL: 'https://api.ebay.com',
    BROWSE_URL: 'https://api.ebay.com/buy/browse/v1',
    CAMPAIGN_ID: 'YOUR_CAMPAIGN_ID',
    AFFILIATE_ID: 'YOUR_AFFILIATE_ID'
};

class SearchAPI {
    constructor() {
        this.ebayToken = null;
        this.tokenExpiry = null;
        this.searchCache = new Map();
        this.amazonProducts = [];
    }

    // Load local Amazon products
    async loadAmazonProducts() {
        try {
            const response = await fetch('products.json');
            const data = await response.json();
            this.amazonProducts = Array.isArray(data) ? data : data.products || [];
            console.log('📦 Loaded', this.amazonProducts.length, 'Amazon products for search');
        } catch (error) {
            console.error('❌ Failed to load Amazon products:', error);
            this.amazonProducts = [];
        }
    }

    // Get eBay OAuth token
    async getEbayToken() {
        if (this.ebayToken && this.tokenExpiry > Date.now()) {
            return this.ebayToken;
        }

        try {
            const credentials = btoa(`${EBAY_CONFIG.APP_ID}:${EBAY_CONFIG.CERT_ID}`);
            const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`
                },
                body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
            });

            const data = await response.json();
            if (data.access_token) {
                this.ebayToken = data.access_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
                return this.ebayToken;
            } else {
                throw new Error('Failed to get eBay token');
            }
        } catch (error) {
            console.error('❌ eBay token error:', error);
            return null;
        }
    }

    // Search Amazon products (local)
    searchAmazon(query, limit = 10) {
        if (!query || query.length < 2) return [];

        const searchTerms = query.toLowerCase().split(' ');
        const results = this.amazonProducts.filter(product => {
            const searchableText = `${product.name} ${product.description || ''} ${product.category}`.toLowerCase();
            return searchTerms.every(term => searchableText.includes(term));
        });

        return results.slice(0, limit).map(product => ({
            ...product,
            searchSource: 'amazon-local'
        }));
    }

    // Search eBay products (live API)
    async searchEbay(query, limit = 10) {
        if (!query || query.length < 2) return [];

        // Check cache first
        const cacheKey = `${query}-${limit}`;
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 min cache
                return cached.results;
            }
        }

        try {
            const token = await this.getEbayToken();
            if (!token) return [];

            const params = new URLSearchParams({
                q: query,
                limit: Math.min(limit, 50),
                sort: 'price',
                filter: 'buyingOptions:{FIXED_PRICE}'
            });

            const response = await fetch(`${EBAY_CONFIG.BROWSE_URL}/item_summary/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                }
            });

            const data = await response.json();
            
            if (data.itemSummaries) {
                const results = data.itemSummaries.slice(0, limit).map(item => ({
                    id: `ebay-${item.itemId}`,
                    name: item.title,
                    salePrice: parseFloat(item.price?.value || 0),
                    originalPrice: item.marketingPrice?.originalPrice ? 
                        parseFloat(item.marketingPrice.originalPrice.value) : null,
                    store: 'eBay',
                    category: this.mapEbayCategory(item.categories?.[0]?.categoryName),
                    image: item.image?.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image',
                    affiliateLink: this.generateEbayAffiliateUrl(item.itemWebUrl || item.itemAffiliateWebUrl),
                    description: item.shortDescription || 'Quality eBay product',
                    searchSource: 'ebay-live'
                }));

                // Cache results
                this.searchCache.set(cacheKey, {
                    results,
                    timestamp: Date.now()
                });

                return results;
            }

            return [];
        } catch (error) {
            console.error('❌ eBay search error:', error);
            return [];
        }
    }

    // Map eBay categories to our categories
    mapEbayCategory(ebayCategory) {
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

    // Generate eBay affiliate URL
    generateEbayAffiliateUrl(originalUrl) {
        if (!originalUrl) return '#';
        
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

    // Combined search (Amazon local + eBay live)
    async searchAll(query, options = {}) {
        const { amazonLimit = 10, ebayLimit = 10, store = 'all' } = options;
        
        const promises = [];
        
        if (store === 'all' || store === 'amazon') {
            promises.push(Promise.resolve(this.searchAmazon(query, amazonLimit)));
        } else {
            promises.push(Promise.resolve([]));
        }
        
        if (store === 'all' || store === 'ebay') {
            promises.push(this.searchEbay(query, ebayLimit));
        } else {
            promises.push(Promise.resolve([]));
        }

        try {
            const [amazonResults, ebayResults] = await Promise.allSettled(promises);
            
            const allResults = [
                ...(amazonResults.status === 'fulfilled' ? amazonResults.value : []),
                ...(ebayResults.status === 'fulfilled' ? ebayResults.value : [])
            ];

            // Sort by relevance and price
            return allResults.sort((a, b) => {
                // Prioritize exact name matches
                const aExact = a.name.toLowerCase().includes(query.toLowerCase());
                const bExact = b.name.toLowerCase().includes(query.toLowerCase());
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Then sort by price
                return a.salePrice - b.salePrice;
            });
        } catch (error) {
            console.error('❌ Search error:', error);
            return [];
        }
    }

    // Real-time search with debouncing
    async performRealTimeSearch(query, store = 'all', callback) {
        if (!query || query.length < 2) {
            callback([]);
            return;
        }

        try {
            callback({ loading: true });
            
            const results = await this.searchAll(query, {
                amazonLimit: store === 'amazon' ? 20 : 10,
                ebayLimit: store === 'ebay' ? 20 : 10,
                store
            });

            callback(results);
        } catch (error) {
            console.error('❌ Real-time search error:', error);
            callback([]);
        }
    }
}

// Initialize search API
const searchAPI = new SearchAPI();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchAPI;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    searchAPI.loadAmazonProducts();
});

// Make available globally
window.DealHarvest = window.DealHarvest || {};
window.DealHarvest.SearchAPI = searchAPI;