// ====================================
// DEAL HARVEST - REAL-TIME PRODUCT SCRAPER
// Built from scratch - November 2025
// ====================================

// Global Variables
let allProducts = [];
let extractedProduct = null;

// ====================================
// CORE PRODUCT EXTRACTION ENGINE
// ====================================

class ProductScraper {
    constructor() {
        this.proxies = [
            { name: 'AllOrigins', url: 'https://api.allorigins.win/get?url=', type: 'json' },
            { name: 'CorsProxy', url: 'https://corsproxy.io/?', type: 'text' },
            { name: 'CodeTabs', url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'text' }
        ];
    }

    // Main extraction method
    async extractProduct(url) {
        console.log('🔍 Starting product extraction for:', url);
        
        if (!this.isValidURL(url)) {
            throw new Error('Invalid URL provided');
        }

        const store = this.detectStore(url);
        console.log('🏪 Detected store:', store);

        // Try each proxy until one works
        for (const proxy of this.proxies) {
            try {
                console.log(`🔄 Trying ${proxy.name}...`);
                const html = await this.fetchHTML(url, proxy);
                
                if (html) {
                    const productData = this.parseHTML(html, store, url);
                    
                    if (this.isValidProductData(productData)) {
                        console.log('✅ Extraction successful!');
                        return {
                            success: true,
                            data: {
                                ...productData,
                                id: Date.now(),
                                store: store,
                                affiliateLink: url,
                                extractedAt: new Date().toISOString(),
                                isRealData: true
                            }
                        };
                    }
                }
            } catch (error) {
                console.log(`❌ ${proxy.name} failed:`, error.message);
                continue;
            }
        }

        throw new Error('All extraction methods failed. Website may be blocking scraping.');
    }

    // Validate URL
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Detect store from URL
    detectStore(url) {
        const domain = url.toLowerCase();
        
        if (domain.includes('amazon.') || domain.includes('amzn.to')) return 'amazon';
        if (domain.includes('walmart.')) return 'walmart';
        if (domain.includes('target.')) return 'target';
        if (domain.includes('homedepot.')) return 'homedepot';
        if (domain.includes('lowes.')) return 'lowes';
        if (domain.includes('bestbuy.')) return 'bestbuy';
        if (domain.includes('ebay.')) return 'ebay';
        
        return 'other';
    }

    // Fetch HTML through proxy
    async fetchHTML(url, proxy) {
        const proxyUrl = proxy.url + encodeURIComponent(url);
        
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        let html;
        if (proxy.type === 'json') {
            const data = await response.json();
            html = data.contents;
        } else {
            html = await response.text();
        }

        return html;
    }

    // Parse HTML based on store
    parseHTML(html, store, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        console.log(`📄 Parsing ${store} page...`);

        switch (store) {
            case 'amazon':
                return this.parseAmazon(doc);
            case 'walmart':
                return this.parseWalmart(doc);
            case 'target':
                return this.parseTarget(doc);
            case 'homedepot':
                return this.parseHomeDepot(doc);
            default:
                return this.parseGeneric(doc);
        }
    }

    // Amazon-specific parsing
    parseAmazon(doc) {
        return {
            name: this.getTextContent(doc, [
                '#productTitle',
                'h1.a-size-large',
                '[data-testid="product-title"]',
                '.product-title h1'
            ]),
            price: this.getTextContent(doc, [
                '.a-price.a-text-price .a-offscreen',
                '.a-price-current .a-offscreen',
                '.a-price .a-offscreen',
                '[data-testid="price-current"]'
            ]),
            originalPrice: this.getTextContent(doc, [
                '.a-text-strike .a-offscreen',
                '.a-price.a-text-price.a-size-base .a-offscreen',
                '[data-testid="price-was"]'
            ]),
            image: this.getAttribute(doc, [
                '#landingImage',
                '.a-dynamic-image',
                '[data-testid="product-image"] img'
            ], 'src'),
            category: this.detectCategory(doc.title || ''),
            description: this.getTextContent(doc, [
                '#feature-bullets ul',
                '.a-unordered-list.a-nostyle',
                '[data-testid="product-description"]'
            ])
        };
    }

