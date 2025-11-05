import React, { useEffect, useState } from "react";
import { staticDeals, categories, stores, filterDeals } from "./staticData.js";
import "./style-purple.css";

export default function App() {
  const [deals, setDeals] = useState([]);
  const [category, setCategory] = useState("all");
  const [store, setStore] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    // Use static data for GitHub Pages
    const filteredDeals = filterDeals(staticDeals, category, store, search);
    setDeals(filteredDeals);
  }, [category, store, search]);

  // Get current season for dynamic content
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return { emoji: '🌸', text: 'Spring Fashion Deals', bg: 'spring' };
    if (month >= 5 && month <= 7) return { emoji: '☀️', text: 'Summer Tech Deals', bg: 'summer' };
    if (month >= 8 && month <= 10) return { emoji: '🍂', text: 'Fall Home Essentials', bg: 'fall' };
    return { emoji: '❄️', text: 'Holiday Tech Deals', bg: 'winter' };
  };

  const season = getCurrentSeason();

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme || 'dark');
  };

  const showSeasonalDeals = () => {
    setStore("all");
    const seasonalCategories = {
      spring: "fashion",
      summer: "electronics", 
      fall: "home",
      winter: "electronics"
    };
    setCategory(seasonalCategories[season.bg] || "electronics");
  };

  const handleEmailSubmribe = (e) => {
    e.preventDefault();
    if (!email) {
      setEmailStatus("Please enter an email address");
      return;
    }
    
    // For GitHub Pages, just show a success message
    setEmailStatus("Thanks! Email subscription feature available in full version.");
    setEmail("");
    setTimeout(() => setEmailStatus(""), 3000);
  };

  const filteredCategories = categories.slice(1); // Remove 'all' for display

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>🛍️ Deal Harvest</h1>
            <p>Premium deals from top retailers</p>
          </div>
          
          <div className="header-actions">
            <div className="seasonal-banner" onClick={showSeasonalDeals}>
              <span className="season-emoji">{season.emoji}</span>
              <span className="season-text">{season.text}</span>
            </div>
            
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              🌙
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="filters">
            <div className="filter-group">
              <label>Store</label>
              <select value={store} onChange={(e) => setStore(e.target.value)}>
                {stores.map(s => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Stores" : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {filteredCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="category-tags">
              {filteredCategories.slice(0, 8).map(cat => (
                <button
                  key={cat}
                  className={`category-tag ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Email Subscription */}
          <div className="email-subscription">
            <h3>📧 Daily Deal Alerts</h3>
            <p>Get the best deals delivered to your inbox!</p>
            <form onSubmit={handleEmailSubmribe}>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
            </form>
            {emailStatus && (
              <p className={`email-status ${emailStatus.includes('Thanks') ? 'success' : 'error'}`}>
                {emailStatus}
              </p>
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products">
          <div className="products-header">
            <h2>
              {category === "all" 
                ? `${deals.length} Hot Deals` 
                : `${deals.length} ${category.charAt(0).toUpperCase() + category.slice(1)} Deals`}
            </h2>
            {store !== "all" && <span className="store-filter">from {store}</span>}
          </div>

          {loading ? (
            <div className="loading">Finding the best deals for you...</div>
          ) : (
            <div className="products-grid">
              {deals.map(deal => (
                <div key={deal.id} className="product-card">
                  <div className="product-image">
                    <img src={deal.image} alt={deal.name} loading="lazy" />
                    <div className="discount-badge">-{deal.discountPercent}%</div>
                  </div>
                  
                  <div className="product-info">
                    <div className="product-store">{deal.store}</div>
                    <h3 className="product-name">{deal.name}</h3>
                    
                    <div className="product-pricing">
                      <span className="current-price">{deal.price}</span>
                      <span className="old-price">{deal.oldPrice}</span>
                    </div>
                    
                    <a 
                      href={deal.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="purchase-btn"
                    >
                      Purchase on {deal.store} 🛒
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deals.length === 0 && !loading && (
            <div className="no-deals">
              <p>No deals found matching your criteria.</p>
              <button onClick={() => { setCategory("all"); setStore("all"); setSearch(""); }}>
                Show All Deals
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 Deal Harvest. Find amazing deals from top retailers.</p>
          <a href="./terms.html" target="_blank" rel="noopener noreferrer">
            Terms & Conditions
          </a>
        </div>
      </footer>
    </div>
  );
}