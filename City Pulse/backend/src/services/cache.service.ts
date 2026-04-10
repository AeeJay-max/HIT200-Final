import Redis from "ioredis";

class CacheService {
    private redisClient: Redis | null = null;
    private memoryCache = new Map<string, { value: string; expiry: number }>();
    private useRedis = false;

    constructor() {
        try {
            if (process.env.REDIS_URL) {
                this.redisClient = new Redis(process.env.REDIS_URL, {
                    lazyConnect: true,
                    showFriendlyErrorStack: true,
                    maxRetriesPerRequest: 1
                });

                this.redisClient.on("error", (err) => {
                    console.warn("Redis connection failed, falling back to memory cache.");
                    this.useRedis = false;
                });

                this.redisClient.on("connect", () => {
                    console.log("Redis connected successfully.");
                    this.useRedis = true;
                });

                // Attempt connection
                this.redisClient.connect().catch(() => {
                    this.useRedis = false;
                });
            }
        } catch (error) {
            console.warn("Failed to initialize Redis, using memory cache fallback.");
            this.useRedis = false;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        const stringValue = JSON.stringify(value);

        if (this.useRedis && this.redisClient) {
            try {
                await this.redisClient.setex(key, ttlSeconds, stringValue);
                return;
            } catch (err) {
                this.useRedis = false; // fallback if fails mid-flight
            }
        }

        // Memory fallback
        this.memoryCache.set(key, {
            value: stringValue,
            expiry: Date.now() + ttlSeconds * 1000,
        });
    }

    async get<T>(key: string): Promise<T | null> {
        if (this.useRedis && this.redisClient) {
            try {
                const data = await this.redisClient.get(key);
                return data ? JSON.parse(data) : null;
            } catch (err) {
                this.useRedis = false;
            }
        }

        // Memory fallback
        const cached = this.memoryCache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiry) {
            this.memoryCache.delete(key);
            return null;
        }

        return JSON.parse(cached.value);
    }

    async del(key: string): Promise<void> {
        if (this.useRedis && this.redisClient) {
            try {
                await this.redisClient.del(key);
                return;
            } catch (err) { }
        }
        this.memoryCache.delete(key);
    }
}

export const cacheService = new CacheService();
