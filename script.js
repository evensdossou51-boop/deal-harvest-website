/**
 * DealHarvest Affiliate Store Script - Manual JSON Fetch
 * Handles product data fetching, filtering (store/category/search), and pagination.
 */

const PRODUCTS_PER_PAGE = 32;
let currentPage = 1;
let ALL_PRODUCTS = []; 
let currentFilters = {
    search: '',
    category: '',
    store: 'all' 
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
    let filteredProducts = ALL_PRODUCTS.filter(product => {
        const searchVal = currentFilters.search.toLowerCase();
        
        // Search Filter (checks name and description)
        const matchesSearch = searchVal === '' ||
            product.name.toLowerCase().includes(searchVal) ||
            (product.description && product.description.toLowerCase().includes(searchVal));
        
        // Category Filter - Case insensitive matching
        const matchesCategory = currentFilters.category === '' ||
            product.category.toLowerCase() === currentFilters.category.toLowerCase();
            
        // Store Filter - Case insensitive matching
        const matchesStore = currentFilters.store === 'all' ||
            product.store.toLowerCase() === currentFilters.store.toLowerCase();

        return matchesSearch && matchesCategory && matchesStore;
    });
    
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


// 6. INITIAL RENDER - FETCHES DATA
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        ALL_PRODUCTS = await response.json(); 
        applyFiltersAndRender();
        
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