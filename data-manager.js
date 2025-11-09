/**
 * DealHarvest Universal Data Manager
 * Ensures consistent data handling across all browsers and devices
 * Supports: Chrome, Firefox, Safari, Edge, Opera, Mobile browsers
 */

(function() {
    'use strict';

    /**
     * Universal Storage Manager
     * Handles localStorage, sessionStorage, and cookies with fallbacks
     */
    class UniversalStorageManager {
        constructor() {
            this.storageAvailable = this.checkStorageAvailability();
            this.cookieEnabled = this.checkCookieSupport();
            console.log('🔧 Storage Support:', {
                localStorage: this.storageAvailable.localStorage,
                sessionStorage: this.storageAvailable.sessionStorage,
                cookies: this.cookieEnabled
            });
        }

        // Check if localStorage and sessionStorage are available
        checkStorageAvailability() {
            const test = '__storage_test__';
            const result = {
                localStorage: false,
                sessionStorage: false
            };

            // Test localStorage
            try {
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                result.localStorage = true;
            } catch (e) {
                console.warn('⚠️ localStorage not available:', e.message);
            }

            // Test sessionStorage
            try {
                sessionStorage.setItem(test, test);
                sessionStorage.removeItem(test);
                result.sessionStorage = true;
            } catch (e) {
                console.warn('⚠️ sessionStorage not available:', e.message);
            }

            return result;
        }

        // Check if cookies are supported
        checkCookieSupport() {
            try {
                document.cookie = 'cookietest=1; SameSite=Lax';
                const supported = document.cookie.indexOf('cookietest') !== -1;
                document.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT; SameSite=Lax';
                return supported;
            } catch (e) {
                console.warn('⚠️ Cookies not available:', e.message);
                return false;
            }
        }

        // Set data with automatic fallback
        setItem(key, value, options = {}) {
            const { storage = 'localStorage', expireDays = 365, useCookie = false } = options;
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            // Try primary storage method
            if (storage === 'localStorage' && this.storageAvailable.localStorage) {
                try {
                    localStorage.setItem(key, stringValue);
                    return true;
                } catch (e) {
                    console.warn(`⚠️ localStorage.setItem failed for ${key}:`, e.message);
                }
            } else if (storage === 'sessionStorage' && this.storageAvailable.sessionStorage) {
                try {
                    sessionStorage.setItem(key, stringValue);
                    return true;
                } catch (e) {
                    console.warn(`⚠️ sessionStorage.setItem failed for ${key}:`, e.message);
                }
            }

            // Fallback to cookies
            if (this.cookieEnabled || useCookie) {
                return this.setCookie(key, stringValue, expireDays);
            }

            console.error(`❌ Unable to store data for key: ${key}`);
            return false;
        }

        // Get data with automatic fallback
        getItem(key, options = {}) {
            const { storage = 'localStorage' } = options;

            // Try primary storage method
            if (storage === 'localStorage' && this.storageAvailable.localStorage) {
                try {
                    const value = localStorage.getItem(key);
                    if (value !== null) return value;
                } catch (e) {
                    console.warn(`⚠️ localStorage.getItem failed for ${key}:`, e.message);
                }
            } else if (storage === 'sessionStorage' && this.storageAvailable.sessionStorage) {
                try {
                    const value = sessionStorage.getItem(key);
                    if (value !== null) return value;
                } catch (e) {
                    console.warn(`⚠️ sessionStorage.getItem failed for ${key}:`, e.message);
                }
            }

            // Fallback to cookies
            if (this.cookieEnabled) {
                const cookieValue = this.getCookie(key);
                if (cookieValue !== null) return cookieValue;
            }

            return null;
        }

        // Remove data from all storage methods
        removeItem(key) {
            let removed = false;

            // Remove from localStorage
            if (this.storageAvailable.localStorage) {
                try {
                    localStorage.removeItem(key);
                    removed = true;
                } catch (e) {
                    console.warn(`⚠️ localStorage.removeItem failed for ${key}:`, e.message);
                }
            }

            // Remove from sessionStorage
            if (this.storageAvailable.sessionStorage) {
                try {
                    sessionStorage.removeItem(key);
                    removed = true;
                } catch (e) {
                    console.warn(`⚠️ sessionStorage.removeItem failed for ${key}:`, e.message);
                }
            }

            // Remove from cookies
            if (this.cookieEnabled) {
                this.deleteCookie(key);
                removed = true;
            }

            return removed;
        }

        // Cookie helper methods
        setCookie(name, value, days = 365) {
            try {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                const expires = `expires=${date.toUTCString()}`;
                const sameSite = 'SameSite=Lax';
                const secure = location.protocol === 'https:' ? 'Secure;' : '';
                document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; ${sameSite}; ${secure}`;
                return true;
            } catch (e) {
                console.error('❌ Cookie set failed:', e.message);
                return false;
            }
        }

        getCookie(name) {
            try {
                const nameEQ = name + '=';
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    let cookie = cookies[i].trim();
                    if (cookie.indexOf(nameEQ) === 0) {
                        return decodeURIComponent(cookie.substring(nameEQ.length));
                    }
                }
                return null;
            } catch (e) {
                console.error('❌ Cookie get failed:', e.message);
                return null;
            }
        }

        deleteCookie(name) {
            this.setCookie(name, '', -1);
        }
    }

    /**
     * Product Data Cache Manager
     * Handles product data caching with versioning
     */
    class ProductDataManager {
        constructor(storage) {
            this.storage = storage;
            this.CACHE_KEY = 'dealharvest_products_cache';
            this.VERSION_KEY = 'dealharvest_data_version';
            this.HASH_KEY = 'dealharvest_products_hash';
            this.TIMESTAMP_KEY = 'dealharvest_last_update';
        }

        // Save products to cache with metadata
        saveProducts(products, metadata = {}) {
            const cacheData = {
                products: products,
                version: metadata.version || '1.0',
                hash: this.calculateHash(products),
                timestamp: Date.now(),
                browser: this.getBrowserInfo(),
                metadata: metadata
            };

            try {
                // Save to storage with compression for large datasets
                const success = this.storage.setItem(this.CACHE_KEY, cacheData, {
                    storage: 'localStorage',
                    expireDays: 7
                });

                if (success) {
                    // Save metadata separately for quick access
                    this.storage.setItem(this.HASH_KEY, cacheData.hash);
                    this.storage.setItem(this.TIMESTAMP_KEY, cacheData.timestamp.toString());
                    console.log('✅ Products cached successfully:', {
                        count: products.length,
                        hash: cacheData.hash.substring(0, 8) + '...',
                        timestamp: new Date(cacheData.timestamp).toLocaleString()
                    });
                    return true;
                }
            } catch (e) {
                console.error('❌ Failed to cache products:', e.message);
            }
            return false;
        }

        // Get cached products
        getCachedProducts() {
            try {
                const cached = this.storage.getItem(this.CACHE_KEY);
                if (cached) {
                    const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
                    
                    // Validate cache freshness (7 days)
                    const age = Date.now() - data.timestamp;
                    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
                    
                    if (age > maxAge) {
                        console.warn('⚠️ Cache expired, will fetch fresh data');
                        this.clearCache();
                        return null;
                    }

                    console.log('✅ Using cached products:', {
                        count: data.products.length,
                        age: Math.round(age / (60 * 1000)) + ' minutes',
                        browser: data.browser
                    });
                    return data.products;
                }
            } catch (e) {
                console.error('❌ Failed to retrieve cached products:', e.message);
            }
            return null;
        }

        // Check if cache needs update
        needsUpdate(newHash) {
            const cachedHash = this.storage.getItem(this.HASH_KEY);
            return !cachedHash || cachedHash !== newHash;
        }

        // Clear product cache
        clearCache() {
            this.storage.removeItem(this.CACHE_KEY);
            this.storage.removeItem(this.HASH_KEY);
            this.storage.removeItem(this.TIMESTAMP_KEY);
            console.log('🗑️ Product cache cleared');
        }

        // Calculate hash for products
        calculateHash(products) {
            try {
                const dataString = JSON.stringify(products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.salePrice || p.price
                })));
                
                let hash = 0;
                for (let i = 0; i < dataString.length; i++) {
                    const char = dataString.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return Math.abs(hash).toString(36);
            } catch (e) {
                console.error('❌ Hash calculation failed:', e.message);
                return Date.now().toString(36);
            }
        }

        // Get browser information
        getBrowserInfo() {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            
            if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
            else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
            else if (ua.indexOf('Trident') > -1) browser = 'IE';
            else if (ua.indexOf('Edge') > -1) browser = 'Edge';
            else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
            else if (ua.indexOf('Safari') > -1) browser = 'Safari';
            
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            
            return {
                name: browser,
                mobile: isMobile,
                platform: navigator.platform
            };
        }
    }

    /**
     * Network State Manager
     * Handles online/offline states
     */
    class NetworkManager {
        constructor() {
            this.online = navigator.onLine;
            this.listeners = [];
            this.setupListeners();
        }

        setupListeners() {
            window.addEventListener('online', () => {
                this.online = true;
                console.log('🌐 Connection restored');
                this.notifyListeners('online');
            });

            window.addEventListener('offline', () => {
                this.online = false;
                console.warn('⚠️ Connection lost');
                this.notifyListeners('offline');
            });
        }

        isOnline() {
            return this.online;
        }

        onStatusChange(callback) {
            this.listeners.push(callback);
        }

        notifyListeners(status) {
            this.listeners.forEach(callback => callback(status));
        }
    }

    /**
     * Initialize and expose to global scope
     */
    const storage = new UniversalStorageManager();
    const productManager = new ProductDataManager(storage);
    const networkManager = new NetworkManager();

    // Expose to window object
    window.DealHarvestDataManager = {
        storage: storage,
        products: productManager,
        network: networkManager,
        
        // Utility methods
        clearAllData: function() {
            storage.removeItem('dealharvest_cookie_consent');
            productManager.clearCache();
            console.log('🗑️ All DealHarvest data cleared');
        },
        
        getStorageInfo: function() {
            return {
                localStorageAvailable: storage.storageAvailable.localStorage,
                sessionStorageAvailable: storage.storageAvailable.sessionStorage,
                cookiesEnabled: storage.cookieEnabled,
                online: networkManager.isOnline(),
                browser: productManager.getBrowserInfo()
            };
        }
    };

    console.log('✅ DealHarvest Data Manager initialized');
    console.log('📊 Storage Info:', window.DealHarvestDataManager.getStorageInfo());

})();
