# Product Upload Guide

## ⚠️ Important: Prevent Duplicate Products

Before adding new products to `products.json`, always run the validation script to check for duplicates.

## How to Add New Products

### Step 1: Validate Current Products

**Using PowerShell (Windows):**
```powershell
.\validate-products.ps1
```

**Using Node.js (Cross-platform):**
```bash
node validate-products.js
```

### Step 2: Add Your New Products

Open `products.json` and add your new product objects. Make sure each product has:

**Required Fields:**
- `id` - Unique number (find the highest ID and add 1)
- `name` - Product name
- `description` - Product description
- `originalPrice` - Original price (number)
- `salePrice` - Sale price (number)
- `store` - Must be "amazon" (lowercase)
- `category` - Product category
- `image` - Image filename (e.g., "product-name.png")
- `affiliateLink` - Amazon affiliate link

**Example:**
```json
{
  "id": 30,
  "name": "Example Product",
  "description": "Product description here",
  "originalPrice": 49.99,
  "salePrice": 39.99,
  "store": "amazon",
  "category": "Electronics",
  "image": "example-product.png",
  "affiliateLink": "https://amzn.to/xxxxx"
}
```

### Step 3: Add Product Images

Place your product images in the `images/` folder with the exact filename specified in the JSON.

### Step 4: Validate Again

Run the validation script again to ensure:
- No duplicate IDs
- No duplicate product names
- No duplicate affiliate links
- All required fields are present

```powershell
.\validate-products.ps1
```

### Step 5: Commit and Push

If validation passes:

```powershell
git add -A
git commit -m "Add new products (IDs XX-XX)"
git push origin main
```

## Duplicate Detection

The system checks for duplicates in three ways:

1. **Duplicate ID** - Each product must have a unique ID number
2. **Duplicate Name** - Product names must be unique (case-insensitive)
3. **Duplicate Link** - Each affiliate link can only appear once

### What Happens if Duplicates Exist?

- ❌ **Validation script** will fail and show you which products are duplicates
- ⚠️ **Live site** will automatically remove duplicates and show a warning in the browser console
- 📊 Only the **first occurrence** of each duplicate will be kept

## Validation Output Examples

**✅ Success:**
```
✅ Successfully loaded 29 products from products.json

🔍 Checking for duplicates...

============================================================
VALIDATION SUMMARY
============================================================
Total products: 29
Unique IDs: 29
Unique names: 29
Unique links: 29

✅ VALIDATION PASSED - No duplicates found!
Safe to commit products.json
```

**❌ Failure:**
```
❌ DUPLICATE ID: 25
   First occurrence: Index 24 - "National Tree Company Mini Christmas Tree"
   Duplicate at:     Index 28 - "Duplicate Tree"

❌ VALIDATION FAILED - Duplicates found!
Please remove duplicate products before committing.
```

## Tips

- Always use the **next available ID** (check the last product in the JSON)
- Use **unique, descriptive names** for each product
- Each **affiliate link should be unique** to the product
- **Test locally** before pushing to production
- Keep image filenames **lowercase and URL-safe** (no spaces)

## Troubleshooting

**Problem:** Validation script won't run
- **Solution:** Make sure you're in the project directory
- **For PowerShell:** You may need to run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first

**Problem:** "Missing ID" warning
- **Solution:** Add a unique `id` field to the product

**Problem:** Duplicate found but products look different
- **Solution:** Check if names are identical (case-insensitive) or if you accidentally reused an ID or affiliate link

## Categories Available

Make sure to use one of these categories (case-sensitive):

- Wearable Technology ⌚
- Home 🏠
- Home Improvement 🔨
- Kitchen & Dining 🍽️
- Beauty & Grooming 💄
- Cell Phones & Accessories 📱
- Patio, Lawn & Garden 🌿
- Books & Textbooks 📚
- Toys & Games 🎮
- Kids 👶
- Pet Food & Supplies 🐾
- Amazon Gift Cards 🎁
- Health & Household 💊
- Shoes, Handbags, Wallets, Sunglasses 👟
- Luggage 🧳
- Musical Instruments 🎵
- General 🛍️

If you need a new category, add it to the `CATEGORY_EMOJIS` object in `script.js`.
