// DealSpotter - JavaScript functionality with API integration
const API_BASE = 'http://localhost:5000'; // Change if server runs on different port

// Sample product data (used as fallback if API is not available)
const sampleProducts = [
  {
    name: "Gaming Mouse",
    image: "https://via.placeholder.com/200x200",
    price: "$29.99",
    oldPrice: "$49.99",
    store: "Amazon",
    link: "https://www.amazon.com/exampleproduct?tag=youraffiliateid-20"
  },
  {
    name: "Trendy Sneakers",
    image: "https://via.placeholder.com/200x200", 
    price: "$79.99",
    oldPrice: "$120.00",
    store: "SHEIN",
    link: "https://www.shein.com/example?aff=yourid"
  },
  {
    name: "Coffee Maker",
    image: "https://via.placeholder.com/200x200",
    price: "$89.99", 
    oldPrice: "$139.99",
    store: "Walmart",
    link: "https://www.walmart.com/ip/example?affp1=yourid"
  }
];

// Fetch deals from API server
async function fetchDealsFromAPI(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.store) params.append('store', filters.store);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${API_BASE}/api/deals?${params}`);
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return data.deals || [];
  } catch (error) {
    console.warn('API not available, using sample data:', error.message);
    return sampleProducts;
  }
}

// Function to render deals to the page
function renderDeals(deals) {
  const dealsContainer = document.getElementById('deals');
  
  deals.forEach(deal => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const discountBadge = deal.discountPercent ? 
      `<div class="discount-badge">${deal.discountPercent}% OFF</div>` : '';
    
    card.innerHTML = `
      ${discountBadge}
      <img src="${deal.image}" alt="${deal.name}">
      <h3>${deal.name}</h3>
      <p class="price">${deal.price} ${deal.oldPrice ? `<span class="old-price">${deal.oldPrice}</span>` : ''}</p>
      <a href="${deal.link}" target="_blank" class="btn">Buy on ${deal.store}</a>
    `;
    dealsContainer.appendChild(card);
  });
}

// Function to load more products dynamically from API
async function addMoreProducts() {
  const deals = await fetchDealsFromAPI({ limit: '6' });
  renderDeals(deals);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Load initial deals from API
  const initialDeals = await fetchDealsFromAPI({ limit: '3' });
  
  // Clear existing deals and add API deals
  const dealsContainer = document.getElementById('deals');
  dealsContainer.innerHTML = '';
  renderDeals(initialDeals);
  
  // Add button to load more deals
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.textContent = 'Load More Deals';
  loadMoreBtn.className = 'btn';
  loadMoreBtn.style.margin = '20px';
  loadMoreBtn.onclick = addMoreProducts;
  
  document.body.insertBefore(loadMoreBtn, document.querySelector('footer'));
});

// Simple click tracking for affiliate links
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn') && e.target.href) {
    console.log('Affiliate link clicked:', e.target.href);
    // Add your analytics tracking here
  }
});