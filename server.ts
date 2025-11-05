import express from "express";
import axios from "axios";
import cors from "cors";
import cron from "node-cron";
import { Router, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
// Amazon API Integration (will be dynamically imported)

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const router = Router();

// Email subscribers storage
let emailSubscribers: string[] = [];
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Configure this
    pass: process.env.EMAIL_PASS || 'your-app-password'     // Configure this
  }
});

// Load existing subscribers
try {
  if (fs.existsSync(SUBSCRIBERS_FILE)) {
    const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
    emailSubscribers = JSON.parse(data);
  }
} catch (error) {
  console.error('Error loading subscribers:', error);
}

// Save subscribers to file
function saveSubscribers() {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(emailSubscribers, null, 2));
  } catch (error) {
    console.error('Error saving subscribers:', error);
  }
}

// Amazon Product Automation
let productScheduler: any = null;

// Initialize Amazon Product Scheduler
async function initializeAmazonScheduler() {
  try {
    // Check if Amazon credentials are configured
    const amazonConfig = {
      accessKey: process.env.AMAZON_ACCESS_KEY_ID,
      secretKey: process.env.AMAZON_SECRET_ACCESS_KEY,
      associateTag: process.env.AMAZON_ASSOCIATE_TAG,
      region: process.env.AMAZON_REGION || 'us-east-1',
      host: process.env.AMAZON_HOST || 'webservices.amazon.com'
    };

    // Validate required credentials
    if (!amazonConfig.accessKey || !amazonConfig.secretKey || !amazonConfig.associateTag) {
      console.log('⚠️ Amazon API credentials not configured. Skipping automation.');
      console.log('💡 To enable Amazon automation, add credentials to .env file:');
      console.log('   - AMAZON_ACCESS_KEY_ID');
      console.log('   - AMAZON_SECRET_ACCESS_KEY'); 
      console.log('   - AMAZON_ASSOCIATE_TAG');
      return;
    }

    // Dynamically import the ProductScheduler
    const ProductSchedulerModule = await import('./src/services/productScheduler.js');
    const ProductScheduler = (ProductSchedulerModule as any).default;
    
    productScheduler = new ProductScheduler();
    
    if (productScheduler.initialize(amazonConfig)) {
      console.log('✅ Amazon Product Scheduler initialized');
      
      // Start automated fetching if enabled
      if (process.env.ENABLE_AUTO_FETCH !== 'false') {
        productScheduler.startScheduler();
        console.log('🤖 Automated Amazon product fetching started');
      }
    } else {
      console.error('❌ Failed to initialize Amazon Product Scheduler');
    }
    
  } catch (error: any) {
    console.error('❌ Amazon scheduler initialization error:', error?.message || error);
    console.log('💡 Make sure to install required dependencies and check credentials');
  }
}

