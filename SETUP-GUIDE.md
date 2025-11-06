# 🚀 ENHANCED AUTO-SCRAPING SYSTEM SETUP

**FULLY AUTOMATED** product management - just paste URLs and everything auto-populates!

## Step 1: Create Your Google Sheet

1. **Open Google Sheets**: https://sheets.google.com
2. **Create a new spreadsheet**
3. **Name it**: "DealHarvest Product Inventory"

## Step 2: Set Up Column Headers

Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Product URL | Name | Price | Original Price | Discount | Image | Store | Category | Status |

### ✨ AUTO-SCRAPING COLUMNS:
- **A (Product URL)**: Your affiliate links (**paste here - everything else auto-fills!**)
- **B (Name)**: 🤖 **AUTO-SCRAPED** from product page
- **C (Price)**: 🤖 **AUTO-SCRAPED** current price 
- **D (Original Price)**: 🤖 **AUTO-SCRAPED** list price
- **E (Discount)**: 🤖 **AUTO-CALCULATED** discount percentage
- **F (Image)**: 🤖 **AUTO-SCRAPED** product image
- **G (Store)**: 🤖 **AUTO-DETECTED** from URL (Amazon/Walmart/Target/Home Depot)
- **H (Category)**: Manual entry (electronics, furniture, etc.)
- **I (Status)**: 🤖 **AUTO-SET** to "Active"

**🎯 WORKFLOW: Paste URL → Watch magic happen!**

## Step 3: Set Up Google Apps Script

1. **In your Google Sheet**, go to: **Extensions > Apps Script**
2. **Delete the default code** and paste the content from `google-apps-script.js`
3. **Save** the project (Ctrl+S)
4. **Name it**: "DealHarvest API"

## Step 4: Deploy as Web App

1. **Click "Deploy" > "New deployment"**
2. **Choose type**: Web app
3. **Execute as**: Me (your email)
4. **Who has access**: Anyone
5. **Click "Deploy"**
6. **Copy the web app URL** (looks like: https://script.google.com/macros/s/ABC123.../exec)

## Step 5: Update Your Website

1. **Open**: `google-sheets-api.js`
2. **Find line 9**: `this.apiUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';`
3. **Replace** `YOUR_SCRIPT_ID` with your actual web app URL
4. **Save the file**

## Step 6: Test Your Setup

1. **Add a test product** to your Google Sheet:
   ```
   Row 2:
   A: https://www.amazon.com/dp/B08XYZ123
   B: Test Product Name
   C: $99.99
   D: $149.99
   H: electronics
   I: Active
   ```

2. **Refresh your website** - the product should appear!

## 🎯 Sample Google Sheet Layout:

```
| Product URL | Name | Price | Original | Discount | Image | Store | Category | Status |
|-------------|------|-------|----------|----------|-------|--------|----------|--------|
| amzn.to/abc | Wireless Headphones | $79.99 | $129.99 | 38% OFF | [auto] | Amazon | electronics | Active |
| walmart.com/xyz | Coffee Maker | $45.99 | $69.99 | 34% OFF | [auto] | Walmart | appliances | Active |
```

## 🔄 ENHANCED AUTO-SCRAPING WORKFLOW:

### 🚀 NEW: Full Auto-Scraping (Paste URL Only!)
1. **Paste affiliate URL** in column A
2. **Watch the magic**: Name, price, image, store, discount % ALL auto-populate!
3. **Optional**: Add category manually
4. **Done!** Product appears on website automatically

### 🎯 What Happens When You Paste a URL:
- ⚡ **Instant**: Store detection (Amazon/Walmart/Target/Home Depot)
- 🔍 **Auto-scrape**: Product name from page title/headers
- 💰 **Auto-scrape**: Current price and original price
- 📊 **Auto-calculate**: Discount percentage
- 🖼️ **Auto-scrape**: Main product image
- ✅ **Auto-set**: Status to "Active"
- 📱 **Auto-update**: Website in ~5 minutes

### 📋 Bulk Adding Made Easy:
1. **Paste multiple URLs** (one per row)
2. **Each auto-scrapes** its own data
3. **All products** appear instantly!

## 🎨 ENHANCED AUTO-SCRAPING FEATURES:

### 🤖 Advanced Web Scraping:
- **Multi-pattern extraction**: Uses multiple strategies to find product data
- **Store-specific scrapers**: Optimized for Amazon, Walmart, Target, Home Depot
- **Image optimization**: Extracts high-quality product images
- **Price intelligence**: Finds both current and original prices
- **Error handling**: Graceful fallbacks if scraping fails

### ⚡ Smart Auto-Detection:
- **Store badges** with color coding
- **Discount calculations** with percentage display
- **URL shortener** detection (amzn.to, etc.)
- **Status management** with defaults

### 🔄 Real-Time System:
- **5-minute cache** for optimal performance
- **Live updates** when you edit cells
- **Loading indicators** during scraping
- **Error messages** if scraping fails
- **Change Status** to "Inactive" → Product disappears
- **Add new rows** → New products appear

### Error Handling:
- **Invalid URLs** → Ignored automatically  
- **Missing data** → Uses fallback values
- **Sheet unavailable** → Shows cached products

## 🧪 TEST YOUR AUTO-SCRAPING SYSTEM:

### Quick Test - Paste These URLs:
Try these sample URLs in column A to test auto-scraping:

```
https://www.amazon.com/dp/B08N5WRWNW
https://www.walmart.com/ip/Apple-AirPods-Pro/408992430
https://www.target.com/p/apple-airpods-3rd-generation/-/A-83658619
https://www.homedepot.com/p/DEWALT-20-Volt-MAX-Cordless-Drill/305605871
```

### What Should Happen:
- ⏳ **"Loading..."** appears in Name field
- 🤖 **Product details** auto-populate within 10-30 seconds
- 🏪 **Store badge** appears automatically
- 💰 **Prices and discounts** calculate automatically
- 🖼️ **Product image** loads automatically

### Test the Google Apps Script:
1. **In Apps Script Editor**: Run the `testScraping()` function
2. **Check logs**: View > Logs to see scraping results
3. **Debug issues**: Look for error messages

## 🚀 You're Ready!

Once setup is complete:
1. **Paste URLs** in your Google Sheet (Column A)
2. **Watch auto-scraping** populate all details
3. **Products appear** on website automatically
4. **Edit anytime** from any device
5. **Scale easily** to thousands of products

## 🔧 Troubleshooting:

### Website shows "Connection Issue":
- Check if web app URL is correct in `google-sheets-api.js`
- Ensure Google Apps Script is deployed as "Anyone" access

### Products not updating:
- Wait 5 minutes (cache refresh time)
- Check if Status column says "Active"
- Verify URL format is correct

### Need help?
- Check browser console for error messages
- Verify Google Sheet has correct column headers
- Test the web app URL directly in browser

**Your automated product management system is ready! 🎉**