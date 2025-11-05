import type { Deal, SearchParams } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const dealService = {
  async getAllDeals(params?: SearchParams): Promise<Deal[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.minDiscount) queryParams.append('minDiscount', params.minDiscount.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.query) queryParams.append('query', params.query);
    if (params?.featured) queryParams.append('featured', 'true');

    const response = await fetch(`${API_BASE_URL}/deals?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch deals');
    return response.json();
  },

  async getFeaturedDeals(): Promise<Deal[]> {
    const response = await fetch(`${API_BASE_URL}/deals/featured`);
    if (!response.ok) throw new Error('Failed to fetch featured deals');
    return response.json();
  },

  async getDealById(id: string): Promise<Deal> {
    const response = await fetch(`${API_BASE_URL}/deals/${id}`);
    if (!response.ok) throw new Error('Failed to fetch deal');
    return response.json();
  },

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  }
};
