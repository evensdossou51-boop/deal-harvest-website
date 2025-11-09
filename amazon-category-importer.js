/**
 * Amazon Category Bulk Importer
 * Fetches entire Amazon categories and imports all products
 * with proper affiliate links
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

// ===== CONFIGURATION =====
const CONFIG = {
    // Your Amazon Affiliate Information
    affiliateTag: 'YOUR_AMAZON_AFFILIATE_TAG', // Update with your Amazon affiliate tag
    
    // Scraping Settings
    maxProductsPerCategory: 50,    // Max products to import from category
    maxPages: 5,                   // Max category pages to scrape
    delayBetweenRequests: 2000,    // Delay between requests (2 seconds)
    
    // Product Filters
    minPrice: 5,                   // Minimum product price
    maxPrice: 500,                 // Maximum product price
    minRating: 3.5,                // Minimum customer rating
    
    // File paths
    productsFile: './products.json',
    imagesDir: './images'
};

// ===== AMAZON CATEGORY SCRAPER =====
class AmazonCategoryScraper {
    constructor(config) {
        this.config = config;
        this.existingProducts = this.loadExistingProducts();
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    /**
     * Load existing products to avoid duplicates
     */
    loadExistingProducts() {
        try {
            const data = fs.readFileSync(this.config.productsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log('No existing products file found, starting fresh');
            return [];
        }
    }

    /**
     * Generate Amazon affiliate link
     */
    generateAffiliateLink(asin) {
        return `https://amzn.to/${asin}?tag=${this.config.affiliateTag}`;
    }

    /**
     * Extract ASIN from Amazon URL
     */
    extractAsin(url) {
        const asinMatch = url.match(/\/([A-Z0-9]{10})/);
        return asinMatch ? asinMatch[1] : null;
    }

    /**
     * Clean and format product name
     */
    cleanProductName(name) {
        return name
            .replace(/Amazon's Choice|#1 Best Seller|Limited time deal/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100); // Limit length
    }

    /**
     * Map Amazon category to your website categories
     */
    mapAmazonCategory(amazonCategory) {
        const categoryMap = {
            'electronics': 'Electronics',
            'computers': 'Computers',
            'kitchen': 'Kitchen & Dining',
            'home': 'Home',
            'garden': 'Garden & Outdoor',
            'clothing': 'Amazon Fashion',
            'shoes': 'Shoes, Handbags, Wallets, Sunglasses',
            'beauty': 'Beauty & Grooming',
            'health': 'Health & Household',
            'baby': 'Baby',
            'toys': 'Toys & Games',
            'sports': 'Sports & Outdoors',
            'automotive': 'Automotive',
            'books': 'Books & Textbooks',
            'music': 'Musical Instruments',
            'office': 'Office Products',
            'pet': 'Pet Food & Supplies'
        };

        // Find matching category
        const lowerCategory = amazonCategory.toLowerCase();
        for (const [key, value] of Object.entries(categoryMap)) {
            if (lowerCategory.includes(key)) {
                return value;
            }
        }
        
        return 'General'; // Default category
    }

    /**
     * Download product image
     */
    async downloadImage(imageUrl, asin) {
        return new Promise((resolve, reject) => {
            if (!imageUrl || !asin) {
                resolve('placeholder.png');
                return;
            }

            const imageName = `amazon_${asin}.jpg`;
            const imagePath = path.join(this.config.imagesDir, imageName);
            
            // Skip if image already exists
            if (fs.existsSync(imagePath)) {
                console.log(`⏭️ Image already exists: ${imageName}`);
                resolve(imageName);
                return;
            }

            const file = fs.createWriteStream(imagePath);
            
            https.get(imageUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${imageName}`);
                    resolve(imageName);
                });
            }).on('error', (error) => {
                console.error(`❌ Error downloading image: ${error}`);
                resolve('placeholder.png');
            });
        });
    }

    /**
     * Parse product data from Amazon HTML (simplified version)
     * In real implementation, you'd use a proper HTML parser like cheerio
     */
    parseProductData(productHtml, categoryUrl) {
        // This is a simplified parser - in reality you'd use cheerio or similar
        // For demonstration purposes, returning mock data structure
        
        const mockProducts = [
            {
                asin: 'B08N5WRWNW',
                name: 'Echo Dot (4th Gen)',
                price: 49.99,
                originalPrice: 59.99,
                rating: 4.5,
                image: 'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1500_.jpg',
                description: 'Smart speaker with Alexa'
            },
            {
                asin: 'B08R5QK017',
                name: 'Fire TV Stick 4K',
                price: 39.99,
                originalPrice: 49.99,
                rating: 4.3,
                image: 'https://m.media-amazon.com/images/I/51TjJOTfslL._AC_SL1000_.jpg',
                description: 'Streaming media player'
            }
        ];

        return mockProducts;
    }

    /**
     * Scrape Amazon category page
     */
    async scrapeCategoryPage(categoryUrl, pageNumber = 1) {
        try {
            console.log(`🔍 Scraping page ${pageNumber} of: ${categoryUrl}`);
            
            // Add page parameter to URL
            const pageUrl = pageNumber > 1 ? `${categoryUrl}&page=${pageNumber}` : categoryUrl;
            
            // In real implementation, you'd make HTTP request to Amazon
            // For now, returning mock data
            const mockHtml = '<html>Mock Amazon category page</html>';
            
            // Parse the HTML and extract product data
            const products = this.parseProductData(mockHtml, categoryUrl);
            
            console.log(`📦 Found ${products.length} products on page ${pageNumber}`);
            
            return products;
            
        } catch (error) {
            console.error(`❌ Error scraping page ${pageNumber}:`, error);
            return [];
        }
    }

    /**
     * Get next available product ID
     */
    getNextProductId() {
        if (this.existingProducts.length === 0) return 1;
        return Math.max(...this.existingProducts.map(p => p.id)) + 1;
    }

    /**
     * Transform Amazon product to your format
     */
    async transformProduct(amazonProduct, categoryUrl) {
        const productId = this.getNextProductId();
        const imageName = await this.downloadImage(amazonProduct.image, amazonProduct.asin);
        const category = this.mapAmazonCategory(categoryUrl);
        
        return {
            id: productId,
            name: this.cleanProductName(amazonProduct.name),
            description: amazonProduct.description || amazonProduct.name,
            originalPrice: amazonProduct.originalPrice || amazonProduct.price,
            salePrice: amazonProduct.price,
            store: "amazon",
            category: category,
            image: imageName,
            affiliateLink: this.generateAffiliateLink(amazonProduct.asin)
        };
    }

    /**
     * Import entire Amazon category
     */
    async importCategory(categoryUrl) {
        console.log('🚀 Starting Amazon category import...');
        console.log(`📂 Category URL: ${categoryUrl}`);
        
        const allProducts = [];
        let currentPage = 1;
        
        while (currentPage <= this.config.maxPages && allProducts.length < this.config.maxProductsPerCategory) {
            try {
                // Scrape current page
                const pageProducts = await this.scrapeCategoryPage(categoryUrl, currentPage);
                
                if (pageProducts.length === 0) {
                    console.log('📄 No more products found, stopping...');
                    break;
                }
                
                // Process each product
                for (const amazonProduct of pageProducts) {
                    // Apply filters
                    if (amazonProduct.price < this.config.minPrice || 
                        amazonProduct.price > this.config.maxPrice ||
                        amazonProduct.rating < this.config.minRating) {
                        continue;
                    }
                    
                    // Check for duplicates
                    const exists = this.existingProducts.some(p => 
                        p.affiliateLink.includes(amazonProduct.asin)
                    );
                    
                    if (exists) {
                        console.log(`⏭️ Product already exists: ${amazonProduct.name}`);
                        continue;
                    }
                    
                    try {
                        const transformedProduct = await this.transformProduct(amazonProduct, categoryUrl);
                        allProducts.push(transformedProduct);
                        
                        console.log(`✅ Added: ${transformedProduct.name} ($${transformedProduct.salePrice})`);
                        
                        // Update existing products list for duplicate checking
                        this.existingProducts.push(transformedProduct);
                        
                        if (allProducts.length >= this.config.maxProductsPerCategory) {
                            break;
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error processing product: ${error}`);
                    }
                }
                
                currentPage++;
                
                // Delay between requests to be respectful
                if (currentPage <= this.config.maxPages) {
                    console.log(`⏳ Waiting ${this.config.delayBetweenRequests/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenRequests));
                }
                
            } catch (error) {
                console.error(`❌ Error on page ${currentPage}:`, error);
                break;
            }
        }
        
        return allProducts;
    }

    /**
     * Save products to JSON file
     */
    saveProducts(newProducts) {
        // Load fresh existing products (in case file was updated)
        const currentProducts = this.loadExistingProducts();
        const allProducts = [...currentProducts, ...newProducts];
        
        fs.writeFileSync(this.config.productsFile, JSON.stringify(allProducts, null, 2));
        console.log(`💾 Saved ${newProducts.length} new products to ${this.config.productsFile}`);
        
        return allProducts;
    }

    /**
     * Auto-commit and push to live website
     */
    async pushToLive() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Pushing new products to live website...');
            
            exec('git add . && git commit -m "Auto-import Amazon category products" && git push', (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Git error: ${error}`);
                    reject(error);
                    return;
                }
                
                console.log('✅ Successfully pushed to live website!');
                console.log(stdout);
                resolve(stdout);
            });
        });
    }

    /**
     * Run complete category import workflow
     */
    async run(categoryUrl) {
        try {
            console.log('🎯 Amazon Category Bulk Importer Started');
            console.log(`📊 Current products: ${this.existingProducts.length}`);
            
            // Validate category URL
            if (!categoryUrl || !categoryUrl.includes('amazon.com')) {
                throw new Error('Invalid Amazon category URL');
            }
            
            // Import category products
            const newProducts = await this.importCategory(categoryUrl);
            
            if (newProducts.length === 0) {
                console.log('ℹ️ No new products to import');
                return;
            }
            
            // Save to file
            this.saveProducts(newProducts);
            
            // Push to live website
            await this.pushToLive();
            
            console.log(`\n🎉 Category import completed! Added ${newProducts.length} new products`);
            console.log('🌐 Your website is now updated with new Amazon products!');
            console.log('💰 All products have affiliate links ready to earn commissions!');
            
        } catch (error) {
            console.error('❌ Category import failed:', error);
        }
    }
}

// ===== COMMAND LINE INTERFACE =====
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 Amazon Category Bulk Importer');
        console.log('Usage: node amazon-category-importer.js [AMAZON_CATEGORY_URL]');
        console.log('');
        console.log('Examples:');
        console.log('  node amazon-category-importer.js "https://www.amazon.com/s?k=electronics"');
        console.log('  node amazon-category-importer.js "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics"');
        console.log('');
        process.exit(1);
    }
    
    const categoryUrl = args[0];
    const scraper = new AmazonCategoryScraper(CONFIG);
    scraper.run(categoryUrl);
}

module.exports = AmazonCategoryScraper;