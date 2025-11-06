// Lightweight stub to avoid 404s when Google Sheets integration isn't configured.
// Provides a no-op API compatible with script.js expectations.
(function(){
    try {
        if (typeof window !== 'undefined') {
            if (!window.googleSheetsAPI) {
                window.googleSheetsAPI = {
                    // Returns an empty array; replace with real implementation when integrating
                    forceRefresh: async () => {
                        try { console.info('[googleSheetsAPI] Stub forceRefresh: returning empty list'); } catch(_) {}
                        return [];
                    }
                };
            }
        }
    } catch (_) {}
})();