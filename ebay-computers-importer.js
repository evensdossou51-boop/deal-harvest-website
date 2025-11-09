const fs = require('fs');
const path = require('path');

// Load eBay configuration
let ebayConfig;
try {
    ebayConfig = require('./ebay-config.local.js');
    console.log('✅ Using local eBay configuration');
} catch (error) {
    console.error('❌ Error: ebay-config.local.js not found');
    console.log('Please create ebay-config.local.js with your eBay API credentials');
    process.exit(1);
}

const EBAY_APP_ID = ebayConfig.APP_ID;
const EBAY_CERT_ID = ebayConfig.CERT_ID;
const EBAY_DEV_ID = ebayConfig.DEV_ID;

// Computer-specific search terms for variety
const COMPUTER_SEARCH_TERMS = [
    'laptop computer',
    'desktop computer',
    'gaming laptop',
    'ultrabook laptop',
    'chromebook',
    'macbook laptop',
    'windows laptop',
    '2-in-1 laptop',
    'business laptop',
    'student laptop',
    'gaming desktop',
    'all-in-one computer',
    'mini pc computer',
    'workstation computer',
    'refurbished laptop'
];

class EbayComputersImporter {
    constructor() {
        this.products = [];
        this.seenIds = new Set();
        this.seenNames = new Set();
        this.targetCount = 100;
    }

