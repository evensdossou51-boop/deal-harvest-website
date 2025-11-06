// ====================================
// DEALHARVEST - GOOGLE SHEETS INTEGRATION
// Live Product Management System - November 2025
// ====================================

// Global Variables
let allProducts = [
    {
        name: "Amazon Item 1",
        image: "https://via.placeholder.com/120x120/ede9fe/333?text=Amazon",
        url: "https://amzn.to/4oVtduX",
        price: "$--",
        category: "electronics",
        store: "Amazon"
    },
    {
        name: "Amazon Item 2",
        image: "https://via.placeholder.com/120x120/ede9fe/333?text=Amazon",
        url: "https://amzn.to/4pfuTQf",
        price: "$--",
        category: "electronics",
        store: "Amazon"
    },
    {
        name: "Amazon Item 3",
        image: "https://via.placeholder.com/120x120/ede9fe/333?text=Amazon",
        url: "https://amzn.to/495FsR0",
        price: "$--",
        category: "electronics",
        store: "Amazon"
    },
    {
        name: "Amazon Item 4",
        image: "https://via.placeholder.com/120x120/ede9fe/333?text=Amazon",
        url: "https://amzn.to/3LMtOR9",
        price: "$--",
        category: "electronics",
        store: "Amazon"
    },
    {
        name: "Amazon Item 5",
        image: "https://via.placeholder.com/120x120/ede9fe/333?text=Amazon",
        url: "https://amzn.to/3WGNyYN",
        price: "$--",
        category: "electronics",
        store: "Amazon"
    }
];
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

        // Start round panels product rotation
        this.startRoundPanelsRotation();

        // Admin tools
        this.initAdminTools();

        // Ensure filters are cleared so products show immediately
        this.clearFilterUI();
        this.renderProducts();
    }

    // Create an inline SVG placeholder image (no network dependency)
    placeholderImage(text) {
        const label = encodeURIComponent((text || 'Item').slice(0, 10));
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
  <rect width='100%' height='100%' fill='#ede9fe'/>
  <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='18' fill='#333'>${label}</text>
  <rect x='0.5' y='0.5' width='119' height='119' fill='none' stroke='#d8d4fb' stroke-width='1'/>
  Sorry, your browser does not support inline SVG.
</svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }
    // Show 3 random products in each round panel, update every 3 minutes
    startRoundPanelsRotation() {
        // Initial render
        this.updateRoundPanels();
        // Update every 3 minutes (180000 ms)
        setInterval(() => this.updateRoundPanels(), 180000);
    }

    updateRoundPanels() {
        const section = document.querySelector('.round-panels-section');
        // If not enough products, hide the section to avoid empty circles
        if (!Array.isArray(allProducts) || allProducts.length < 3) {
            if (section) section.style.display = 'none';
            return;
        } else {
            if (section) section.style.display = '';
        }

        // For each of the 4 panels
        for (let i = 1; i <= 4; i++) {
            const panel = document.getElementById(`panel${i}`);
            if (!panel) continue;

            // Pick 3 unique random products
            const chosen = this.getRandomUniqueProducts(3);
            panel.innerHTML = chosen.map(prod => {
                const name = prod.name || 'Item';
                const first = name.split(' ')[0];
                const img = prod.image && prod.image.trim() ? prod.image : this.placeholderImage(first);
                const fallback = this.placeholderImage(first);
                return `
                <div class="round-panel-product">
                    <img src="${img}" alt="${name}" class="round-panel-product-img" onerror="this.onerror=null;this.src='${fallback}';">
                    <span class="round-panel-product-name">${this.truncateName(name, 18)}</span>
                </div>`;
            }).join('');
        }
    }

    // Helper: get n unique random products
    getRandomUniqueProducts(n) {
        if (!Array.isArray(allProducts) || allProducts.length <= n) return allProducts.slice(0, n);
        const used = new Set();
        const result = [];
        while (result.length < n) {
            const idx = Math.floor(Math.random() * allProducts.length);
            if (!used.has(idx)) {
                used.add(idx);
                result.push(allProducts[idx]);
            }
        }
        return result;
    }

    // Helper: truncate product name
    truncateName(name, maxLen) {
        if (!name) return '';
        return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
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

    // ADMIN: Initialize add-product tools (visible with ?admin=1)
    initAdminTools() {
        const params = new URLSearchParams(window.location.search);
        const isAdmin = params.get('admin') === '1';
        const fab = document.getElementById('adminAddBtn');
        const backdrop = document.getElementById('adminModalBackdrop');
        const closeBtn = document.getElementById('adminCloseModal');
    const saveBtn = document.getElementById('adminSaveProduct');
    const bulkBtn = document.getElementById('adminBulkImport');
    const bulkArea = document.getElementById('adminBulkLinks');
    const clearAllBtn = document.getElementById('adminClearAll');
    const fetchBtn = document.getElementById('adminFetchDetails');
    const autoFetch = document.getElementById('adminAutoFetch');
    const refreshSheetsBtn = document.getElementById('adminRefreshSheets');
        if (!fab || !backdrop || !closeBtn || !saveBtn) return;

        if (isAdmin) {
            fab.style.display = 'block';
        }
        const openModal = () => {
            backdrop.style.display = 'flex';
        };
        const closeModal = () => {
            backdrop.style.display = 'none';
        };
        fab.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

        saveBtn.addEventListener('click', () => {
            const nameEl = document.getElementById('adminName');
            const imageEl = document.getElementById('adminImage');
            const urlEl = document.getElementById('adminUrl');
            const priceEl = document.getElementById('adminPrice');
            const categoryEl = document.getElementById('adminCategory');
            const name = (nameEl?.value || '').trim();
            const url = (urlEl?.value || '').trim();
            const image = (imageEl?.value || '').trim();
            const price = (priceEl?.value || '').trim();
            const category = (categoryEl?.value || '').trim() || 'electronics';
            if (!name || !url) {
                alert('Please provide at least a Name and URL');
                return;
            }
            const store = this.detectStore(url);
            const product = {
                name,
                url,
                image: image || `https://via.placeholder.com/120x120/ede9fe/333?text=${encodeURIComponent(name.split(' ')[0])}`,
                price: price || '$--',
                category,
                store
            };
            // Persist to localStorage
            const existing = JSON.parse(localStorage.getItem('customProducts') || '[]');
            existing.push(product);
            localStorage.setItem('customProducts', JSON.stringify(existing));
            // Merge and re-render
            allProducts = this.mergeProducts(allProducts, [product]);
            this.renderProducts();
            this.updateRoundPanels();
            closeModal();
            // Clear fields
            if (nameEl) nameEl.value = '';
            if (imageEl) imageEl.value = '';
            if (urlEl) urlEl.value = '';
            if (priceEl) priceEl.value = '';
            if (categoryEl) categoryEl.value = '';
        });

        // Fetch details for a single URL and populate fields
        if (fetchBtn) {
            fetchBtn.addEventListener('click', async () => {
                const urlEl = document.getElementById('adminUrl');
                const nameEl = document.getElementById('adminName');
                const imageEl = document.getElementById('adminImage');
                const priceEl = document.getElementById('adminPrice');
                const url = (urlEl?.value || '').trim();
                if (!url) { alert('Enter a product URL first.'); return; }
                try {
                    fetchBtn.disabled = true; fetchBtn.textContent = 'Fetching…';
                    const data = await this.fetchProductDetails(url);
                    if (data) {
                        if (data.name && nameEl) nameEl.value = data.name;
                        if (data.image && imageEl) imageEl.value = data.image;
                        if (data.price && priceEl) priceEl.value = data.price;
                    } else {
                        alert('No details found.');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Failed to fetch details.');
                } finally {
                    fetchBtn.disabled = false; fetchBtn.textContent = 'Fetch Details';
                }
            });
        }

        // Bulk import from pasted links
        if (bulkBtn) {
            bulkBtn.addEventListener('click', async () => {
                if (!bulkArea) return;
                const lines = bulkArea.value
                    .split(/\r?\n/)
                    .map(s => s.trim())
                    .filter(s => s && /^https?:\/\//i.test(s));
                if (lines.length === 0) {
                    alert('Please paste one or more valid links (starting with http or https).');
                    return;
                }
                const doAuto = !!(autoFetch && autoFetch.checked);
                const newProducts = [];
                for (let i = 0; i < lines.length; i++) {
                    const url = lines[i];
                    let prod = null;
                    if (doAuto) {
                        try {
                            const data = await this.fetchProductDetails(url);
                            if (data) {
                                prod = {
                                    name: data.name || 'Item',
                                    image: data.image || this.placeholderImage('Item'),
                                    url,
                                    price: data.price || '$--',
                                    category: 'electronics',
                                    store: data.store || this.detectStore(url)
                                };
                            }
                        } catch (e) { console.warn('Auto-fetch failed for', url, e); }
                    }
                    if (!prod) {
                        const store = this.detectStore(url);
                        const nameBase = store && store !== 'Online Store' ? store : 'Product';
                        prod = {
                            name: `${nameBase} Item ${i + 1}`,
                            url,
                            image: this.placeholderImage(nameBase.split(' ')[0]),
                            price: '$--',
                            category: 'electronics',
                            store
                        };
                    }
                    newProducts.push(prod);
                }
                // Persist
                const existing = JSON.parse(localStorage.getItem('customProducts') || '[]');
                const mergedCustom = [...existing, ...newProducts];
                localStorage.setItem('customProducts', JSON.stringify(mergedCustom));
                // Merge to current and render
                allProducts = this.mergeProducts(allProducts, newProducts);
                this.fullProductList = this.mergeProducts(this.fullProductList || [], newProducts);
                this.renderProducts();
                this.updateRoundPanels();
                bulkArea.value = '';
                closeModal();
            });
        }
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (!confirm('This will remove all custom products you added on this device. Continue?')) return;
                localStorage.removeItem('customProducts');
                allProducts = [];
                this.fullProductList = [];
                this.renderProducts([]);
                this.updateRoundPanels();
                alert('All custom products cleared.');
            });
        }

        if (refreshSheetsBtn) {
            refreshSheetsBtn.addEventListener('click', async () => {
                try {
                    if (window.googleSheetsAPI && window.googleSheetsAPI.forceRefresh) {
                        this.showLoading();
                        const fresh = await window.googleSheetsAPI.forceRefresh();
                        // Merge with current & local custom
                        const custom = JSON.parse(localStorage.getItem('customProducts') || '[]');
                        const merged = this.mergeProducts(custom, fresh);
                        allProducts = merged;
                        this.fullProductList = merged.slice();
                        this.renderProducts();
                        this.updateRoundPanels();
                        alert(`Loaded ${fresh.length} products from Google Sheets.`);
                    } else {
                        alert('Google Sheets API is not available on this page.');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Failed to refresh from Google Sheets.');
                }
            });
        }
    }

    // Load products (currently disabled to remove all items)
    async loadProducts() {
        this.showLoading();
        try {
            // Remove any locally saved custom products
            localStorage.removeItem('customProducts');
        } catch (_) {}
        // Clear all products and render empty grid
        this.fullProductList = [];
        allProducts = [];
        this.hideLoading();
        this.renderProducts([]);
    }

    // Merge lists, unique by URL
    mergeProducts(baseList, incomingList) {
        const urlSet = new Set();
        const out = [];
        [...(baseList || []), ...(incomingList || [])].forEach(p => {
            if (!p || !p.url) return;
            if (urlSet.has(p.url)) return;
            urlSet.add(p.url);
            out.push(p);
        });
        return out;
    }

    // Call our serverless function to fetch real details
    async fetchProductDetails(url) {
        // If using Netlify, function is at /.netlify/functions/fetch-product
        // netlify.toml also allows /api/fetch-product
        const endpoints = [
            `/.netlify/functions/fetch-product?url=${encodeURIComponent(url)}`,
            `/api/fetch-product?url=${encodeURIComponent(url)}`
        ];
        let lastErr = null;
        for (const ep of endpoints) {
            try {
                const res = await fetch(ep, { method: 'GET' });
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.success && json.data) return json.data;
                }
            } catch (e) { lastErr = e; }
        }
        if (lastErr) throw lastErr;
        return null;
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

        // Always filter from the full merged product list
        let filtered = [...(this.fullProductList || allProducts)];

        // Apply search filter
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchQuery) {
            filtered = filtered.filter(product => 
                product.name && product.name.toLowerCase().includes(searchQuery)
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
                const store = (product.store || this.detectStore(product.url)).toLowerCase();
                return store === selectedStore || 
                       (selectedStore === 'homedepot' && store === 'home depot') ||
                       (selectedStore === 'bestbuy' && store === 'best buy');
            });
        }

        this.renderProducts(filtered);

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
    renderProducts(productList) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        // Also update round panels if products change
        this.updateRoundPanels();

        const products = productList || allProducts;
        if (products.length === 0) {
            grid.innerHTML = `
                <div class="no-products">
                    <h3>No products found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => {
            const storeName = product.store || this.detectStore(product.url);
            const storeColor = this.getStoreColor(storeName);
            const name = product.name || 'Item';
            const first = name.split(' ')[0];
            const image = product.image && product.image.trim() ? product.image : this.placeholderImage(first);
            const fallback = this.placeholderImage(first);
            const price = product.price && product.price.trim() ? product.price : '$--';
            return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${image}"
                             alt="${name}"
                             onerror="this.onerror=null;this.src='${fallback}';">
                    </div>
                    <div class="product-name">${name}</div>
                    <div class="product-price">${price}</div>
                    <div class="product-store" style="background-color: ${storeColor}">
                        ${storeName}
                    </div>
                    <button class="product-btn" onclick="trackProductClick('${name}', '${product.url}', '${storeName}'); window.open('${product.url || '#'}', '_blank')">View Deal</button>
                </div>
            `;
        }).join('');
    }

    // Clear filters UI to neutral state
    clearFilterUI() {
        const categoryFilter = document.getElementById('categoryFilter');
        const storeFilter = document.getElementById('storeFilter');
        const searchInput = document.getElementById('searchInput');
        if (categoryFilter) categoryFilter.value = '';
        if (storeFilter) storeFilter.value = '';
        if (searchInput) searchInput.value = '';
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