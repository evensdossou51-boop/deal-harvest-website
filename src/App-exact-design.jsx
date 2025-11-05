import React, { useEffect, useState } from "react";
import { staticDeals, categories, stores, filterDeals } from "./staticData.js";
import "./style-exact-design.css";

export default function App() {
  const [deals, setDeals] = useState([]);
  const [category, setCategory] = useState("all");
  const [store, setStore] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [loading, setLoading] = useState(false);

  // Check if we're in development mode
  const isDevelopment = window.location.hostname === 'localhost';
  const logoPath = isDevelopment ? './logo.png' : '/deal-harvest-website/logo.png';

  useEffect(() => {
    // Use static data and show all 38 products (or filtered results)
    const filteredDeals = filterDeals(staticDeals, category, store, "");
    setDeals(filteredDeals);
  }, [category, store, priceRange]);

  return (
    <div className="deal-harvest-app">
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo-section">
            <img src={logoPath} alt="Deal Harvest Logo" className="logo-image" />
            <span className="logo-text">DEAL HARVEST</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-subtitle">Your Daily Shopping Discorfavings</p>
          <h1 className="hero-title">
            UNBEATABLE SAVINGS,<br />
            ALL IN ONE PLACE
          </h1>
          <p className="hero-description">
            Discover amazing deals from Amazon, Walmart, Target, and Home Depot.<br />
            Save more on everything you need, every day!
          </p>
          <button className="view-deal-btn">VIEW ALL DEALS</button>
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content-container">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <h3 className="filter-title">Renja Penja wallpars</h3>
          
          <div className="filter-section">
            <label className="filter-label">Filter</label>
            
            <div className="filter-group">
              <label>Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">Smartphones</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Garden</option>
                <option value="beauty">Health & Beauty</option>
                <option value="sports">Sports</option>
                <option value="toys">Toys</option>
                <option value="books">Books</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Store</label>
              <select 
                value={store} 
                onChange={(e) => setStore(e.target.value)}
                className="filter-select"
              >
                <option value="all">Smartphones</option>
                <option value="Amazon">Amazon</option>
                <option value="Walmart">Walmart</option>
                <option value="Target">Target</option>
                <option value="Home Depot">Home Depot</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range</label>
              <select 
                value={priceRange} 
                onChange={(e) => setPriceRange(e.target.value)}
                className="filter-select"
              >
                <option value="all">Over $10,000</option>
                <option value="under-25">Under $25</option>
                <option value="25-50">$25 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-500">$100 - $500</option>
                <option value="over-500">Over $500</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          <div className="products-grid-container">
            {deals.map((deal) => (
              <div key={deal.id} className="product-card">
                <div className="card-header">
                  <div className="store-icon">
                    {deal.store === "Amazon" ? "📦" : 
                     deal.store === "Walmart" ? "🛒" :
                     deal.store === "Target" ? "🎯" : "🏠"}
                  </div>
                  <div className="discount-tag">
                    SAVE {deal.discountPercent}% OFF
                  </div>
                </div>
                
                <div className="product-image-container">
                  <img src={deal.image} alt={deal.name} className="product-image" />
                </div>
                
                <div className="product-details">
                  <div className="seller-info">
                    <span className="seller-label">Sold by:</span>
                    <span className="seller-name">{deal.store}</span>
                  </div>
                  
                  <h3 className="product-title">{deal.name}</h3>
                  
                  <div className="product-pricing">
                    <span className="current-price">{deal.price}</span>
                    <span className="old-price">{deal.oldPrice}</span>
                  </div>
                  
                  <a 
                    href={deal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-deal-button"
                  >
                    VIEW DEAL ON {deal.store.toUpperCase()}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-left">
            <img src={logoPath} alt="Deal Harvest Logo" className="footer-logo" />
            <div className="footer-text">© 2025 DEAL HARVEST. YOUR DAILY SHOPPING DISCORFAVINGS.</div>
            <div className="footer-links">
              <a href="./terms.html" className="footer-link">Terms & Conditions</a>
              <span className="footer-separator">|</span>
              <a href="./terms.html#privacy" className="footer-link">Privacy Policy</a>
              <span className="footer-separator">|</span>
              <a href="./terms.html#affiliate" className="footer-link">Affiliate Disclosure</a>
            </div>
          </div>
          <div className="footer-right">
            <div className="affiliate-notice">
              <small>As an Amazon Associate and participant in other affiliate programs, I earn from qualifying purchases.</small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}