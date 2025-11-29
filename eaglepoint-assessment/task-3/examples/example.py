"""
Rate Limiter Example Script (Python)

This script demonstrates how to use the rate limiter API.
Run with: python examples/example.py

Requires: pip install requests
"""

import requests
import time

API_BASE_URL = "http://localhost:3001"


def make_request(user_id, request_number):
    """Make a request to the protected endpoint"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/data",
            headers={"X-User-ID": user_id}
        )
        
        if response.status_code == 200:
            data = response.json()
            remaining = data["rateLimitInfo"]["remaining"]
            print(f"✅ Request {request_number} ({user_id}): Success - {remaining} requests remaining")
            return True
        elif response.status_code == 429:
            data = response.json()
            print(f"❌ Request {request_number} ({user_id}): Rate Limited - {data['message']}")
            print(f"   Retry after: {data['retryAfter']} seconds")
            return False
        else:
            print(f"❌ Request {request_number} ({user_id}): Error - Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Request {request_number} ({user_id}): Error - {str(e)}")
        return False


def check_status(user_id):
    """Check rate limit status"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/rate-limit-status",
            params={"userId": user_id}
        )
        data = response.json()
        print(f"\n📊 Rate Limit Status for {user_id}:")
        print(f"   Remaining: {data['remaining']}/{data['limit']}")
        print(f"   Reset in: {data['resetInSeconds']} seconds")
        print(f"   Reset time: {data['resetTime']}\n")
    except Exception as e:
        print(f"Error checking status: {str(e)}")


def reset_limit(user_id):
    """Reset rate limit for a user"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/reset-rate-limit",
            headers={
                "Content-Type": "application/json",
                "X-User-ID": user_id
            },
            json={"userId": user_id}
        )
        data = response.json()
        print(f"🔄 {data['message']}\n")
    except Exception as e:
        print(f"Error resetting limit: {str(e)}")


def main():
    print("🚀 Rate Limiter Example\n")
    print("=" * 50)

    user_id = "example-user"

    # Example 1: Make 6 requests (5 should succeed, 1 should fail)
    print("\n📝 Example 1: Making 6 requests (limit is 5 per 60s)\n")
    
    for i in range(1, 7):
        make_request(user_id, i)
        time.sleep(0.2)  # Small delay between requests

    # Check status
    check_status(user_id)

    # Example 2: Reset and try again
    print("📝 Example 2: Resetting limit and making requests again\n")
    reset_limit(user_id)

    for i in range(1, 4):
        make_request(user_id, i)
        time.sleep(0.2)

    check_status(user_id)

    # Example 3: Multiple users (each has separate limit)
    print("📝 Example 3: Testing with multiple users (separate limits)\n")
    
    users = ["user-a", "user-b", "user-c"]
    
    for user in users:
        print(f"\nMaking requests as {user}:")
        for i in range(1, 4):
            make_request(user, i)
            time.sleep(0.1)

    print("\n" + "=" * 50)
    print("✨ Example completed!")


if __name__ == "__main__":
    main()

