import express, { Request, Response } from 'express';
import cors from 'cors';
import { DealService } from './dealService';
import { DealCategory } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize service
const dealService = new DealService();

// Routes
app.get('/api/deals', (req: Request, res: Response) => {
  try {
    const deals = dealService.searchDeals(req.query);
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

app.get('/api/deals/featured', (req: Request, res: Response) => {
  try {
    const deals = dealService.getFeaturedDeals();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured deals' });
  }
});

app.get('/api/deals/:id', (req: Request, res: Response) => {
  try {
    const deal = dealService.getDealById(req.params.id);
    if (deal) {
      res.json(deal);
    } else {
      res.status(404).json({ error: 'Deal not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

app.get('/api/categories', (req: Request, res: Response) => {
  try {
    const categories = Object.values(DealCategory);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Deal Harvest API server running on http://localhost:${PORT}`);
});
