// ====================================
// ADMIN PRODUCT MANAGER
// Simple localStorage-based product management
// ====================================

class ProductManager {
    constructor() {
        this.products = [];
        this.loadFromLocalStorage();
        this.init();
    }

    init() {
        // Form submission
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        // Initial render
        this.render();
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('adminProducts');
            if (saved) {
                this.products = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load products:', e);
            this.products = [];
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('adminProducts', JSON.stringify(this.products));
        } catch (e) {
            console.error('Failed to save products:', e);
            alert('Failed to save products. Your browser storage might be full.');
        }
    }

    addProduct() {
        const name = document.getElementById('productName').value.trim();
        const url = document.getElementById('productUrl').value.trim();
        const image = document.getElementById('productImage').value.trim();
        const price = document.getElementById('productPrice').value.trim() || '$--';
        const store = document.getElementById('productStore').value;
        const category = document.getElementById('productCategory').value;

        if (!name || !url || !image) {
            alert('Please fill in all required fields (Name, URL, Image)');
            return;
        }

        // Create product object
        const product = {
            id: Date.now(),
            name,
            url,
            image,
            price,
            store,
            category
        };

        // Add to products array
        this.products.push(product);

        // Save to localStorage
        this.saveToLocalStorage();

        // Re-render
        this.render();

        // Clear form
        document.getElementById('productForm').reset();

        // Show success feedback
        this.showSuccess('Product added successfully!');
    }

    removeProduct(id) {
        if (!confirm('Are you sure you want to remove this product?')) {
            return;
        }

        this.products = this.products.filter(p => p.id !== id);
        this.saveToLocalStorage();
        this.render();
    }

    render() {
        const container = document.getElementById('productsList');
        const countEl = document.getElementById('productCount');
        const storeCountEl = document.getElementById('storeCount');

        // Update stats
        countEl.textContent = this.products.length;
        const uniqueStores = new Set(this.products.map(p => p.store));
        storeCountEl.textContent = uniqueStores.size;

        // Render products list
        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No products yet. Add your first product!</p>
                </div>
            `;
            return;
        }

        // Render product items (newest first)
        container.innerHTML = this.products
            .slice()
            .reverse()
            .map(product => `
                <div class="product-item">
                    <img src="${this.escapeHtml(product.image)}" 
                         alt="${this.escapeHtml(product.name)}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/60x60/ede9fe/333?text=No+Image'">
                    <div class="product-info">
                        <div class="product-name">${this.escapeHtml(product.name)}</div>
                        <div class="product-meta">
                            <span class="badge badge-store">${this.escapeHtml(product.store)}</span>
                            <span class="badge badge-price">${this.escapeHtml(product.price)}</span>
                        </div>
                    </div>
                    <button class="btn btn-danger" onclick="productManager.removeProduct(${product.id})">
                        Delete
                    </button>
                </div>
            `).join('');
    }

    downloadJSON() {
        if (this.products.length === 0) {
            alert('No products to download. Add some products first!');
            return;
        }

        // Create JSON file
        const dataStr = JSON.stringify(this.products, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'products.json';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showSuccess('products.json downloaded! Upload it to your website hosting.');
    }

    showSuccess(message) {
        // Simple success notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the product manager
const productManager = new ProductManager();
