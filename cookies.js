/**
 * DealHarvest Cookie Consent Manager (cookies.js)
 * Manages the cookie banner display and Google Analytics consent.
 * Works with the GA4 implementation in index.html, where consent is DENIED by default.
 * Now uses Universal Data Manager for cross-browser/device compatibility
 */

const COOKIE_CONSENT_KEY = 'dealharvest_cookie_consent';
const COOKIE_BANNER_ID = 'cookieBanner';

// Get storage manager (with fallback for older browsers)
function getStorageManager() {
    return window.DealHarvestDataManager?.storage || {
        getItem: (key) => {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                return document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + key + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1') || null;
            }
        },
        setItem: (key, value, options) => {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                const expires = new Date();
                expires.setFullYear(expires.getFullYear() + 1);
                document.cookie = `${key}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
                return true;
            }
        }
    };
}

function getConsentStatus() {
    const storage = getStorageManager();
    return storage.getItem(COOKIE_CONSENT_KEY);
}

function showCookieBanner() {
    const banner = document.getElementById(COOKIE_BANNER_ID);
    if (banner && !getConsentStatus()) {
        banner.style.display = 'block';
        setTimeout(() => banner.classList.add('show'), 10);
    }
}

function hideCookieBanner() {
    const banner = document.getElementById(COOKIE_BANNER_ID);
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.style.display = 'none', 300);
    }
}

function setConsent(status) {
    const storage = getStorageManager();
    storage.setItem(COOKIE_CONSENT_KEY, status, {
        storage: 'localStorage',
        expireDays: 365,
        useCookie: true // Ensure it works even if localStorage fails
    });
    
    console.log('✅ Consent saved:', status);
}

function updateGAConsent(analytics_status, ad_status) {
    if (typeof gtag === 'function') {
        gtag('consent', 'update', {
            'analytics_storage': analytics_status,
            'ad_storage': ad_status
        });
        console.log(`GA Consent Updated: Analytics=${analytics_status}, Ads=${ad_status}`);
    }
}

// A. Function triggered by "Accept All" button
window.acceptAllCookies = function() {
    updateGAConsent('granted', 'granted');
    setConsent('accepted');
    hideCookieBanner();
};

// B. Function triggered by "Necessary Only" button
window.acceptNecessaryCookies = function() {
    // Keep GA consent denied (default)
    updateGAConsent('denied', 'denied'); 
    setConsent('necessary_only');
    hideCookieBanner();
};


// Initialization Logic (on page load)
document.addEventListener('DOMContentLoaded', () => {
    const consentStatus = getConsentStatus();
    
    if (consentStatus === 'accepted') {
        updateGAConsent('granted', 'granted');
        hideCookieBanner();
        
    } else if (consentStatus === 'necessary_only') {
        // Keeps the default 'denied' status from HTML
        hideCookieBanner();
        
    } else {
        // No consent status found - MUST show the banner
        showCookieBanner();
    }
});