// Static deals data for GitHub Pages deployment
// Empty for now - only Amazon products you specifically provide will be added
export const staticDeals = [
  // Products will be added here when you provide Amazon links
];

// Categories remain the same
export const categories = [
  "all", "Electronics", "Clothing", "Home & Garden", "Beauty", 
  "Sports", "Books", "Automotive", "Health", "Toys", "Food", 
  "Office", "Baby", "Pet Supplies", "Industrial", "Handmade", "Other"
];

export const stores = ["all", "Amazon", "Walmart", "Target", "Home Depot"];

export function filterDeals(deals, category, store, searchTerm) {
  return deals.filter(deal => {
    const matchesCategory = category === "all" || deal.category === category;
    const matchesStore = store === "all" || deal.store === store;
    const matchesSearch = !searchTerm || 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStore && matchesSearch;
  });
}

// Last updated: Ready for Amazon products