// Email template for deal notifications
function createDealEmailTemplate(deals: Deal[]) {
  const dealsHtml = deals.map(deal => `
    <div style="border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 8px; background: white;">
      <h3 style="color: #0070f3; margin: 0 0 10px 0;">${deal.name}</h3>
      <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <img src="${deal.image}" alt="${deal.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
        <div style="flex: 1;">
          <p style="font-size: 18px; font-weight: bold; color: #e74c3c; margin: 5px 0;">
            ${deal.price} ${deal.oldPrice ? `<span style="text-decoration: line-through; color: #888; font-size: 14px;">${deal.oldPrice}</span>` : ''}
          </p>
          ${deal.discountPercent ? `<p style="color: #27ae60; font-weight: bold; margin: 5px 0;">${deal.discountPercent}% OFF</p>` : ''}
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Category: ${deal.category}</p>
          <a href="${deal.link}" style="background: #0070f3; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 8px;">
            Shop Now on ${deal.store}
          </a>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DealVerse - Today's Hot Deals!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #0070f3; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0070f3; padding-bottom: 15px;">
          🎉 DealVerse Daily Deals
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 25px; text-align: center; color: #666;">
          Discover today's hottest deals from Amazon, Walmart, and Shein!
        </p>
        
        ${dealsHtml}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px;">
          <p>Want to unsubscribe? <a href="#" style="color: #0070f3;">Click here</a></p>
          <p>© 2024 DealVerse. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send daily deals email to all subscribers
async function sendDailyDealsEmail() {
  if (emailSubscribers.length === 0) {
    console.log('No subscribers to send emails to');
    return;
  }

  try {
    // Get all deals (you can modify this to get fresh deals)
    const amazonDeals = await fetchAmazonDeals();
    const walmartDeals = await fetchWalmartDeals();
    const targetDeals = await fetchTargetDeals();
    
    const allDeals = [...amazonDeals, ...walmartDeals, ...targetDeals];

    // Get top 10 deals by discount percentage
    const topDeals = allDeals
      .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
      .slice(0, 10);

    if (topDeals.length === 0) {
      console.log('No deals available to send');
      return;
    }

    const emailHtml = createDealEmailTemplate(topDeals);

    // Send email to all subscribers
    for (const email of emailSubscribers) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER || 'dealverse@gmail.com',
          to: email,
          subject: `🔥 ${topDeals.length} Hot Deals Today - Save Up to ${topDeals[0].discountPercent || 0}%!`,
          html: emailHtml
        });
        console.log(`Daily deals email sent to: ${email}`);
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
      }
    }

    console.log(`Daily deals email sent to ${emailSubscribers.length} subscribers`);
  } catch (error) {
    console.error('Error sending daily deals email:', error);
  }
}

// Mock for now (or soon replace with each store's API)
interface Deal {
  store: string;
  category: string;
  name: string;
  image: string;
  price: string;
  oldPrice?: string;
  link: string;
  discountPercent?: number;
  timestamp: string;
}

// Example hardcoded deals list; you will replace with API fetches
let deals: Deal[] = [
  {
    store: "Amazon",
    category: "electronics",
    name: "Wireless Headphones",
    image: "https://via.placeholder.com/200x200",
    price: "$59.99",
    oldPrice: "$89.99",
    link: "https://www.amazon.com/example?tag=YOURTAG-20",
    discountPercent: 33,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Target",
    category: "fashion",
    name: "Stylish Jacket",
    image: "https://via.placeholder.com/200x200",
    price: "$39.99",
    oldPrice: "$69.99",
    link: "https://www.target.com/example?affid=YOURID",
    discountPercent: 42,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Walmart",
    category: "home",
    name: "Smart TV 55\"",
    image: "https://via.placeholder.com/200x200",
    price: "$449.99",
    oldPrice: "$699.99",
    link: "https://www.walmart.com/ip/example?affp1=YOURID",
    discountPercent: 35,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Amazon",
    category: "gaming",
    name: "Gaming Mouse RGB",
    image: "https://via.placeholder.com/200x200",
    price: "$29.99",
    oldPrice: "$49.99",
    link: "https://www.amazon.com/example?tag=YOURTAG-20",
    discountPercent: 40,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Home Depot",
    category: "home",
    name: "Power Drill Set",
    image: "https://via.placeholder.com/200x200",
    price: "$79.99",
    oldPrice: "$129.99",
    link: "https://www.homedepot.com/example?affid=YOURID",
    discountPercent: 38,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Walmart",
    category: "fitness",
    name: "Yoga Mat Premium",
    image: "https://via.placeholder.com/200x200",
    price: "$19.99",
    oldPrice: "$34.99",
    link: "https://www.walmart.com/ip/example?affp1=YOURID",
    discountPercent: 43,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Amazon",
    category: "books",
    name: "Bestseller Novel Collection",
    image: "https://via.placeholder.com/200x200",
    price: "$15.99",
    oldPrice: "$25.99",
    link: "https://www.amazon.com/example?tag=YOURTAG-20",
    discountPercent: 38,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Target",
    category: "electronics",
    name: "Wireless Earbuds Pro",
    image: "https://via.placeholder.com/200x200",
    price: "$89.99",
    oldPrice: "$199.99",
    link: "https://www.target.com/example?affid=YOURID",
    discountPercent: 55,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Home Depot",
    category: "home", 
    name: "Cordless Vacuum Cleaner",
    image: "https://via.placeholder.com/200x200",
    price: "$149.99",
    oldPrice: "$299.99",
    link: "https://www.homedepot.com/example?affid=YOURID",
    discountPercent: 50,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Amazon",
    category: "fashion",
    name: "Winter Jacket Premium",
    image: "https://via.placeholder.com/200x200",
    price: "$79.99",
    oldPrice: "$159.99",
    link: "https://www.amazon.com/example?tag=YOURTAG-20",
    discountPercent: 50,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Target",
    category: "fashion",
    name: "Spring Dress Collection", 
    image: "https://via.placeholder.com/200x200",
    price: "$29.99",
    oldPrice: "$59.99",
    link: "https://www.target.com/example?affid=YOURID",
    discountPercent: 50,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Walmart",
    category: "electronics",
    name: "Bluetooth Speaker Waterproof",
    image: "https://via.placeholder.com/200x200",
    price: "$24.99",
    oldPrice: "$49.99", 
    link: "https://www.walmart.com/ip/example?affp1=YOURID",
    discountPercent: 50,
    timestamp: (new Date()).toISOString()
  },
  {
    store: "Home Depot",
    category: "home",
    name: "Coffee Machine Espresso",
    image: "https://via.placeholder.com/200x200",
    price: "$199.99",
    oldPrice: "$399.99",
    link: "https://www.homedepot.com/example?affid=YOURID", 
    discountPercent: 50,
    timestamp: (new Date()).toISOString()
  }
];

// Endpoint: Get deals by category and store filters
router.get("/api/deals", async (req: Request, res: Response) => {
  try {
    const { store, category, search, limit = "20", sortBy = "discount" } = req.query;

    let filtered = deals;

    // Filter by store
    if (store && typeof store === "string" && store !== "all") {
      filtered = filtered.filter(d => d.store.toLowerCase() === store.toLowerCase());
    }
    
    // Filter by category
    if (category && typeof category === "string" && category !== "all") {
      filtered = filtered.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }
    
    // Enhanced search functionality
    if (search && typeof search === "string") {
      const searchTerms = search.toLowerCase().split(" ");
      filtered = filtered.filter(d => {
        const searchableText = `${d.name} ${d.store} ${d.category}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      });
    }

    // Sort deals for best value
    if (sortBy === "price") {
      // Sort by price (lowest first)
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.price.replace('$', ''));
        const priceB = parseFloat(b.price.replace('$', ''));
        return priceA - priceB;
      });
    } else {
      // Sort by discount percentage (best deals first)
      filtered.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    }

    const lim = parseInt(limit as string, 10);
    const result = filtered.slice(0, lim);

    res.json({ 
      deals: result, 
      total: filtered.length,
      filters: { store, category, search, sortBy }
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

// Email subscription endpoint
router.post("/api/subscribe", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: "Valid email required" });
    }
    
    // Check if email already exists
    if (emailSubscribers.includes(email.toLowerCase())) {
      return res.status(409).json({ error: "Email already subscribed" });
    }
    
    // Add email to subscribers
    emailSubscribers.push(email.toLowerCase());
    saveSubscribers();
    
    console.log(`New subscriber: ${email}`);
    res.json({ message: "Successfully subscribed!", email });
  } catch (error) {
    console.error("Error subscribing email:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Get subscribers count (for admin purposes)
router.get("/api/subscribers/count", (req: Request, res: Response) => {
  res.json({ count: emailSubscribers.length });
});

// Manual endpoint to test sending emails (for development)
router.post("/api/send-test-email", async (req: Request, res: Response) => {
  try {
    await sendDailyDealsEmail();
    res.json({ message: "Test emails sent successfully!" });
  } catch (error) {
    console.error("Error sending test emails:", error);
    res.status(500).json({ error: "Failed to send test emails" });
  }
});

// Category detection function
function detectCategory(name: string, description: string = ""): string {
  const text = (name + " " + description).toLowerCase();
  
  // Electronics & Tech
  if (text.match(/(laptop|computer|phone|tablet|tv|headphone|speaker|camera|gaming|tech|electronic|iphone|ipad|macbook|samsung|apple|sony|xbox|playstation|nintendo|pc|monitor|keyboard|mouse)/)) {
    return "electronics";
  }
  
  // Fashion & Clothing
  if (text.match(/(shirt|dress|pants|jacket|coat|sweater|jeans|blouse|fashion|clothing|apparel|t-shirt|hoodie|cardigan|blazer|skirt|shorts)/)) {
    return "fashion";
  }
  
  // Beauty & Personal Care
  if (text.match(/(makeup|skincare|beauty|cosmetic|shampoo|conditioner|lotion|cream|perfume|cologne|hair|nail|face|lip|eye|foundation|mascara)/)) {
    return "beauty";
  }
  
  // Home & Garden
  if (text.match(/(furniture|home|decor|garden|plant|lamp|chair|table|sofa|bed|mattress|pillow|curtain|rug|vase|decoration)/)) {
    return "home";
  }
  
  // Kitchen & Dining
  if (text.match(/(kitchen|cooking|pot|pan|knife|blender|mixer|coffee|cup|plate|bowl|utensil|cookware|appliance|microwave|toaster)/)) {
    return "kitchen";
  }
  
  // Sports & Outdoors
  if (text.match(/(sport|outdoor|bike|bicycle|camping|hiking|fishing|golf|tennis|basketball|football|soccer|gym|exercise|yoga)/)) {
    return "sports";
  }
  
  // Health & Fitness
  if (text.match(/(health|fitness|vitamin|supplement|protein|workout|exercise|wellness|medical|thermometer|blood pressure|scale)/)) {
    return "fitness";
  }
  
  // Baby & Kids
  if (text.match(/(baby|kid|child|toddler|infant|stroller|crib|diaper|toy|children|nursery|feeding|bottle|pacifier)/)) {
    return "baby";
  }
  
  // Shoes & Footwear
  if (text.match(/(shoe|boot|sneaker|sandal|heel|footwear|nike|adidas|converse|running shoe|dress shoe|casual shoe)/)) {
    return "shoes";
  }
  
  // Automotive
  if (text.match(/(car|auto|vehicle|tire|oil|brake|engine|automotive|truck|motorcycle|bike|helmet|dash cam)/)) {
    return "automotive";
  }
  
  // Tools & Hardware
  if (text.match(/(tool|drill|hammer|saw|screwdriver|wrench|hardware|construction|repair|diy|workshop|toolbox)/)) {
    return "tools";
  }
  
  // Pet Supplies
  if (text.match(/(pet|dog|cat|fish|bird|food|treat|toy|collar|leash|cage|aquarium|litter|grooming)/)) {
    return "pets";
  }
  
  // Jewelry & Accessories
  if (text.match(/(jewelry|ring|necklace|bracelet|earring|watch|accessory|gold|silver|diamond|pendant|charm)/)) {
    return "jewelry";
  }
  
  // Office & School
  if (text.match(/(office|school|pen|pencil|notebook|paper|desk|chair|supplies|backpack|calculator|printer|scanner)/)) {
    return "office";
  }
  
  // Books & Media
  if (text.match(/(book|novel|magazine|cd|dvd|blu-ray|movie|music|media|reading|kindle|audiobook)/)) {
    return "books";
  }
  
  // Toys & Games
  if (text.match(/(toy|game|puzzle|doll|action figure|lego|board game|video game|stuffed animal|educational)/)) {
    return "toys";
  }
  
  // Default to general category
  return "electronics"; // Default fallback
}

// Placeholder functions for fetching deals from each store API
async function fetchAmazonDeals(): Promise<Deal[]> {
  // TODO: Replace with real Amazon Product Advertising API calls
  console.log("Fetching Amazon deals...");
  
  const sampleProducts = [
    { name: "Gaming Laptop RTX 4060", description: "High performance gaming laptop", price: "$899.99", oldPrice: "$1299.99", discountPercent: 31 },
    { name: "Wireless Bluetooth Headphones", description: "Noise cancelling headphones", price: "$79.99", oldPrice: "$149.99", discountPercent: 47 },
    { name: "Women's Winter Jacket", description: "Warm winter coat for women", price: "$45.99", oldPrice: "$89.99", discountPercent: 49 },
    { name: "Kitchen Stand Mixer", description: "Professional stand mixer for baking", price: "$129.99", oldPrice: "$199.99", discountPercent: 35 },
    { name: "Running Shoes Nike", description: "Comfortable running sneakers", price: "$65.99", oldPrice: "$120.00", discountPercent: 45 },
    { name: "Skincare Set Anti-Aging", description: "Complete skincare routine set", price: "$34.99", oldPrice: "$59.99", discountPercent: 42 },
    { name: "Baby Stroller Lightweight", description: "Compact and lightweight baby stroller", price: "$89.99", oldPrice: "$149.99", discountPercent: 40 },
    { name: "Cordless Drill Set", description: "Professional cordless drill with bits", price: "$55.99", oldPrice: "$99.99", discountPercent: 44 },
    { name: "Dog Food Premium", description: "High quality dog food 30lbs", price: "$39.99", oldPrice: "$54.99", discountPercent: 27 },
    { name: "Office Chair Ergonomic", description: "Comfortable ergonomic office chair", price: "$149.99", oldPrice: "$249.99", discountPercent: 40 },
    { name: "Gold Plated Necklace", description: "Elegant gold plated jewelry", price: "$24.99", oldPrice: "$49.99", discountPercent: 50 },
    { name: "Board Game Family Pack", description: "Fun family board game collection", price: "$29.99", oldPrice: "$45.99", discountPercent: 35 },
    { name: "Smart TV 55 Inch 4K", description: "Ultra HD smart television", price: "$399.99", oldPrice: "$699.99", discountPercent: 43 },
    { name: "Coffee Machine Espresso", description: "Professional espresso coffee maker", price: "$199.99", oldPrice: "$349.99", discountPercent: 43 },
    { name: "Yoga Mat Premium", description: "Non-slip premium yoga mat", price: "$29.99", oldPrice: "$54.99", discountPercent: 45 },
    { name: "Smartphone Case iPhone", description: "Protective phone case with screen protector", price: "$19.99", oldPrice: "$39.99", discountPercent: 50 }
  ];
  
  return sampleProducts.map(product => ({
    store: "Amazon",
    category: detectCategory(product.name, product.description),
    name: product.name,
    image: "https://via.placeholder.com/200x200?text=" + encodeURIComponent(product.name.split(' ')[0]),
    price: product.price,
    oldPrice: product.oldPrice,
    link: `https://www.amazon.com/example?tag=YOURTAG-20&keywords=${encodeURIComponent(product.name)}`,
    discountPercent: product.discountPercent,
    timestamp: (new Date()).toISOString()
  }));
}

async function fetchTargetDeals(): Promise<Deal[]> {
  // TODO: Replace with real Target API calls
  console.log("Fetching Target deals...");
  
  const sampleProducts = [
    { name: "Winter Coat Women's", description: "Warm stylish winter coat for women", price: "$29.99", oldPrice: "$59.99", discountPercent: 50 },
    { name: "Protein Powder Chocolate", description: "Whey protein powder 2lb container", price: "$24.99", oldPrice: "$39.99", discountPercent: 38 },
    { name: "Baby Formula Organic", description: "Organic baby formula powder", price: "$22.99", oldPrice: "$34.99", discountPercent: 34 },
    { name: "Yoga Mat Extra Thick", description: "Non-slip exercise yoga mat", price: "$18.99", oldPrice: "$32.99", discountPercent: 42 },
    { name: "Makeup Brush Set Professional", description: "Complete makeup brush collection", price: "$19.99", oldPrice: "$39.99", discountPercent: 50 },
    { name: "Home Decor Throw Pillows", description: "Decorative throw pillows set of 2", price: "$14.99", oldPrice: "$24.99", discountPercent: 40 },
    { name: "Puzzle 1000 Piece", description: "Beautiful landscape jigsaw puzzle", price: "$9.99", oldPrice: "$16.99", discountPercent: 41 },
    { name: "Notebook Set Spiral", description: "Pack of 5 spiral notebooks", price: "$12.99", oldPrice: "$19.99", discountPercent: 35 },
    { name: "Smartphone Case iPhone", description: "Protective phone case with screen protector", price: "$15.99", oldPrice: "$29.99", discountPercent: 47 },
    { name: "Tennis Shoes Women's", description: "Comfortable athletic tennis shoes", price: "$34.99", oldPrice: "$59.99", discountPercent: 42 },
    { name: "Dog Treats Natural", description: "Healthy natural dog training treats", price: "$8.99", oldPrice: "$14.99", discountPercent: 40 },
    { name: "Watch Smart Fitness", description: "Fitness tracker smart watch", price: "$79.99", oldPrice: "$129.99", discountPercent: 38 }
  ];
  
  return sampleProducts.map(product => ({
    store: "Target",
    category: detectCategory(product.name, product.description),
    name: product.name,
    image: "https://via.placeholder.com/200x200?text=" + encodeURIComponent(product.name.split(' ')[0]),
    price: product.price,
    oldPrice: product.oldPrice,
    link: `https://www.target.com/example?affid=YOURID&q=${encodeURIComponent(product.name)}`,
    discountPercent: product.discountPercent,
    timestamp: (new Date()).toISOString()
  }));
}

async function fetchHomeDepotDeals(): Promise<Deal[]> {
  // TODO: Replace with real Home Depot API calls
  console.log("Fetching Home Depot deals...");
  
  const sampleProducts = [
    { name: "Cordless Drill Kit 20V", description: "Professional cordless drill with battery", price: "$89.99", oldPrice: "$139.99", discountPercent: 36 },
    { name: "Hammer Heavy Duty", description: "Steel hammer for construction work", price: "$19.99", oldPrice: "$29.99", discountPercent: 33 },
    { name: "Garden Hose 50ft", description: "Flexible garden hose with nozzle", price: "$24.99", oldPrice: "$39.99", discountPercent: 38 },
    { name: "Paint Brushes Professional Set", description: "High quality paint brush set", price: "$15.99", oldPrice: "$24.99", discountPercent: 36 },
    { name: "LED Light Bulbs Energy Efficient", description: "Pack of 6 LED bulbs 60W equivalent", price: "$18.99", oldPrice: "$32.99", discountPercent: 42 },
    { name: "Toolbox Rolling Large", description: "Large capacity rolling tool chest", price: "$149.99", oldPrice: "$229.99", discountPercent: 35 },
    { name: "Extension Cord Heavy Duty 25ft", description: "Outdoor heavy duty extension cord", price: "$29.99", oldPrice: "$44.99", discountPercent: 33 },
    { name: "Circular Saw 7.5 Inch", description: "Professional circular saw with blade", price: "$79.99", oldPrice: "$119.99", discountPercent: 33 },
    { name: "Lawn Mower Push 21 Inch", description: "Self-propelled push lawn mower", price: "$199.99", oldPrice: "$299.99", discountPercent: 33 },
    { name: "Safety Glasses Pack", description: "Pack of 5 safety glasses", price: "$12.99", oldPrice: "$19.99", discountPercent: 35 }
  ];
  
  return sampleProducts.map(product => ({
    store: "Home Depot",
    category: detectCategory(product.name, product.description),
    name: product.name,
    image: "https://via.placeholder.com/200x200?text=" + encodeURIComponent(product.name.split(' ')[0]),
    price: product.price,
    oldPrice: product.oldPrice,
    link: `https://www.homedepot.com/example?affid=YOURID&keyword=${encodeURIComponent(product.name)}`,
    discountPercent: product.discountPercent,
    timestamp: (new Date()).toISOString()
  }));
}

async function fetchWalmartDeals(): Promise<Deal[]> {
  // TODO: Replace with real Walmart Affiliate API calls
  console.log("Fetching Walmart deals...");
  
  const sampleProducts = [
    { name: "Air Fryer 6 Quart", description: "Large capacity air fryer for family", price: "$79.99", oldPrice: "$129.99", discountPercent: 38 },
    { name: "Men's Casual T-Shirt Pack", description: "Comfortable cotton t-shirts 3-pack", price: "$19.99", oldPrice: "$34.99", discountPercent: 43 },
    { name: "Vitamin D3 Supplements", description: "High potency vitamin D3 tablets", price: "$12.99", oldPrice: "$24.99", discountPercent: 48 },
    { name: "Outdoor Camping Tent 4-Person", description: "Waterproof family camping tent", price: "$89.99", oldPrice: "$149.99", discountPercent: 40 },
    { name: "Coffee Maker Single Serve", description: "Compact single serve coffee maker", price: "$39.99", oldPrice: "$69.99", discountPercent: 43 },
    { name: "Moisturizing Face Cream", description: "Anti-aging moisturizer with SPF", price: "$16.99", oldPrice: "$29.99", discountPercent: 43 },
    { name: "Car Phone Mount Magnetic", description: "Magnetic dashboard phone holder", price: "$14.99", oldPrice: "$29.99", discountPercent: 50 },
    { name: "Kids Educational Tablet", description: "Learning tablet for children ages 3-7", price: "$69.99", oldPrice: "$119.99", discountPercent: 42 },
    { name: "Cat Litter Box Self-Cleaning", description: "Automatic self-cleaning litter box", price: "$149.99", oldPrice: "$249.99", discountPercent: 40 },
    { name: "Bluetooth Speaker Waterproof", description: "Portable waterproof speaker", price: "$25.99", oldPrice: "$49.99", discountPercent: 48 },
    { name: "Women's Diamond Ring", description: "Sterling silver diamond engagement ring", price: "$199.99", oldPrice: "$399.99", discountPercent: 50 },
    { name: "Desk Organizer Set", description: "Complete desk organization system", price: "$22.99", oldPrice: "$39.99", discountPercent: 43 },
    { name: "Microwave Oven Countertop", description: "Compact microwave for kitchen", price: "$89.99", oldPrice: "$139.99", discountPercent: 36 },
    { name: "Winter Boots Women's", description: "Waterproof insulated winter boots", price: "$49.99", oldPrice: "$89.99", discountPercent: 44 },
    { name: "Protein Bars Pack of 12", description: "High protein energy bars variety pack", price: "$24.99", oldPrice: "$39.99", discountPercent: 38 },
    { name: "Backpack School Large", description: "Durable large capacity school backpack", price: "$34.99", oldPrice: "$59.99", discountPercent: 42 }
  ];
  
  return sampleProducts.map(product => ({
    store: "Walmart",
    category: detectCategory(product.name, product.description),
    name: product.name,
    image: "https://via.placeholder.com/200x200?text=" + encodeURIComponent(product.name.split(' ')[0]),
    price: product.price,
    oldPrice: product.oldPrice,
    link: `https://www.walmart.com/ip/example?affp1=YOURID&search=${encodeURIComponent(product.name)}`,
    discountPercent: product.discountPercent,
    timestamp: (new Date()).toISOString()
  }));
}

// Scheduled task to fetch latest deals daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Fetching latest deals...");
  try {
    const amazon = await fetchAmazonDeals();
    const target = await fetchTargetDeals();
    const walmart = await fetchWalmartDeals();
    const homeDepot = await fetchHomeDepotDeals();
    deals = [...amazon, ...target, ...walmart, ...homeDepot];
    console.log(`Updated deals: ${deals.length} total deals loaded`);
  } catch (error) {
    console.error("Error fetching deals:", error);
  }
});

