# Walmart Auto-Importer Setup Guide

## 🎯 What This Does
Automatically imports products from Walmart using their API and adds them to your website with proper affiliate links.

## 📋 Prerequisites
1. ✅ Walmart Affiliate Account (You have this!)
2. 🔑 Walmart API Access (Need to get from Walmart)
3. 💻 Node.js installed on your computer

## 🚀 Quick Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Your Settings
Edit `walmart-importer.js` and update these values:
```javascript
const CONFIG = {
    // Your actual Walmart API credentials
    apiKey: 'YOUR_WALMART_API_KEY',      // Get from Walmart Developer Portal
    apiSecret: 'YOUR_WALMART_API_SECRET', // Get from Walmart Developer Portal
    
    // Your affiliate info (already set from your link)
    affiliateId: '6661715',  // ✅ Already correct
    campaignId: '1398372',   // ✅ Already correct
    linkId: '16662',         // ✅ Already correct
}
```

### Step 3: Test the Importer
```bash
# Test run (won't modify your site)
npm run import-test

# Run actual import
npm run import
```

## 🕐 Automated Scheduling

### Daily Import (Recommended)
```bash
npm run schedule-daily
```
Runs every day at 9 AM, imports 5-10 new products

### Weekly Import
```bash
npm run schedule-weekly
```
Runs every Monday at 9 AM

### One-Time Import
```bash
node scheduler.js once
```

## 🔧 Customization

### Change Categories
Edit the categories array in `walmart-importer.js`:
```javascript
categories: [
    'Electronics',      // Current
    'Home & Garden',    // Current
    'Your Category',    // Add your preferred categories
]
```

### Change Price Range
```javascript
minPrice: 10,    // Minimum price
maxPrice: 200,   // Maximum price
```

### Change Import Quantity
```javascript
maxProducts: 15,  // Products per import run
```

## 📊 How It Works

1. **Searches Walmart** for trending/bestselling products in your chosen categories
2. **Filters products** by price range and quality metrics
3. **Downloads images** and optimizes them for your site
4. **Generates affiliate links** with your tracking parameters
5. **Adds to products.json** in your website format
6. **Auto-commits and pushes** to your live website

## 🔗 Getting Walmart API Access

1. Go to `developer.walmart.com`
2. Sign in with your Walmart account
3. Create a new application
4. Get your API Key and Secret
5. Update the config in `walmart-importer.js`

## 📱 Example Output

After running, you'll see:
```
🚀 Starting Walmart product import...
📂 Importing from category: Electronics
✅ Added: Wireless Headphones ($29.99)
✅ Added: Smart Speaker ($49.99)
💾 Saved 10 new products to products.json
🚀 Pushing changes to live website...
✅ Successfully pushed to live website!
🎉 Import completed! Added 10 new Walmart products
```

## 🚨 Important Notes

- **Test first**: Always run `npm run import-test` before live imports
- **API Limits**: Walmart has daily API call limits
- **Review products**: Check imported products before they go live
- **Categories**: Make sure imported categories match your website filters

## 🆘 Troubleshooting

### "API Key Invalid"
- Check your API credentials in the config
- Verify your Walmart Developer account is active

### "No products imported"
- Check if categories exist in Walmart's system
- Adjust price range (might be too restrictive)
- Check API rate limits

### "Git push failed"
- Make sure you're in the correct directory
- Check git credentials and permissions

## 📞 Support

If you need help:
1. Check the console logs for detailed error messages
2. Verify all configuration settings
3. Test with a single category first
4. Ask me for specific troubleshooting!