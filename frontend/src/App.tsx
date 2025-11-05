import { useState, useEffect } from 'react';
import Header from './components/Header';
import DealCard from './components/DealCard';
import Filters from './components/Filters';
import type { Deal, SearchParams } from './types';
import { dealService } from './services/dealService';
import styles from './App.module.css';

function App() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchParams>({});

  useEffect(() => {
    loadDeals();
  }, [filters]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dealService.getAllDeals(filters);
      setDeals(data);
    } catch (err) {
      setError('Failed to load deals. Please try again later.');
      console.error('Error loading deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = deals.reduce(
    (sum, deal) => sum + (deal.originalPrice - deal.discountedPrice),
    0
  );

  const avgDiscount = deals.length > 0
    ? Math.round(deals.reduce((sum, deal) => sum + deal.discountPercentage, 0) / deals.length)
    : 0;

  return (
    <div className={styles.app}>
      <Header />

      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Discover Premium Deals</h1>
          <p className={styles.heroSubtitle}>
            Smart categorization. Unbeatable prices. Curated daily.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{deals.length}+</span>
              <span className={styles.statLabel}>Active Deals</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{avgDiscount}%</span>
              <span className={styles.statLabel}>Avg Discount</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>${totalSavings.toFixed(0)}+</span>
              <span className={styles.statLabel}>Total Savings</span>
            </div>
          </div>
        </div>
      </section>

      <main className={styles.mainContent}>
        <div className="container">
          <Filters filters={filters} onFilterChange={setFilters} />

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              🔥 All Deals
              <span className={styles.resultsCount}>
                ({deals.length} {deals.length === 1 ? 'deal' : 'deals'})
              </span>
            </h2>
          </div>

          {loading && (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading amazing deals...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && deals.length === 0 && (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <h3>No deals found</h3>
              <p>Try adjusting your filters to see more results</p>
            </div>
          )}

          {!loading && !error && deals.length > 0 && (
            <div className={styles.dealsGrid}>
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerLogo}>
              <span>💎</span>
              Deal Harvest
            </div>
            <div className={styles.footerLinks}>
              <a href="#" className={styles.footerLink}>About</a>
              <a href="#" className={styles.footerLink}>Contact</a>
              <a href="#" className={styles.footerLink}>Privacy</a>
              <a href="#" className={styles.footerLink}>Terms</a>
            </div>
            <p>&copy; 2025 Deal Harvest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
