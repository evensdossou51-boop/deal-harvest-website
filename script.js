// ====================================
// DEALHARVEST - Product Display System
// Live Product Management - November 2025
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

    async init() {
        this.setupEventListeners();
        await this.loadProducts();
        console.log('✅ DealHarvest initialized');

        // Start round panels product rotation
        this.startRoundPanelsRotation();

        // Ensure filters are cleared so products show immediately
        this.clearFilterUI();
        this.renderProducts();

        // Setup hero video playlist (websiteloop1.mp4 -> websiteloop2.mp4 -> repeat)
        this.setupHeroPlaylist();
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

    // Load products from products.json file
    async loadProducts() {
        this.showLoading();
        try {
            // Fetch products from products.json
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            const products = await response.json();
            
            // Set products
            this.fullProductList = products;
            allProducts = products;
            
            console.log(`✅ Loaded ${products.length} products from products.json`);
            
        } catch (error) {
            console.error('Error loading products:', error);
            // If products.json doesn't exist or fails, show empty state
            this.fullProductList = [];
            allProducts = [];
        }
        
        this.hideLoading();
        this.renderProducts();
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
            const description = product.description || '';
            const highlights = product.highlights || [];
            
            // Handle images - use first image or fallback
            const images = product.images || [product.image];
            const primaryImage = images[0] || this.placeholderImage(name.split(' ')[0]);
            const fallback = this.placeholderImage(name.split(' ')[0]);
            
            // Create highlights HTML
            const highlightsHTML = highlights.length > 0 ? `
                <div class="product-highlights">
                    ${highlights.slice(0, 3).map(h => `<div class="highlight-item">${h}</div>`).join('')}
                </div>
            ` : '';
            
            // Create image gallery indicators if multiple images
            const galleryHTML = images.length > 1 ? `
                <div class="image-gallery-dots">
                    ${images.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
                </div>
            ` : '';
            
            return `
                <div class="product-card" data-images='${JSON.stringify(images)}'>
                    <div class="product-image-wrapper">
                        <img class="product-main-image" src="${primaryImage}"
                             alt="${name}"
                             onerror="this.onerror=null;this.src='${fallback}';">
                        ${galleryHTML}
                    </div>
                    <div class="product-name">${name}</div>
                    ${description ? `<div class="product-description">${description}</div>` : ''}
                    ${highlightsHTML}
                    <div class="product-store" style="background-color: ${storeColor}">
                        ${storeName}
                    </div>
                    <button class="product-btn" onclick="trackProductClick('${name}', '${product.url}', '${storeName}'); window.open('${product.url || '#'}', '_blank')">
                        🛒 Check Deal on ${storeName}
                    </button>
                </div>
            `;
        }).join('');
        
        // Add image gallery functionality
        this.setupImageGalleries();
    }
    
    // Setup image gallery click handlers
    setupImageGalleries() {
        document.querySelectorAll('.product-card').forEach(card => {
            const imagesData = card.getAttribute('data-images');
            if (!imagesData) return;
            
            try {
                const images = JSON.parse(imagesData);
                if (images.length <= 1) return;
                
                const mainImg = card.querySelector('.product-main-image');
                const dots = card.querySelectorAll('.dot');
                
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        mainImg.src = images[index];
                        dots.forEach(d => d.classList.remove('active'));
                        dot.classList.add('active');
                    });
                });
            } catch (e) {
                console.error('Failed to parse images:', e);
            }
        });
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

    // HERO VIDEO: slideshow-style crossfade between 3 videos
    setupHeroPlaylist() {
        const video = document.getElementById('heroVideo');
        if (!video) return;

        // Create a second video element for crossfade
        const video2 = document.createElement('video');
        video2.className = 'hero-video hero-video-transition';
        video2.muted = true;
        video2.playsInline = true;
        video2.style.position = 'absolute';
        video2.style.top = '0';
        video2.style.left = '0';
        video2.style.width = '100%';
        video2.style.height = '100%';
        video2.style.objectFit = 'cover';
        video2.style.opacity = '0';
        video2.style.transition = 'opacity 1s ease-in-out';
        video2.style.pointerEvents = 'none';
        
        // Make video container relative for absolute positioning
        const container = video.parentElement;
        if (container) {
            container.style.position = 'relative';
            container.appendChild(video2);
        }

        // Playlist with 3 videos in the videos folder
        const playlist = [
            'videos/websiteloop1.mp4',
            'videos/websiteloop2.mp4',
            'videos/websiteloop3.mp4'
        ];
        let index = 0;
        let activeVideo = video;
        let nextVideo = video2;

        // Ensure initial video is correct
        if (!video.src || !video.src.includes(playlist[0])) {
            video.src = playlist[0];
        }
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.muted = true;

        // Try to play; if blocked, wait for user gesture
        const tryPlay = (vid) => {
            try {
                const p = vid.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {/* ignore autoplay block */});
                }
            } catch (_) {}
        };
        
        tryPlay(video);
        
        const onFirstInteract = () => {
            tryPlay(video);
            cleanupInteract();
        };
        const cleanupInteract = () => {
            window.removeEventListener('touchstart', onFirstInteract);
            window.removeEventListener('click', onFirstInteract);
        };
        window.addEventListener('touchstart', onFirstInteract, { once: true, passive: true });
        window.addEventListener('click', onFirstInteract, { once: true });

        // Crossfade transition when current video ends
        const switchVideo = () => {
            index = (index + 1) % playlist.length;
            const nextSrc = playlist[index];
            
            // Preload next video
            nextVideo.src = nextSrc;
            nextVideo.load();
            
            // Start playing next video (hidden underneath)
            tryPlay(nextVideo);
            
            // Wait a moment for it to start, then crossfade
            setTimeout(() => {
                // Fade out current, fade in next
                activeVideo.style.opacity = '0';
                nextVideo.style.opacity = '1';
                
                // After transition completes, swap references
                setTimeout(() => {
                    activeVideo.pause();
                    activeVideo.currentTime = 0;
                    // Swap which is active
                    const temp = activeVideo;
                    activeVideo = nextVideo;
                    nextVideo = temp;
                }, 1000); // match transition duration
            }, 100);
        };

        video.addEventListener('ended', switchVideo);
        video2.addEventListener('ended', switchVideo);
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