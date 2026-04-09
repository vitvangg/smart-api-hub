import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitInfo>();
const LIMIT = 100;
const WINDOW_MS = 60000;

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const key = String(ip);
    if (!store.has(key)) {
        store.set(key, { count: 1, resetTime: now + WINDOW_MS });
        res.setHeader('X-RateLimit-Limit', LIMIT);
        res.setHeader('X-RateLimit-Remaining', LIMIT - 1);
        return next();
    }

    const record = store.get(ip as string)!;

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + WINDOW_MS;
        res.setHeader('X-RateLimit-Limit', LIMIT);
        res.setHeader('X-RateLimit-Remaining', LIMIT - 1);
        return next();
    }

    record.count += 1;

    if (record.count > LIMIT) {
        res.setHeader('X-RateLimit-Limit', LIMIT);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
        return res.status(429).json({ error: 'Too Many Requests' });
    }

    res.setHeader('X-RateLimit-Limit', LIMIT);
    res.setHeader('X-RateLimit-Remaining', LIMIT - record.count);
    next();
};

setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of store.entries()) {
        if (now > record.resetTime) {
            store.delete(ip);
        }
    }
}, WINDOW_MS);