    // Walmart-specific parsing
    parseWalmart(doc) {
        return {
            name: this.getTextContent(doc, [
                'h1[data-testid="product-title"]',
                '[data-automation-id="product-title"]',
                '.prod-ProductTitle h1'
            ]),
            price: this.getTextContent(doc, [
                '[data-testid="price-current"]',
                '[data-automation-id="product-price"]',
                '.price-characteristic'
            ]),
            originalPrice: this.getTextContent(doc, [
                '[data-testid="price-was"]',
                '.price-comparison'
            ]),
            image: this.getAttribute(doc, [
                '[data-testid="product-image"] img',
                '.prod-hero-image img'
            ], 'src'),
            category: this.detectCategory(doc.title || ''),
            description: this.getTextContent(doc, [
                '[data-testid="product-description"]',
                '.about-desc'
            ])
        };
    }

    // Target-specific parsing
    parseTarget(doc) {
        return {
            name: this.getTextContent(doc, [
                'h1[data-test="product-title"]',
                '.pdp-product-name h1'
            ]),
            price: this.getTextContent(doc, [
                '[data-test="product-price"]',
                '.Price__StyledPrice-sc-18mjlk8-0'
            ]),
            originalPrice: this.getTextContent(doc, [
                '[data-test="product-price-reg"]',
                '.sr-only'
            ]),
            image: this.getAttribute(doc, [
                '[data-test="product-image"] img',
                '.ProductImages img'
            ], 'src'),
            category: this.detectCategory(doc.title || ''),
            description: this.getTextContent(doc, [
                '[data-test="item-details-description"]'
            ])
        };
    }

    // Home Depot parsing
    parseHomeDepot(doc) {
        return {
            name: this.getTextContent(doc, [
                'h1.product-title',
                '.pip-product__title h1'
            ]),
            price: this.getTextContent(doc, [
                '.price-format__main-price',
                '.pip-temp-price__main'
            ]),
            originalPrice: this.getTextContent(doc, [
                '.price-format__was-price',
                '.pip-temp-price__was'
            ]),
            image: this.getAttribute(doc, [
                '.mediagallery__mainimage img',
                '.product-image img'
            ], 'src'),
            category: 'home-garden',
            description: this.getTextContent(doc, [
                '.product-details__badge-title'
            ])
        };
    }

    // Generic parsing for unknown stores
    parseGeneric(doc) {
        return {
            name: this.getTextContent(doc, [
                'h1',
                '.product-title',
                '.title',
                '[itemprop="name"]'
            ]),
            price: this.getTextContent(doc, [
                '.price',
                '[itemprop="price"]',
                '.current-price',
                '.sale-price'
            ]),
            originalPrice: this.getTextContent(doc, [
                '.original-price',
                '.was-price',
                '.list-price'
            ]),
            image: this.getAttribute(doc, [
                '.product-image img',
                '.main-image img',
                'img[itemprop="image"]'
            ], 'src'),
            category: this.detectCategory(doc.title || ''),
            description: this.getTextContent(doc, [
                '.product-description',
                '.description'
            ])
        };
    }

    // Helper: Get text content from multiple selectors
    getTextContent(doc, selectors) {
        for (const selector of selectors) {
            const element = doc.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return null;
    }

    // Helper: Get attribute from multiple selectors
    getAttribute(doc, selectors, attribute) {
        for (const selector of selectors) {
            const element = doc.querySelector(selector);
            if (element && element.getAttribute(attribute)) {
                return element.getAttribute(attribute);
            }
        }
        return null;
    }

    // Detect product category
    detectCategory(text) {
        const categories = {
            'electronics': ['laptop', 'phone', 'tablet', 'tv', 'computer', 'headphones', 'speaker'],
            'home-garden': ['furniture', 'decor', 'kitchen', 'garden', 'home', 'bed', 'chair'],
            'fashion': ['shirt', 'shoes', 'dress', 'clothing', 'fashion', 'jewelry'],
            'health-beauty': ['skincare', 'makeup', 'health', 'beauty', 'vitamins'],
            'sports': ['fitness', 'sports', 'exercise', 'outdoor', 'gym'],
            'automotive': ['car', 'auto', 'vehicle', 'tire', 'motor'],
            'toys': ['toy', 'game', 'kids', 'children', 'play']
        };

        const lowerText = text.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return category;
            }
        }
        
