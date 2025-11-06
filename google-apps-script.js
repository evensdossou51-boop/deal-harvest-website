/**
 * Advanced Google Apps Script auto-scraper with ScraperAPI
 * Handles SiteStripe URLs, JavaScript rendering, and anti-bot measures
 * Fills product info when a URL is pasted in column A
 */

// ✅ CONFIGURED: ScraperAPI key activated for SiteStripe URLs!
// Your ScraperAPI account: https://www.scraperapi.com/dashboard
const SCRAPER_API_KEY = 'c46d9380f62db937998b5f397074d42e';

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.source.getActiveSheet();
  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (col !== 1 || row === 1) return; // Only trigger for product URL
  const url = e.range.getValue();
  if (!url || !url.startsWith('http')) return;

  sheet.getRange(row, 2).setValue('⏳ Loading...');
  try {
    const data = scrapeWithScraperAPI(url);
    fillSheetRow(sheet, row, data);
    sheet.getRange(row, 9).setValue('Active');
    
    // Add success timestamp
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm:ss');
    sheet.getRange(row, 8).setValue(timestamp);
    
  } catch (err) {
    console.error('Scrape failed:', err);
    sheet.getRange(row, 2).setValue('❌ Failed: ' + err.message);
  }
}

/**
 * Scrape product data using ScraperAPI (handles SiteStripe, JavaScript, anti-bot)
 */
