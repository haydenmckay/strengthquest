interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < windowStart) {
      delete store[key];
    }
  });

  // Initialize or get existing entry
  if (!store[ip]) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Reset if window has passed
  if (store[ip].resetTime < now) {
    store[ip] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  store[ip].count++;

  // Check if over limit
  const isRateLimited = store[ip].count > limit;

  return {
    isRateLimited,
    limit,
    remaining: Math.max(0, limit - store[ip].count),
    resetTime: store[ip].resetTime,
  };
} 