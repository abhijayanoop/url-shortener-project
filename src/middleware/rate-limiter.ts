import type { Request, Response, NextFunction } from "express";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  keyExtractor: (req: Request) => string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const store = new Map<string, number[]>();

  const CLEANUP_INTERVAL_MS = 60000;
  const clearInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const active = timestamps.filter((t) => t > now - options.windowMs);
      if (active.length === 0) {
        store.delete(key);
      } else {
        store.set(key, active);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  clearInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyExtractor(req);

    const now = Date.now();
    const timestamps = store.get(key) ?? [];

    const windowStart = now - options.windowMs;
    const activeTimestamps = timestamps.filter((t) => t > windowStart);

    const currentCount = activeTimestamps.length;
    const remaining = Math.max(0, options.max - currentCount);

    const resetTime = Math.ceil((now + options.windowMs) / 1000);
    res.setHeader("X-RateLimit-Limit", options.max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetTime);

    if (currentCount >= options.max) {
      const oldestTimestamp = activeTimestamps[0];
      const retryAfterMs = oldestTimestamp
        ? oldestTimestamp + options.windowMs - now
        : options.windowMs;
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.setHeader("Retry-After", retryAfterSec);

      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
          retryAfter: retryAfterSec,
        },
      });
      return;
    }
    activeTimestamps.push(now);
    store.set(key, activeTimestamps);
    next();
  };
}
