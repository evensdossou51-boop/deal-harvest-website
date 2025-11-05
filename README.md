# Deal Harvest - Premium Deal Finder Website

A full-stack deal aggregator with React frontend and TypeScript Express backend, featuring a beautiful purple theme and smart categorization system.

## ✨ Features

- 🎨 **Purple Theme**: Professional gradient design with modern aesthetics
- 🏪 **Multi-Store Support**: Amazon, Walmart, Target, Home Depot deals
- 📱 **Responsive Grid Layout**: Optimized for all devices
- 🔍 **Smart Categorization**: 16 categories with automatic detection
- 📧 **Email Notifications**: Daily deal digest with subscription system
- ⚡ **Real-time Filtering**: Instant search and category filters
- 🛒 **Direct Purchase**: Store-specific purchase buttons

## 📁 Project Structure
```
my-deals-site/
├── src/
│   ├── App.jsx           # Main React component with grid layout
│   └── style-purple.css  # Purple theme styles
├── public/
│   └── terms.html        # Terms & conditions page
├── server.ts             # TypeScript Express API with smart categorization
├── package.json          # Node.js dependencies
├── EMAIL-SETUP.md        # Email configuration guide
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Start the Application
```powershell
# Start both API server (port 5001) and React client (port 3002)
npm run dev
```

### 3. OR Start Services Individually
```powershell
# Terminal 1: Start API server
npm run server

# Terminal 2: Start Vite client  
npm run client
```

### 4. Open Application
- **React Frontend**: http://localhost:3002
- **API Server**: http://localhost:5001/api/deals

## 🔧 API Endpoints

### GET `/api/deals`
Fetch deals with optional filters:

**Query Parameters:**
- `store` - Filter by store (Amazon, Walmart, Target, "Home Depot")
- `category` - Filter by 16 available categories
- `search` - Search in product names
- `limit` - Max number of results (default: 50)

### POST `/api/subscribe`
Subscribe to email notifications:
```json
{
  "email": "user@example.com"
}
```

## 📧 Email Setup

1. Copy `.env.example` to `.env`
2. Add your Gmail credentials:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```
3. See `EMAIL-SETUP.md` for detailed configuration

## 🎨 Theme Customization

The purple theme uses CSS variables in `src/style-purple.css`:
- `--primary-purple`: #46306c (Dark purple)
- `--light-purple`: #a593c2 (Light purple)
- `--accent-purple`: #8a2be2 (Accent purple)

## 🛍️ Product Categories

The system automatically categorizes products into:
- Electronics & Tech
- Fashion & Apparel
- Home & Garden
- Health & Beauty
- Sports & Outdoors
- Toys & Games
- Books & Media
- Automotive
- Office & Business
- Kitchen & Dining
- Baby & Kids
- Pet Supplies
- Tools & Hardware
- Jewelry & Accessories
- Art & Crafts
- Travel & Luggage

## 🔒 Affiliate Disclosure

This website contains affiliate links. We may earn a commission when you make a purchase through these links at no additional cost to you. See our [Terms & Conditions](./public/terms.html) for full details.

## 📝 Development

### Tech Stack
- **Frontend**: React 18 + Vite 5
- **Backend**: Express + TypeScript
- **Styling**: CSS Grid + Purple Theme
- **Email**: Nodemailer + Gmail SMTP
- **Scheduling**: Node-cron for daily emails

### Scripts
```powershell
npm run dev      # Start both client and server
npm run client   # Start Vite dev server only
npm run server   # Start Express server only
npm run build    # Build for production
```

## 🚀 Deployment

1. Set environment variables on your hosting platform
2. Build the project: `npm run build`
3. Deploy both frontend and backend
4. Update CORS settings for your domain

## 📄 License

This project is for educational and commercial use. Please comply with affiliate program terms and conditions.

---

**Ready to start finding deals!** 🛍️