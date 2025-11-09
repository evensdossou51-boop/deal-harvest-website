# Walmart Affiliate Integration Setup Guide

## 🎯 Step 1: Get Walmart API Credentials

1. **Sign up for Walmart Affiliate Program**
   - Go to: https://affiliates.walmart.com/
   - Create account or log in
   - Apply for affiliate program

2. **Get API Access**
   - Go to: https://developer.walmart.com/
   - Register for developer account
   - Apply for API access (free for affiliates)

3. **Get Your Credentials**
   - API Key (Consumer ID)
   - Affiliate ID (Publisher ID)
   - Link ID (optional for tracking)

---

## 📝 Step 2: Configure walmart-config.local.js

Open `walmart-config.local.js` and add your credentials:

```javascript
module.exports = {
    API_KEY: 'your-api-key-here',
    AFFILIATE_ID: 'your-publisher-id',
    LINK_ID: 'optional-link-id',
    // ... rest stays the same
};
```

**Important:** Add to `.gitignore` to protect credentials:
```
walmart-config.local.js
```

---

## 🚀 Step 3: Run Walmart Importer

### Option 1: Use Default Electronics Import
```bash
node walmart-importer.js
```

### Option 2: Custom Category Import
Create a custom importer file (e.g., `walmart-home-importer.js`):

```javascript
const WalmartImporter = require('./walmart-importer.js');

async function main() {
    const importer = new WalmartImporter();

    const homeSearchTerms = [
        'bed sheets',
        'towels',
        'kitchen utensils',
        'coffee maker',
        'vacuum cleaner'
    ];

    await importer.importBySearchTerms(
        homeSearchTerms,
        'Home & Kitchen',
        20  // products per term
    );
}

main();
```

---

## 📋 Categories You Can Import

Available categories in `walmart-config.local.js`:
- `Electronics`
- `Home & Garden`
- `Fashion`
- `Toys`
- `Sports & Outdoors`
- `Health & Beauty`

---

## 🎨 Update Website UI

### 1. Add Walmart to Store Selector

In `index.html`, find the store filter section and unhide Walmart:

```html
<button class="store-option-btn" data-store="walmart">
    <div class="store-logo-container">
        <img src="https://logo.clearbit.com/walmart.com" alt="Walmart" class="store-logo">
    </div>
    <span class="store-name">Walmart</span>
</button>
```

### 2. Update Statistics
The "Partner Stores" stat will auto-update to show 3 stores.

---

## 📊 Product Data Format

Walmart products will be saved with this structure:

```json
{
    "name": "Product Name",
    "description": "Product description",
    "salePrice": 29.99,
    "originalPrice": 49.99,
    "image": "https://...",
    "affiliateLink": "https://walmart.com/...?affcampaign=...",
    "store": "Walmart",
    "category": "Electronics",
    "condition": "New",
    "shipping": "Free Shipping",
    "rating": 4.5,
    "reviews": 234,
    "stock": "Available"
}
```

---

## 🔄 Import Workflow

1. **Configure credentials** in `walmart-config.local.js`
2. **Choose category** and search terms
3. **Run importer**: `node walmart-importer.js`
4. **Products auto-merge** with existing Amazon/eBay products
5. **Website auto-updates** - refresh to see new products

---

## 💡 Import Examples

### Electronics (100 products)
```javascript
const terms = [
    'laptop', 'headphones', 'monitor', 'keyboard', 'mouse',
    'tablet', 'smartwatch', 'speaker', 'webcam', 'charger'
];
await importer.importBySearchTerms(terms, 'Electronics', 10);
```

### Home & Kitchen (50 products)
```javascript
const terms = [
    'cookware set', 'bedding', 'towels', 'kitchen appliances', 'furniture'
];
await importer.importBySearchTerms(terms, 'Home & Kitchen', 10);
```

### Fashion (75 products)
```javascript
const terms = [
    'mens shirts', 'womens dress', 'shoes', 'jeans', 'jacket'
];
await importer.importBySearchTerms(terms, 'Fashion', 15);
```

---

## ⚙️ API Rate Limits

**Walmart API Limits:**
- 5,000 requests per day (free tier)
- 25 products per request
- 1-second delay between requests (built-in)

**To import 100 products:**
- 10 search terms × 10 products each = 100 products
- Takes ~10 seconds (with delays)

---

## 🛡️ Important Notes

1. **Protect Your Credentials**
   ```bash
   # Add to .gitignore
   walmart-config.local.js
   ```

2. **Test First**
   - Start with 1-2 search terms
   - Verify products look correct
   - Then scale up

3. **Avoid Duplicates**
   - Importer automatically removes old Walmart products
   - Each import is a fresh set

4. **Track Earnings**
   - Use `linkId` parameter for campaign tracking
   - Monitor in Walmart Affiliate Dashboard

---

## 🔧 Troubleshooting

### "API Key Invalid"
- Double-check credentials in config file
- Ensure developer account is approved
- Wait 24 hours after API approval

### "No Products Found"
- Try more general search terms
- Check category spelling
- Verify API quota not exceeded

### "Affiliate Link Not Working"
- Confirm Affiliate ID is correct
- Check affiliate account status
- Test link manually first

---

## 📈 Next Steps

1. ✅ Set up Walmart credentials
2. ✅ Run test import (10 products)
3. ✅ Verify on website
4. ✅ Unhide Walmart button in UI
5. ✅ Import full catalog
6. ✅ Monitor affiliate earnings!

---

## 🎉 Benefits

- **3 Major Stores**: Amazon + eBay + Walmart
- **More Products**: Wider selection for users
- **More Revenue**: Additional affiliate income
- **Better Pricing**: Competition = better deals
- **Automatic Updates**: Same system as eBay

---

**Ready to import? Run:** `node walmart-importer.js`
