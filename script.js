/**
 * DealHarvest Affiliate Store Script - Optimized Version
 * Uses centralized utilities to eliminate code duplication
 * Enhanced with Universal Data Manager for cross-browser/device compatibility
 */

// Import utilities if available (with fallback)
let CONFIG, CacheManager, HashManager, NotificationManager, DataManager;
try {
    const utilities = window.DealHarvest || {};
    CONFIG = utilities.CONFIG;
    CacheManager = utilities.CacheManager;
    HashManager = utilities.HashManager;
    NotificationManager = utilities.NotificationManager;
    DataManager = window.DealHarvestDataManager;
    console.log('✅ Utilities loaded successfully');
} catch (error) {
    console.warn('⚠️ Utilities not available, using fallbacks');
}

// Centralized function to fetch products.json with cache-busting
async function fetchProductsJson() {
    // Always fetch fresh data - no cache
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const cacheBustUrl = `products.json?v=${timestamp}&r=${randomId}&cb=${Math.floor(Math.random() * 10000)}`;
    
    console.log('🔄 Fetching fresh products.json with cache-busting:', cacheBustUrl);
    
    try {
        const response = await fetch(cacheBustUrl, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        throw error;
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
                newProducts = data.filter(p => p.store && p.store.toLowerCase() === 'amazon'); // Amazon only
            } else if (data.products && Array.isArray(data.products)) {
                newProducts = data.products.filter(p => p.store && p.store.toLowerCase() === 'amazon'); // Amazon only
                
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
            products = data.filter(p => p.store && p.store.toLowerCase() === 'amazon'); // Amazon only
        } else if (data.products && Array.isArray(data.products)) {
            products = data.products.filter(p => p.store && p.store.toLowerCase() === 'amazon'); // Amazon only
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
    store: 'amazon' // Amazon only
};

// 1. DOM ELEMENTS
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchForm').querySelector('.search-input');
// New view elements for unified search results
const categoryViewEl = document.getElementById('categoryView');
const productViewEl = document.getElementById('productView');
const productViewGridEl = document.getElementById('productViewGrid');
const productCategoryTitleEl = document.getElementById('productCategoryTitle');
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

    // Generate condition badge
    const conditionBadge = product.condition ? 
        `<span class="condition-badge condition-${product.condition.toLowerCase().replace(/\s+/g, '-')}">${product.condition}</span>` : '';
    
    // Generate shipping badge
    const shippingBadge = product.shipping && (product.shipping.toLowerCase().includes('free') || product.shipping === '$0.00') ?
        `<span class="shipping-badge">⚡ Free Shipping</span>` : '';
    
    // Generate deal badge
    const dealBadge = product.originalPrice && ((product.originalPrice - product.salePrice) / product.originalPrice) >= 0.3 ?
        `<span class="deal-badge">🔥 Hot Deal</span>` : '';
    
    // No seller rating for Amazon-only view
    const sellerRating = '';

    return `
        <div class="product-card" data-store="${product.store.toLowerCase()}" data-category="${product.category.toLowerCase()}">
            ${discountBadge}
            ${dealBadge}
            ${conditionBadge}
            ${shippingBadge}
            <button class="wishlist-btn" onclick="toggleWishlist(event, '${product.name}')" aria-label="Add to wishlist">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
            <div class="product-image-wrapper">
                <img src="${imageSrc}" alt="${product.name}" class="product-main-image" loading="lazy">
                <div class="quick-view-overlay">
                    <button class="quick-view-btn" onclick="openQuickView(event, ${JSON.stringify(product).replace(/"/g, '&quot;')})">
                        👁️ Quick View
                    </button>
                </div>
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-store">${product.store.toUpperCase()}</p>
            ${sellerRating}
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
            
        // Store Filter - Only show Amazon products
        let matchesStore = product.store.toLowerCase() === 'amazon';

        // ADVANCED FILTERS
        // Price filter
        const matchesPrice = product.salePrice >= advancedFiltersState.minPrice && 
                           product.salePrice <= advancedFiltersState.maxPrice;
        
        // Condition filter
        const matchesCondition = advancedFiltersState.condition.length === 0 ||
            (product.condition && advancedFiltersState.condition.some(cond => 
                product.condition.toLowerCase().includes(cond.toLowerCase())
            ));
        
        // Shipping filter
        let matchesShipping = advancedFiltersState.shipping.length === 0;
        if (!matchesShipping && product.shipping) {
            if (advancedFiltersState.shipping.includes('free') && 
                (product.shipping.toLowerCase().includes('free') || product.shipping === '$0.00')) {
                matchesShipping = true;
            }
            if (advancedFiltersState.shipping.includes('fast') && 
                product.shipping.toLowerCase().includes('fast')) {
                matchesShipping = true;
            }
        }
        
        // Deal filter
        let matchesDeal = advancedFiltersState.deal.length === 0;
        if (!matchesDeal && product.originalPrice) {
            const discount = ((product.originalPrice - product.salePrice) / product.originalPrice);
            if (advancedFiltersState.deal.includes('hot') && discount >= 0.3) {
                matchesDeal = true;
            }
            if (advancedFiltersState.deal.includes('discount') && discount >= 0.3) {
                matchesDeal = true;
            }
        }

        const matches = matchesSearch && matchesCategory && matchesStore && 
                       matchesPrice && matchesCondition && matchesShipping && matchesDeal;
        
        // Enhanced debug logging for store filtering
        if (currentFilters.store !== 'all') {
            console.log(`🏪 Product: "${product.name}" | Product Store: "${product.store}" | Filter: "${currentFilters.store}" | Match: ${matchesStore}`);
        }

        return matches;
    });
    
    console.log('📊 Filtered products:', filteredProducts.length); // Debug log
    
    // Store filtering summary
    // Store filtering summary for Amazon only
    const storeProducts = ALL_PRODUCTS.filter(p => p.store.toLowerCase() === 'amazon');
    console.log(`🏪 Store Filter Summary: "amazon" has ${storeProducts.length} total products`);
    console.log(`🏪 After all filters: ${filteredProducts.length} products shown`);
    
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

// EBAY CATEGORY SYSTEM REMOVED - Amazon only

// 5. EVENT LISTENERS
// Add error handling for DOM elements
try {
    searchInput.addEventListener('input', () => {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        if (currentFilters.search.length > 0) {
            // Show search results in productView
            renderSearchResults(currentFilters.search);
        } else {
            // Clear search -> show categories again
            showCategoryView();
        }
    });
    document.getElementById('searchForm').addEventListener('submit', (e) => e.preventDefault()); // Stop page reload

    categoryFilter.addEventListener('change', () => {
        currentFilters.category = categoryFilter.value;
        currentPage = 1;
        if (currentFilters.search && currentFilters.search.length > 0) {
            renderSearchResults(currentFilters.search);
        } else {
            applyFiltersAndRender();
        }
    });

    storeFilterGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.store-option-btn');
        if (!btn) return;
        
        console.log('🏪 Store button clicked:', btn.dataset.store); // Debug log
        
        // Amazon only - no special handling needed
        
        console.log('🏪 Before filter change - Current store filter:', currentFilters.store);
        
        storeFilterGrid.querySelectorAll('.store-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentFilters.store = btn.dataset.store;
        console.log('🏪 After filter change - New store filter:', currentFilters.store);
        currentPage = 1;
        
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

} catch (error) {
    console.error('Error setting up event listeners:', error);
}

// CATEGORY EMOJI MAPPING
const CATEGORY_EMOJIS = {
    'Wearable Technology': '⌚',
    'Home': '🏠',
    'Home Improvement': '🔨',
    'Kitchen & Dining': '🍽️',
    'Beauty & Grooming': '💄',
    'Cell Phones & Accessories': '📱',
    'Patio, Lawn & Garden': '🌿',
    'Books & Textbooks': '📚',
    'Toys & Games': '🎮',
    'Kids': '👶',
    'Pet Food & Supplies': '🐾',
    'Amazon Gift Cards': '🎁',
    'Health & Household': '💊',
    'Shoes, Handbags, Wallets, Sunglasses': '👟',
    'Luggage': '🧳',
    'Musical Instruments': '🎵',
    'General': '🛍️'
};

// Category to image mapping
const CATEGORY_IMAGES = {
    'Wearable Technology': 'images/apple watch.png',
    'Home': 'images/WONDER GARDEN Christmas Wreath.png',
    'Home Improvement': 'images/Beieverluck.png',
    'Kitchen & Dining': 'images/espresso.png',
    'Beauty & Grooming': 'images/medicube.png',
    'Cell Phones & Accessories': 'images/charger block.png',
    'Patio, Lawn & Garden': 'images/Hourleey.png',
    'Books & Textbooks': 'images/bible.png',
    'Toys & Games': 'images/batman toy.png',
    'Kids': 'images/todler toy.png',
    'Pet Food & Supplies': 'images/dogblanket.png',
    'Amazon Gift Cards': 'images/amazongiftcard.png',
    'Health & Household': 'images/cascade.png',
    'Shoes, Handbags, Wallets, Sunglasses': 'images/KidsGirks SNeakers.png',
    'Luggage': 'images/Luggage 3 Piece.png',
    'Musical Instruments': 'images/wirelessiphone mic.png',
    'General': 'images/pajamas.png'
};

// Store categorized products globally
let categorizedProducts = {};

// Optional SVG icon set for categories (preferred over emoji when available)
const CATEGORY_SVG_ICONS = {
    'Cell Phones & Accessories': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="7" y="2" width="10" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
    `,
    'Books & Textbooks': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M4 4v15.5"></path>
            <path d="M20 22V6a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 6.5"></path>
        </svg>
    `,
    'Kitchen & Dining': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 3v8a2 2 0 0 0 2 2h1V3"></path>
            <path d="M10 3v10"></path>
            <path d="M14 3v6a2 2 0 0 0 2 2h2"></path>
            <path d="M16 13v8"></path>
        </svg>
    `,
    'Beauty & Grooming': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 3h4l1 4H9l1-4z"></path>
            <rect x="9" y="7" width="6" height="13" rx="2"></rect>
        </svg>
    `,
    'Home': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7"></path>
            <path d="M9 22V12h6v10"></path>
            <path d="M21 22H3"></path>
        </svg>
    `,
    'Home Improvement': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-9.9 9.9H6v-1.8l8.7-8.7z"></path>
            <path d="M13 7l4 4"></path>
        </svg>
    `,
    'Patio, Lawn & Garden': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22V12"></path>
            <path d="M7 17c2-2 5-2 5-7 0 5 3 5 5 7"></path>
            <path d="M5 10c2 0 4-2 4-4 0 2 2 4 4 4"></path>
        </svg>
    `,
    'Wearable Technology': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="7" y="5" width="10" height="14" rx="3"></rect>
            <path d="M9 5V3m6 2V3m0 18v-2M9 21v-2"></path>
        </svg>
    `,
    'Toys & Games': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="8" width="18" height="8" rx="2"></rect>
            <circle cx="8" cy="12" r="1"></circle>
            <circle cx="16" cy="12" r="1"></circle>
        </svg>
    `,
    'Kids': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="7" r="3"></circle>
            <path d="M5 21a7 7 0 0 1 14 0"></path>
        </svg>
    `,
    'Pet Food & Supplies': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 21c-4-1-7-3-7-6a5 5 0 0 1 10 0c0 3-3 5-7 6z"></path>
            <circle cx="8" cy="8" r="1.5"></circle>
            <circle cx="16" cy="8" r="1.5"></circle>
        </svg>
    `,
    'Amazon Gift Cards': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="5" width="18" height="14" rx="2"></rect>
            <path d="M12 5v14"></path>
            <path d="M7 9h10"></path>
        </svg>
    `,
    'Health & Household': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21s-6-4.35-6-9a6 6 0 0 1 12 0c0 4.65-6 9-6 9z"></path>
            <path d="M10 11h4M12 9v4"></path>
        </svg>
    `,
    'Shoes, Handbags, Wallets, Sunglasses': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 7h12l2 6H4l2-6z"></path>
            <path d="M9 7a3 3 0 0 1 6 0"></path>
        </svg>
    `,
    'Luggage': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="7" y="6" width="10" height="14" rx="2"></rect>
            <path d="M9 6V4h6v2"></path>
            <path d="M9 10v6M15 10v6"></path>
        </svg>
    `,
    'Musical Instruments': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
            <path d="M21 3l-9 9"></path>
            <path d="M15 3h6v6"></path>
        </svg>
    `,
    'General': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6h15l-1.5 9H7.5L6 6z"></path>
            <circle cx="9" cy="20" r="1"></circle>
            <circle cx="18" cy="20" r="1"></circle>
        </svg>
    `
    , 'Electronics': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect>
            <path d="M12 17v2"></path>
            <circle cx="12" cy="12" r="2"></circle>
        </svg>
    `
    , 'Computers': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="12" rx="2"></rect>
            <path d="M8 20h8"></path>
            <path d="M12 16v4"></path>
        </svg>
    `
    , 'Sports & Outdoors': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="9" r="4"></circle>
            <path d="M9 13a6 6 0 0 0 6 6"></path>
            <path d="M17 7a6 6 0 0 0-6 6"></path>
        </svg>
    `
    , 'Video Games': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="8" width="20" height="8" rx="2"></rect>
            <path d="M6 12h2"></path>
            <path d="M5 10h4"></path>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="18" cy="12" r="1"></circle>
        </svg>
    `
    , 'Automotive': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 13h18l-1.5-5h-15z"></path>
            <circle cx="7.5" cy="16" r="1.5"></circle>
            <circle cx="16.5" cy="16" r="1.5"></circle>
        </svg>
    `
    , 'Arts, Crafts & Sewing': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3l7 7-7 7-7-7 7-7z"></path>
            <path d="M12 3v14"></path>
        </svg>
    `
    , 'Beauty & Personal Care': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 3h6l1 4H8l1-4z"></path>
            <rect x="8" y="7" width="8" height="13" rx="2"></rect>
        </svg>
    `
    , 'Home & Kitchen': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 11l9-8 9 8"></path>
            <path d="M5 10v10h14V10"></path>
            <path d="M10 14h4v6h-4z"></path>
        </svg>
    `
    , 'Garden & Outdoor': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22V12"></path>
            <path d="M7 17c2-2 5-2 5-7 0 5 3 5 5 7"></path>
            <path d="M5 10c2 0 4-2 4-4 0 2 2 4 4 4"></path>
        </svg>
    `
    , 'Grocery & Gourmet Food': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 7h14l-1.5 9H6.5L5 7z"></path>
            <circle cx="9" cy="19" r="1"></circle>
            <circle cx="15" cy="19" r="1"></circle>
        </svg>
    `
    , 'Office Products': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="3" width="12" height="18" rx="2"></rect>
            <path d="M10 7h4"></path>
            <path d="M10 11h4"></path>
            <path d="M10 15h4"></path>
        </svg>
    `
    , 'Industrial & Scientific': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.4 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .7.4 1.33 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10c.7.2 1.33.9 1.51 1.6V12a2 2 0 1 1-4 0v-.09c0-.7-.4-1.33-1-1.51-.53-.18-1.14-.04-1.54.36-.4.4-.54 1.01-.36 1.54.18.6.81 1 1.51 1.09z"></path>
        </svg>
    `
    , 'Movies & TV': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
            <path d="M12 18v3"></path>
            <path d="M8 21h8"></path>
        </svg>
    `
    , 'Pet Supplies': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M3 12h3"></path>
            <path d="M18 12h3"></path>
            <path d="M12 3v3"></path>
            <path d="M12 18v3"></path>
        </svg>
    `
    , 'Amazon Fashion': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 3h12l2 7H4l2-7z"></path>
            <path d="M5 10l2 11h10l2-11"></path>
        </svg>
    `
    , 'Baby': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M5 21a7 7 0 0 1 14 0"></path>
        </svg>
    `
};

// Display category cards (circular with images)
function displayCategoryCards() {
    const categoryGrid = document.getElementById('categoryGrid');
    const categoryView = document.getElementById('categoryView');
    const productView = document.getElementById('productView');
    const categoryLoading = document.getElementById('categoryLoading');
    const productsGridContainer = document.getElementById('productsGrid');
    const paginationContainer = document.querySelector('.pagination');

    if (!categoryGrid) return;

    // Group products by category
    categorizedProducts = {};
    ALL_PRODUCTS.forEach(product => {
        const category = product.category || 'General';
        if (!categorizedProducts[category]) {
            categorizedProducts[category] = [];
        }
        categorizedProducts[category].push(product);
    });

    const sortedCategories = Object.keys(categorizedProducts).sort((a, b) =>
        categorizedProducts[b].length - categorizedProducts[a].length
    );

    if (sortedCategories.length === 0) {
        categoryGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6b7280;">
                No categories found yet. Please try again later.
            </div>`;
    } else {
        categoryGrid.innerHTML = sortedCategories.map(category => {
            const products = categorizedProducts[category];
            const imgSrc = CATEGORY_IMAGES[category] || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop';
            const safeCategory = category.replace(/'/g, "\\'");
            return `
                <div class="category-card" data-category="${safeCategory}" title="${category}">
                    <div class="category-circle" aria-hidden="true">
                        <img class="category-image" src="${imgSrc}" alt="${category}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop'">
                    </div>
                    <div class="category-label">${category}</div>
                    <div class="category-item-count">${products.length} item${products.length !== 1 ? 's' : ''}</div>
                </div>
            `;
        }).join('');
    }

    // Attach click listeners
    categoryGrid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.category;
            showCategoryProducts(cat);
        });
    });

    // Show category view, hide product view and legacy grids
    categoryView.style.display = 'block';
    productView.style.display = 'none';
    if (categoryLoading) categoryLoading.style.display = 'none';
    if (productsGridContainer) productsGridContainer.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';
}

// Show products for a specific category
function showCategoryProducts(categoryName) {
    const productView = document.getElementById('productView');
    const categoryView = document.getElementById('categoryView');
    const productCategoryTitle = document.getElementById('productCategoryTitle');
    const productViewGrid = document.getElementById('productViewGrid');
    const productsGridContainer = document.getElementById('productsGrid');
    const paginationContainer = document.querySelector('.pagination');

    if (!categorizedProducts[categoryName]) return;

    const products = categorizedProducts[categoryName];
    productCategoryTitle.textContent = categoryName + ' Deals';
    productViewGrid.innerHTML = products.map(createProductCard).join('');

    categoryView.style.display = 'none';
    productView.style.display = 'block';
    if (productsGridContainer) productsGridContainer.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCategoryView() {
    const productView = document.getElementById('productView');
    const categoryView = document.getElementById('categoryView');
    productView.style.display = 'none';
    categoryView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Render unified search results into product view
 */
function renderSearchResults(term) {
    // Filter across all products using existing applyFilters logic baseline
    const searchVal = term.toLowerCase();
    const filtered = ALL_PRODUCTS.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchVal) ||
            (product.description && product.description.toLowerCase().includes(searchVal));
        const matchesCategory = currentFilters.category === '' || (product.category && product.category.toLowerCase() === currentFilters.category.toLowerCase());
        const matchesStore = product.store && product.store.toLowerCase() === 'amazon';
        // Keep advanced filters consistent
        const matchesPrice = product.salePrice >= advancedFiltersState.minPrice && product.salePrice <= advancedFiltersState.maxPrice;
        const matchesCondition = advancedFiltersState.condition.length === 0 || (product.condition && advancedFiltersState.condition.some(cond => product.condition.toLowerCase().includes(cond.toLowerCase())));
        let matchesShipping = advancedFiltersState.shipping.length === 0;
        if (!matchesShipping && product.shipping) {
            if (advancedFiltersState.shipping.includes('free') && (product.shipping.toLowerCase().includes('free') || product.shipping === '$0.00')) matchesShipping = true;
            if (advancedFiltersState.shipping.includes('fast') && product.shipping.toLowerCase().includes('fast')) matchesShipping = true;
        }
        let matchesDeal = advancedFiltersState.deal.length === 0;
        if (!matchesDeal && product.originalPrice) {
            const discount = ((product.originalPrice - product.salePrice) / product.originalPrice);
            if (advancedFiltersState.deal.includes('hot') && discount >= 0.3) matchesDeal = true;
            if (advancedFiltersState.deal.includes('discount') && discount >= 0.3) matchesDeal = true;
        }
        return matchesSearch && matchesCategory && matchesStore && matchesPrice && matchesCondition && matchesShipping && matchesDeal;
    });

    // Update product view
    if (productCategoryTitleEl) {
        productCategoryTitleEl.textContent = `Search results for "${term}" (${filtered.length})`;
    }
    if (productViewGridEl) {
        productViewGridEl.innerHTML = filtered.length > 0
            ? filtered.map(createProductCard).join('')
            : `<div style="grid-column: 1 / -1; text-align:center; padding:40px; color:#6b7280;">No results found.</div>`;
    }
    if (categoryViewEl && productViewEl) {
        categoryViewEl.style.display = 'none';
        productViewEl.style.display = 'block';
    }
    const paginationContainer = document.querySelector('.pagination');
    if (paginationContainer) paginationContainer.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Switch back to regular view
function displayProductsRegular() {
    const categorySectionsContainer = document.getElementById('categorySections');
    const productsGridContainer = document.getElementById('productsGrid');
    
    if (categorySectionsContainer) {
        categorySectionsContainer.style.display = 'none';
    }
    productsGridContainer.style.display = 'grid';
    
    applyFiltersAndRender();
}

// DUPLICATE DETECTION AND REMOVAL
function removeDuplicateProducts(products) {
    const seen = {
        ids: new Set(),
        names: new Set(),
        links: new Set()
    };
    
    const duplicates = [];
    const unique = [];
    
    products.forEach((product, index) => {
        let isDuplicate = false;
        const duplicateReasons = [];
        
        // Check for duplicate ID
        if (product.id && seen.ids.has(product.id)) {
            isDuplicate = true;
            duplicateReasons.push(`ID: ${product.id}`);
        }
        
        // Check for duplicate name (case-insensitive)
        const normalizedName = product.name?.toLowerCase().trim();
        if (normalizedName && seen.names.has(normalizedName)) {
            isDuplicate = true;
            duplicateReasons.push(`Name: "${product.name}"`);
        }
        
        // Check for duplicate affiliate link
        const normalizedLink = product.affiliateLink?.toLowerCase().trim();
        if (normalizedLink && seen.links.has(normalizedLink)) {
            isDuplicate = true;
            duplicateReasons.push(`Link: ${product.affiliateLink}`);
        }
        
        if (isDuplicate) {
            duplicates.push({
                index: index,
                product: product,
                reasons: duplicateReasons
            });
            console.warn(`⚠️ Duplicate product found at index ${index}: ${duplicateReasons.join(', ')}`);
        } else {
            // Mark as seen
            if (product.id) seen.ids.add(product.id);
            if (normalizedName) seen.names.add(normalizedName);
            if (normalizedLink) seen.links.add(normalizedLink);
            
            unique.push(product);
        }
    });
    
    if (duplicates.length > 0) {
        console.error(`❌ Found ${duplicates.length} duplicate product(s):`);
        duplicates.forEach(dup => {
            console.error(`   - Index ${dup.index}: "${dup.product.name}" (${dup.reasons.join(', ')})`);
        });
        console.log(`✅ Kept ${unique.length} unique products`);
    } else {
        console.log(`✅ No duplicates found. All ${unique.length} products are unique.`);
    }
    
    return unique;
}

// 6. INITIAL RENDER - FETCHES DATA
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state for categories immediately
    const categoryLoading = document.getElementById('categoryLoading');
    const categoryView = document.getElementById('categoryView');
    if (categoryView) categoryView.style.display = 'block';
    if (categoryLoading) categoryLoading.style.display = 'block';
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
            // Old format - direct array - Filter to Amazon only
            ALL_PRODUCTS = data.filter(p => p.store && p.store.toLowerCase() === 'amazon');
            
            // Remove duplicates
            ALL_PRODUCTS = removeDuplicateProducts(ALL_PRODUCTS);
            
            console.log('📊 Amazon products loaded (old format):', ALL_PRODUCTS.length);
            console.log('🏪 Stores found:', [...new Set(ALL_PRODUCTS.map(p => p.store))]);
            
            // Cache products with Data Manager
            if (DataManager?.products) {
                DataManager.products.saveProducts(ALL_PRODUCTS, {
                    version: '1.0',
                    source: 'direct-array'
                });
            }
        } else if (data.products && Array.isArray(data.products)) {
            // New format - object with metadata - Filter to Amazon only
            ALL_PRODUCTS = data.products.filter(p => p.store && p.store.toLowerCase() === 'amazon');
            
            // Remove duplicates
            ALL_PRODUCTS = removeDuplicateProducts(ALL_PRODUCTS);
            
            console.log('📊 Amazon products loaded from:', data.updateSource || 'unknown source');
            console.log('📅 Last updated:', data.lastUpdated || 'unknown time');
            console.log('🔢 Amazon product count:', ALL_PRODUCTS.length);
            console.log('🏪 Stores found:', [...new Set(ALL_PRODUCTS.map(p => p.store))]);
            
            // Cache products with Data Manager
            if (DataManager?.products) {
                DataManager.products.saveProducts(ALL_PRODUCTS, {
                    version: data.version || '1.0',
                    source: data.updateSource,
                    lastUpdated: data.lastUpdated
                });
            }
            
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
        
    // Display category cards in new view structure
    displayCategoryCards();
        updateStatistics();
        
        // Start periodic update checking
        const interval = CONFIG?.UPDATE_CHECK_INTERVAL || 30000;
        setInterval(checkForUpdates, interval);
        
    } catch (error) {
        // Render error inside category view so user sees it
        const categoryGrid = document.getElementById('categoryGrid');
        if (categoryGrid) {
            categoryGrid.innerHTML = `
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
                </div>`;
        }
        const categoryLoading = document.getElementById('categoryLoading');
        if (categoryLoading) categoryLoading.style.display = 'none';
        console.error("Error fetching product data:", error);
        console.error("Stack trace:", error.stack);
    }
    
    // Auto-play video
    const video = document.getElementById('heroVideo');
    if (video) {
        video.play().catch(() => {}); 
    }
    // Back button listener (new view structure)
    const backBtn = document.getElementById('backToCategories');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showCategoryView();
        });
    }
});

/**
 * WISHLIST FUNCTIONALITY
 */
let wishlist = JSON.parse(localStorage.getItem('dealHarvestWishlist') || '[]');

function toggleWishlist(event, productName) {
    event.preventDefault();
    event.stopPropagation();
    
    const btn = event.currentTarget;
    const index = wishlist.indexOf(productName);
    
    if (index > -1) {
        wishlist.splice(index, 1);
        btn.classList.remove('active');
        showNotification('❤️ Removed from wishlist');
    } else {
        wishlist.push(productName);
        btn.classList.add('active');
        showNotification('💚 Added to wishlist!');
    }
    
    localStorage.setItem('dealHarvestWishlist', JSON.stringify(wishlist));
}

/**
 * QUICK VIEW MODAL
 */
function openQuickView(event, product) {
    event.preventDefault();
    event.stopPropagation();
    
    const imageSrc = product.image.startsWith('http') ? product.image : `images/${product.image}`;
    const savings = product.originalPrice ? ((product.originalPrice - product.salePrice) / product.originalPrice * 100).toFixed(0) : 0;
    
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
        <div class="quick-view-content">
            <button class="close-modal" onclick="this.closest('.quick-view-modal').remove()">✕</button>
            <div class="quick-view-grid">
                <div class="quick-view-image">
                    <img src="${imageSrc}" alt="${product.name}">
                </div>
                <div class="quick-view-info">
                    <h2>${product.name}</h2>
                    <div class="quick-view-store">${product.store.toUpperCase()}</div>
                    ${product.condition ? `<div class="quick-view-condition">Condition: ${product.condition}</div>` : ''}
                    ${product.description ? `<p class="quick-view-description">${product.description}</p>` : ''}
                    <div class="quick-view-price">
                        <span class="quick-view-sale">$${product.salePrice.toFixed(2)}</span>
                        ${product.originalPrice ? `
                            <span class="quick-view-original">$${product.originalPrice.toFixed(2)}</span>
                            <span class="quick-view-savings">Save ${savings}%</span>
                        ` : ''}
                    </div>
                    ${product.shipping ? `<div class="quick-view-shipping">📦 ${product.shipping}</div>` : ''}
                    <a href="${product.affiliateLink}" target="_blank" class="quick-view-btn">
                        View Full Details & Buy Now
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * ADVANCED FILTERS FUNCTIONALITY
 */
let advancedFiltersState = {
    minPrice: 0,
    maxPrice: 1000,
    condition: [],
    shipping: [],
    deal: []
};

function toggleAdvancedFilters() {
    const panel = document.getElementById('filtersPanel');
    panel.classList.toggle('active');
}

function resetAdvancedFilters() {
    advancedFiltersState = {
        minPrice: 0,
        maxPrice: 1000,
        condition: [],
        shipping: [],
        deal: []
    };
    
    document.getElementById('minPrice').value = 0;
    document.getElementById('maxPrice').value = 1000;
    document.getElementById('minPriceValue').textContent = '0';
    document.getElementById('maxPriceValue').textContent = '1000';
    
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    
    updateActiveFiltersDisplay();
    applyFiltersAndRender();
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    if (!container) return; // Advanced filters removed
    const list = container.querySelector('.active-filters-list');
    list.innerHTML = '';
    
    let hasFilters = false;
    
    // Price filter
    if (advancedFiltersState.minPrice > 0 || advancedFiltersState.maxPrice < 1000) {
        hasFilters = true;
        list.innerHTML += `
            <div class="active-filter-tag">
                Price: $${advancedFiltersState.minPrice} - $${advancedFiltersState.maxPrice}
                <button onclick="resetPriceFilter()">×</button>
            </div>
        `;
    }
    
    // Condition filters
    advancedFiltersState.condition.forEach(cond => {
        hasFilters = true;
        list.innerHTML += `
            <div class="active-filter-tag">
                ${cond}
                <button onclick="removeFilter('condition', '${cond}')">×</button>
            </div>
        `;
    });
    
    // Shipping filters
    advancedFiltersState.shipping.forEach(ship => {
        hasFilters = true;
        list.innerHTML += `
            <div class="active-filter-tag">
                ${ship === 'free' ? 'Free Shipping' : 'Fast Delivery'}
                <button onclick="removeFilter('shipping', '${ship}')">×</button>
            </div>
        `;
    });
    
    // Deal filters
    advancedFiltersState.deal.forEach(deal => {
        hasFilters = true;
        list.innerHTML += `
            <div class="active-filter-tag">
                ${deal === 'hot' ? '🔥 Hot Deals' : '30%+ Off'}
                <button onclick="removeFilter('deal', '${deal}')">×</button>
            </div>
        `;
    });
    
    container.style.display = hasFilters ? 'block' : 'none';
}

function resetPriceFilter() {
    advancedFiltersState.minPrice = 0;
    advancedFiltersState.maxPrice = 1000;
    document.getElementById('minPrice').value = 0;
    document.getElementById('maxPrice').value = 1000;
    document.getElementById('minPriceValue').textContent = '0';
    document.getElementById('maxPriceValue').textContent = '1000';
    updateActiveFiltersDisplay();
    applyFiltersAndRender();
}

function removeFilter(type, value) {
    const index = advancedFiltersState[type].indexOf(value);
    if (index > -1) {
        advancedFiltersState[type].splice(index, 1);
    }
    
    document.querySelectorAll(`.filter-chip[data-filter="${type}"][data-value="${value}"]`)
        .forEach(chip => chip.classList.remove('active'));
    
    updateActiveFiltersDisplay();
    applyFiltersAndRender();
}

// Initialize filter controls
document.addEventListener('DOMContentLoaded', () => {
    // Price sliders
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const minPriceValue = document.getElementById('minPriceValue');
    const maxPriceValue = document.getElementById('maxPriceValue');
    
    if (minPrice && maxPrice) {
        minPrice.addEventListener('input', (e) => {
            advancedFiltersState.minPrice = parseInt(e.target.value);
            minPriceValue.textContent = e.target.value;
            updateActiveFiltersDisplay();
            applyFiltersAndRender();
        });
        
        maxPrice.addEventListener('input', (e) => {
            advancedFiltersState.maxPrice = parseInt(e.target.value);
            maxPriceValue.textContent = e.target.value;
            updateActiveFiltersDisplay();
            applyFiltersAndRender();
        });
    }
    
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            
            this.classList.toggle('active');
            
            const index = advancedFiltersState[filterType].indexOf(filterValue);
            if (index > -1) {
                advancedFiltersState[filterType].splice(index, 1);
            } else {
                advancedFiltersState[filterType].push(filterValue);
            }
            
            updateActiveFiltersDisplay();
            applyFiltersAndRender();
        });
    });
    
    // Grid view controls removed
});

/**
 * UPDATE STATISTICS
 */
function updateStatistics() {
    // Stats section removed from DOM; guard exists for future reinstatement
    const totalProductsEl = document.getElementById('totalProductsStat');
    if (!totalProductsEl) return; // silently exit if element not present
    if (ALL_PRODUCTS) {
        animateNumber(totalProductsEl, 0, ALL_PRODUCTS.length, 800);
    }
}

function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}
