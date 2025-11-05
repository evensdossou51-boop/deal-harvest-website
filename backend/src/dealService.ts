import { Deal, DealCategory } from './types';

export const sampleDeals: Deal[] = [
  {
    id: '1',
    title: 'Premium Wireless Headphones',
    description: 'High-quality noise-canceling wireless headphones with 30-hour battery life',
    originalPrice: 299.99,
    discountedPrice: 179.99,
    discountPercentage: 40,
    category: DealCategory.ELECTRONICS,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    url: '#',
    store: 'TechMart',
    expiresAt: new Date('2025-12-31'),
    featured: true,
    tags: ['wireless', 'audio', 'premium']
  },
  {
    id: '2',
    title: 'Smart Watch Series 8',
    description: 'Latest smartwatch with health tracking, GPS, and water resistance',
    originalPrice: 449.99,
    discountedPrice: 299.99,
    discountPercentage: 33,
    category: DealCategory.ELECTRONICS,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    url: '#',
    store: 'GadgetWorld',
    expiresAt: new Date('2025-12-31'),
    featured: true,
    tags: ['smartwatch', 'fitness', 'wearable']
  },
  {
    id: '3',
    title: 'Designer Leather Jacket',
    description: 'Genuine leather jacket with premium finish and modern design',
    originalPrice: 599.99,
    discountedPrice: 359.99,
    discountPercentage: 40,
    category: DealCategory.FASHION,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    url: '#',
    store: 'FashionHub',
    expiresAt: new Date('2025-12-31'),
    featured: false,
    tags: ['leather', 'jacket', 'designer']
  },
  {
    id: '4',
    title: 'Robot Vacuum Cleaner',
    description: 'Smart robot vacuum with mapping technology and app control',
    originalPrice: 499.99,
    discountedPrice: 299.99,
    discountPercentage: 40,
    category: DealCategory.HOME,
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
    url: '#',
    store: 'HomeEssentials',
    expiresAt: new Date('2025-12-31'),
    featured: true,
    tags: ['smart home', 'cleaning', 'robot']
  },
  {
    id: '5',
    title: 'Professional Running Shoes',
    description: 'Lightweight running shoes with advanced cushioning technology',
    originalPrice: 159.99,
    discountedPrice: 89.99,
    discountPercentage: 44,
    category: DealCategory.SPORTS,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    url: '#',
    store: 'SportsPro',
    expiresAt: new Date('2025-12-31'),
    featured: false,
    tags: ['running', 'athletic', 'footwear']
  },
  {
    id: '6',
    title: 'Luxury Skincare Set',
    description: 'Complete skincare routine with premium organic ingredients',
    originalPrice: 249.99,
    discountedPrice: 149.99,
    discountPercentage: 40,
    category: DealCategory.BEAUTY,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    url: '#',
    store: 'BeautyLux',
    expiresAt: new Date('2025-12-31'),
    featured: true,
    tags: ['skincare', 'organic', 'luxury']
  },
  {
    id: '7',
    title: 'Gaming Console Bundle',
    description: 'Latest gaming console with 2 controllers and 3 popular games',
    originalPrice: 599.99,
    discountedPrice: 449.99,
    discountPercentage: 25,
    category: DealCategory.ELECTRONICS,
    image: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400',
    url: '#',
    store: 'GameZone',
    expiresAt: new Date('2025-12-31'),
    featured: false,
    tags: ['gaming', 'console', 'entertainment']
  },
  {
    id: '8',
    title: 'Designer Sunglasses',
    description: 'Polarized designer sunglasses with UV protection',
    originalPrice: 199.99,
    discountedPrice: 99.99,
    discountPercentage: 50,
    category: DealCategory.FASHION,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    url: '#',
    store: 'LuxAccessories',
    expiresAt: new Date('2025-12-31'),
    featured: false,
    tags: ['sunglasses', 'designer', 'accessories']
  },
  {
    id: '9',
    title: 'Coffee Maker Deluxe',
    description: 'Programmable coffee maker with built-in grinder and thermal carafe',
    originalPrice: 249.99,
    discountedPrice: 149.99,
    discountPercentage: 40,
    category: DealCategory.HOME,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
    url: '#',
    store: 'KitchenPro',
    expiresAt: new Date('2025-12-31'),
    featured: false,
    tags: ['coffee', 'kitchen', 'appliance']
  },
  {
    id: '10',
    title: 'Yoga Mat & Accessories Set',
    description: 'Premium yoga mat with blocks, strap, and carrying bag',
    originalPrice: 89.99,
    discountedPrice: 49.99,
    discountPercentage: 44,
    category: DealCategory.SPORTS,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    url: '#',
    store: 'FitnessWorld',
    expiresAt: new Date('2025-12-31'),
    featured: true,
    tags: ['yoga', 'fitness', 'wellness']
  },
  {
    id: '11',
    title: '4K Ultra HD TV 55"',
    description: 'Smart TV with HDR, streaming apps, and voice control',
    originalPrice: 899.99,
    discountedPrice: 599.99,
    discountPercentage: 33,
    category: DealCategory.ELECTRONICS,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    url: '#',
    store: 'ElectroMart',
    expiresAt: new Date('2025-12-31'),
    featured: true,
    tags: ['tv', '4k', 'smart home']
  },
  {
    id: '12',
    title: 'Bestseller Book Collection',
    description: 'Set of 5 bestselling novels from top authors',
    originalPrice: 99.99,
    discountedPrice: 49.99,
    discountPercentage: 50,
    category: DealCategory.BOOKS,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    url: '#',
    store: 'BookHaven',
    expiresAt: new Date('2025-12-31'),
    featured: false,
    tags: ['books', 'reading', 'collection']
  }
];

export class DealService {
  private deals: Deal[] = sampleDeals;

  getAllDeals(): Deal[] {
    return this.deals;
  }

  getDealById(id: string): Deal | undefined {
    return this.deals.find(deal => deal.id === id);
  }

  searchDeals(params: any): Deal[] {
    let filtered = this.deals;

    if (params.category) {
      filtered = filtered.filter(deal => deal.category === params.category);
    }

    if (params.minDiscount) {
      filtered = filtered.filter(deal => deal.discountPercentage >= parseFloat(params.minDiscount));
    }

    if (params.maxPrice) {
      filtered = filtered.filter(deal => deal.discountedPrice <= parseFloat(params.maxPrice));
    }

    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(deal =>
        deal.title.toLowerCase().includes(query) ||
        deal.description.toLowerCase().includes(query) ||
        deal.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (params.featured === 'true') {
      filtered = filtered.filter(deal => deal.featured);
    }

    return filtered;
  }

  getFeaturedDeals(): Deal[] {
    return this.deals.filter(deal => deal.featured);
  }

  getDealsByCategory(category: DealCategory): Deal[] {
    return this.deals.filter(deal => deal.category === category);
  }
}
