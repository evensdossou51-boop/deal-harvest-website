import type { SearchParams } from '../types';
import { DealCategory } from '../types';
import styles from './Filters.module.css';

interface FiltersProps {
  filters: SearchParams;
  onFilterChange: (filters: SearchParams) => void;
}

export default function Filters({ filters, onFilterChange }: FiltersProps) {
  const categories = Object.values(DealCategory);

  const handleCategoryClick = (category: DealCategory) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category
    });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filtersHeader}>
        <h2 className={styles.filtersTitle}>
          🔍 Smart Filters
        </h2>
        <button 
          className={styles.clearButton}
          onClick={handleClearFilters}
        >
          Clear All
        </button>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Search Deals</label>
        <input
          type="text"
          placeholder="Search by title, description, or tags..."
          className={styles.searchInput}
          value={filters.query || ''}
          onChange={(e) => onFilterChange({ ...filters, query: e.target.value })}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Categories</label>
        <div className={styles.categoriesGrid}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryButton} ${
                filters.category === category ? styles.active : ''
              }`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Price & Discount</label>
        <div className={styles.numberInputs}>
          <div className={styles.inputWrapper}>
            <label>Min Discount %</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              className={styles.numberInput}
              value={filters.minDiscount || ''}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                minDiscount: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
          </div>
          <div className={styles.inputWrapper}>
            <label>Max Price $</label>
            <input
              type="number"
              placeholder="Any"
              min="0"
              className={styles.numberInput}
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                maxPrice: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
