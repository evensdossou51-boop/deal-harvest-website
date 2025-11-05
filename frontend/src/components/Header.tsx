import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💎</span>
          <div>
            <div>Deal Harvest</div>
            <span className={styles.tagline}>Premium Deals, Curated for You</span>
          </div>
        </div>
        <nav className={styles.nav}>
          <a href="#deals" className={styles.navLink}>All Deals</a>
          <a href="#featured" className={styles.navLink}>Featured</a>
          <a href="#categories" className={styles.navLink}>Categories</a>
        </nav>
      </div>
    </header>
  );
}
