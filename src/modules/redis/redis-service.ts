import { connectRedis, redisClient } from './init';

class RedisService {
    /**
     * Ensure the Redis connection is established.
     */
    public async ensureConnected(): Promise<void> {
        if (!redisClient.isReady) {
            await connectRedis(); // Utilize your existing connect function
        }
    }

    /**
     * Set a value in Redis.
     * @param key - The key for the data.
     * @param value - The value to store (string or JSON object).
     * @param expiry - Expiry time in seconds (optional).
     */
    public async set(key: string, value: any, expiry?: number): Promise<void> {
        await this.ensureConnected();

        const valueToStore = JSON.stringify(value, function (_, value) {
            const seen = new WeakSet();
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return; // Omit circular reference
                seen.add(value);
            }
            return value;
        });
        if (expiry) {
            await redisClient.set(key, valueToStore, { EX: expiry });
        } else {
            await redisClient.set(key, valueToStore);
        }
    }

    /**
     * Get a value from Redis.
     * @param key - The key of the data to retrieve.
     * @returns A promise that resolves with the retrieved value or null if not found.
     */
    public async get<T>(key: string): Promise<T | null> {
        await this.ensureConnected();

        const data = await redisClient.get(key);

        try {
            return data ? (JSON.parse(data) as T) : null;
        } catch {
            return data as T;
        }
    }

    /**
     * Delete a key from Redis.
     * @param key - The key to delete.
     * @returns A promise that resolves with the number of keys that were removed.
     */
    public async delete(key: string): Promise<boolean> {
        await this.ensureConnected();

        const result = await redisClient.del(key);
        return result > 0;
    }

    /**
     * Check if a key exists in Redis.
     * @param key - The key to check.
     * @returns A promise that resolves to `true` if the key exists, `false` otherwise.
     */
    public async exists(key: string): Promise<boolean> {
        await this.ensureConnected();

        const result = await redisClient.exists(key);
        return result > 0;
    }
}

export const redisService = new RedisService();
