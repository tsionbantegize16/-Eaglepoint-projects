const express = require('express');
const cors = require('cors');
const { RateLimiter, createRateLimiterMiddleware } = require('./rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create rate limiter instance: 5 requests per 60 seconds
const rateLimiter = new RateLimiter(5, 60000);
const rateLimiterMiddleware = createRateLimiterMiddleware(rateLimiter);

// Cleanup expired entries every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected endpoint with rate limiting
app.get('/api/data', rateLimiterMiddleware, (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId || 'anonymous';
  const status = rateLimiter.getStatus(userId);
  
  res.json({
    message: 'Request successful!',
    userId: userId,
    timestamp: new Date().toISOString(),
    rateLimitInfo: {
      remaining: status.remaining,
      resetTime: new Date(status.resetTime).toISOString()
    }
  });
});

// POST endpoint with rate limiting
app.post('/api/data', rateLimiterMiddleware, (req, res) => {
  const userId = req.headers['x-user-id'] || req.body?.userId || 'anonymous';
  const status = rateLimiter.getStatus(userId);
  
  res.json({
    message: 'POST request successful!',
    userId: userId,
    data: req.body,
    timestamp: new Date().toISOString(),
    rateLimitInfo: {
      remaining: status.remaining,
      resetTime: new Date(status.resetTime).toISOString()
    }
  });
});

// Get rate limit status (doesn't count against limit)
app.get('/api/rate-limit-status', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId || 'anonymous';
  const status = rateLimiter.getStatus(userId);
  
  res.json({
    userId: userId,
    limit: rateLimiter.maxRequests,
    windowMs: rateLimiter.windowMs,
    remaining: status.remaining,
    resetTime: new Date(status.resetTime).toISOString(),
    resetInSeconds: Math.ceil((status.resetTime - Date.now()) / 1000)
  });
});

// Reset rate limit for a user (admin endpoint)
app.post('/api/reset-rate-limit', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body?.userId || req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  rateLimiter.reset(userId);
  res.json({
    message: `Rate limit reset for user: ${userId}`,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Rate Limiter Server running on http://localhost:${PORT}`);
  console.log(`📊 Rate Limit: 5 requests per 60 seconds per user`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health - Health check (no rate limit)`);
  console.log(`  GET  /api/data - Protected endpoint`);
  console.log(`  POST /api/data - Protected endpoint`);
  console.log(`  GET  /api/rate-limit-status - Check status (doesn't count)`);
  console.log(`  POST /api/reset-rate-limit - Reset limit for user`);
});