    // Build eBay API URL for computers
    buildSearchUrl(searchTerm, pageNumber = 1) {
        const params = new URLSearchParams({
            'OPERATION-NAME': 'findItemsAdvanced',
            'SERVICE-VERSION': '1.0.0',
            'SECURITY-APPNAME': EBAY_APP_ID,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'keywords': searchTerm,
            'paginationInput.entriesPerPage': '100',
            'paginationInput.pageNumber': pageNumber.toString(),
            'categoryId': '58058', // Computers/Tablets & Networking category
            'sortOrder': 'BestMatch',
            // Price filters for reasonable computers
            'itemFilter(0).name': 'MinPrice',
            'itemFilter(0).value': '100',
            'itemFilter(1).name': 'MaxPrice',
            'itemFilter(1).value': '3000',
            'itemFilter(2).name': 'ListingType',
            'itemFilter(2).value(0)': 'FixedPrice',
            'itemFilter(2).value(1)': 'AuctionWithBIN',
            'itemFilter(3).name': 'Condition',
            'itemFilter(3).value(0)': 'New',
            'itemFilter(3).value(1)': 'Open box',
            'itemFilter(3).value(2)': 'Manufacturer refurbished',
            'itemFilter(4).name': 'HideDuplicateItems',
            'itemFilter(4).value': 'true'
        });

        return `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;
    }

    // Fetch products from eBay
    async fetchProducts(searchTerm, maxItems = 20) {
        try {
            console.log(`🔍 Searching for: "${searchTerm}"`);
            const url = this.buildSearchUrl(searchTerm);
            
            const response = await fetch(url);
            const data = await response.json();

            // Debug: Show actual response
            if (data.errorMessage) {
                console.log(`  ❌ eBay Error:`, data.errorMessage[0].error[0].message[0]);
                return [];
            }

            if (data.findItemsAdvancedResponse && data.findItemsAdvancedResponse[0].ack[0] === 'Success') {
                const searchResult = data.findItemsAdvancedResponse[0].searchResult[0];
                
                if (searchResult['@count'] === '0') {
                    console.log(`  ⚠️ No results for "${searchTerm}"`);
                    return [];
                }

                const items = searchResult.item || [];
                console.log(`  ✅ Found ${items.length} items`);

                const products = [];
                for (const item of items.slice(0, maxItems)) {
                    // Skip duplicates
                    const itemId = item.itemId[0];
                    const itemName = item.title[0].toLowerCase().trim();
                    
                    if (this.seenIds.has(itemId) || this.seenNames.has(itemName)) {
                        continue;
                    }

                    // Only include actual computers (filter out accessories)
                    const computerKeywords = ['laptop', 'desktop', 'computer', 'pc', 'macbook', 'chromebook', 'notebook', 'ultrabook', 'workstation'];
                    const hasComputerKeyword = computerKeywords.some(keyword => 
                        itemName.includes(keyword)
                    );

                    if (!hasComputerKeyword) {
                        continue;
                    }

                    this.seenIds.add(itemId);
                    this.seenNames.add(itemName);

                    const product = {
                        id: `ebay-${itemId}`,
                        name: item.title[0],
                        store: 'ebay',
                        category: 'electronics', // Explicitly set to electronics
                        price: parseFloat(item.sellingStatus[0].currentPrice[0].__value__),
                        salePrice: parseFloat(item.sellingStatus[0].currentPrice[0].__value__),
                        currency: item.sellingStatus[0].currentPrice[0]['@currencyId'],
                        image: item.galleryURL ? item.galleryURL[0] : '',
                        link: item.viewItemURL[0],
                        condition: item.condition ? item.condition[0].conditionDisplayName[0] : 'Not Specified',
                        shippingCost: item.shippingInfo && item.shippingInfo[0].shippingServiceCost 
                            ? parseFloat(item.shippingInfo[0].shippingServiceCost[0].__value__) 
                            : 0,
                        location: item.location ? item.location[0] : '',
                        listingType: item.listingInfo[0].listingType[0]
                    };

                    products.push(product);

                    if (this.products.length + products.length >= this.targetCount) {
                        break;
                    }
                }

                return products;
            } else {
                console.log(`  ❌ API Error for "${searchTerm}"`);
                return [];
            }
        } catch (error) {
            console.error(`  ❌ Error fetching "${searchTerm}":`, error.message);
            return [];
        }
    }

    // Import computers strategically
    async importComputers() {
        console.log('🖥️  IMPORTING 100 COMPUTERS TO ELECTRONICS CATEGORY');
        console.log('='.repeat(60));

        let searchIndex = 0;
        const itemsPerSearch = 10;

        while (this.products.length < this.targetCount && searchIndex < COMPUTER_SEARCH_TERMS.length) {
            const searchTerm = COMPUTER_SEARCH_TERMS[searchIndex];
            const needed = this.targetCount - this.products.length;
            const toFetch = Math.min(itemsPerSearch, needed);

            console.log(`\n📊 Progress: ${this.products.length}/${this.targetCount} computers`);
            
            const newProducts = await this.fetchProducts(searchTerm, toFetch);
            this.products.push(...newProducts);

            console.log(`  ➕ Added ${newProducts.length} computers`);

            searchIndex++;

            // Small delay to be nice to eBay API
            await new Promise(resolve => setTimeout(resolve, 500));

            if (this.products.length >= this.targetCount) {
                console.log(`\n✅ Target reached: ${this.products.length} computers!`);
                break;
            }
        }

        // Ensure we have exactly 100 (trim if we went over)
        if (this.products.length > this.targetCount) {
            this.products = this.products.slice(0, this.targetCount);
        }

        return this.products;
    }

    // Save to products.json
    async saveToFile() {
        try {
            // Read existing products
            let existingProducts = [];
            const productsPath = path.join(__dirname, 'products.json');
            
            if (fs.existsSync(productsPath)) {
                const fileContent = fs.readFileSync(productsPath, 'utf8');
                existingProducts = JSON.parse(fileContent);
                console.log(`\n📦 Loaded ${existingProducts.length} existing products`);
            }

            // Combine with new computers
            const allProducts = [...existingProducts, ...this.products];

            // Save to file
            fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2));
            
            console.log('\n✅ IMPORT COMPLETE!');
            console.log('='.repeat(60));
            console.log(`📊 Final Summary:`);
            console.log(`  - Existing products: ${existingProducts.length}`);
            console.log(`  - New computers added: ${this.products.length}`);
            console.log(`  - Total products: ${allProducts.length}`);
            console.log(`  - All computers labeled: "electronics" category ✅`);
            console.log(`\n💾 Saved to: products.json`);

            // Show sample
            console.log('\n🖥️  Sample Computers:');
            this.products.slice(0, 5).forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.name.substring(0, 60)}...`);
                console.log(`     Category: ${p.category} | Price: $${p.price} | ${p.condition}`);
            });

            return allProducts;
        } catch (error) {
            console.error('❌ Error saving to file:', error.message);
            throw error;
        }
    }
}

// Main execution
async function main() {
    const importer = new EbayComputersImporter();
    
    try {
        await importer.importComputers();
        await importer.saveToFile();
        
        console.log('\n🎉 SUCCESS! 100 computers imported to electronics category!');
        console.log('\n📝 Next steps:');
        console.log('  1. Run: git add products.json');
        console.log('  2. Run: git commit -m "Add 100 computers to electronics category"');
        console.log('  3. Run: git push origin main');
        
    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Run the importer
main();
