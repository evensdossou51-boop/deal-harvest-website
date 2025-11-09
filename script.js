/**
 * DealHarvest Affiliate Store Script - Optimized Version
 * Uses centralized utilities to eliminate code duplication
 */

// Import utilities if available (with fallback)
let CONFIG, CacheManager, HashManager, NotificationManager;
try {
    const utilities = window.DealHarvest || {};
    CONFIG = utilities.CONFIG;
    CacheManager = utilities.CacheManager;
    HashManager = utilities.HashManager;
    NotificationManager = utilities.NotificationManager;
    console.log('✅ Utilities loaded successfully');
} catch (error) {
    console.warn('⚠️ Utilities not available, using fallbacks');
}

// Centralized function to fetch products.json with cache-busting
async function fetchProductsJson() {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const cacheBustUrl = `products.json?v=${timestamp}&r=${randomId}&cb=${Math.floor(Math.random() * 10000)}`;
    
    if (CacheManager) {
        return await CacheManager.fetchWithCacheBust('products.json');
    } else {
        return await fetch(cacheBustUrl, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    }
}

let currentProductsHash = '';

// Function to calculate a simple hash of the products array (fallback)
function calculateProductsHash(products) {
    if (HashManager) {
        return HashManager.calculateProductsHash(products);
    }
    // Fallback implementation - Unicode-safe hash
    try {
        const dataString = JSON.stringify(products.map(p => p.id + p.name + p.salePrice));
        // Use a simple hash function instead of btoa to avoid Unicode issues
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36).slice(0, 16);
    } catch (error) {
        console.warn('Hash calculation failed, using timestamp:', error);
        return Date.now().toString(36).slice(-8);
    }
}

// Function to check for updates
async function checkForUpdates() {
    try {
        const response = await fetchProductsJson();
        
        if (response.ok) {
            const data = await response.json();
            let newProducts;
            
            // Handle both old format (array) and new format (object with metadata)
            if (Array.isArray(data)) {
                newProducts = data; // Include all stores
            } else if (data.products && Array.isArray(data.products)) {
                newProducts = data.products; // Include all stores
                
                // Log update details for debugging
                console.log('🔍 Update check - Source:', data.updateSource);
                console.log('🔍 Update check - Time:', data.lastUpdated);
                console.log('🔍 Update check - ID:', data.updateId);
            } else {
                console.warn('⚠️ Invalid data format during update check');
                return;
            }
            
            // Calculate new hash with error handling
            let newHash;
            try {
                newHash = calculateProductsHash(newProducts);
            } catch (hashError) {
                console.warn('⚠️ Hash calculation failed in update check:', hashError);
                return;
            }
            
            if (currentProductsHash && newHash !== currentProductsHash) {
                console.log('🔄 Products updated! Refreshing...');
                console.log('🔄 Old hash:', currentProductsHash);
                console.log('🔄 New hash:', newHash);
                
                ALL_PRODUCTS = newProducts;
                currentProductsHash = newHash;
                applyFiltersAndRender();
                
                // Show update notification with additional info
                let updateMessage = 'New products available!';
                if (data.updateSource) {
                    updateMessage = `Updated via ${data.updateSource}!`;
                }
                
                if (NotificationManager) {
                    NotificationManager.showSuccess(updateMessage);
                } else {
                    showUpdateNotification(updateMessage);
                }
                
            } else if (!currentProductsHash) {
                currentProductsHash = newHash;
            }
        }
    } catch (error) {
        console.log('Update check failed:', error);
    }
}

