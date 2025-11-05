// Amazon Product Advertising API Integration
import crypto from 'crypto';

class AmazonProductAPI {
  constructor(config) {
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.associateTag = config.associateTag;
    this.region = config.region || 'us-east-1';
    this.host = config.host || 'webservices.amazon.com';
    this.endpoint = `https://${this.host}/paapi5`;
  }

  // Generate AWS signature for authentication
  generateSignature(stringToSign, secretKey) {
    return crypto
      .createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('base64');
  }

  // Create authorization header
  createAuthHeader(method, uri, headers, payload) {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const date = timestamp.split('T')[0].replace(/-/g, '');
    
    // Create canonical request
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n');
    
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const hashedPayload = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');

    const canonicalRequest = [
      method,
      uri,
      '', // query string
      canonicalHeaders + '\n',
      signedHeaders,
      hashedPayload
    ].join('\n');

    // Create string to sign
    const credentialScope = `${date}/${this.region}/ProductAdvertisingAPI/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    // Calculate signature
    const kDate = crypto.createHmac('sha256', 'AWS4' + this.secretKey).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('ProductAdvertisingAPI').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  // Search for products by keywords
  async searchProducts(keywords, category = 'All', minPrice = null, maxPrice = null) {
    const payload = {
      Keywords: keywords,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'Offers.Listings.Availability.Message',
        'ItemInfo.ProductInfo'
      ],
      PartnerTag: this.associateTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
      Operation: 'SearchItems',
      SearchIndex: category
    };

    if (minPrice) payload.MinPrice = minPrice * 100; // Convert to cents
    if (maxPrice) payload.MaxPrice = maxPrice * 100;

    return this.makeRequest('/paapi5/searchitems', payload);
  }

  // Get product details by ASIN
  async getProductDetails(asins) {
    const payload = {
      ItemIds: Array.isArray(asins) ? asins : [asins],
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'Offers.Listings.Availability.Message',
        'ItemInfo.ProductInfo',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ],
      PartnerTag: this.associateTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
      Operation: 'GetItems'
    };

    return this.makeRequest('/paapi5/getitems', payload);
  }

  // Make authenticated request to Amazon PA-API
  async makeRequest(uri, payload) {
    try {
      const payloadString = JSON.stringify(payload);
      const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'X-Amz-Date': timestamp,
        'Host': this.host
      };

      const authHeader = this.createAuthHeader('POST', uri, headers, payloadString);
      headers['Authorization'] = authHeader;

      const response = await fetch(this.endpoint + uri, {
        method: 'POST',
        headers: headers,
        body: payloadString
      });

      if (!response.ok) {
        throw new Error(`Amazon API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Amazon API Request Failed:', error);
      throw error;
    }
  }

  // Transform Amazon product data to our format
  transformProductData(amazonProduct) {
    try {
      const item = amazonProduct;
      const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
      const image = item.Images?.Primary?.Large?.URL || '/placeholder-image.jpg';
      const price = item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'Price not available';
      const originalPrice = item.Offers?.Listings?.[0]?.SavingBasis?.DisplayAmount;
      const availability = item.Offers?.Listings?.[0]?.Availability?.Message || 'Check availability';
      
      return {
        id: `amazon_${item.ASIN}`,
        title: title.length > 50 ? title.substring(0, 50) + '...' : title,
        image: image,
        price: price,
        originalPrice: originalPrice,
        discount: originalPrice && price ? this.calculateDiscount(originalPrice, price) : null,
        store: 'Amazon',
        category: this.detectCategory(title),
        link: `https://www.amazon.com/dp/${item.ASIN}?tag=${this.associateTag}`,
        seller: 'Amazon',
        asin: item.ASIN,
        availability: availability,
        rating: item.CustomerReviews?.StarRating?.Value || null,
        reviewCount: item.CustomerReviews?.Count || 0
      };
    } catch (error) {
      console.error('Error transforming product data:', error);
      return null;
    }
  }

  // Calculate discount percentage
  calculateDiscount(originalPrice, currentPrice) {
    try {
      const original = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
      const current = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
      
      if (original > current) {
        return Math.round(((original - current) / original) * 100);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // Smart category detection
  detectCategory(title) {
    const titleLower = title.toLowerCase();
    
    const categoryMap = {
      'Electronics': ['phone', 'laptop', 'tablet', 'headphone', 'camera', 'tv', 'speaker', 'gaming', 'console'],
      'Clothing': ['shirt', 'dress', 'pants', 'shoes', 'jacket', 'sweater', 'jeans', 'sneakers'],
      'Home & Garden': ['furniture', 'decor', 'kitchen', 'bedroom', 'living room', 'garden', 'outdoor'],
      'Beauty': ['makeup', 'skincare', 'perfume', 'cosmetics', 'beauty', 'hair care'],
      'Sports': ['fitness', 'exercise', 'gym', 'sports', 'outdoor', 'athletic', 'workout'],
      'Books': ['book', 'novel', 'textbook', 'reading', 'literature'],
      'Automotive': ['car', 'auto', 'vehicle', 'motorcycle', 'automotive', 'parts'],
      'Health': ['vitamin', 'supplement', 'health', 'medical', 'wellness', 'nutrition']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }
}

export default AmazonProductAPI;