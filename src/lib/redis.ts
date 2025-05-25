// lib/redis.ts
import Redis from 'ioredis';

class RedisClient {
    private static instance: Redis | null = null;
    private static isInitializing = false;

    private constructor() { }

    public static getInstance(): Redis {
        if (!RedisClient.instance && !RedisClient.isInitializing) {
            RedisClient.isInitializing = true;

            const redisConfig = {
                host: 'localhost',
                port: 6379,
                db: '0',
                retryDelayOnFailover: 100,
                enableReadyCheck: false,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                // Connection pool settings
                family: 4,
                keepAlive: true,
                // Reconnection settings
                connectTimeout: 10000,
                commandTimeout: 5000,
            };

            RedisClient.instance = new Redis();

            // Event handlers
            RedisClient.instance.on('connect', () => {
                console.log('Redis connected successfully');
            });

            RedisClient.instance.on('ready', () => {
                console.log('Redis ready to receive commands');
            });

            RedisClient.instance.on('error', (error) => {
                console.error('Redis connection error:', error);
            });

            RedisClient.instance.on('close', () => {
                console.log('Redis connection closed');
            });

            RedisClient.instance.on('reconnecting', () => {
                console.log('Redis reconnecting...');
            });

            RedisClient.isInitializing = false;
        }

        return RedisClient.instance!;
    }

    public static async disconnect(): Promise<void> {
        if (RedisClient.instance) {
            await RedisClient.instance.quit();
            RedisClient.instance = null;
        }
    }

    // Helper methods for common operations
    public static async setRoomCount(conversationId: string, count: number): Promise<void> {
        const client = RedisClient.getInstance();
        await client.setex(`room:${conversationId}:count`, 3600, count.toString());
    }

    public static async incrementRoomCount(conversationId: string): Promise<number> {
        const client = RedisClient.getInstance();
        const count = await client.incr(`room:${conversationId}:count`);
        await client.expire(`room:${conversationId}:count`, 3600);
        return count;
    }

    public static async decrementRoomCount(conversationId: string): Promise<number> {
        const client = RedisClient.getInstance();
        const count = await client.decr(`room:${conversationId}:count`);

        if (count <= 0) {
            await client.del(`room:${conversationId}:count`);
            return 0;
        }

        return count;
    }

    public static async getRoomCount(conversationId: string): Promise<number> {
        const client = RedisClient.getInstance();
        const count = await client.get(`room:${conversationId}:count`);
        return parseInt(count || '0');
    }
}

// Export the singleton instance getter
export const redis = RedisClient.getInstance();

// Export helper methods
export const {
    setRoomCount,
    incrementRoomCount,
    decrementRoomCount,
    getRoomCount,
    disconnect: disconnectRedis
} = RedisClient;

// Default export for flexibility
export default RedisClient;