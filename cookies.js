// Cookie Management System
class CookieManager {
    constructor() {
        this.cookieConsent = this.getCookie('cookieConsent');
        this.userPreferences = this.getCookie('userPreferences') ? JSON.parse(this.getCookie('userPreferences')) : {};
        this.init();
    }

    init() {
        // Show banner if no consent given
        if (!this.cookieConsent) {
            this.showCookieBanner();
        } else {
            this.hideCookieBanner();
        }

        // Load saved preferences
        this.loadUserPreferences();

        // Track page view if analytics allowed
        if (this.cookieConsent === 'all') {
            this.enableAnalytics();
        }
    }

    // Cookie utility functions
    setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    // Banner functions
    showCookieBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.style.display = 'block';
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);
        }
    }

    hideCookieBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        }
    }

    // Consent functions
    acceptAllCookies() {
        this.setCookie('cookieConsent', 'all');
        this.cookieConsent = 'all';
        this.enableAnalytics();
        this.hideCookieBanner();
        this.trackEvent('cookie_consent', 'accept_all');
    }

    acceptNecessaryCookies() {
        this.setCookie('cookieConsent', 'necessary');
        this.cookieConsent = 'necessary';
        this.disableAnalytics();
        this.hideCookieBanner();
        this.trackEvent('cookie_consent', 'necessary_only');
    }

    // Analytics functions
    enableAnalytics() {
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted'
            });
        }
    }

    disableAnalytics() {
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
            });
        }
    }

    // User preferences functions
    saveUserPreference(key, value) {
        this.userPreferences[key] = value;
        this.setCookie('userPreferences', JSON.stringify(this.userPreferences));
    }

    getUserPreference(key, defaultValue = null) {
        return this.userPreferences[key] || defaultValue;
    }

    loadUserPreferences() {
        // Apply saved search preferences
        const savedSearchTerm = this.getUserPreference('lastSearch', '');
        const searchInput = document.getElementById('searchInput');
        if (searchInput && savedSearchTerm) {
            searchInput.value = savedSearchTerm;
        }

        // Apply theme preference (if you add dark/light mode later)
        const theme = this.getUserPreference('theme', 'light');
        document.body.setAttribute('data-theme', theme);
    }

    // Event tracking
    trackEvent(action, category, label = '', value = 0) {
        if (this.cookieConsent === 'all' && typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        }
    }

    // Track user interactions
    trackProductView(productName, store) {
        this.trackEvent('product_view', 'engagement', `${productName} - ${store}`);
    }

    trackSearch(searchTerm) {
        this.saveUserPreference('lastSearch', searchTerm);
        this.trackEvent('search', 'engagement', searchTerm);
    }

    trackProductClick(productName, productUrl, store) {
        this.trackEvent('product_click', 'engagement', `${productName} - ${store}`);
    }
}

// Global functions for cookie banner buttons
function acceptAllCookies() {
    window.cookieManager.acceptAllCookies();
}

function acceptNecessaryCookies() {
    window.cookieManager.acceptNecessaryCookies();
}

// Initialize cookie manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.cookieManager = new CookieManager();
});