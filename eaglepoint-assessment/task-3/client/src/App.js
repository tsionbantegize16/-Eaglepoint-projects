import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [userId, setUserId] = useState('user-1');
  const [requests, setRequests] = useState([]);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState(null);
  const [error, setError] = useState(null);

  // Fetch rate limit status
  const fetchRateLimitStatus = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsRefreshing(true);
    }
    setError(null);
    
    try {
      const url = `${API_BASE_URL}/api/rate-limit-status?userId=${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-User-ID': userId
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setRateLimitStatus(data);
      
      if (data.resetInSeconds !== undefined && data.resetInSeconds > 0) {
        setTimeUntilReset(data.resetInSeconds);
      } else if (data.resetInSeconds === 0) {
        setTimeUntilReset(0);
      } else {
        // If resetInSeconds is negative or undefined, calculate it
        if (data.resetTime) {
          const resetTime = new Date(data.resetTime).getTime();
          const now = Date.now();
          const secondsUntilReset = Math.ceil((resetTime - now) / 1000);
          setTimeUntilReset(Math.max(0, secondsUntilReset));
        }
      }
    } catch (error) {
      console.error('Error fetching rate limit status:', error);
      setError(`Failed to fetch status: ${error.message}. Make sure the server is running on ${API_BASE_URL}`);
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  }, [userId]);

  // Update countdown timer
  useEffect(() => {
    if (timeUntilReset && timeUntilReset > 0) {
      const timer = setInterval(() => {
        setTimeUntilReset(prev => {
          if (prev <= 1) {
            fetchRateLimitStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeUntilReset, fetchRateLimitStatus]);

  // Fetch status on mount and when userId changes
  useEffect(() => {
    fetchRateLimitStatus();
  }, [fetchRateLimitStatus]);

  // Make a request to the protected endpoint
  const makeRequest = async (method = 'GET') => {
    setIsLoading(true);
    const timestamp = new Date().toISOString();
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        }
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ 
          userId,
          message: 'Test POST request',
          timestamp 
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/data`, options);
      const data = await response.json();
      
      const requestLog = {
        id: Date.now(),
        timestamp,
        method,
        success: response.ok,
        status: response.status,
        data: data,
        headers: {
          'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
          'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset')
        }
      };

      setRequests(prev => [requestLog, ...prev]);
      
      // Update rate limit status
      if (response.ok) {
        await fetchRateLimitStatus();
      }
    } catch (error) {
      const requestLog = {
        id: Date.now(),
        timestamp,
        method,
        success: false,
        status: 'Error',
        error: error.message
      };
      setRequests(prev => [requestLog, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset rate limit for current user
  const resetRateLimit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-rate-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      alert(data.message);
      await fetchRateLimitStatus();
      setRequests([]);
    } catch (error) {
      alert('Error resetting rate limit: ' + error.message);
    }
  };

  const getRemainingClass = (remaining) => {
    if (remaining === 0) return 'remaining-zero';
    if (remaining <= 2) return 'remaining-low';
    return 'remaining-ok';
  };

  return (
    <div className="app-container">
      <div className="container">
        <div className="card">
          <h1 className="title">Rate Limiter Demo</h1>
          <p className="subtitle">Limit: 5 requests per 60 seconds per user</p>

          {/* User ID Input */}
          <div className="form-group">
            <label className="label">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setRequests([]);
              }}
              className="input"
              placeholder="Enter user ID"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="warning-box" style={{ marginBottom: '1rem' }}>
              <p className="warning-text">⚠️ {error}</p>
            </div>
          )}

          {/* Rate Limit Status */}
          {rateLimitStatus && (
            <div className="status-card">
              <h2 className="status-title">Rate Limit Status</h2>
              <div className="status-grid">
                <div className="status-item">
                  <p className="status-label">Limit</p>
                  <p className="status-value">{rateLimitStatus.limit}</p>
                </div>
                <div className="status-item">
                  <p className="status-label">Remaining</p>
                  <p className={`status-value ${getRemainingClass(rateLimitStatus.remaining)}`}>
                    {rateLimitStatus.remaining}
                  </p>
                </div>
                <div className="status-item">
                  <p className="status-label">Window</p>
                  <p className="status-value">{rateLimitStatus.windowMs / 1000}s</p>
                </div>
                <div className="status-item">
                  <p className="status-label">Reset In</p>
                  <p className="status-value reset">
                    {timeUntilReset !== null ? `${timeUntilReset}s` : 'N/A'}
                  </p>
                </div>
              </div>
              {rateLimitStatus.remaining === 0 && (
                <div className="warning-box">
                  <p className="warning-text">
                    ⚠️ Rate limit exceeded! Please wait {timeUntilReset}s before making more requests.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="button-group">
            <button
              onClick={() => makeRequest('GET')}
              disabled={isLoading || (rateLimitStatus?.remaining === 0)}
              className="button button-primary"
            >
              {isLoading ? 'Loading...' : 'Make GET Request'}
            </button>
            <button
              onClick={() => makeRequest('POST')}
              disabled={isLoading || (rateLimitStatus?.remaining === 0)}
              className="button button-success"
            >
              {isLoading ? 'Loading...' : 'Make POST Request'}
            </button>
            <button
              onClick={() => fetchRateLimitStatus(true)}
              disabled={isRefreshing}
              className="button button-info"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <button
              onClick={resetRateLimit}
              className="button button-danger"
            >
              Reset Limit
            </button>
          </div>
        </div>

        {/* Request History */}
        <div className="card">
          <h2 className="history-title">Request History</h2>
          {requests.length === 0 ? (
            <p className="history-empty">
              No requests made yet. Click the buttons above to make requests.
            </p>
          ) : (
            <div className="history-list">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`history-item ${request.success ? 'success' : 'error'}`}
                >
                  <div className="history-header">
                    <div className="badge-group">
                      <span className={`badge badge-method-${request.method.toLowerCase()}`}>
                        {request.method}
                      </span>
                      <span className={`badge badge-status-${request.success ? 'success' : 'error'}`}>
                        {request.status}
                      </span>
                    </div>
                    <span className="timestamp">
                      {new Date(request.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {request.success ? (
                    <div>
                      <p className="history-content">
                        {request.data?.message || 'Success'}
                      </p>
                      {request.headers['X-RateLimit-Remaining'] !== null && (
                        <p className="history-details">
                          Remaining: {request.headers['X-RateLimit-Remaining']} | 
                          Reset: {request.headers['X-RateLimit-Reset'] ? 
                            new Date(request.headers['X-RateLimit-Reset']).toLocaleTimeString() : 
                            'N/A'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="error-message">
                        {request.data?.error || request.error || 'Request failed'}
                      </p>
                      {request.data?.message && (
                        <p className="history-details">
                          {request.data.message}
                        </p>
                      )}
                      {request.data?.retryAfter && (
                        <p className="error-details">
                          Retry after: {request.data.retryAfter} seconds
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
