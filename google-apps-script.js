/**
 * GOOGLE APPS SCRIPT - WEB API FOR DEALHARVEST
 * 
 * Setup Instructions:
 * 1. Open Google Sheets and create a new spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Replace the default code with this script
 * 4. Save and deploy as web app (Execute as: Me, Access: Anyone)
 * 5. Copy the web app URL and update it in google-sheets-api.js
 * 
 * Sheet Structure (Columns A-I):
 * A: Product URL, B: Name, C: Price, D: Original Price, E: Discount, 
 * F: Image, G: Store, H: Category, I: Status
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const headers = data[0];
    const rows = data.slice(1);
    
    const products = rows
      .filter(row => row[0] && row[0].toString().trim()) // Must have URL
      .map((row, index) => {
        return {
          id: index + 1,
          url: row[0] || '',
          name: row[1] || 'Product Name',
          price: formatPrice(row[2]),
          originalPrice: formatPrice(row[3]),
          discount: row[4] || calculateDiscount(row[2], row[3]),
          image: row[5] || getDefaultImage(),
          store: row[6] || detectStoreFromUrl(row[0]),
          category: row[7] || 'general',
          status: row[8] || 'Active',
          lastUpdated: new Date().toISOString()
        };
      })
      .filter(product => product.status === 'Active');

    return ContentService
      .createOutput(JSON.stringify(products))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    console.error('Error in doGet:', error);
    
    return ContentService
      .createOutput(JSON.stringify({
        error: 'Failed to fetch products',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Format price to ensure consistency
 */
function formatPrice(price) {
  if (!price || price === '') return '';
  
  const priceStr = price.toString();
  const numericPrice = parseFloat(priceStr.replace(/[^\d.]/g, ''));
  
  if (isNaN(numericPrice)) return '';
  
  return '$' + numericPrice.toFixed(2);
}

/**
 * Calculate discount percentage
 */
function calculateDiscount(currentPrice, originalPrice) {
  if (!originalPrice || !currentPrice) return '';
  
  const current = parseFloat(currentPrice.toString().replace(/[^\d.]/g, ''));
  const original = parseFloat(originalPrice.toString().replace(/[^\d.]/g, ''));
  
  if (isNaN(current) || isNaN(original) || original <= current) return '';
  
  const discount = Math.round(((original - current) / original) * 100);
  return discount > 0 ? `${discount}% OFF` : '';
}

/**
 * Detect store from URL
 */
function detectStoreFromUrl(url) {
  if (!url) return 'Unknown';
  
  const domain = url.toLowerCase();
  
  if (domain.includes('amazon.com') || domain.includes('amzn.to')) return 'Amazon';
  if (domain.includes('walmart.com')) return 'Walmart';
  if (domain.includes('target.com')) return 'Target';
  if (domain.includes('homedepot.com')) return 'Home Depot';
  
  return 'Online Store';
}

/**
 * Get default placeholder image
 */
function getDefaultImage() {
  return 'https://via.placeholder.com/300x300/f8f9fa/666?text=No+Image';
}

/**
 * Optional: Auto-populate product data from URL (Advanced feature)
 * This function can be enhanced to scrape product details
 */
function onEdit(e) {
  const range = e.range;
  const sheet = e.source.getActiveSheet();
  
  // If URL is added to column A, try to auto-populate other fields
  if (range.getColumn() === 1 && range.getRow() > 1) {
    const url = range.getValue();
    if (url && url.toString().startsWith('http')) {
      
      // Auto-detect store (Column G)
      const store = detectStoreFromUrl(url);
      sheet.getRange(range.getRow(), 7).setValue(store);
      
      // Set default status to Active (Column I)
      if (!sheet.getRange(range.getRow(), 9).getValue()) {
        sheet.getRange(range.getRow(), 9).setValue('Active');
      }
      
      // You can add more auto-population logic here
      // For example, scraping product name, price, image, etc.
    }
  }
}