// Static deals data for GitHub Pages deployment
// Empty for now - only Amazon products you specifically provide will be added
export const staticDeals = [
  {
    id: 1,
    name: "Premium Amazon Product 1",
    description: "Amazing product with great features",
    price: "$99.99",
    oldPrice: "$149.99",
    image: "https://via.placeholder.com/300x300/5d3a9b/white?text=Product+1",
    link: "https://amzn.to/4nGXCMx",
    store: "Amazon",
    category: "Electronics",
    discountPercent: "33",
    rating: "4.5",
    reviews: "1,234",
    isSponsored: true,
    tags: ["amazon", "electronics"]
  },
  {
    id: 2,
    name: "Premium Amazon Product 2",
    description: "High-quality product at an amazing price",
    price: "$79.99",
    oldPrice: "$119.99",
    image: "https://via.placeholder.com/300x300/7b4bb8/white?text=Product+2",
    link: "https://amzn.to/4oyZ5pl",
    store: "Amazon",
    category: "Home & Garden",
    discountPercent: "33",
    rating: "4.7",
    reviews: "856",
    isSponsored: true,
    tags: ["amazon", "home"]
  },
  {
    id: 3,
    name: "Premium Amazon Product 3",
    description: "Top-rated product with excellent reviews",
    price: "$129.99",
    oldPrice: "$179.99",
    image: "https://via.placeholder.com/300x300/8b5cc8/white?text=Product+3",
    link: "https://amzn.to/3LKREg4",
    store: "Amazon",
    category: "Beauty",
    discountPercent: "28",
    rating: "4.8",
    reviews: "2,145",
    isSponsored: true,
    tags: ["amazon", "beauty"]
  },
  {
    id: 4,
    name: "Premium Amazon Product 4",
    description: "Must-have item with incredible value",
    price: "$59.99",
    oldPrice: "$89.99",
    image: "https://via.placeholder.com/300x300/9b6dd8/white?text=Product+4",
    link: "https://amzn.to/4oqQC7G",
    store: "Amazon",
    category: "Sports",
    discountPercent: "33",
    rating: "4.6",
    reviews: "743",
    isSponsored: true,
    tags: ["amazon", "sports"]
  },
  {
    id: 5,
    name: "Premium Amazon Product 5",
    description: "Best-selling product with amazing features",
    price: "$149.99",
    oldPrice: "$199.99",
    image: "https://via.placeholder.com/300x300/ab7ee8/white?text=Product+5",
    link: "https://amzn.to/4qGAJeM",
    store: "Amazon",
    category: "Clothing",
    discountPercent: "25",
    rating: "4.9",
    reviews: "3,267",
    isSponsored: true,
    tags: ["amazon", "clothing"]
  },
  {
    id: 6,
    name: "Premium Amazon Product 6",
    description: "Innovative product with cutting-edge technology",
    price: "$89.99",
    oldPrice: "$129.99",
    image: "https://via.placeholder.com/300x300/bb8ff8/white?text=Product+6",
    link: "https://amzn.to/3WBmOcf",
    store: "Amazon",
    category: "Electronics",
    discountPercent: "31",
    rating: "4.4",
    reviews: "1,892",
    isSponsored: true,
    tags: ["amazon", "electronics"]
  },
  {
    id: 7,
    name: "Premium Amazon Product 7",
    description: "Perfect solution for everyday needs",
    price: "$39.99",
    oldPrice: "$59.99",
    image: "https://via.placeholder.com/300x300/cba0ff/white?text=Product+7",
    link: "https://amzn.to/47VXKTv",
    store: "Amazon",
    category: "Home & Garden",
    discountPercent: "33",
    rating: "4.3",
    reviews: "567",
    isSponsored: true,
    tags: ["amazon", "home"]
  },
  {
    id: 8,
    name: "Premium Amazon Product 8",
    description: "High-performance product with great durability",
    price: "$199.99",
    oldPrice: "$299.99",
    image: "https://via.placeholder.com/300x300/dbb1ff/white?text=Product+8",
    link: "https://amzn.to/3JJzwCQ",
    store: "Amazon",
    category: "Automotive",
    discountPercent: "33",
    rating: "4.7",
    reviews: "1,456",
    isSponsored: true,
    tags: ["amazon", "automotive"]
  },
  {
    id: 9,
    name: "Premium Amazon Product 9",
    description: "Essential item with unbeatable price",
    price: "$69.99",
    oldPrice: "$99.99",
    image: "https://via.placeholder.com/300x300/ebc2ff/white?text=Product+9",
    link: "https://amzn.to/4ou29mE",
    store: "Amazon",
    category: "Books",
    discountPercent: "30",
    rating: "4.5",
    reviews: "892",
    isSponsored: true,
    tags: ["amazon", "books"]
  }
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