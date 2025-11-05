export interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  category: DealCategory;
  image: string;
  url: string;
  store: string;
  expiresAt: Date;
  featured: boolean;
  tags: string[];
}

export enum DealCategory {
  ELECTRONICS = 'Electronics',
  FASHION = 'Fashion',
  HOME = 'Home & Garden',
  SPORTS = 'Sports & Outdoors',
  BEAUTY = 'Beauty & Health',
  TOYS = 'Toys & Games',
  BOOKS = 'Books & Media',
  FOOD = 'Food & Grocery',
  OTHER = 'Other'
}

export interface SearchParams {
  category?: DealCategory;
  minDiscount?: number;
  maxPrice?: number;
  query?: string;
  featured?: boolean;
}
