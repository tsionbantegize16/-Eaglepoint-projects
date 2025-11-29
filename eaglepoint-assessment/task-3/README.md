# Task 3: Rate Limiter Implementation

A rate limiter implementation that limits **5 requests per 60 seconds per user**, with automatic reset after the time window.

## Features

✅ **Limit**: 5 requests per 60 seconds per user  
✅ **Tracking**: By user ID (header, query param, or body)  
✅ **Blocking**: Returns 429 status when limit exceeded  
✅ **Auto-reset**: Automatically resets after 60-second window  
✅ **Working Examples**: React client demo and API examples  

## Architecture

- **Server**: Node.js/Express with custom rate limiter middleware
- **Client**: React application to test the rate limiter
- **Rate Limiter**: In-memory implementation with automatic cleanup

## Quick Start

### 1. Install Dependencies

```bash
# Server
cd server
npm install

# Client (in a new terminal)
cd client
npm install
```

### 2. Start the Server

```bash
cd server
node index.js
```

The server will start on `http://localhost:3001`

### 3. Start the Client

```bash
cd client
npm start
```

The client will start on `http://localhost:3000`

## API Endpoints

### Protected Endpoints (Rate Limited)

#### GET /api/data
Make a GET request to the protected endpoint.

**Headers:**
```
X-User-ID: user-1
```

**Response (Success - 200):**
```json
{
  "message": "Request successful!",
  "userId": "user-1",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "rateLimitInfo": {
    "remaining": 4,
    "resetTime": "2024-01-15T10:31:00.000Z"
  }
}
```

**Response (Rate Limit Exceeded - 429):**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 5 requests per 60 seconds.",
  "resetTime": "2024-01-15T10:31:00.000Z",
  "retryAfter": 45
}
```

#### POST /api/data
Make a POST request to the protected endpoint.

**Headers:**
```
Content-Type: application/json
X-User-ID: user-1
```

**Body:**
```json
{
  "userId": "user-1",
  "message": "Test data"
}
```

### Utility Endpoints

#### GET /api/rate-limit-status
Check current rate limit status (doesn't count against limit).

**Query Parameters:**
- `userId` (optional): User ID to check

**Headers:**
```
X-User-ID: user-1
```

**Response:**
```json
{
  "userId": "user-1",
  "limit": 5,
  "windowMs": 60000,
  "remaining": 3,
  "resetTime": "2024-01-15T10:31:00.000Z",
  "resetInSeconds": 30
}
```

#### POST /api/reset-rate-limit
Reset rate limit for a specific user (admin function).

**Headers:**
```
X-User-ID: user-1
```

**Body:**
```json
{
  "userId": "user-1"
}
```

#### GET /health
Health check endpoint (no rate limiting).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### Example 1: Using cURL

```bash
# Make 5 requests (all should succeed)
for i in {1..5}; do
  curl -H "X-User-ID: user-1" http://localhost:3001/api/data
  echo ""
done

# 6th request should fail with 429
curl -H "X-User-ID: user-1" http://localhost:3001/api/data
```

### Example 2: Using JavaScript/Fetch

```javascript
async function testRateLimiter() {
  const userId = 'user-1';
  const baseUrl = 'http://localhost:3001';
  
  // Make 5 requests
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/data`, {
        headers: {
          'X-User-ID': userId
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`Request ${i}: Success - ${data.rateLimitInfo.remaining} remaining`);
      } else {
        console.log(`Request ${i}: Rate limited - ${data.message}`);
        console.log(`Retry after: ${data.retryAfter} seconds`);
      }
    } catch (error) {
      console.error(`Request ${i}: Error -`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

testRateLimiter();
```

### Example 3: Using Python

```python
import requests
import time

base_url = "http://localhost:3001"
user_id = "user-1"

headers = {"X-User-ID": user_id}

# Make 5 requests
for i in range(1, 7):
    response = requests.get(f"{base_url}/api/data", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        remaining = data["rateLimitInfo"]["remaining"]
        print(f"Request {i}: Success - {remaining} remaining")
    elif response.status_code == 429:
        data = response.json()
        print(f"Request {i}: Rate limited - {data['message']}")
        print(f"Retry after: {data['retryAfter']} seconds")
    else:
        print(f"Request {i}: Error - Status {response.status_code}")
    
    time.sleep(0.1)  # Small delay between requests
```

### Example 4: Multiple Users

```javascript
// Different users have separate rate limits
const users = ['user-1', 'user-2', 'user-3'];

users.forEach(async (userId) => {
  for (let i = 1; i <= 6; i++) {
    const response = await fetch('http://localhost:3001/api/data', {
      headers: { 'X-User-ID': userId }
    });
    
    const data = await response.json();
    console.log(`${userId} - Request ${i}:`, 
      response.ok ? `Success (${data.rateLimitInfo.remaining} remaining)` : 'Rate limited'
    );
  }
});
```

## Rate Limiter Implementation Details

### How It Works

1. **Tracking**: Each user ID is tracked separately in a Map
2. **Window**: 60-second sliding window per user
3. **Counting**: Each request increments the counter for that user
4. **Blocking**: When count reaches 5, subsequent requests return 429
5. **Auto-reset**: After 60 seconds, the window resets automatically
6. **Cleanup**: Expired entries are cleaned up periodically

### Rate Limiter Class

The `RateLimiter` class in `server/rateLimiter.js` provides:

- `checkLimit(userId)`: Check and increment request count
- `getStatus(userId)`: Get current status without incrementing
- `reset(userId)`: Manually reset a user's limit
- `cleanup()`: Remove expired entries

### Express Middleware

The `createRateLimiterMiddleware` function creates Express middleware that:

- Extracts user ID from headers, query params, or body
- Checks rate limit before processing request
- Sets rate limit headers in response
- Returns 429 with details when limit exceeded

## Response Headers

All protected endpoints include these headers:

- `X-RateLimit-Limit`: Maximum requests allowed (5)
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when the window resets

## Testing

### Manual Testing

1. Start the server: `cd server && node index.js`
2. Start the client: `cd client && npm start`
3. Use the React UI to make requests and see rate limiting in action
4. Try different user IDs to see separate rate limits

### Automated Testing

You can use the examples above or create your own test scripts. The rate limiter:
- Tracks each user independently
- Resets automatically after 60 seconds
- Returns proper HTTP status codes
- Includes helpful error messages

## Notes

- Rate limiter uses in-memory storage (resets on server restart)
- For production, consider using Redis or a database for distributed systems
- User ID can be provided via:
  - Header: `X-User-ID`
  - Query parameter: `?userId=user-1`
  - POST body: `{ "userId": "user-1" }`
- Default user ID is `"anonymous"` if none provided

## Future Enhancements

- Redis-backed rate limiter for distributed systems
- Different rate limits per endpoint
- Rate limit based on IP address
- Burst allowance (e.g., 5 requests per 60s, but allow 10 in first 10s)
- Rate limit analytics and monitoring

