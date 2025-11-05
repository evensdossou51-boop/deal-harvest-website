import React, { useEffect, useState } from "react";
import "./style-purple.css";

export default function App() {
  const [deals, setDeals] = useState([]);
  const [category, setCategory] = useState("all");
  const [store, setStore] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.append("category", category);
    if (store !== "all") params.append("store", store);
    if (search) params.append("search", search);
    fetch(`http://localhost:5001/api/deals?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setDeals(data.deals);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch deals:", err);
        setLoading(false);
      });
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
    // Reset to show all stores for maximum deals
    setStore("all");
    
    // Set seasonal category and search terms for best deals
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) {
      // Spring: Fashion deals
      setCategory("fashion"); 
      setSearch("jacket dress spring");
    } else if (month >= 5 && month <= 7) {
      // Summer: Electronics for outdoor/travel
      setCategory("electronics"); 
      setSearch("headphones speaker bluetooth");
    } else if (month >= 8 && month <= 10) {
      // Fall: Home essentials and coffee
      setCategory("home"); 
      setSearch("coffee vacuum home machine");
    } else {
      // Winter/Holiday: Tech gifts and electronics
      setCategory("electronics"); 
      setSearch("headphones watch tech premium");
    }
    
    // Scroll to deals section
    setTimeout(() => {
      document.querySelector('.featured-deals').scrollIntoView({behavior: 'smooth'});
    }, 100);
  };

  const showBestDeals = () => {
    // Reset all filters to show best deals from all stores
    setStore("all");
    setCategory("all");
    setSearch("");
    
    // Scroll to deals section
    setTimeout(() => {
      document.querySelector('.featured-deals').scrollIntoView({behavior: 'smooth'});
    }, 100);
  };

  const handleEmailSubscription = async () => {
    if (!email || !email.includes('@')) {
      setEmailStatus("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setEmailStatus("🎉 Successfully subscribed! Check your email daily for hot deals at 8 AM.");
        setEmail("");
      } else {
        setEmailStatus(data.error || "❌ Subscription failed. Please try again.");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setEmailStatus("❌ Connection error. Please try again.");
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">✓ DEAL HARVEST</div>
      </header>

      {/* Secondary Navigation */}
      <div className="secondary-nav">
        <div className="nav-content">
          <div className="store-tabs">
            {['All Stores', 'Amazon', 'Walmart', 'Target', 'Home Depot'].map((storeName, index) => (
              <button
                key={storeName}
                className={`store-tab ${store === (index === 0 ? 'all' : storeName) ? 'active' : ''}`}
                onClick={() => setStore(index === 0 ? 'all' : storeName)}
              >
                {storeName}
              </button>
            ))}
            <div className="seasonal-filter">
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion & Clothing</option>
                <option value="home">Home & Garden</option>
                <option value="fitness">Health & Fitness</option>
                <option value="books">Books & Media</option>
                <option value="toys">Toys & Games</option>
              </select>
            </div>
          </div>
          
          <div className="search-container">
            <input 
              type="text"
              className="search-bar"
              placeholder="Search deals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="search-button">🔍</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="main-content">
        <div className="content-wrapper">
          {/* Hero Section */}
          <div className="hero-content">
            <h1>UNBEATABLE SAVINGS, ALL IN ONE PLACE</h1>
            <button className="view-all-button" onClick={showBestDeals}>
              VIEW ALL
            </button>
          </div>
          
          {/* Main Layout with Sidebar and Grid */}
          <div className="layout-container">
            {/* Sidebar Filters */}
            <aside className="sidebar">
              <div className="filter-section">
                <h3>Filter</h3>
                
                <div className="filter-group">
                  <label>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics & Tech</option>
                    <option value="fashion">Fashion & Clothing</option>
                    <option value="home">Home & Garden</option>
                    <option value="fitness">Health & Fitness</option>
                    <option value="books">Books & Media</option>
                    <option value="toys">Toys & Games</option>
                    <option value="beauty">Beauty & Personal Care</option>
                    <option value="sports">Sports & Outdoors</option>
                    <option value="automotive">Automotive</option>
                    <option value="kitchen">Kitchen & Dining</option>
                    <option value="baby">Baby & Kids</option>
                    <option value="pets">Pet Supplies</option>
                    <option value="office">Office & School</option>
                    <option value="tools">Tools & Hardware</option>
                    <option value="jewelry">Jewelry & Accessories</option>
                    <option value="shoes">Shoes & Footwear</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Store</label>
                  <select value={store} onChange={e => setStore(e.target.value)}>
                    <option value="all">All Stores</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Walmart">Walmart</option>
                    <option value="Target">Target</option>
                    <option value="Home Depot">Home Depot</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Price Range</label>
                  <select>
                    <option>Any amount</option>
                    <option>Under $25</option>
                    <option>$25 - $50</option>
                    <option>$50 - $100</option>
                    <option>Over $100</option>
                  </select>
                </div>
              </div>
            </aside>
            
            {/* Products Grid */}
            <main className="products-grid">
              <div className="grid-header">
                <span className="results-count">
                  {deals.length > 0 ? `${deals.length} results found` : 'No results'}
                </span>
              </div>
              
              {loading ? (
                <div className="loading">Loading amazing deals...</div>
              ) : deals.length === 0 ? (
                <div className="no-deals">
                  <h3>🔍 No deals found</h3>
                  <p>Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="product-grid">
                  {deals.slice(0, 27).map((item, i) => (
                    <div key={i} className="product-card">
                      {item.discountPercent && (
                        <div className="discount-badge">{item.discountPercent}% OFF</div>
                      )}
                      <div className="product-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="product-info">
                        <h3>{item.name.length > 50 ? item.name.substring(0, 50) + '...' : item.name}</h3>
                        <p className="product-description">Limited Time Offer</p>
                        <button 
                          className="view-deal-btn"
                          onClick={() => window.open(item.link, '_blank')}
                        >
                          Purchase on {item.store}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Additional deals section for filtered results */}
      {(search || category !== 'all' || store !== 'all') && deals.length > 8 && (
        <section className="additional-deals" style={{ padding: '50px', background: '#f8f7ff' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#46306c', marginBottom: '10px' }}>
              🔍 More Results
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {search ? `Showing results for "${search}"` : `Showing ${category !== 'all' ? category : 'all'} deals`}
              {store !== 'all' && ` from ${store}`}
            </p>
            <button 
              className="clear-filters-btn" 
              onClick={() => {setSearch(''); setCategory('all'); setStore('all');}}
              style={{ 
                padding: '8px 20px', 
                background: '#a593c2', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}
            >
              🗙 Clear Filters
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px' 
          }}>
            {deals.slice(8).map((item, i) => (
              <div key={i} style={{
                background: 'white',
                border: '2px solid #a593c2',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                {item.discountPercent && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: '#46306c',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '6px 10px',
                    borderRadius: '0 15px 0 15px'
                  }}>
                    {item.discountPercent}%
                  </div>
                )}
                <img src={item.image} alt={item.name} style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }} />
                <h3 style={{ fontSize: '14px', color: '#46306c', margin: '10px 0' }}>
                  {item.name.length > 50 ? item.name.substring(0, 50) + '...' : item.name}
                </h3>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#46306c', margin: '5px 0' }}>
                  {item.price}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
                  {item.store}
                </div>
                <button 
                  onClick={() => window.open(item.link, '_blank')}
                  style={{
                    padding: '8px 16px',
                    background: '#a593c2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Purchase on {item.store}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <h2>🚀 Never Miss a Deal</h2>
        <p>Get daily drops straight to your inbox - the hottest deals from all your favorite stores!</p>
        <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); handleEmailSubscription(); }}>
          <input 
            type="email" 
            placeholder="Enter your email..." 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="newsletter-btn">
            Subscribe
          </button>
        </form>
        {emailStatus && (
          <div className={`email-status ${emailStatus.includes('Successfully') ? 'success' : 'error'}`}>
            {emailStatus}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div>
            <p>&copy; 2024 DEAL HARVEST. ALL RIGHTS RESERVED. | <a href="/terms.html" style={{color: '#a593c2', textDecoration: 'underline'}}>Terms & Conditions</a></p>
          </div>
          <div>
            <p><strong>Disclosure:</strong> As an Amazon Associate and participant in other affiliate programs, 
I may earn a commission from qualifying purchases. This does not affect the price you pay.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}