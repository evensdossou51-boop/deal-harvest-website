// ====================================
// DEALHARVEST - GOOGLE SHEETS INTEGRATION
// Live Product Management System - November 2025
// ====================================

// Global Variables
let allProducts = [];
let isLoading = false;

// ====================================
// UI MANAGEMENT
// ====================================

class UIManager {
    constructor() {
        // Load products will be called in init()
    }

    // Initialize the application
    async init() {
        this.setupEventListeners();
        await this.loadProducts();
        console.log('✅ DealHarvest initialized with Google Sheets integration');
    }

    // Detect store from URL
    detectStore(url) {
        if (!url) return 'Unknown Store';
        
        const domain = url.toLowerCase();
        
        if (domain.includes('amazon.com') || domain.includes('amzn.to')) return 'Amazon';
        if (domain.includes('walmart.com')) return 'Walmart';
        if (domain.includes('target.com')) return 'Target';
        if (domain.includes('homedepot.com')) return 'Home Depot';
        if (domain.includes('lowes.com')) return 'Lowe\'s';
        if (domain.includes('bestbuy.com')) return 'Best Buy';
        if (domain.includes('ebay.com')) return 'eBay';
        if (domain.includes('costco.com')) return 'Costco';
        if (domain.includes('samsclub.com')) return 'Sam\'s Club';
        if (domain.includes('macys.com')) return 'Macy\'s';
        
        return 'Online Store';
    }

    // Get store color for badges
    getStoreColor(storeName) {
        const colors = {
            'Amazon': '#FF9900',
            'Walmart': '#004c91',
            'Target': '#cc0000',
            'Home Depot': '#f96302',
            'Lowe\'s': '#004990',
            'Best Buy': '#fff200',
            'eBay': '#e53238',
            'Costco': '#00447c',
            'Sam\'s Club': '#004c91',
            'Macy\'s': '#e21a2c'
        };
        return colors[storeName] || '#7C3AED';
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchValue = searchInput ? searchInput.value : '';
                this.handleSearch(searchValue);
            });
        }
        
        // Filter event listeners
        const categoryFilter = document.getElementById('categoryFilter');
        const storeFilter = document.getElementById('storeFilter');
        const clearFiltersBtn = document.getElementById('clearFilters');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (storeFilter) {
            storeFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    // Load products from Google Sheets
    async loadProducts() {
        this.showLoading();
        
        try {
            const products = await window.googleSheetsAPI.fetchProducts();
            allProducts = [...products];
            this.hideLoading();
            this.renderProducts();
            
            // Track successful load
            if (window.cookieManager) {
                window.cookieManager.trackEvent('products_loaded', 'system', `${products.length} products`);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            this.hideLoading();
            this.showError();
        }
    }

    // Show loading state
    showLoading() {
        isLoading = true;
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <h3>Loading fresh deals...</h3>
                <p>Fetching the latest products from our inventory</p>
            </div>
        `;
    }

    // Hide loading state
    hideLoading() {
        isLoading = false;
    }

    // Show error state
    showError() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="error-state">
                <h3>⚠️ Connection Issue</h3>
                <p>Unable to load fresh products. Please check your connection and try again.</p>
                <button onclick="location.reload()" class="retry-btn">Try Again</button>
            </div>
        `;
    }

    // Handle search functionality
    handleSearch(query) {
        // Track search with cookies if consent given
        if (window.cookieManager && query.trim()) {
            window.cookieManager.trackSearch(query);
        }

        // Use applyFilters instead of direct filtering
        this.applyFilters();
    }

    // Apply filters based on category and store selection
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const storeFilter = document.getElementById('storeFilter');
        const searchInput = document.getElementById('searchInput');
        
        let filtered = [...allProducts];
        
        // Apply search filter
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchQuery) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply category filter
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        if (selectedCategory) {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }
        
        // Apply store filter
        const selectedStore = storeFilter ? storeFilter.value : '';
        if (selectedStore) {
            filtered = filtered.filter(product => {
                const store = this.detectStore(product.url).toLowerCase();
                return store === selectedStore || 
                       (selectedStore === 'homedepot' && store === 'home depot') ||
                       (selectedStore === 'bestbuy' && store === 'best buy');
            });
        }
        
        allProducts = filtered;
        this.renderProducts();
        
        // Track filter usage
        if (window.cookieManager && (selectedCategory || selectedStore)) {
            window.cookieManager.trackEvent('filter_applied', 'engagement', 
                `Category: ${selectedCategory || 'none'}, Store: ${selectedStore || 'none'}`);
        }
    }

    // Clear all filters
    clearAllFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const storeFilter = document.getElementById('storeFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (categoryFilter) categoryFilter.value = '';
        if (storeFilter) storeFilter.value = '';
        if (searchInput) searchInput.value = '';
        
        this.loadProducts();
        
        // Track clear filters
        if (window.cookieManager) {
            window.cookieManager.trackEvent('filters_cleared', 'engagement');
        }
    }

    // Render products on the page
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (allProducts.length === 0) {
            grid.innerHTML = `
                <div class="no-products">
                    <h3>No products found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = allProducts.map(product => {
            const storeName = this.detectStore(product.url);
            const storeColor = this.getStoreColor(storeName);
            
            return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${product.image}" 
                             alt="${product.name}" 
                             onerror="this.src='https://via.placeholder.com/120x120/f8f9fa/666?text=${encodeURIComponent(product.name.split(' ')[0])}'">
                    </div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price}</div>
                    <div class="product-store" style="background-color: ${storeColor}">
                        ${storeName}
                    </div>
                    <button class="product-btn" onclick="trackProductClick('${product.name}', '${product.url}', '${storeName}'); window.open('${product.url || '#'}', '_blank')">View Deal</button>
                </div>
            `;
        }).join('');
    }


}

// ====================================
// APPLICATION INITIALIZATION
// ====================================

// Global function for tracking product clicks
function trackProductClick(productName, productUrl, storeName) {
    if (window.cookieManager) {
        window.cookieManager.trackProductClick(productName, productUrl, storeName);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    const app = new UIManager();
    await app.init();
});

console.log('🚀 DealHarvest - Google Sheets Integration Active');