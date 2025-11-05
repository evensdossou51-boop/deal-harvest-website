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
  expiresAt: Date | string;
  featured: boolean;
  tags: string[];
}

export const DealCategory = {
  ELECTRONICS: 'Electronics',
  FASHION: 'Fashion',
  HOME: 'Home & Garden',
  SPORTS: 'Sports & Outdoors',
  BEAUTY: 'Beauty & Health',
  TOYS: 'Toys & Games',
  BOOKS: 'Books & Media',
  FOOD: 'Food & Grocery',
  OTHER: 'Other'
} as const;

export type DealCategory = typeof DealCategory[keyof typeof DealCategory];

export interface SearchParams {
  category?: DealCategory;
  minDiscount?: number;
  maxPrice?: number;
  query?: string;
  featured?: boolean;
}