// Show update notification
function showUpdateNotification(message = '🔄 Products updated!') {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Manual refresh function
function manualRefresh() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('spinning');
    }
    
    if (NotificationManager) {
        NotificationManager.showProgress('Refreshing products...');
    } else {
        showUpdateNotification('🔄 Refreshing products...');
    }
    
    // Force reload products with cache-busting
    const fetchPromise = fetchProductsJson();
    
    fetchPromise
    .then(response => response.json())
    .then(data => {
        let products;
        
        // Handle both old format (array) and new format (object with metadata)
        if (Array.isArray(data)) {
            products = data;
        } else if (data.products && Array.isArray(data.products)) {
            products = data.products;
            console.log('🔄 Manual refresh - Source:', data.updateSource);
            console.log('🔄 Manual refresh - Time:', data.lastUpdated);
        } else {
            throw new Error('Invalid data format');
        }
        
        ALL_PRODUCTS = products;
        currentProductsHash = calculateProductsHash(products);
        applyFiltersAndRender();
        
        if (refreshBtn) {
            refreshBtn.classList.remove('spinning');
        }
        
        if (NotificationManager) {
            NotificationManager.showSuccess('Products updated successfully!');
        } else {
            showUpdateNotification('✅ Products updated successfully!');
        }
    })
    .catch(error => {
        if (refreshBtn) {
            refreshBtn.classList.remove('spinning');
        }
        
        if (NotificationManager) {
            NotificationManager.showError('Refresh failed. Please try again.');
        } else {
            showUpdateNotification('❌ Refresh failed. Please try again.');
        }
        console.error('Refresh error:', error);
    });
}

const PRODUCTS_PER_PAGE = 32;
let currentPage = 1;
let ALL_PRODUCTS = []; 
let currentFilters = {
    search: '',
    category: '',
    store: 'all' // Show all stores (Amazon and Walmart)
};

// 1. DOM ELEMENTS
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchForm').querySelector('.search-input');
const categoryFilter = document.getElementById('categoryFilter');
const storeFilterGrid = document.getElementById('storeFilterGrid');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');

/**
 * Helper: Calculates Discount Percentage
 */
function calculateDiscount(product) {
    if (product.originalPrice > product.salePrice) {
        const discount = 1 - (product.salePrice / product.originalPrice);
        return Math.round(discount * 100);
    }
    return 0;
}

/**
 * 2. CORE FUNCTION: Generates the HTML for a single product card.
 */