        return 'other';
    }

    // Validate extracted product data
    isValidProductData(data) {
        return data && 
               data.name && 
               data.name.length > 3 && 
               data.price &&
               data.price.match(/[\d.,]+/); // Has numeric price
    }

    // Calculate discount percentage
    calculateDiscount(originalPrice, currentPrice) {
        if (!originalPrice || !currentPrice) return null;
        
        const original = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
        const current = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
        
        if (original > current) {
            return Math.round(((original - current) / original) * 100) + '%';
        }
        
        return null;
    }
}

// ====================================
// UI MANAGEMENT
// ====================================

class UIManager {
    constructor() {
        this.scraper = new ProductScraper();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.renderProducts();
        console.log('✅ Deal Harvest initialized');
    }

    // Setup event listeners
    setupEventListeners() {
        // Extract product button
        const extractBtn = document.getElementById('extractBtn');
        if (extractBtn) {
            extractBtn.addEventListener('click', () => this.handleExtraction());
        }

        // Admin panel toggle
        const adminToggle = document.querySelector('.admin-toggle-btn');
        if (adminToggle) {
            adminToggle.addEventListener('click', () => this.toggleAdminPanel());
        }

        // Add product to site
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addProductToSite());
        }
    }

    // Handle product extraction
    async handleExtraction() {
        const urlInput = document.getElementById('productUrl');
        const extractBtn = document.getElementById('extractBtn');
        
        if (!urlInput || !urlInput.value.trim()) {
            alert('Please enter a product URL');
            return;
        }

        // Show loading state
        this.setButtonLoading(extractBtn, true, 'Extracting...');

        try {
            const result = await this.scraper.extractProduct(urlInput.value.trim());
            
            if (result.success) {
                extractedProduct = result.data;
                
                // Calculate discount if we have original price
                if (result.data.originalPrice) {
                    result.data.discount = this.scraper.calculateDiscount(
                        result.data.originalPrice, 
                        result.data.price
                    );
                }
                
                this.showProductPreview(result.data);
                this.setButtonLoading(extractBtn, false, 'Extract Product Info');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Extraction failed:', error);
            this.setButtonLoading(extractBtn, false, 'Extract Product Info');
            
            alert(`❌ Extraction Failed\n\n${error.message}\n\nTips:\n• Try a direct product page URL\n• Check if the link works in your browser\n• Some sites block automated scraping`);
        }
    }

    // Show/hide admin panel
    toggleAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                // Clear form when opening
                const form = document.getElementById('productUrl');
                if (form) form.value = '';
                this.hideProductPreview();
            }
        }
    }

    // Set button loading state
    setButtonLoading(button, isLoading, text) {
        if (!button) return;
        
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            button.disabled = isLoading;
            btnText.style.display = isLoading ? 'none' : 'inline';
            btnLoading.style.display = isLoading ? 'inline' : 'none';
            
            if (isLoading) {
                btnLoading.textContent = text || 'Loading...';
            }
        }
    }

    // Show product preview
    showProductPreview(product) {
        const preview = document.getElementById('productPreview');
        const previewContent = document.getElementById('previewContent');
        
        if (!preview || !previewContent) return;

        previewContent.innerHTML = `
            <div class="preview-container real-data">
                <div class="data-quality real-data">✅ Real product data extracted</div>
                <div class="preview-main">
                    <div class="preview-image-container">
                        <img src="${product.image || 'https://via.placeholder.com/150x120/f8f9fa/718096?text=Product'}" 
                             alt="${product.name}" class="preview-image" 
                             onerror="this.src='https://via.placeholder.com/150x120/f8f9fa/718096?text=Product'">
                    </div>
                    <div class="preview-details">
                        <h5>${product.name}</h5>
                        <div class="preview-price">
                            ${product.originalPrice ? `<span class="original-price">${product.originalPrice}</span> ` : ''}
                            <span class="current-price">${product.price}</span>
                        </div>
                        ${product.discount ? `<span class="preview-discount">${product.discount} OFF</span>` : ''}
                        <div class="preview-store">From ${this.getStoreDisplayName(product.store)}</div>
                        <div class="preview-category">Category: ${product.category}</div>
                        <div class="preview-extracted">Extracted: ${new Date(product.extractedAt).toLocaleString()}</div>
                    </div>
                </div>
                ${product.description ? `<div class="preview-description">${product.description.substring(0, 200)}...</div>` : ''}
            </div>
        `;
        
        preview.style.display = 'block';

        // Show add button
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.style.display = 'block';
        }
    }

    // Hide product preview
    hideProductPreview() {
        const preview = document.getElementById('productPreview');
        const addBtn = document.getElementById('addProductBtn');
        
        if (preview) preview.style.display = 'none';
        if (addBtn) addBtn.style.display = 'none';
    }

    // Get store display name
    getStoreDisplayName(store) {
        const names = {
            'amazon': 'Amazon',
            'walmart': 'Walmart',
            'target': 'Target',
            'homedepot': 'Home Depot',
            'lowes': "Lowe's",
            'bestbuy': 'Best Buy',
            'ebay': 'eBay',
            'other': 'Online Store'
        };
        return names[store] || store;
    }

    // Add product to website
    addProductToSite() {
        if (!extractedProduct) {
            alert('No product data available');
            return;
        }

        // Add to products array
        allProducts.push(extractedProduct);
        
        // Re-render products
        this.renderProducts();
        
        // Close admin panel
        this.toggleAdminPanel();
        
        // Show success message
        alert(`✅ Product "${extractedProduct.name}" added successfully!`);
        
        // Clear extracted product
        extractedProduct = null;
    }

    // Render products on the page
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (allProducts.length === 0) {
            grid.innerHTML = '<p class="no-products">No products added yet. Use the admin panel to add products.</p>';
            return;
        }

        grid.innerHTML = allProducts.map(product => `
            <div class="product-card" data-category="${product.category}">
                <div class="product-image">
                    <img src="${product.image || 'https://via.placeholder.com/300x200/f8f9fa/718096?text=Product'}" 
                         alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200/f8f9fa/718096?text=Product'">
                    ${product.discount ? `<span class="discount-badge">${product.discount} OFF</span>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        ${product.originalPrice ? `<span class="original-price">${product.originalPrice}</span>` : ''}
                        <span class="current-price">${product.price}</span>
                    </div>
                    <div class="product-meta">
                        <span class="product-store">${this.getStoreDisplayName(product.store)}</span>
                        <span class="product-category">${product.category}</span>
                    </div>
                    ${product.description ? `<p class="product-description">${product.description.substring(0, 100)}...</p>` : ''}
                </div>
                <div class="product-actions">
                    <a href="${product.affiliateLink}" target="_blank" class="btn btn-primary">
                        View Deal
                    </a>
                </div>
            </div>
        `).join('');
    }
}

// ====================================
// APPLICATION INITIALIZATION
// ====================================

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    const app = new UIManager();
    app.init();
});

// Global function exports for HTML onclick events
window.toggleAdminPanel = function() {
    const app = new UIManager();
    app.toggleAdminPanel();
};

window.handleExtractProduct = function() {
    const app = new UIManager();
    app.handleExtraction();
};

console.log('🚀 Deal Harvest - Real-time Product Scraper Loaded');