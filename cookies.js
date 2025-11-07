/**
 * DealHarvest Cookie Consent Manager (cookies.js)
 * Manages the cookie banner display and Google Analytics consent.
 * Works with the GA4 implementation in index.html, where consent is DENIED by default.
 */

const COOKIE_CONSENT_KEY = 'dealharvest_cookie_consent';
const COOKIE_BANNER_ID = 'cookieBanner';

function getConsentStatus() {
    return localStorage.getItem(COOKIE_CONSENT_KEY);
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
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
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