function scrapeWithScraperAPI(url) {
  // Check if ScraperAPI key is configured
  if (SCRAPER_API_KEY === 'YOUR_SCRAPER_API_KEY_HERE') {
    throw new Error('Please configure your ScraperAPI key in the script');
  }

  const store = detectStore(url);
  console.log(`🛒 Scraping ${store} product: ${url}`);

  // Clean and validate URL
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http')) {
    throw new Error('Invalid URL format');
  }

  // Build ScraperAPI request URL with simplified settings first
  const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(cleanUrl)}`;
  
  console.log(`📡 ScraperAPI Request: ${scraperUrl.substring(0, 100)}...`);

  try {
    const response = UrlFetchApp.fetch(scraperUrl, {
      method: 'GET',
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const statusCode = response.getResponseCode();
    console.log(`📊 ScraperAPI Response: ${statusCode}`);

    if (statusCode === 404) {
      throw new Error('ScraperAPI 404 - URL may be invalid or API key issue. Check: 1) URL format 2) API key validity 3) Account credits');
    }
    
    if (statusCode === 401) {
      throw new Error('ScraperAPI 401 - Invalid API key. Check your API key at scraperapi.com/dashboard');
    }
    
    if (statusCode === 403) {
      throw new Error('ScraperAPI 403 - Account suspended or no credits remaining');
    }

    if (statusCode !== 200) {
      const errorText = response.getContentText();
      throw new Error(`ScraperAPI returned status ${statusCode}: ${errorText.substring(0, 200)}`);
    }

    const html = response.getContentText();
    
    if (!html || html.length < 100) {
      throw new Error('ScraperAPI returned empty or invalid response');
    }
    
    console.log(`✅ HTML received: ${html.length} characters`);
    
    // Extract product data based on store
    switch (store) {
      case 'Amazon':
        return extractAmazonData(url, html);
      case 'Walmart':
        return extractWalmartData(url, html);
      case 'Target':
        return extractTargetData(url, html);
      case 'Home Depot':
        return extractHomeDepotData(url, html);
      default:
        return extractGenericData(url, html, store);
    }

  } catch (error) {
    console.error(`❌ ScraperAPI error: ${error}`);
    throw new Error(`Scraping failed: ${error.message}`);
  }
}

/**
 * Fill Google Sheet cells with product data
 */
function fillSheetRow(sheet, row, d) {
  sheet.getRange(row, 2).setValue(d.name);
  sheet.getRange(row, 3).setValue(d.price);
  sheet.getRange(row, 4).setValue(d.originalPrice);
  sheet.getRange(row, 5).setValue(d.discount);
  sheet.getRange(row, 6).setValue(d.image);
  sheet.getRange(row, 7).setValue(d.store);
  sheet.getRange(row, 8).setValue(d.category);
  if (!sheet.getRange(row, 9).getValue()) sheet.getRange(row, 9).setValue('Active');
}

// ====================================
// WEB APP ENDPOINTS FOR WEBSITE
// ====================================

/**
 * Handle web app requests (GET/POST)
 */
function doGet(e) {
  try {
    return ContentService
      .createTextOutput(JSON.stringify(getAllProducts()))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  } catch (error) {
    console.error('doGet error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests for manual product updates
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'scrape' && data.url) {
      const productData = scrapeWithScraperAPI(data.url);
      return ContentService
        .createTextOutput(JSON.stringify(productData))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Invalid request' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all products from the sheet for the website
 */
function getAllProducts() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const products = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Only include active products with required data
    if (row[8] === 'Active' && row[0] && row[1]) { // URL and Name required
      products.push({
        id: i,
        url: row[0] || '',
        name: row[1] || 'Product Name',
        price: row[2] || '$0.00',
        originalPrice: row[3] || '',
        discount: row[4] || '',
        image: row[5] || 'https://via.placeholder.com/300x300/f8f9fa/666?text=No+Image',
        store: row[6] || 'Online Store',
        category: row[7] || 'general',
        status: row[8] || 'Active',
        lastUpdated: row[9] ? row[9].toString() : new Date().toISOString()
      });
    }
  }
  
  console.log(`📋 Returning ${products.length} active products`);
  return products;
}

// ====================================
// TESTING AND DEBUGGING FUNCTIONS
// ====================================

/**
 * Simple function to authorize external requests (run this first!)
 */
function authorizeExternalRequests() {
  console.log('🔐 Authorizing external requests...');
  try {
    // Simple test request to trigger permission prompt
    const response = UrlFetchApp.fetch('https://httpbin.org/get', { muteHttpExceptions: true });
    console.log('✅ Authorization successful! External requests enabled.');
    return 'Authorized successfully!';
  } catch (error) {
    console.log('❌ Authorization failed:', error.message);
    throw error;
  }
}

/**
 * Force permission grant for ScraperAPI specifically
 */
function authorizeScraperAPI() {
  console.log('🔐 Authorizing ScraperAPI access...');
  
  if (SCRAPER_API_KEY === 'YOUR_SCRAPER_API_KEY_HERE') {
    throw new Error('Please configure your ScraperAPI key first');
  }
  
  try {
    // Test ScraperAPI with simple request
    const testUrl = 'https://httpbin.org/html';
    const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(testUrl)}`;
    
    console.log('📡 Testing ScraperAPI authorization...');
    const response = UrlFetchApp.fetch(scraperUrl, {
      method: 'GET',
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'GoogleAppsScript/1.0'
      }
    });
    
    const statusCode = response.getResponseCode();
    console.log(`📊 ScraperAPI Response: ${statusCode}`);
    
    if (statusCode === 200) {
      console.log('✅ ScraperAPI authorization successful!');
      return 'ScraperAPI authorized successfully!';
    } else {
      console.log(`❌ ScraperAPI returned: ${statusCode}`);
      return `ScraperAPI error: ${statusCode}`;
    }
    
  } catch (error) {
    console.log('❌ ScraperAPI authorization failed:', error.message);
    throw new Error(`ScraperAPI authorization failed: ${error.message}`);
  }
}

/**
 * Diagnose permission and connectivity issues
 */
