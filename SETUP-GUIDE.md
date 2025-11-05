# 🚀 GOOGLE SHEETS INTEGRATION SETUP GUIDE

## Step 1: Create Your Google Sheet

1. **Open Google Sheets**: https://sheets.google.com
2. **Create a new spreadsheet**
3. **Name it**: "DealHarvest Product Inventory"

## Step 2: Set Up Column Headers

Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Product URL | Name | Price | Original Price | Discount | Image | Store | Category | Status |

### Column Descriptions:
- **A (Product URL)**: Your affiliate links (required)
- **B (Name)**: Product name (auto-fillable)
- **C (Price)**: Current price like $99.99
- **D (Original Price)**: Original price for discount calculation
- **E (Discount)**: Auto-calculated (like "25% OFF")
- **F (Image)**: Product image URL (auto-fillable)
- **G (Store)**: Auto-detected from URL
- **H (Category)**: electronics, furniture, etc.
- **I (Status)**: Active or Inactive

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

## 🔄 How to Add Products:

### Method 1: Manual Entry
1. **Paste URL** in column A
2. **Fill in** Name, Price, Category manually
3. **Set Status** to "Active"
4. **Website updates** automatically!

### Method 2: Bulk Import
1. **Copy multiple URLs** into column A
2. **Fill in** product details
3. **All products** appear on website instantly

## 🎨 Advanced Features:

### Auto-Detection:
- **Store names** are auto-detected from URLs
- **Discount percentages** auto-calculated
- **Status** defaults to "Active"

### Real-Time Updates:
- **Edit any field** → Website updates in ~5 minutes
- **Change Status** to "Inactive" → Product disappears
- **Add new rows** → New products appear

### Error Handling:
- **Invalid URLs** → Ignored automatically  
- **Missing data** → Uses fallback values
- **Sheet unavailable** → Shows cached products

## 🚀 You're Ready!

Once setup is complete:
1. **Add products** to your Google Sheet
2. **Watch them appear** on your website automatically
3. **Edit anytime** from any device
4. **Scale easily** to thousands of products

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