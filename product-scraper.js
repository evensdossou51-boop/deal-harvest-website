// Product URL Scraper for DealHarvest
// Simple scraper to extract product information from URLs

class ProductScraper {
    constructor() {
        this.storePatterns = {
            amazon: /amazon\.(com|ca|co\.uk)/,
            walmart: /walmart\.com/,
            target: /target\.com/,
            homedepot: /homedepot\.com/
        };
    }

    // Detect store from URL
    detectStore(url) {
        for (const [store, pattern] of Object.entries(this.storePatterns)) {
            if (pattern.test(url)) {
                return store;
            }
        }
        return 'unknown';
    }

    // Auto-detect category based on keywords
    detectCategory(title, description = '') {
        const text = (title + ' ' + description).toLowerCase();
        
        const categoryKeywords = {
            'electronics': ['laptop', 'phone', 'tablet', 'computer', 'headphones', 'speaker', 'camera', 'tv', 'monitor', 'gaming'],
            'kitchen': ['kitchen', 'cooking', 'mixer', 'blender', 'coffee', 'cookware', 'appliance'],
            'furniture': ['chair', 'table', 'sofa', 'bed', 'desk', 'shelf', 'furniture'],
            'fashion': ['shirt', 'shoes', 'dress', 'pants', 'clothing', 'fashion', 'apparel'],
            'sports-outdoors': ['fitness', 'exercise', 'outdoor', 'camping', 'sports', 'gym'],
            'health-wellness': ['health', 'vitamin', 'supplement', 'medical', 'wellness'],
            'tools-hardware': ['tool', 'drill', 'hammer', 'screwdriver', 'hardware'],
            'garden': ['garden', 'plant', 'seed', 'lawn', 'outdoor'],
            'automotive': ['car', 'auto', 'vehicle', 'motor', 'tire']
        };

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }
        return 'other';
    }

    // Calculate discount percentage
    calculateDiscount(currentPrice, originalPrice) {
        const current = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
        const original = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
        
        if (original > current) {
            const discount = Math.round(((original - current) / original) * 100);
            return `${discount}%`;
        }
        return null;
    }

    // Generate affiliate link (placeholder - you'll need to implement your affiliate program)
    generateAffiliateLink(url, store) {
        // This is a placeholder - you'll need to implement actual affiliate link generation
        // For now, it returns the original URL
        return url;
    }

    // Scrape product using a simple fetch approach
    async scrapeProduct(url) {
        try {
            const store = this.detectStore(url);
            
            // For demo purposes, we'll simulate the scraping
            // In a real implementation, you'd use a scraping service or CORS proxy
            const mockData = this.getMockProductData(url, store);
            
            return {
                success: true,
                data: mockData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Mock product data for demonstration
    getMockProductData(url, store) {
        // This simulates what real scraping would return
        const mockProducts = {
            amazon: {
                name: "Amazon Echo Dot (4th Gen) Smart Speaker",
                price: "$29.99",
                originalPrice: "$49.99",
                image: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&h=300&fit=crop",
                category: "electronics"
            },
            walmart: {
                name: "Instant Vortex Plus Air Fryer",
                price: "$79.99",
                originalPrice: "$99.99",
                image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
                category: "kitchen"
            },
            target: {
                name: "Wireless Bluetooth Headphones",
                price: "$59.99",
                originalPrice: "$89.99",
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
                category: "electronics"
            },
            homedepot: {
                name: "BLACK+DECKER Cordless Drill",
                price: "$39.99",
                originalPrice: "$59.99",
                image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop",
                category: "tools-hardware"
            }
        };

        const baseData = mockProducts[store] || mockProducts.amazon;
        const discount = this.calculateDiscount(baseData.price, baseData.originalPrice);
        
        return {
            id: Date.now(), // Generate unique ID
            name: baseData.name,
            price: baseData.price,
            originalPrice: baseData.originalPrice,
            discount: discount,
            image: baseData.image,
            store: store,
            category: baseData.category,
            affiliateLink: this.generateAffiliateLink(url, store),
            description: `Amazing deal on ${baseData.name} from ${store.charAt(0).toUpperCase() + store.slice(1)}!`
        };
    }
}

// Initialize scraper
const scraper = new ProductScraper();

// Function to handle URL scraping
async function scrapeProductFromURL(url) {
    if (!url || !url.trim()) {
        return {
            success: false,
            error: 'Please provide a valid URL'
        };
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        return {
            success: false,
            error: 'Invalid URL format'
        };
    }

    return await scraper.scrapeProduct(url);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductScraper, scrapeProductFromURL };
}