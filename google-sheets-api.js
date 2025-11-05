// ====================================
// GOOGLE SHEETS INTEGRATION
// Live Product Management System
// ====================================

class GoogleSheetsAPI {
    constructor() {
        // You'll replace this URL with your Google Apps Script web app URL
        this.apiUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
        this.cache = {
            products: [],
            lastFetch: 0,
            cacheTime: 5 * 60 * 1000 // 5 minutes cache
        };
    }

    // Check if cache is still valid
    isCacheValid() {
        return (Date.now() - this.cache.lastFetch) < this.cacheTime;
    }

    // Fetch products from Google Sheets via Apps Script
    async fetchProducts() {
        try {
            // Return cached data if still valid
            if (this.isCacheValid() && this.cache.products.length > 0) {
                console.log('📋 Using cached products');
                return this.cache.products;
            }

            console.log('🔄 Fetching fresh data from Google Sheets...');
            
            const response = await fetch(this.apiUrl + '?t=' + Date.now(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Process and validate the data
            const products = this.processProducts(data);
            
            // Update cache
            this.cache.products = products;
            this.cache.lastFetch = Date.now();
            
            console.log(`✅ Loaded ${products.length} products from Google Sheets`);
            return products;

        } catch (error) {
            console.warn('⚠️ Google Sheets fetch failed, using fallback:', error);
            return this.getFallbackProducts();
        }
    }

    // Process and validate products from Google Sheets
    processProducts(rawData) {
        if (!Array.isArray(rawData)) {
            console.warn('Invalid data format from Google Sheets');
            return this.getFallbackProducts();
        }

        return rawData
            .filter(item => {
                // Only include active products with required fields
                return item.status === 'Active' && 
                       item.name && 
                       item.price && 
                       item.url;
            })
            .map((item, index) => ({
                id: item.id || index + 1,
                name: item.name || 'Product Name',
                price: this.formatPrice(item.price),
                originalPrice: this.formatPrice(item.originalPrice),
                discount: this.calculateDiscount(item.price, item.originalPrice),
                image: item.image || 'https://via.placeholder.com/300x300/f8f9fa/666?text=No+Image',
                url: item.url || '#',
                category: item.category || 'general',
                store: item.store || 'Unknown',
                lastUpdated: item.lastUpdated || new Date().toISOString()
            }));
    }

    // Format price to ensure consistency
    formatPrice(price) {
        if (!price) return '$0.00';
        
        // Remove any non-numeric characters except decimal point
        const numericPrice = parseFloat(price.toString().replace(/[^\d.]/g, ''));
        
        if (isNaN(numericPrice)) return '$0.00';
        
        return '$' + numericPrice.toFixed(2);
    }

    // Calculate discount percentage
    calculateDiscount(currentPrice, originalPrice) {
        if (!originalPrice || !currentPrice) return '';
        
        const current = parseFloat(currentPrice.toString().replace(/[^\d.]/g, ''));
        const original = parseFloat(originalPrice.toString().replace(/[^\d.]/g, ''));
        
        if (isNaN(current) || isNaN(original) || original <= current) return '';
        
        const discount = Math.round(((original - current) / original) * 100);
        return discount > 0 ? `${discount}% OFF` : '';
    }

    // Fallback products if Google Sheets is unavailable
    getFallbackProducts() {
        return [
            {
                id: 1,
                name: "Living Room Sofa",
                price: "$299.99",
                originalPrice: "$399.99",
                discount: "25% OFF",
                category: "furniture",
                image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&crop=center",
                url: "https://www.amazon.com/dp/B08XYZ123/ref=sr_1_1?keywords=living+room+sofa",
                store: "Amazon",
                lastUpdated: new Date().toISOString()
            }
        ];
    }

    // Force refresh data from Google Sheets
    async forceRefresh() {
        this.cache.lastFetch = 0; // Invalidate cache
        return await this.fetchProducts();
    }
}

// Global instance
window.googleSheetsAPI = new GoogleSheetsAPI();