// Send daily deals email at 8 AM every day
cron.schedule("0 8 * * *", async () => {
  console.log("Sending daily deals email to subscribers...");
  await sendDailyDealsEmail();
});

// Amazon Product Management API Endpoints
router.get('/api/amazon/status', (req: Request, res: Response) => {
  if (!productScheduler) {
    return res.json({ 
      isConnected: false, 
      message: 'Amazon API not initialized. Configure credentials in .env file.' 
    });
  }
  
  res.json(productScheduler.getStatus());
});

router.post('/api/amazon/fetch-now', async (req: Request, res: Response) => {
  if (!productScheduler) {
    return res.status(400).json({ 
      error: 'Amazon API not initialized' 
    });
  }
  
  try {
    console.log('🚀 Manual product fetch triggered via API');
    await productScheduler.fetchProducts();
    res.json({ 
      success: true, 
      message: 'Product fetch completed successfully' 
    });
  } catch (error: any) {
    console.error('API fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products', 
      details: error?.message 
    });
  }
});

router.post('/api/amazon/start-scheduler', (req: Request, res: Response) => {
  if (!productScheduler) {
    return res.status(400).json({ 
      error: 'Amazon API not initialized' 
    });
  }
  
  productScheduler.startScheduler();
  res.json({ 
    success: true, 
    message: 'Scheduler started successfully' 
  });
});

router.post('/api/amazon/stop-scheduler', (req: Request, res: Response) => {
  if (!productScheduler) {
    return res.status(400).json({ 
      error: 'Amazon API not initialized' 
    });
  }
  
  productScheduler.stopScheduler();
  res.json({ 
    success: true, 
    message: 'Scheduler stopped successfully' 
  });
});

app.use(router);

const PORT = process.env.PORT || 5001;

// Start server and initialize Amazon automation
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🔄 Initializing Amazon Product Automation...');
  
  // Initialize Amazon scheduler after server starts
  await initializeAmazonScheduler();
  
  console.log('✅ Server startup completed');
});