/**
 * Rate Limiter Implementation
 * Limits: 5 requests per 60 seconds per user
 * Tracks by user ID
 * Auto-resets after time window
 */

class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests; // 5 requests
    this.windowMs = windowMs; // 60 seconds (60000 ms)
    this.userRequests = new Map(); // Map<userId, {count: number, resetTime: number}>
  }

  /**
   * Check if a request should be allowed for a given user
   * @param {string} userId - The user ID to check
   * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
   */
  checkLimit(userId) {
    const now = Date.now();
    const userData = this.userRequests.get(userId);

    // If no record exists or window has expired, create/reset
    if (!userData || now >= userData.resetTime) {
      const resetTime = now + this.windowMs;
      this.userRequests.set(userId, {
        count: 1,
        resetTime: resetTime
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: resetTime
      };
    }

    // Window is still active
    if (userData.count < this.maxRequests) {
      userData.count++;
      this.userRequests.set(userId, userData);
      return {
        allowed: true,
        remaining: this.maxRequests - userData.count,
        resetTime: userData.resetTime
      };
    }

    // Limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: userData.resetTime
    };
  }

  /**
   * Get current status for a user without incrementing count
   * @param {string} userId - The user ID to check
   * @returns {Object} - { remaining: number, resetTime: number }
   */
  getStatus(userId) {
    const now = Date.now();
    const userData = this.userRequests.get(userId);

    if (!userData || now >= userData.resetTime) {
      return {
        remaining: this.maxRequests,
        resetTime: now + this.windowMs
      };
    }

    return {
      remaining: this.maxRequests - userData.count,
      resetTime: userData.resetTime
    };
  }

  /**
   * Reset the rate limit for a specific user
   * @param {string} userId - The user ID to reset
   */
  reset(userId) {
    this.userRequests.delete(userId);
  }

  /**
   * Clean up expired entries (optional cleanup method)
   */
  cleanup() {
    const now = Date.now();
    for (const [userId, data] of this.userRequests.entries()) {
      if (now >= data.resetTime) {
        this.userRequests.delete(userId);
      }
    }
  }
}

// Express middleware factory
function createRateLimiterMiddleware(rateLimiter) {
  return (req, res, next) => {
    // Extract user ID from header, query, or body
    // Priority: header > query > body
    const userId = req.headers['x-user-id'] || 
                   req.query.userId || 
                   req.body?.userId || 
                   'anonymous';

    const result = rateLimiter.checkLimit(userId);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${rateLimiter.maxRequests} requests per ${rateLimiter.windowMs / 1000} seconds.`,
        resetTime: new Date(result.resetTime).toISOString(),
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }

    next();
  };
}

module.exports = { RateLimiter, createRateLimiterMiddleware };

