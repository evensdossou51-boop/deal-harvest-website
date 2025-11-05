// Automated Amazon Product Fetcher
import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import AmazonProductAPI from './amazonAPI.js';

class ProductScheduler {
  constructor() {
    this.amazonAPI = null;
    this.isRunning = false;
    this.lastFetchTime = null;
    this.productDatabase = [];
    this.maxProducts = 50; // Limit to prevent overwhelming the site
    this.categories = [
      'Electronics',
      'Clothing',
      'Home & Garden', 
      'Beauty',
      'Sports',
      'Books',
      'Automotive',
      'Health'
    ];
    
    // Keywords for each category to search
    this.searchKeywords = {
      'Electronics': ['laptop deals', 'headphones sale', 'smartphone discount', 'gaming accessories'],
      'Clothing': ['fashion deals', 'shoes sale', 'clothing discount', 'apparel offers'],
      'Home & Garden': ['home decor', 'kitchen deals', 'furniture sale', 'garden tools'],
      'Beauty': ['makeup deals', 'skincare sale', 'beauty products', 'cosmetics discount'],
      'Sports': ['fitness equipment', 'sports gear', 'workout accessories', 'athletic wear'],
      'Books': ['bestseller books', 'kindle deals', 'textbooks sale', 'popular novels'],
      'Automotive': ['car accessories', 'auto parts', 'vehicle tools', 'motorcycle gear'],
      'Health': ['vitamins sale', 'supplements deal', 'health products', 'wellness items']
    };
  }

  // Initialize the scheduler with Amazon credentials
  initialize(amazonConfig) {
    try {
      this.amazonAPI = new AmazonProductAPI(amazonConfig);
      console.log('✅ Amazon API initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Amazon API:', error);
      return false;
    }
  }

  // Start the automated scheduling
  startScheduler() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    console.log('🚀 Starting automated product fetcher...');
    
    // Run immediately on start
    this.fetchProducts().catch(console.error);
    
    // Schedule to run every hour
    cron.schedule('0 * * * *', () => {
      console.log('⏰ Hourly product fetch triggered');
      this.fetchProducts().catch(console.error);
    });

    // Schedule to run every 4 hours for deep refresh
    cron.schedule('0 */4 * * *', () => {
      console.log('🔄 Deep refresh triggered');
      this.deepRefresh().catch(console.error);
    });

