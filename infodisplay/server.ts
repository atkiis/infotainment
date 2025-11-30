import express from "express";
import { scrapeLunchData } from "./services/lunchScraper";

const app = express();
const PORT = 3001;

// Basic CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lunch data endpoint with comprehensive error handling
app.get("/lunch", async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log(`[${new Date().toISOString()}] Lunch data requested`);
    
    const data = await scrapeLunchData();
    const duration = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] Lunch data served in ${duration}ms, ${data.length} restaurants`);
    
    res.json(data);
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Lunch data error after ${duration}ms:`, err);
    
    res.status(500).json({ 
      error: "Failed to load lunch data",
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Backend running at http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log(`  - GET http://localhost:${PORT}/lunch (lunch menus)`);
  console.log(`  - GET http://localhost:${PORT}/health (health check)`);
});
