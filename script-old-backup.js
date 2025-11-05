// ====================================
// DEAL HARVEST - PRODUCT DISPLAY SYSTEM
// No Scraper Version - November 2025
// ====================================

// Global Variables
let allProducts = [];

// ====================================
// UI MANAGEMENT
// ====================================

class UIManager {
    constructor() {
        this.loadSampleProducts();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.renderProducts();
        console.log('✅ Deal Harvest initialized');
    }

    // Setup event listeners
    setupEventListeners() {
        // Category filter functionality
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                
                // Update active button
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Filter products
                this.filterProducts(category);
            });
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Filter products by category
    filterProducts(category) {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const productCategory = card.getAttribute('data-category');
            
            if (category === 'all' || productCategory === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
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

    // Load sample products for demonstration
    loadSampleProducts() {
        allProducts = [
            {
                id: 1,
                name: "Apple MacBook Air M2 13-inch Laptop",
                price: "$899",
                originalPrice: "$1,199",
                discount: "25%",
                image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop",
                category: "electronics",
                store: "amazon",
                affiliateLink: "#",
                description: "Latest MacBook Air with M2 chip, 8GB RAM, 256GB SSD"
            },
            {
                id: 2,
                name: "Samsung 55\" 4K Smart TV",
                price: "$449",
                originalPrice: "$649",
                discount: "31%",
                image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop",
                category: "electronics",
                store: "walmart",
                affiliateLink: "#",
                description: "Crystal UHD 4K Smart TV with HDR"
            },
            {
                id: 3,
                name: "Nike Air Max 270 Running Shoes",
                price: "$89",
                originalPrice: "$130",
                discount: "32%",
                image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
                category: "fashion",
                store: "target",
                affiliateLink: "#",
                description: "Comfortable running shoes with Air Max cushioning"
            },
            {
                id: 4,
                name: "KitchenAid Stand Mixer",
                price: "$199",
                originalPrice: "$299",
                discount: "33%",
                image: "https://images.unsplash.com/photo-1578643319842-5d0b7750ad20?w=400&h=300&fit=crop",
                category: "home-garden",
                store: "homedepot",
                affiliateLink: "#",
                description: "5-Qt Artisan Series Stand Mixer with Tilt-Head"
            }
        ];
    }

    // Render products on the page
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (allProducts.length === 0) {
            grid.innerHTML = '<div class="no-products"><h3>No products available</h3></div>';
            return;
        }

        grid.innerHTML = allProducts.map(product => `
            <div class="product-card" data-category="${product.category}">
                <div class="product-image">
                    <img src="${product.image}" 
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
                    ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                </div>
                <div class="product-actions">
                    <a href="${product.affiliateLink}" target="_blank" class="btn btn-primary">
                        View Deal
                    </a>
                </div>
            </div>
        `).join('');

        // Update product count
        this.updateProductCount();
    }

    // Update product count in hero section
    updateProductCount() {
        const countElement = document.getElementById('productCount');
        if (countElement) {
            countElement.textContent = allProducts.length;
        }
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

console.log('🚀 Deal Harvest - Product Display System Loaded (No Scraper)');