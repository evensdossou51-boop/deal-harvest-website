import type { Deal } from '../types';
import styles from './DealCard.module.css';

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const savings = deal.originalPrice - deal.discountedPrice;

  return (
    <div className={styles.dealCard}>
      <div className={styles.imageContainer}>
        <img 
          src={deal.image} 
          alt={deal.title}
          className={styles.dealImage}
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x200/7c3aed/ffffff?text=Deal';
          }}
        />
        {deal.featured && (
          <div className={styles.featuredBadge}>
            ⭐ Featured
          </div>
        )}
        <div className={styles.discountBadge}>
          -{deal.discountPercentage}%
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.category}>{deal.category}</div>
        <h3 className={styles.title}>{deal.title}</h3>
        <p className={styles.description}>{deal.description}</p>

        <div className={styles.priceSection}>
          <div className={styles.prices}>
            <span className={styles.currentPrice}>${deal.discountedPrice.toFixed(2)}</span>
            <span className={styles.originalPrice}>${deal.originalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.savings}>
            Save ${savings.toFixed(2)}
          </div>
        </div>

        <div className={styles.tags}>
          {deal.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.footer}>
          <span className={styles.store}>🏪 {deal.store}</span>
          <button className={styles.viewDeal}>
            View Deal →
          </button>
        </div>
      </div>
    </div>
  );
}