function createProductCard(product) {
    const discountPercent = calculateDiscount(product);
    const discountBadge = discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}% OFF</span>` : '';

    // Handle image src - check if it's a full URL or filename
    const imageSrc = product.image.startsWith('http') ? product.image : `images/${product.image}`;

    return `
        <div class="product-card" data-store="${product.store.toLowerCase()}" data-category="${product.category.toLowerCase()}">
            ${discountBadge} 
            <div class="product-image-wrapper">
                <img src="${imageSrc}" alt="${product.name}" class="product-main-image">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-store">${product.store.toUpperCase()}</p>
            <p class="product-price">
                <span class="sale-price">$${product.salePrice.toFixed(2)}</span>
                ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
            </p>
            <a href="${product.affiliateLink}" target="_blank" rel="nofollow sponsored" class="product-btn">
                View Deal & Shop Now
            </a>
        </div>
    `;
}

/**
 * 3. RENDERING & FILTERING
 */
function applyFiltersAndRender() {
    console.log('🔍 Applying filters:', currentFilters); // Debug log
    console.log('📊 Total products before filtering:', ALL_PRODUCTS.length); // Debug log
    
    let filteredProducts = ALL_PRODUCTS.filter(product => {
        const searchVal = currentFilters.search.toLowerCase();
        
        // Search Filter (checks name and description)
        const matchesSearch = searchVal === '' ||
            product.name.toLowerCase().includes(searchVal) ||
            (product.description && product.description.toLowerCase().includes(searchVal));
        
        // Category Filter - Case insensitive matching
        const matchesCategory = currentFilters.category === '' ||
            product.category.toLowerCase() === currentFilters.category.toLowerCase();
            
        // Store Filter - Support Amazon and eBay with categories
        let matchesStore = currentFilters.store === 'all' || 
            product.store.toLowerCase() === currentFilters.store.toLowerCase();
        
        // eBay Category Filter - Additional filtering for eBay products
        if (currentFilters.store === 'ebay' && currentEbayCategory && currentEbayCategory !== 'all') {
            const productCategory = getEbayProductCategory(product);
            matchesStore = matchesStore && (productCategory === currentEbayCategory);
        }

        const matches = matchesSearch && matchesCategory && matchesStore;
        
        // Enhanced debug logging for store filtering
        if (currentFilters.store !== 'all') {
            console.log(`🏪 Product: "${product.name}" | Product Store: "${product.store}" | Filter: "${currentFilters.store}" | Match: ${matchesStore}`);
        }

        return matches;
    });
    
    console.log('📊 Filtered products:', filteredProducts.length); // Debug log
    
    // Store filtering summary
    if (currentFilters.store !== 'all') {
        const storeProducts = ALL_PRODUCTS.filter(p => p.store.toLowerCase() === currentFilters.store.toLowerCase());
        console.log(`🏪 Store Filter Summary: "${currentFilters.store}" has ${storeProducts.length} total products`);
        console.log(`🏪 After all filters: ${filteredProducts.length} products shown`);
    }
    
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

    // Ensure the current page is valid
    if (currentPage > totalPages && totalPages > 0) { currentPage = totalPages; } 
    else if (totalPages === 0) { currentPage = 1; }

    // Determine the products to display
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const productsToDisplay = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

    // Render output
    productsGrid.innerHTML = productsToDisplay.length > 0
        ? productsToDisplay.map(createProductCard).join('')
        : '<div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 50px;"><h3>No Deals Found</h3><p>Try broadening your search or selecting "All Stores."</p></div>';

    updatePaginationControls(totalPages);
}

/**
 * 4. PAGINATION CONTROLS
 */
function updatePaginationControls(totalPages) {
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    
    // Hide pagination if unnecessary
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.style.display = totalPages <= 1 ? 'none' : 'flex';
}

// EBAY CATEGORY SYSTEM
let currentEbayCategory = null;
let isEbayCategoriesVisible = false;

// eBay category mapping and detection
function getEbayProductCategory(product) {
    const name = product.name.toLowerCase();
    const description = product.description.toLowerCase();
    
    // Christmas/Holiday detection (seasonal priority)
    if (name.includes('christmas') || name.includes('holiday') || name.includes('winter') || 
        description.includes('christmas') || name.includes('decor')) {
        return 'christmas';
    }
    
    // Electronics & Tech
    if (name.includes('electronic') || name.includes('headphone') || name.includes('bluetooth') || 
        name.includes('smart') || name.includes('led') || name.includes('iphone') || 
        name.includes('audio') || name.includes('bracelet') || name.includes('carrier')) {
        return 'electronics';
    }
    
    // Home & Decor
    if (name.includes('wall art') || name.includes('decor') || name.includes('printable') || 
        name.includes('poster') || name.includes('nursery') || name.includes('organizer')) {
        return 'home-decor';
    }
    
    // Health & Fitness
    if (name.includes('fitness') || name.includes('health') || name.includes('tracker') || 
        name.includes('monitor')) {
        return 'health-fitness';
    }
    
    // Digital & DIY
    if (name.includes('diy') || name.includes('digital download') || name.includes('jpeg') || 
        name.includes('vinyl') || name.includes('sublimation') || name.includes('file')) {
        return 'digital-diy';
    }
    
    // Default category
    return 'electronics';
}

function updateEbayCategoryCounts() {
    const ebayProducts = ALL_PRODUCTS.filter(p => p.store.toLowerCase() === 'ebay');
    const categories = {
        'christmas': 0,
        'electronics': 0,
        'home-decor': 0,
        'health-fitness': 0,
        'digital-diy': 0,
        'all': ebayProducts.length
    };
    
    // Count products in each category
    ebayProducts.forEach(product => {
        const category = getEbayProductCategory(product);
        categories[category]++;
    });
    
    // Update the count displays
    Object.keys(categories).forEach(category => {
        const countElement = document.querySelector(`[data-category="${category}"] .category-count`);
        if (countElement) {
            const count = categories[category];
            countElement.textContent = `${count} item${count !== 1 ? 's' : ''}`;
        }
    });
    
    console.log('🏷️ eBay Category Counts:', categories);
}

function showEbayCategorySelection() {
    console.log('🏪 Showing eBay category selection');
    
    // Hide main products and show eBay categories
    const productsGrid = document.getElementById('productsGrid');
    const ebayCategoriesSection = document.getElementById('ebayCategoriesSection');
    const mainTitle = document.getElementById('mainTitle');
    const pagination = document.querySelector('.pagination');
    
    if (productsGrid) productsGrid.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    if (mainTitle) mainTitle.style.display = 'none';
    if (ebayCategoriesSection) ebayCategoriesSection.style.display = 'block';
    
    // Update category counts
    updateEbayCategoryCounts();
    
    isEbayCategoriesVisible = true;
}

function hideEbayCategorySelection() {
    console.log('🏪 Hiding eBay category selection');
    
    // Show main products and hide eBay categories
    const productsGrid = document.getElementById('productsGrid');
    const ebayCategoriesSection = document.getElementById('ebayCategoriesSection');
    const mainTitle = document.getElementById('mainTitle');
    const pagination = document.querySelector('.pagination');
    
    if (productsGrid) productsGrid.style.display = 'grid';
    if (pagination) pagination.style.display = 'flex';
    if (mainTitle) mainTitle.style.display = 'block';
    if (ebayCategoriesSection) ebayCategoriesSection.style.display = 'none';
    
    isEbayCategoriesVisible = false;
    currentEbayCategory = null;
}

function filterEbayByCategory(category) {
    console.log('🏷️ Filtering eBay products by category:', category);
    
    // Set filters for eBay products with specific category
    currentFilters.store = 'ebay';
    currentEbayCategory = category;
    currentPage = 1;
    
    // Update store filter UI
    const storeFilterGrid = document.getElementById('storeFilterGrid');
    storeFilterGrid.querySelectorAll('.store-option-btn').forEach(b => b.classList.remove('active'));
    const ebayBtn = storeFilterGrid.querySelector('[data-store="ebay"]');
    if (ebayBtn) ebayBtn.classList.add('active');
    
    // Hide categories and show filtered products
    hideEbayCategorySelection();
    
    // Update main title
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) {
        if (category === 'all') {
            mainTitle.textContent = '🔨 All eBay Products';
        } else {
            const categoryNames = {
                'christmas': '🎄 Christmas Deals',
                'electronics': '📱 Electronics & Tech',
                'home-decor': '🏠 Home & Decor',
                'health-fitness': '💪 Health & Fitness',
                'digital-diy': '🎨 Digital & DIY'
            };
            mainTitle.textContent = categoryNames[category] || '🔨 eBay Products';
        }
    }
    
    applyFiltersAndRender();
}

// 5. EVENT LISTENERS
// Add error handling for DOM elements
try {
    searchInput.addEventListener('input', () => {
        currentFilters.search = searchInput.value;
        currentPage = 1;
        applyFiltersAndRender();
    });
    document.getElementById('searchForm').addEventListener('submit', (e) => e.preventDefault()); // Stop page reload

    categoryFilter.addEventListener('change', () => {
        currentFilters.category = categoryFilter.value;
        currentPage = 1;
        applyFiltersAndRender();
    });

    storeFilterGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.store-option-btn');
        if (!btn) return;
        
        console.log('🏪 Store button clicked:', btn.dataset.store); // Debug log
        
        // Special handling for eBay - show category selection
        if (btn.dataset.store === 'ebay') {
            showEbayCategorySelection();
            return;
        }
        
        console.log('🏪 Before filter change - Current store filter:', currentFilters.store);
        
        storeFilterGrid.querySelectorAll('.store-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentFilters.store = btn.dataset.store;
        console.log('🏪 After filter change - New store filter:', currentFilters.store);
        currentPage = 1;
        
        // Hide eBay categories if showing
        hideEbayCategorySelection();
        applyFiltersAndRender();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applyFiltersAndRender();
            window.scrollTo({ top: productsGrid.offsetTop - 100, behavior: 'smooth' });
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(ALL_PRODUCTS.length / PRODUCTS_PER_PAGE); // Simple check, filtering is done inside applyFilters
        if (currentPage < totalPages) {
            currentPage++;
            applyFiltersAndRender();
            window.scrollTo({ top: productsGrid.offsetTop - 100, behavior: 'smooth' });
        }
    });

    // eBay Category Selection Event Listeners
    const ebayCategoriesGrid = document.getElementById('ebayCategoriesGrid');
    const backToStoresBtn = document.getElementById('backToStoresBtn');
    
    if (ebayCategoriesGrid) {
        ebayCategoriesGrid.addEventListener('click', (e) => {
            const categoryCard = e.target.closest('.ebay-category-card');
            if (!categoryCard) return;
            
            const category = categoryCard.dataset.category;
            console.log('🏷️ eBay category selected:', category);
            filterEbayByCategory(category);
        });
    }
    
    if (backToStoresBtn) {
        backToStoresBtn.addEventListener('click', () => {
            console.log('🔙 Back to stores clicked');
            
            // Reset filters and show all stores
            currentFilters.store = 'all';
            currentFilters.category = '';
            currentFilters.search = '';
            currentPage = 1;
            currentEbayCategory = null;
            
            // Update UI
            const storeFilterGrid = document.getElementById('storeFilterGrid');
            storeFilterGrid.querySelectorAll('.store-option-btn').forEach(b => b.classList.remove('active'));
            const allStoresBtn = storeFilterGrid.querySelector('[data-store="all"]');
            if (allStoresBtn) allStoresBtn.classList.add('active');
            
            // Reset search and category filters
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            
            // Reset main title
            const mainTitle = document.getElementById('mainTitle');
            if (mainTitle) mainTitle.textContent = 'Today\'s Featured Deals';
            
            hideEbayCategorySelection();
            applyFiltersAndRender();
        });
    }

} catch (error) {
    console.error('Error setting up event listeners:', error);
}


// 6. INITIAL RENDER - FETCHES DATA
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔄 Loading products...');
        
        // Use centralized fetch function
        const response = await fetchProductsJson();
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('🔍 Raw data type:', typeof data);
        console.log('🔍 Is array:', Array.isArray(data));
        console.log('🔍 Data preview:', data.slice ? data.slice(0, 2) : data);
        
        // Handle both old format (array) and new format (object with metadata)
        if (Array.isArray(data)) {
            // Old format - direct array
            ALL_PRODUCTS = data; // Include all stores
            console.log('📊 Products loaded (old format):', data.length);
            console.log('🏪 Stores found:', [...new Set(ALL_PRODUCTS.map(p => p.store))]);
        } else if (data.products && Array.isArray(data.products)) {
            // New format - object with metadata
            ALL_PRODUCTS = data.products; // Include all stores
            console.log('📊 Products loaded from:', data.updateSource || 'unknown source');
            console.log('📅 Last updated:', data.lastUpdated || 'unknown time');
            console.log('🔢 Product count:', data.productCount || data.products.length);
            console.log('🏪 Stores found:', [...new Set(ALL_PRODUCTS.map(p => p.store))]);
            
            // Show update info in notification if recent
            if (data.lastUpdated) {
                const updateTime = new Date(data.lastUpdated);
                const timeDiff = Date.now() - updateTime.getTime();
                
                // If updated within last 5 minutes, show notification
                if (timeDiff < 5 * 60 * 1000) {
                    setTimeout(() => {
                        const message = `Fresh products loaded! Updated ${Math.round(timeDiff/1000/60)} minutes ago`;
                        if (NotificationManager) {
                            NotificationManager.showSuccess(message);
                        } else {
                            showUpdateNotification(`✅ ${message}`);
                        }
                    }, 1000);
                }
            }
        } else {
            throw new Error('Invalid data format in products.json');
        }
        
        // Calculate hash with error handling
        try {
            currentProductsHash = calculateProductsHash(ALL_PRODUCTS);
            console.log('✅ Product hash calculated successfully');
        } catch (hashError) {
            console.warn('⚠️ Hash calculation failed:', hashError);
            currentProductsHash = 'fallback_' + Date.now().toString(36);
        }
        
        applyFiltersAndRender();
        
        // Start periodic update checking
        const interval = CONFIG?.UPDATE_CHECK_INTERVAL || 30000;
        setInterval(checkForUpdates, interval);
        
    } catch (error) {
        const errorDetails = `
            <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <h3>Data Load Error</h3>
                <p>Could not load product data. Please check your <code>products.json</code> file.</p>
                <details style="margin-top: 20px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                    <summary style="cursor: pointer; font-weight: bold;">Technical Details</summary>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 10px; overflow-x: auto;">${error.message}</pre>
                    <p style="margin-top: 10px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>URL:</strong> ${window.location.href}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">🔄 Try Again</button>
                </details>
            </div>
        `;
        productsGrid.innerHTML = errorDetails;
        console.error("Error fetching product data:", error);
        console.error("Stack trace:", error.stack);
    }
    
    // Auto-play video
    const video = document.getElementById('heroVideo');
    if (video) {
        video.play().catch(() => {}); 
    }
});