// ====================================
// ADMIN PRODUCT MANAGER WITH GITHUB SYNC
// Enhanced product management with auto-deployment
// ====================================

class ProductManager {
    constructor() {
        this.products = [];
        this.githubToken = '';
        this.githubOwner = 'evensdossou51-boop';
        this.githubRepo = 'deal-harvest-website';
        this.githubBranch = 'new-design';
        this.loadFromLocalStorage();
        this.loadGitHubToken();
        this.init();
    }

    init() {
        // Form submission
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Save GitHub token
        document.getElementById('saveTokenBtn').addEventListener('click', () => {
            this.saveGitHubToken();
        });

        // Sync to GitHub
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncToGitHub();
        });

        // Download button (backup)
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                console.log('Preview button clicked');
                this.showPreview();
            });
        } else {
            console.error('Preview button not found!');
        }

        // Close preview
        const closeBtn = document.getElementById('closePreview');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('previewModal').style.display = 'none';
            });
        } else {
            console.error('Close preview button not found!');
        }

        // Initial render
        this.render();
    }

    loadGitHubToken() {
        try {
            const token = localStorage.getItem('githubToken');
            if (token) {
                this.githubToken = token;
                document.getElementById('githubToken').value = token;
            }
        } catch (e) {
            console.error('Failed to load GitHub token:', e);
        }
    }

    saveGitHubToken() {
        const token = document.getElementById('githubToken').value.trim();
        if (!token) {
            alert('Please enter a GitHub token');
            return;
        }
        
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            alert('Invalid GitHub token format. Should start with ghp_ or github_pat_');
            return;
        }

        this.githubToken = token;
        localStorage.setItem('githubToken', token);
        this.showSuccess('GitHub token saved! You can now sync products automatically.');
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
        const description = document.getElementById('productDescription').value.trim();
        const image1 = document.getElementById('productImage1').value.trim();
        const image2 = document.getElementById('productImage2').value.trim();
        const image3 = document.getElementById('productImage3').value.trim();
        const highlightsText = document.getElementById('productHighlights').value.trim();
        const store = document.getElementById('productStore').value;
        const category = document.getElementById('productCategory').value;

        if (!name || !url || !description || !image1) {
            alert('Please fill in all required fields (Name, URL, Description, Image 1)');
            return;
        }

        // Parse highlights into array
        const highlights = highlightsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Collect images
        const images = [image1];
        if (image2) images.push(image2);
        if (image3) images.push(image3);

        // Create product object
        const product = {
            id: Date.now(),
            name,
            url,
            description,
            images,
            highlights,
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
        this.showSuccess('Product added successfully! Click "Sync to GitHub" to publish.');
    }

    removeProduct(id) {
        if (!confirm('Are you sure you want to remove this product?')) {
            return;
        }

        this.products = this.products.filter(p => p.id !== id);
        this.saveToLocalStorage();
        this.render();
        this.showSuccess('Product removed successfully!');
    }

    showPreview() {
        console.log('showPreview called, products:', this.products.length);
        
        if (this.products.length === 0) {
            alert('No products to preview. Add some products first!');
            return;
        }

        const modal = document.getElementById('previewModal');
        const content = document.getElementById('previewContent');
        
        console.log('Modal:', modal, 'Content:', content);

        if (!modal || !content) {
            alert('Preview modal not found. Please refresh the page.');
            return;
        }

        content.innerHTML = this.products.map((product, index) => {
            // Handle old products that might have single 'image' field instead of 'images' array
            const images = product.images || (product.image ? [product.image] : []);
            
            if (images.length === 0) {
                images.push('https://via.placeholder.com/400x400/ede9fe/333?text=No+Image');
            }
            
            return `
            <div class="preview-product">
                <div class="preview-slideshow" id="slideshow-${product.id}">
                    ${images.map((img, i) => `
                        <img src="${this.escapeHtml(img)}" class="${i === 0 ? 'active' : ''}" alt="${this.escapeHtml(product.name)}">
                    `).join('')}
                    ${images.length > 1 ? `
                        <div class="preview-nav">
                            ${images.map((_, i) => `
                                <button class="${i === 0 ? 'active' : ''}" onclick="productManager.switchPreviewImage(${product.id}, ${i})"></button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="preview-details">
                    <h3>${this.escapeHtml(product.name)}</h3>
                    <p><strong>Store:</strong> ${this.escapeHtml(product.store)}</p>
                    <p><strong>Category:</strong> ${this.escapeHtml(product.category)}</p>
                    <p>${this.escapeHtml(product.description || 'No description')}</p>
                    ${(product.highlights && product.highlights.length > 0) ? `
                        <div class="preview-highlights">
                            <strong>Highlights:</strong>
                            ${product.highlights.map(h => `<div>✓ ${this.escapeHtml(h)}</div>`).join('')}
                        </div>
                    ` : ''}
                    <p style="word-break: break-all; font-size: 0.85rem; color: #999;">
                        <strong>URL:</strong> ${this.escapeHtml(product.url)}
                    </p>
                </div>
            </div>
            `;
        }).join('');

        modal.style.display = 'block';

        // Auto-start slideshows
        this.products.forEach(product => {
            const images = product.images || (product.image ? [product.image] : []);
            if (images.length > 1) {
                this.startAutoSlideshow(product.id);
            }
        });
    }

    switchPreviewImage(productId, imageIndex) {
        const slideshow = document.getElementById(`slideshow-${productId}`);
        if (!slideshow) return;

        const images = slideshow.querySelectorAll('img');
        const buttons = slideshow.querySelectorAll('.preview-nav button');

        images.forEach((img, i) => {
            img.classList.toggle('active', i === imageIndex);
        });

        buttons.forEach((btn, i) => {
            btn.classList.toggle('active', i === imageIndex);
        });
    }

    startAutoSlideshow(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.images.length <= 1) return;

        let currentIndex = 0;
        setInterval(() => {
            currentIndex = (currentIndex + 1) % product.images.length;
            this.switchPreviewImage(productId, currentIndex);
        }, 3000); // Change image every 3 seconds
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
            .map(product => {
                // Handle old products that might have single 'image' field instead of 'images' array
                const images = product.images || (product.image ? [product.image] : []);
                const firstImage = images[0] || 'https://via.placeholder.com/60x60/ede9fe/333?text=No+Image';
                
                return `
                <div class="product-item">
                    <img src="${this.escapeHtml(firstImage)}" 
                         alt="${this.escapeHtml(product.name)}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/60x60/ede9fe/333?text=No+Image'">
                    <div class="product-info">
                        <div class="product-name">${this.escapeHtml(product.name)}</div>
                        <div class="product-meta">
                            <span class="badge badge-store">${this.escapeHtml(product.store)}</span>
                            <span class="badge badge-price">${images.length} image${images.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <button class="btn btn-danger" onclick="productManager.removeProduct(${product.id})">
                        🗑️ Delete
                    </button>
                </div>
                `;
            }).join('');
    }

    async syncToGitHub() {
        if (!this.githubToken) {
            alert('Please save your GitHub token first!');
            return;
        }

        if (this.products.length === 0) {
            alert('No products to sync. Add some products first!');
            return;
        }

        try {
            const syncBtn = document.getElementById('syncBtn');
            syncBtn.disabled = true;
            syncBtn.textContent = '⏳ Syncing...';

            // Get current file SHA (needed for updates)
            const currentFile = await this.getGitHubFile();
            
            // Prepare products JSON
            const productsJSON = JSON.stringify(this.products, null, 2);
            const content = btoa(unescape(encodeURIComponent(productsJSON)));

            // Commit to GitHub
            const response = await fetch(
                `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/contents/products.json`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `Update products - ${this.products.length} items`,
                        content: content,
                        branch: this.githubBranch,
                        sha: currentFile?.sha
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'GitHub API error');
            }

            syncBtn.disabled = false;
            syncBtn.textContent = '🚀 Sync to GitHub';
            
            this.showSuccess('✅ Products synced to GitHub! Your site will update automatically.');
            
        } catch (error) {
            console.error('GitHub sync error:', error);
            alert(`Failed to sync: ${error.message}\n\nCheck:\n1. Token has "repo" permission\n2. Token is valid\n3. Repository exists`);
            
            const syncBtn = document.getElementById('syncBtn');
            syncBtn.disabled = false;
            syncBtn.textContent = '🚀 Sync to GitHub';
        }
    }

    async getGitHubFile() {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.githubOwner}/${this.githubRepo}/contents/products.json?ref=${this.githubBranch}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                    }
                }
            );

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (e) {
            return null;
        }
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
