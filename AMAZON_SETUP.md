# Amazon API Integration Setup Guide

## 📋 What You Need to Get Started

### 1. Amazon Associate Account
- **Apply at**: https://affiliate-program.amazon.com/
- **Requirements**: 
  - Valid website with quality content
  - Regular traffic (visitors)
  - Compliance with Amazon's policies
- **What you get**: Associate Tag (e.g., "yourtag-20")

### 2. AWS Account & PA-API Access
- **Create AWS Account**: https://aws.amazon.com/
- **Apply for PA-API**: https://webservices.amazon.com/paapi5/documentation/
- **Requirements**:
  - Active Amazon Associate account
  - Qualifying sales/traffic from affiliate links
  - API usage approval

### 3. Get Your Credentials

#### Step 1: Get Your Associate Tag
1. Login to Amazon Associates
2. Go to Account Settings
3. Copy your "Associate Tag" (looks like: yourtag-20)

#### Step 2: Get AWS Credentials  
1. Login to AWS Console
2. Go to IAM → Users
3. Create new user or select existing
4. Create Access Keys
5. Copy:
   - Access Key ID
   - Secret Access Key

### 4. Configure Your Website

#### Step 1: Create .env File
Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Copy the example file
cp .env.example .env
```

#### Step 2: Add Your Credentials
Edit the `.env` file:

```bash
# Amazon Associate Program
AMAZON_ASSOCIATE_TAG=your-associate-tag-20

# AWS Credentials
AMAZON_ACCESS_KEY_ID=AKIA...your-access-key
AMAZON_SECRET_ACCESS_KEY=your-secret-key-here

# API Configuration  
AMAZON_REGION=us-east-1
AMAZON_HOST=webservices.amazon.com

# Scheduler Settings
ENABLE_AUTO_FETCH=true
FETCH_INTERVAL_HOURS=1
MAX_PRODUCTS=50
```

### 5. Start Your Server

```bash
npm run dev
```

## 🤖 How the Automation Works

### Automatic Features
- ✅ **Hourly Updates**: Fetches new products every hour
- ✅ **Smart Categories**: Automatically categorizes products  
- ✅ **Duplicate Prevention**: Removes duplicate products
- ✅ **Price Tracking**: Monitors price changes and discounts
- ✅ **Affiliate Links**: All links include your Associate Tag

### Manual Controls
Access these endpoints to control the system:

#### Check Status
```
GET http://localhost:5001/api/amazon/status
```

#### Force Update Now
```  
POST http://localhost:5001/api/amazon/fetch-now
```

#### Start/Stop Scheduler
```
POST http://localhost:5001/api/amazon/start-scheduler
POST http://localhost:5001/api/amazon/stop-scheduler
```

## 📊 What Gets Updated

The system automatically updates your `staticData.js` file with:
- New products from Amazon
- Real pricing information
- Affiliate links with your tag
- Product images and details
- Smart categorization

## ⚡ Expected Results

### After Setup:
1. **Immediate**: Server will attempt to connect to Amazon API
2. **First Hour**: Initial product fetch (10-20 products)
3. **Every Hour**: New products added, old ones refreshed
4. **Every 4 Hours**: Deep refresh with more diverse products

### Performance:
- **Products**: Up to 50 live products
- **Categories**: Auto-detected from 16 categories
- **Updates**: Real-time pricing and availability
- **Revenue**: Earn commissions from all sales

## 🚨 Important Notes

### Amazon Requirements:
- Must maintain active Associate account
- Need qualifying traffic/sales to keep API access
- Follow Amazon's content and linking policies

### Rate Limits:
- Max 1 request per second
- Built-in delays prevent rate limiting
- Automatic retry on failures

### Backup:
- Original products are preserved
- Automatic backups created in `/backups` folder
- Can revert to manual products anytime

## 🛠️ Troubleshooting

### Common Issues:

#### "Amazon API not initialized"
- Check your .env credentials
- Verify Associate Tag format
- Ensure AWS credentials are valid

#### "Rate limit exceeded"  
- Reduce FETCH_INTERVAL_HOURS in .env
- Wait 1 hour and try again
- Check AWS usage limits

#### "No products found"
- Verify PA-API access approval
- Check search keywords in scheduler
- Try manual fetch endpoint

### Debug Commands:
```bash
# Check if server is running
curl http://localhost:5001/api/amazon/status

# Check logs
npm run dev
# Look for Amazon-related console messages
```

## 🎯 Expected Revenue

With automated Amazon products:
- **Commission Rate**: 1-10% per sale (varies by category)
- **Product Volume**: 50 fresh products hourly  
- **Conversion**: Higher with real-time pricing
- **Traffic**: Better SEO with fresh content

Your affiliate website will now automatically stay updated with the hottest Amazon deals!

## 📞 Support

If you need help:
1. Check the server console for error messages
2. Verify all credentials in .env file
3. Test API endpoints manually
4. Review Amazon Associate account status

The system is designed to be fully automated once configured properly!