// Static deals data for GitHub Pages deployment
// Empty for now - only Amazon products you specifically provide will be added
export const staticDeals = [
  {
    id: 1,
    title: "Amazon Product", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/4nGXCMx",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 2,
    title: "Amazon Product 2", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/4oyZ5pl",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 3,
    title: "Amazon Product 3", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/3LKREg4",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 4,
    title: "Amazon Product 4", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/4oqQC7G",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 5,
    title: "Amazon Product 5", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/4qGAJeM",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 6,
    title: "Amazon Product 6", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/3WBmOcf",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 7,
    title: "Amazon Product 7", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/47VXKTv",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 8,
    title: "Amazon Product 8", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/3JJzwCQ",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
  },
  {
    id: 9,
    title: "Amazon Product 9", // Update with actual product name
    description: "Amazon product from the provided link", // Update with actual description
    price: "Check Amazon", // Update with actual price
    originalPrice: "", // Update if there's an original price
    image: "", // Update with actual product image URL
    link: "https://amzn.to/4ou29mE",
    store: "Amazon",
    category: "Other", // Update with appropriate category
    discount: "", // Update if there's a discount percentage
    rating: "", // Update with product rating
    reviews: "", // Update with number of reviews
    isSponsored: true,
    tags: ["amazon"]
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