/**
 * DealHarvest Utility Functions
 * Centralizes common functionality to eliminate code duplication
 */

// Configuration constants
const CONFIG = {
    GITHUB: {
        OWNER: 'evensdossou51-boop',
        REPO: 'deal-harvest-website',
        BRANCH: 'main',
        PRODUCTS_PATH: 'products.json'
    },
    API: {
        GITHUB_BASE: 'https://api.github.com/repos',
        CACHE_HEADERS: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    },
    UPDATE_CHECK_INTERVAL: 30000, // 30 seconds
    NOTIFICATION_DURATION: 3000   // 3 seconds
};

// GitHub API utilities
class GitHubAPI {
    constructor(token) {
        this.token = token;
        this.baseHeaders = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    getRepoUrl(path = '') {
        const { OWNER, REPO } = CONFIG.GITHUB;
        return `${CONFIG.API.GITHUB_BASE}/${OWNER}/${REPO}${path ? '/' + path : ''}`;
    }

    async getFile(path, cacheBust = true) {
        const url = this.getRepoUrl(`contents/${path}`) + (cacheBust ? `?t=${Date.now()}` : '');
        const response = await fetch(url, {
            headers: {
                ...this.baseHeaders,
                ...CONFIG.API.CACHE_HEADERS
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${path}: ${response.status}`);
        }

        return response.json();
    }

    async updateFile(path, content, message, sha = null) {
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        const body = {
            message,
            content: encodedContent,
            branch: CONFIG.GITHUB.BRANCH
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(this.getRepoUrl(`contents/${path}`), {
            method: 'PUT',
            headers: {
                ...this.baseHeaders,
                ...CONFIG.API.CACHE_HEADERS
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API Error: ${errorData.message || 'Unknown error'}`);
        }

        return response.json();
    }

    async triggerPagesBuild() {
        try {
            const response = await fetch(this.getRepoUrl('pages/builds'), {
                method: 'POST',
                headers: this.baseHeaders
            });

            return response.ok;
        } catch (error) {
            console.warn('Pages build trigger failed:', error);
            return false;
        }
    }
}

// Product data utilities
class ProductManager {
    static generateId() {
        return Date.now().toString();
    }

    static createProductData(products) {
        const timestamp = new Date().toISOString();
        return {
            lastUpdated: timestamp,
            updateSource: 'utility-manager',
            productCount: products.length,
            updateId: `update-${Date.now()}`,
            products: products
        };
    }

    static extractProducts(data) {
        if (Array.isArray(data)) {
            return data; // Old format
        } else if (data.products && Array.isArray(data.products)) {
            return data.products; // New format
        } else {
            throw new Error('Invalid product data format');
        }
    }

    static validateProduct(product) {
        const required = ['name', 'salePrice', 'store', 'category', 'affiliateLink'];
        const missing = required.filter(field => !product[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (isNaN(parseFloat(product.salePrice))) {
            throw new Error('Sale price must be a valid number');
        }

        return true;
    }
}

// Form utilities
class FormHelper {
    static collectFormData(formId, fieldMap) {
        const data = {};
        Object.entries(fieldMap).forEach(([key, elementId]) => {
            const element = document.getElementById(elementId);
            if (element) {
                data[key] = element.value.trim();
            }
        });
        return data;
    }

    static collectProductForm(prefix = '') {
        const fieldMap = {
            name: prefix + 'name',
            description: prefix + 'description',
            originalPrice: prefix + 'originalPrice',
            salePrice: prefix + 'salePrice',
            store: prefix + 'store',
            category: prefix + 'category',
            image: prefix + 'image',
            affiliateLink: prefix + 'affiliateLink'
        };

        const data = this.collectFormData('', fieldMap);
        
        // Convert numeric fields
        data.originalPrice = parseFloat(data.originalPrice) || 0;
        data.salePrice = parseFloat(data.salePrice);
        
        // Add generated fields
        data.id = ProductManager.generateId();
        
        return data;
    }

    static clearForm(fieldIds) {
        fieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
    }
}

// Notification utilities
class NotificationManager {
    static show(message, type = 'success', duration = CONFIG.NOTIFICATION_DURATION) {
        // Remove existing notifications
        document.querySelectorAll('.utility-notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'utility-notification';
        notification.textContent = message;
        
        const colors = {
            success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            info: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 600;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    static showProgress(message) {
        this.show(message + ' 🔄', 'info', 10000); // Longer duration for progress
    }

    static showSuccess(message) {
        this.show('✅ ' + message, 'success');
    }

    static showError(message) {
        this.show('❌ ' + message, 'error');
    }

    static showWarning(message) {
        this.show('⚠️ ' + message, 'warning');
    }
}

// Cache utilities
class CacheManager {
    static generateCacheBustUrl(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${Date.now()}`;
    }

    static getCacheBustHeaders() {
        return CONFIG.API.CACHE_HEADERS;
    }

    static async fetchWithCacheBust(url, options = {}) {
        const cacheBustUrl = this.generateCacheBustUrl(url);
        const headers = {
            ...this.getCacheBustHeaders(),
            ...options.headers
        };

        return fetch(cacheBustUrl, {
            ...options,
            headers
        });
    }
}

// Hash utilities for change detection
class HashManager {
    static calculateProductsHash(products) {
        const simplified = products.map(p => ({
            id: p.id,
            name: p.name,
            salePrice: p.salePrice,
            store: p.store
        }));
        return btoa(JSON.stringify(simplified)).substring(0, 20);
    }
}

// Export utilities for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        GitHubAPI,
        ProductManager,
        FormHelper,
        NotificationManager,
        CacheManager,
        HashManager
    };
} else {
    // Browser environment
    window.DealHarvest = {
        CONFIG,
        GitHubAPI,
        ProductManager,
        FormHelper,
        NotificationManager,
        CacheManager,
        HashManager
    };
}