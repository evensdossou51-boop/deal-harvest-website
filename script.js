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

let currentProductsHash = '';

// Function to calculate a simple hash of the products array (fallback)
function calculateProductsHash(products) {
    if (HashManager) {
        return HashManager.calculateProductsHash(products);
    }
    // Fallback implementation
    return btoa(JSON.stringify(products.map(p => p.id + p.name + p.salePrice))).slice(0, 16);
}

// Function to check for updates
async function checkForUpdates() {
    try {
        const timestamp = Date.now();
        let response;
        
        if (CacheManager) {
            response = await CacheManager.fetchWithCacheBust('products.json');
        } else {
            // Fallback implementation
            response = await fetch(`products.json?v=${timestamp}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
        }
        
        if (response.ok) {
            const data = await response.json();
            let newProducts;
            
            // Handle both old format (array) and new format (object with metadata)
            if (Array.isArray(data)) {
                newProducts = data.filter(product => product.store.toLowerCase() === 'amazon');
            } else if (data.products && Array.isArray(data.products)) {
                newProducts = data.products.filter(product => product.store.toLowerCase() === 'amazon');
                
                // Log update details for debugging
                console.log('🔍 Update check - Source:', data.updateSource);
                console.log('🔍 Update check - Time:', data.lastUpdated);
                console.log('🔍 Update check - ID:', data.updateId);
            } else {
                console.warn('⚠️ Invalid data format during update check');
                return;
            }
            
            const newHash = calculateProductsHash(newProducts);
            
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
    const fetchPromise = CacheManager ? 
        CacheManager.fetchWithCacheBust('products.json') :
        fetch(`products.json?v=${Date.now()}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    
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
    store: 'amazon' // Amazon only store
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
            
        // Store Filter - Only Amazon products allowed
        const matchesStore = product.store.toLowerCase() === 'amazon';

        const matches = matchesSearch && matchesCategory && matchesStore;
        
        // Debug specific store filtering
        if (currentFilters.store !== 'all') {
            console.log(`Product: ${product.name}, Store: "${product.store}" vs Filter: "${currentFilters.store}", Matches: ${matchesStore}`);
        }

        return matches;
    });
    
    console.log('📊 Filtered products:', filteredProducts.length); // Debug log
    
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
        
        console.log('Store button clicked:', btn.dataset.store); // Debug log
        
        storeFilterGrid.querySelectorAll('.store-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentFilters.store = btn.dataset.store;
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


// 6. INITIAL RENDER - FETCHES DATA
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Use utility for cache-busted fetch if available
        const response = CacheManager ? 
            await CacheManager.fetchWithCacheBust('products.json') :
            await fetch(`products.json?v=${Date.now()}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle both old format (array) and new format (object with metadata)
        if (Array.isArray(data)) {
            // Old format - direct array
            ALL_PRODUCTS = data.filter(product => product.store.toLowerCase() === 'amazon');
            console.log('📊 Products loaded (old format):', data.length, '→ Amazon only:', ALL_PRODUCTS.length);
            console.log('🏪 Stores found:', [...new Set(ALL_PRODUCTS.map(p => p.store))]);
        } else if (data.products && Array.isArray(data.products)) {
            // New format - object with metadata
            ALL_PRODUCTS = data.products.filter(product => product.store.toLowerCase() === 'amazon');
            console.log('📊 Products loaded from:', data.updateSource || 'unknown source');
            console.log('📅 Last updated:', data.lastUpdated || 'unknown time');
            console.log('🔢 Product count:', data.productCount || data.products.length, '→ Amazon only:', ALL_PRODUCTS.length);
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
        
        currentProductsHash = calculateProductsHash(ALL_PRODUCTS);
        applyFiltersAndRender();
        
        // Start periodic update checking
        const interval = CONFIG?.UPDATE_CHECK_INTERVAL || 30000;
        setInterval(checkForUpdates, interval);
        
    } catch (error) {
        productsGrid.innerHTML = '<div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 50px;"><h3>Data Load Error</h3><p>Could not load product data. Please check your <code>products.json</code> file.</p></div>';
        console.error("Error fetching product data:", error);
    }
    
    // Auto-play video
    const video = document.getElementById('heroVideo');
    if (video) {
        video.play().catch(() => {}); 
    }
});