import React, { useEffect, useState } from "react";
import { staticDeals, categories, stores, filterDeals } from "./staticData.js";
import "./style-exact-design.css";

export default function App() {
  const [deals, setDeals] = useState([]);
  const [category, setCategory] = useState("all");
  const [store, setStore] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use static data and limit to 6 products for the 2x3 grid
    const filteredDeals = filterDeals(staticDeals, category, store, "").slice(0, 6);
    setDeals(filteredDeals);
  }, [category, store, priceRange]);

  return (
    <div className="deal-harvest-app">
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo-section">
            <div className="logo-icon">🌾</div>
            <span className="logo-text">DEAL HARVEST</span>
          </div>
          
          <button className="login-btn">LOGIN</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-subtitle">We uncover new deals weekly</p>
          <h1 className="hero-title">
            UNBETABLE SAVINGS,<br />
            ALL IN ONE PLACE
          </h1>
          <button className="view-deal-btn">VIEW DEAL</button>
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
            {deals.map((deal, index) => (
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
                  <h3 className="product-title">
                    {index === 0 ? "Urog Helen Miou" :
                     index === 1 ? "Save & Hora Masrug" :
                     index === 2 ? "Oola Go Panow" :
                     index === 3 ? "Seceg Du Weol" :
                     index === 4 ? "Hilo Lou Salisa Home Ceres" :
                     "Jah 5 Skan Tut Bar Yant Geost"}
                  </h3>
                  <p className="product-subtitle">
                    {index === 0 ? "Lnuj Eus Emp" :
                     index === 1 ? "Iso Mlin" :
                     index === 2 ? "Tende Eus Cat" :
                     index === 3 ? "Sik Wijk" :
                     index === 4 ? "Saleu Musargu" :
                     "Wel Geir"}
                  </p>
                  
                  <button className="view-deal-button">VIEW DEAL</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-text">© 2025 DEAL HARVEST. ALL YOUR RESERVED.</div>
          <div className="social-icons">
            <span>📘</span>
            <span>🐦</span>
            <span>📷</span>
            <span>🔗</span>
          </div>
        </div>
      </footer>
    </div>
  );
}