    this.isRunning = true;
    console.log('✅ Scheduler started successfully');
  }

  // Fetch products from Amazon
  async fetchProducts() {
    if (!this.amazonAPI) {
      console.error('❌ Amazon API not initialized');
      return;
    }

    console.log('🛒 Fetching products from Amazon...');
    const startTime = Date.now();
    const newProducts = [];

    try {
      // Rotate through categories to get diverse products
      const categoriesToFetch = this.getRandomCategories(3);
      
      for (const category of categoriesToFetch) {
        const keywords = this.getRandomKeywords(category, 2);
        
        for (const keyword of keywords) {
          try {
            console.log(`🔍 Searching for: ${keyword} in ${category}`);
            
            const searchResult = await this.amazonAPI.searchProducts(
              keyword, 
              category,
              5,  // Min price $5
              200 // Max price $200
            );

            if (searchResult?.SearchResult?.Items) {
              const products = searchResult.SearchResult.Items
                .slice(0, 5) // Limit per search
                .map(item => this.amazonAPI.transformProductData(item))
                .filter(product => product !== null);
                
              newProducts.push(...products);
              
              // Add delay between requests to respect rate limits
              await this.delay(1000);
            }
          } catch (error) {
            console.error(`❌ Error searching ${keyword}:`, error.message);
            continue;
          }
        }
      }

      // Remove duplicates and update database
      const uniqueProducts = this.removeDuplicates(newProducts);
      await this.updateProductDatabase(uniqueProducts);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`✅ Fetch completed: ${uniqueProducts.length} new products in ${duration}s`);
      this.lastFetchTime = new Date();
      
    } catch (error) {
      console.error('❌ Product fetch failed:', error);
    }
  }

  // Deep refresh - fetch more products and clean old ones
  async deepRefresh() {
    console.log('🔄 Starting deep refresh...');
    
    // Clean products older than 24 hours
    await this.cleanOldProducts();
    
    // Fetch from all categories
    const allProducts = [];
    
    for (const category of this.categories) {
      const keywords = this.getRandomKeywords(category, 1);
      
      for (const keyword of keywords) {
        try {
          const searchResult = await this.amazonAPI.searchProducts(keyword, category);
          
          if (searchResult?.SearchResult?.Items) {
            const products = searchResult.SearchResult.Items
              .slice(0, 8)
              .map(item => this.amazonAPI.transformProductData(item))
              .filter(product => product !== null);
              
            allProducts.push(...products);
          }
          
          await this.delay(2000); // Longer delay for deep refresh
        } catch (error) {
          console.error(`❌ Deep refresh error for ${keyword}:`, error.message);
        }
      }
    }

    const uniqueProducts = this.removeDuplicates(allProducts);
    await this.updateProductDatabase(uniqueProducts);
    
    console.log(`✅ Deep refresh completed: ${uniqueProducts.length} products updated`);
  }

  // Update the static data file with new products
  async updateProductDatabase(newProducts) {
    try {
      // Read current static data
      const staticDataPath = path.join(process.cwd(), 'src', 'staticData.js');
      let currentData = await fs.readFile(staticDataPath, 'utf8');
      
      // Merge with existing products (keep some existing ones)
      const existingProducts = this.extractCurrentProducts(currentData);
      const mergedProducts = this.mergeProducts(existingProducts, newProducts);
      
      // Limit total products
      const finalProducts = mergedProducts.slice(0, this.maxProducts);
      
      // Generate new static data file
      const newStaticData = this.generateStaticDataFile(finalProducts);
      await fs.writeFile(staticDataPath, newStaticData, 'utf8');
      
      console.log(`📝 Updated staticData.js with ${finalProducts.length} products`);
      
      // Also create a backup
      const backupPath = path.join(process.cwd(), 'backups', `products_${Date.now()}.json`);
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, JSON.stringify(finalProducts, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to update product database:', error);
    }
  }

  // Helper methods
  getRandomCategories(count) {
    const shuffled = [...this.categories].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  getRandomKeywords(category, count) {
    const keywords = this.searchKeywords[category] || [];
    const shuffled = [...keywords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  removeDuplicates(products) {
    const seen = new Set();
    return products.filter(product => {
      const key = product.asin || product.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  mergeProducts(existing, newProducts) {
    // Keep 70% new products, 30% existing (for stability)
    const newCount = Math.floor(this.maxProducts * 0.7);
    const existingCount = this.maxProducts - newCount;
    
    return [
      ...newProducts.slice(0, newCount),
      ...existing.slice(0, existingCount)
    ];
  }

  async cleanOldProducts() {
    // Implementation for removing products older than 24 hours
    // This would check timestamps and remove outdated products
    console.log('🧹 Cleaning old products...');
  }

  extractCurrentProducts(staticDataContent) {
    // Parse existing staticData.js to extract current products
    try {
      const match = staticDataContent.match(/export const staticDeals = (\[[\s\S]*?\]);/);
      if (match) {
        return eval(match[1]) || [];
      }
    } catch (error) {
      console.error('Error parsing existing products:', error);
    }
    return [];
  }

  generateStaticDataFile(products) {
    return `// Auto-generated by Amazon Product Scheduler - ${new Date().toISOString()}
export const staticDeals = ${JSON.stringify(products, null, 2)};

// Categories remain the same
export const categories = [
  "all", "Electronics", "Clothing", "Home & Garden", "Beauty", 
  "Sports", "Books", "Automotive", "Health", "Toys", "Food", 
  "Office", "Baby", "Pet Supplies", "Industrial", "Handmade", "Other"
];

export const stores = ["all", "Amazon", "Walmart", "Target", "Home Depot"];

export function filterDeals(deals, category, store, searchTerm) {
  return deals.filter(deal => {
    const matchesCategory = category === "all" || deal.category === category;
    const matchesStore = store === "all" || deal.store === store;
    const matchesSearch = !searchTerm || 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStore && matchesSearch;
  });
}

// Last updated: ${new Date().toLocaleString()}
`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stop the scheduler
  stopScheduler() {
    this.isRunning = false;
    console.log('⏹️ Scheduler stopped');
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastFetchTime: this.lastFetchTime,
      productCount: this.productDatabase.length,
      amazonAPIConnected: !!this.amazonAPI
    };
  }
}

export default ProductScheduler;