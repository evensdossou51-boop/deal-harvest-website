# Deal Harvest Website 💎

A premium deal finder application with a beautiful purple-themed UI, featuring smart categorization and real-time deal discovery.

## Features ✨

- **🎨 Purple Theme**: Modern, eye-catching purple color scheme with smooth gradients
- **🔍 Smart Search**: Filter deals by category, discount percentage, price, and keywords
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **⚡ Real-time Updates**: Dynamic deal filtering and categorization
- **🏷️ Smart Categories**: Electronics, Fashion, Home & Garden, Sports, Beauty, and more
- **💰 Deal Analytics**: View average discounts and total savings at a glance
- **⭐ Featured Deals**: Highlighted premium deals for quick access

## Tech Stack 🛠️

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **CSS Modules** for scoped styling
- Modern ES6+ features

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **RESTful API** architecture
- CORS-enabled for cross-origin requests

## Project Structure 📁

```
deal-harvest-website/
├── backend/              # TypeScript backend
│   ├── src/
│   │   ├── index.ts     # Express server
│   │   ├── types.ts     # TypeScript interfaces
│   │   └── dealService.ts # Deal logic & data
│   ├── dist/            # Compiled JavaScript
│   ├── package.json
│   └── tsconfig.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx      # Main app component
│   │   └── index.css    # Global styles
│   ├── package.json
│   └── vite.config.ts
└── package.json         # Root package.json
```

## Getting Started 🚀

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/evensdossou51-boop/deal-harvest-website.git
cd deal-harvest-website
```

2. Install dependencies for both frontend and backend:
```bash
npm run install:all
```

Or install individually:
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Backend** (runs on http://localhost:3001):
```bash
npm run dev:backend
```

**Frontend** (runs on http://localhost:5173):
```bash
npm run dev:frontend
```

### Building for Production

Build both applications:
```bash
npm run build
```

Or build individually:
```bash
npm run build:backend
npm run build:frontend
```

### Running Production Build

Start the production servers:
```bash
npm start
```

## API Endpoints 🔌

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Get All Deals
```
GET /api/deals
Query Parameters:
  - category: Filter by category
  - minDiscount: Minimum discount percentage
  - maxPrice: Maximum price
  - query: Search term
  - featured: Show only featured deals (true/false)
```

#### Get Featured Deals
```
GET /api/deals/featured
```

#### Get Deal by ID
```
GET /api/deals/:id
```

#### Get Categories
```
GET /api/categories
```

#### Health Check
```
GET /api/health
```

## Features in Detail 📋

### Smart Categorization
Deals are automatically categorized into:
- Electronics
- Fashion
- Home & Garden
- Sports & Outdoors
- Beauty & Health
- Toys & Games
- Books & Media
- Food & Grocery
- Other

### Search & Filters
- **Text Search**: Search deals by title, description, or tags
- **Category Filter**: Filter by specific categories
- **Discount Filter**: Show only deals above a certain discount percentage
- **Price Filter**: Set maximum price threshold
- **Featured Toggle**: Show only premium featured deals

### Deal Card Information
Each deal card displays:
- Product image
- Discount percentage badge
- Featured badge (if applicable)
- Original and discounted prices
- Savings amount
- Store name
- Product tags
- Quick "View Deal" button

## Environment Variables 🔐

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend
```env
PORT=3001
```

## Design System 🎨

### Color Palette
- **Primary Purple**: `#7c3aed`
- **Primary Purple Dark**: `#6d28d9`
- **Primary Purple Light**: `#a78bfa`
- **Secondary Purple**: `#c084fc`
- **Accent Purple**: `#e9d5ff`
- **Background**: `#0f0f1e`
- **Background Secondary**: `#1a1a2e`
- **Background Card**: `#252541`

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the ISC License.

## Acknowledgments 🙏

- Design inspired by modern e-commerce platforms
- Icons and imagery from Unsplash
- Built with modern web technologies

---

**Enjoy discovering premium deals!** 🛍️✨