function diagnosePermissions() {
  console.log('🔍 Diagnosing permissions and connectivity...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: Basic HTTP fetch
  try {
    const response = UrlFetchApp.fetch('https://httpbin.org/get', { muteHttpExceptions: true });
    results.tests.basicHTTP = {
      status: 'SUCCESS ✅',
      code: response.getResponseCode(),
      message: 'Basic HTTP requests work'
    };
  } catch (error) {
    results.tests.basicHTTP = {
      status: 'FAILED ❌',
      error: error.message,
      message: 'Basic HTTP requests blocked - permission issue'
    };
  }
  
  // Test 2: HTTPS with parameters
  try {
    const response = UrlFetchApp.fetch('https://httpbin.org/get?test=1', { muteHttpExceptions: true });
    results.tests.httpsParams = {
      status: 'SUCCESS ✅',
      code: response.getResponseCode()
    };
  } catch (error) {
    results.tests.httpsParams = {
      status: 'FAILED ❌',
      error: error.message
    };
  }
  
  // Test 3: ScraperAPI connectivity
  if (SCRAPER_API_KEY !== 'YOUR_SCRAPER_API_KEY_HERE') {
    try {
      const testUrl = 'https://httpbin.org/html';
      const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(testUrl)}`;
      const response = UrlFetchApp.fetch(scraperUrl, { muteHttpExceptions: true });
      
      results.tests.scraperAPI = {
        status: response.getResponseCode() === 200 ? 'SUCCESS ✅' : 'FAILED ❌',
        code: response.getResponseCode(),
        message: response.getResponseCode() === 200 ? 'ScraperAPI working' : 'ScraperAPI issue'
      };
    } catch (error) {
      results.tests.scraperAPI = {
        status: 'FAILED ❌',
        error: error.message,
        message: 'ScraperAPI blocked - permission issue'
      };
    }
  } else {
    results.tests.scraperAPI = {
      status: 'SKIPPED ⚠️',
      message: 'API key not configured'
    };
  }
  
  console.log('📋 PERMISSION DIAGNOSIS RESULTS:');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

/**
 * Test ScraperAPI key and connection (run this to diagnose issues!)
 */
function testScraperAPIConnection() {
  console.log('🧪 Testing ScraperAPI connection and API key...');
  
  if (SCRAPER_API_KEY === 'YOUR_SCRAPER_API_KEY_HERE') {
    console.log('❌ API key not configured!');
    return 'API key not configured';
  }
  
  console.log(`🔑 API Key: ${SCRAPER_API_KEY.substring(0, 8)}...${SCRAPER_API_KEY.slice(-4)}`);
  
  // Test with the exact same URL as ScraperAPI dashboard suggests
  const testUrl = 'https://httpbin.org/html';
  const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(testUrl)}`;
  
  console.log('🌐 Testing with ScraperAPI dashboard example URL...');
  console.log(`📡 Full request: ${scraperUrl}`);
  
  try {
    const response = UrlFetchApp.fetch(scraperUrl, {
      method: 'GET',
      muteHttpExceptions: true
    });
    
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log(`📊 Status Code: ${statusCode}`);
    console.log(`📝 Response Length: ${responseText.length} characters`);
    
    if (statusCode === 200) {
      console.log('✅ ScraperAPI connection successful!');
      console.log('✅ API key is valid and working');
      console.log(`📄 Sample response: ${responseText.substring(0, 100)}...`);
      return 'Connection successful!';
    } else if (statusCode === 401) {
      console.log('❌ Invalid API key - Check your API key at scraperapi.com/dashboard');
      return 'Invalid API key';
    } else if (statusCode === 403) {
      console.log('❌ Account issue or no credits remaining');
      return 'Account issue or no credits';
    } else {
      console.log(`❌ Unexpected status: ${statusCode}`);
      console.log(`Full response: ${responseText}`);
      return `Error: ${statusCode} - ${responseText.substring(0, 100)}`;
    }
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return `Connection failed: ${error.message}`;
  }
}

/**
 * Test with the exact URL format from ScraperAPI manual tester
 */
function testManualFormat() {
  console.log('🧪 Testing with manual ScraperAPI format...');
  
  // Use the exact example from their dashboard
  const testUrl = 'https://httpbin.org/json';
  
  try {
    const result = scrapeWithScraperAPI(testUrl);
    console.log('✅ Manual format test successful!');
    console.log(result);
    return result;
  } catch (error) {
    console.log(`❌ Manual format test failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test ScraperAPI with your 4 target stores: Amazon, Target, Walmart, Home Depot
 */
function testScraperAPI() {
  console.log('🧪 Testing ScraperAPI with your 4 target stores...');
  
  const testUrls = [
    {
      url: 'https://www.amazon.com/Amazon-Echo-Dot-5th-Gen/dp/B09B8V1LZ3',
      store: 'Amazon',
      description: 'Echo Dot (Popular product)'
    },
    {
      url: 'https://www.target.com/p/apple-airpods-3rd-generation/-/A-84671677',
      store: 'Target', 
      description: 'AirPods (Electronics)'
    },
    {
      url: 'https://www.walmart.com/ip/Apple-AirPods-3rd-Generation/412597403',
      store: 'Walmart',
      description: 'AirPods (Same product, different store)'
    },
    {
      url: 'https://www.homedepot.com/p/Milwaukee-M18-18V-Lithium-Ion-Cordless-Drill-Driver-Kit/202196349',
      store: 'Home Depot',
      description: 'Power Drill (Tools)'
    }
  ];
  
  testUrls.forEach((test, index) => {
    console.log(`\n--- Test ${index + 1}: ${test.store} (${test.description}) ---`);
    console.log(`🔗 URL: ${test.url}`);
    
    try {
      const result = scrapeWithScraperAPI(test.url);
      console.log('✅ Success:', result.name);
      console.log('💰 Price:', result.price);
      console.log('🏪 Store:', result.store);
      console.log('📂 Category:', result.category);
      console.log('🖼️ Image:', result.image ? 'Found' : 'Not found');
      
      if (result.originalPrice) {
        console.log('🏷️ Original Price:', result.originalPrice);
        console.log('💥 Discount:', result.discount);
      }
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
  });
}

/**
 * Test all 4 stores with one function call
 */
function testAllStores() {
  console.log('🛒 Testing all 4 target stores: Amazon, Target, Walmart, Home Depot');
  
  const storeTests = {
    'Amazon': 'https://www.amazon.com/Amazon-Echo-Dot-5th-Gen/dp/B09B8V1LZ3',
    'Target': 'https://www.target.com/p/apple-airpods-3rd-generation/-/A-84671677', 
    'Walmart': 'https://www.walmart.com/ip/Apple-AirPods-3rd-Generation/412597403',
    'Home Depot': 'https://www.homedepot.com/p/Milwaukee-M18-18V-Lithium-Ion-Cordless-Drill-Driver-Kit/202196349'
  };
  
  const results = {};
  
  Object.entries(storeTests).forEach(([storeName, url]) => {
    console.log(`\n🏪 Testing ${storeName}...`);
    
    try {
      const result = scrapeWithScraperAPI(url);
      results[storeName] = {
        status: 'Success ✅',
        name: result.name,
        price: result.price,
        category: result.category
      };
      console.log(`✅ ${storeName}: ${result.name} - ${result.price}`);
    } catch (error) {
      results[storeName] = {
        status: 'Failed ❌', 
        error: error.message
      };
      console.log(`❌ ${storeName}: ${error.message}`);
    }
  });
  
  console.log('\n📊 SUMMARY:');
  Object.entries(results).forEach(([store, result]) => {
    console.log(`${store}: ${result.status}`);
  });
  
  return results;
}

/**
 * Test with a specific real SiteStripe URL (paste your own)
 */
function testRealSiteStripe() {
  console.log('🧪 Testing with real SiteStripe URL...');
  
  // REPLACE THIS with your actual SiteStripe URL from Amazon Associates
  const realSiteStripeUrl = 'https://amzn.to/REPLACE_WITH_YOUR_REAL_URL';
  
  if (realSiteStripeUrl.includes('REPLACE_WITH_YOUR_REAL_URL')) {
    console.log('❌ Please replace with your actual SiteStripe URL');
    return 'Please add your real SiteStripe URL';
  }
  
  try {
    const result = scrapeWithScraperAPI(realSiteStripeUrl);
    console.log('✅ SiteStripe Success:', result);
    return result;
  } catch (error) {
    console.log('❌ SiteStripe Failed:', error.message);
    throw error;
  }
}

/**
 * Quick test with a guaranteed working Amazon URL
 */
function testWorkingAmazon() {
  console.log('🧪 Testing with known working Amazon URL...');
  
  // This is a popular, stable Amazon product
  const amazonUrl = 'https://www.amazon.com/Amazon-Echo-Dot-5th-Gen/dp/B09B8V1LZ3';
  
  try {
    const result = scrapeWithScraperAPI(amazonUrl);
    console.log('✅ Amazon Success:', result.name);
    console.log('💰 Price:', result.price);
    console.log('🏪 Store:', result.store);
    return result;
  } catch (error) {
    console.log('❌ Amazon Failed:', error.message);
    throw error;
  }
}

/**
 * Test SiteStripe URL handling specifically
 */
function testSiteStripeURL() {
  console.log('🧪 Testing SiteStripe URL handling...');
  
  // Example SiteStripe URL (replace with actual SiteStripe URL for testing)
  const siteStripeUrl = 'https://amzn.to/3example'; // Replace with real SiteStripe URL
  
  try {
    const result = scrapeWithScraperAPI(siteStripeUrl);
    console.log('✅ SiteStripe Success:', result);
    return result;
  } catch (error) {
    console.log('❌ SiteStripe Failed:', error.message);
    throw error;
  }
}

/**
 * Bulk update all products in the sheet
 */
function refreshAllProducts() {
  console.log('🔄 Refreshing all products with ScraperAPI...');
  
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  let updated = 0;
  let failed = 0;
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const url = data[i][0];
    if (url && url.startsWith('http')) {
      try {
        console.log(`Updating row ${i + 1}: ${url}`);
        const productData = scrapeWithScraperAPI(url);
        fillSheetRow(sheet, i + 1, productData);
        updated++;
        
        // Add small delay to avoid rate limits
        Utilities.sleep(1000);
        
      } catch (error) {
        console.error(`Failed to update row ${i + 1}:`, error);
        sheet.getRange(i + 1, 2).setValue('❌ Update Failed');
        failed++;
      }
    }
  }
  
  console.log(`✅ Refresh complete: ${updated} updated, ${failed} failed`);
  return { updated, failed };
}

/**
 * Extract Amazon product data (handles SiteStripe URLs)
 */
function extractAmazonData(url, html) {
  console.log('🎯 Extracting Amazon product data...');
  
  // Multiple patterns for product name
  const namePatterns = [
    /<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i,
    /<h1[^>]*class="[^"]*a-size-large[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<title>([^|:]+)(?:\s*[:|]|$)/i,
    /"title":"([^"]+)"/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<h1[^>]*>([^<]+)<\/h1>/i
  ];

  // Multiple patterns for price
  const pricePatterns = [
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<span[^>]*class="[^"]*a-price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)/i,
    /"priceAmount":([0-9]+\.?[0-9]*)/i,
    /\$([0-9,]+\.?[0-9]*)/i
  ];

  // Extract product name
  let name = 'Amazon Product';
  for (const pattern of namePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length > 10) break; // Good match found
    }
  }

  // Extract current price
  let price = '';
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const cleanPrice = match[1].replace(/[^\d.]/g, '');
      if (cleanPrice && parseFloat(cleanPrice) > 0) {
        price = '$' + parseFloat(cleanPrice).toFixed(2);
        break;
      }
    }
  }

  // Extract original price (for deals)
  let originalPrice = '';
  const originalPriceMatch = html.match(/<span[^>]*class="[^"]*a-text-price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i);
  if (originalPriceMatch) {
    const cleanOriginal = originalPriceMatch[1].replace(/[^\d.]/g, '');
    if (cleanOriginal && parseFloat(cleanOriginal) > parseFloat(price.replace('$', '') || '0')) {
      originalPrice = '$' + parseFloat(cleanOriginal).toFixed(2);
    }
  }

  // Extract main product image
  let image = 'https://via.placeholder.com/300x300/f8f9fa/666?text=Amazon+Product';
  const imagePatterns = [
    /<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*a-dynamic-image[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*data-old-hires="([^"]+)"/i,
    /<img[^>]*src="([^"]*amazon[^"]*\.jpg)"/i
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].includes('amazon')) {
      image = match[1].split('._')[0] + '._AC_SL300_.jpg'; // Standard Amazon image size
      break;
    }
  }

  // Calculate discount
  const discount = calculateDiscount(price, originalPrice);

  // Determine category from breadcrumbs or title
  const category = extractCategory(html, name);

  return {
    url,
    name,
    price,
    originalPrice,
    discount,
    image,
    store: 'Amazon',
    category
  };
}

/**
 * Extract Walmart product data - Enhanced patterns
 */
function extractWalmartData(url, html) {
  console.log('🛒 Extracting Walmart product data...');
  
  // Enhanced Walmart name patterns
  const namePatterns = [
    /<h1[^>]*data-automation-id="product-title"[^>]*>([^<]+)<\/h1>/i,
    /<h1[^>]*id="main-title"[^>]*>([^<]+)<\/h1>/i,
    /<title>([^|:-]+)(?:\s*[|:-]|$)/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /"productName":"([^"]+)"/i
  ];

  // Enhanced Walmart price patterns
  const pricePatterns = [
    /<span[^>]*data-testid="price-current"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i,
    /<span[^>]*class="[^"]*price-current[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i,
    /"currentPrice":{"price":([0-9]+\.?[0-9]*)/i,
    /\$([0-9,]+\.?[0-9]*)/
  ];

  // Enhanced Walmart image patterns
  const imagePatterns = [
    /<img[^>]*data-testid="hero-image"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*product-image[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*walmart[^"]*\.(?:jpg|jpeg|png|webp))"/i,
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i
  ];

  // Extract product name
  let name = 'Walmart Product';
  for (const pattern of namePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length > 10) break;
    }
  }

  // Extract current price
  let price = '';
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const cleanPrice = match[1].replace(/[^\d.]/g, '');
      if (cleanPrice && parseFloat(cleanPrice) > 0) {
        price = '$' + parseFloat(cleanPrice).toFixed(2);
        break;
      }
    }
  }

  // Extract original price (for deals)
  let originalPrice = '';
  const originalPriceMatch = html.match(/<span[^>]*class="[^"]*price-was[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i);
  if (originalPriceMatch) {
    const cleanOriginal = originalPriceMatch[1].replace(/[^\d.]/g, '');
    if (cleanOriginal && parseFloat(cleanOriginal) > parseFloat(price.replace('$', '') || '0')) {
      originalPrice = '$' + parseFloat(cleanOriginal).toFixed(2);
    }
  }

  // Extract product image
  let image = 'https://via.placeholder.com/300x300/f8f9fa/666?text=Walmart+Product';
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      image = match[1].includes('http') ? match[1] : 'https:' + match[1];
      break;
    }
  }

  const discount = calculateDiscount(price, originalPrice);
  const category = extractCategory(html, name);

  return {
    url,
    name,
    price,
    originalPrice,
    discount,
    image,
    store: 'Walmart',
    category
  };
}

/**
 * Extract Target product data - Enhanced patterns
 */
function extractTargetData(url, html) {
  console.log('🎯 Extracting Target product data...');
  
  // Enhanced Target name patterns
  const namePatterns = [
    /<h1[^>]*data-test="product-title"[^>]*>([^<]+)<\/h1>/i,
    /<h1[^>]*class="[^"]*pdp-product-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<title>([^|:-]+)(?:\s*[|:-]|$)/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /"productTitle":"([^"]+)"/i
  ];

  // Enhanced Target price patterns
  const pricePatterns = [
    /<span[^>]*data-test="product-price"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i,
    /<span[^>]*class="[^"]*current-price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i,
    /"price":{"current":([0-9]+\.?[0-9]*)/i,
    /\$([0-9,]+\.?[0-9]*)/
  ];

  // Enhanced Target image patterns
  const imagePatterns = [
    /<img[^>]*data-test="product-image"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*pdp-hero-image[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*target[^"]*\.(?:jpg|jpeg|png|webp))"/i,
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i
  ];

  // Extract product name
  let name = 'Target Product';
  for (const pattern of namePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length > 10) break;
    }
  }

  // Extract current price
  let price = '';
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const cleanPrice = match[1].replace(/[^\d.]/g, '');
      if (cleanPrice && parseFloat(cleanPrice) > 0) {
        price = '$' + parseFloat(cleanPrice).toFixed(2);
        break;
      }
    }
  }

  // Extract original price (for deals)
  let originalPrice = '';
  const originalPriceMatch = html.match(/<span[^>]*class="[^"]*original-price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i);
  if (originalPriceMatch) {
    const cleanOriginal = originalPriceMatch[1].replace(/[^\d.]/g, '');
    if (cleanOriginal && parseFloat(cleanOriginal) > parseFloat(price.replace('$', '') || '0')) {
      originalPrice = '$' + parseFloat(cleanOriginal).toFixed(2);
    }
  }

  // Extract product image
  let image = 'https://via.placeholder.com/300x300/f8f9fa/666?text=Target+Product';
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      image = match[1].includes('http') ? match[1] : 'https:' + match[1];
      break;
    }
  }

  const discount = calculateDiscount(price, originalPrice);
  const category = extractCategory(html, name);

  return {
    url,
    name,
    price,
    originalPrice,
    discount,
    image,
    store: 'Target',
    category
  };
}

/**
 * Extract Home Depot product data - Enhanced patterns
 */
function extractHomeDepotData(url, html) {
  console.log('🔨 Extracting Home Depot product data...');
  
  // Enhanced Home Depot name patterns
  const namePatterns = [
    /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<h1[^>]*data-testid="product-title"[^>]*>([^<]+)<\/h1>/i,
    /<title>([^|:-]+)(?:\s*[|:-]|$)/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /"name":"([^"]+)"/i
  ];

  // Enhanced Home Depot price patterns
  const pricePatterns = [
    /<span[^>]*data-testid="price"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i,
    /<span[^>]*class="[^"]*price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i,
    /"price":([0-9]+\.?[0-9]*)/i,
    /\$([0-9,]+\.?[0-9]*)/
  ];

  // Enhanced Home Depot image patterns
  const imagePatterns = [
    /<img[^>]*data-testid="product-image"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*media-image[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*homedepot[^"]*\.(?:jpg|jpeg|png|webp))"/i,
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i
  ];

  // Extract product name
  let name = 'Home Depot Product';
  for (const pattern of namePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length > 10) break;
    }
  }

  // Extract current price
  let price = '';
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const cleanPrice = match[1].replace(/[^\d.]/g, '');
      if (cleanPrice && parseFloat(cleanPrice) > 0) {
        price = '$' + parseFloat(cleanPrice).toFixed(2);
        break;
      }
    }
  }

  // Extract original price (for deals)
  let originalPrice = '';
  const originalPriceMatch = html.match(/<span[^>]*class="[^"]*was-price[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)<\/span>/i);
  if (originalPriceMatch) {
    const cleanOriginal = originalPriceMatch[1].replace(/[^\d.]/g, '');
    if (cleanOriginal && parseFloat(cleanOriginal) > parseFloat(price.replace('$', '') || '0')) {
      originalPrice = '$' + parseFloat(cleanOriginal).toFixed(2);
    }
  }

  // Extract product image
  let image = 'https://via.placeholder.com/300x300/f8f9fa/666?text=Home+Depot+Product';
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      image = match[1].includes('http') ? match[1] : 'https:' + match[1];
      break;
    }
  }

  const discount = calculateDiscount(price, originalPrice);
  const category = extractCategory(html, name);

  return {
    url,
    name,
    price,
    originalPrice,
    discount,
    image,
    store: 'Home Depot',
    category
  };
}

/**
 * Extract generic product data for other stores
 */
function extractGenericData(url, html, store) {
  console.log(`🎯 Extracting ${store} product data...`);
  
  const nameMatch = html.match(/<title>([^<]+)<\/title>/i) ||
                   html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const name = nameMatch ? nameMatch[1].trim() : `${store} Product`;

  const priceMatch = html.match(/\$([0-9,]+\.?[0-9]*)/);
  const price = priceMatch ? '$' + parseFloat(priceMatch[1].replace(',', '')).toFixed(2) : '';

  const imageMatch = html.match(/<img[^>]*src="([^"]+\.(?:jpg|jpeg|png))"/i);
  const image = imageMatch ? imageMatch[1] : 'https://via.placeholder.com/300x300/f8f9fa/666?text=Product+Image';

  return {
    url,
    name,
    price,
    originalPrice: '',
    discount: '',
    image,
    store,
    category: 'general'
  };
}

/**
 * Helper function to calculate discount percentage
 */
function calculateDiscount(currentPrice, originalPrice) {
  if (!currentPrice || !originalPrice) return '';
  
  const current = parseFloat(currentPrice.replace('$', ''));
  const original = parseFloat(originalPrice.replace('$', ''));
  
  if (original > current) {
    const discount = Math.round(((original - current) / original) * 100);
    return `${discount}% OFF`;
  }
  
  return '';
}

/**
 * Helper function to extract category from content
 */
function extractCategory(html, productName) {
  const name = productName.toLowerCase();
  
  // Category keywords mapping
  if (name.includes('furniture') || name.includes('chair') || name.includes('table') || name.includes('sofa')) {
    return 'furniture';
  }
  if (name.includes('electronic') || name.includes('phone') || name.includes('laptop') || name.includes('tv')) {
    return 'electronics';
  }
  if (name.includes('clothing') || name.includes('shirt') || name.includes('dress') || name.includes('shoes')) {
    return 'fashion';
  }
  if (name.includes('home') || name.includes('kitchen') || name.includes('garden') || name.includes('tool')) {
    return 'home-garden';
  }
  
  return 'general';
}

/**
 * Detect store by domain - Focused on your 4 target stores
 * Includes enhanced SiteStripe detection for Amazon
 */
function detectStore(url) {
  const d = url.toLowerCase();
  
  // Enhanced Amazon detection (includes SiteStripe affiliate links)
  if (d.includes('amazon') || d.includes('amzn') || d.includes('/dp/') || d.includes('/gp/product/') || d.includes('amazon.com')) {
    return 'Amazon';
  }
  
  // Target detection
  if (d.includes('target.com') || d.includes('target')) {
    return 'Target';
  }
  
  // Walmart detection  
  if (d.includes('walmart.com') || d.includes('walmart')) {
    return 'Walmart';
  }
  
  // Home Depot detection
  if (d.includes('homedepot.com') || d.includes('homedepot') || d.includes('home-depot')) {
    return 'Home Depot';
  }
  
  // If not one of your 4 target stores, classify as unsupported
  console.log(`⚠️ Unsupported store detected: ${url}`);
  return 'Unsupported Store';
}
