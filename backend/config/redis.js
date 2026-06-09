/**
 * Redis Cache Service
 *
 * Provides a high-performance caching layer for frequently accessed data:
 *   - User profiles
 *   - Feed pages
 *   - Suggested users
 *   - User search results
 *
 * Falls back gracefully to no-caching if Redis is unavailable.
 *
 * Usage:
 *   const { cache } = require('../config/redis');
 *   const data = await cache.get('user:123');
 *   if (!data) {
 *     const fresh = await fetchFromDB();
 *     await cache.set('user:123', fresh, 300); // 5min TTL
 *   }
 */

const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

let client = null;
let isConnected = false;

if (REDIS_ENABLED) {
  client = redis.createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          return new Error('Redis reconnection failed');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on('error', (err) => {
    if (isConnected) {
      console.error('[Redis] Connection error:', err.message);
    }
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
    isConnected = true;
  });

  client.on('ready', () => {
    isConnected = true;
    console.log('[Redis] Ready');
  });

  client.on('end', () => {
    isConnected = false;
  });

  // Try to connect but don't block startup
  client.connect().catch((err) => {
    console.warn('[Redis] Could not connect on startup (running in non-cached mode):', err.message);
    isConnected = false;
  });
}

/**
 * Cache wrapper with graceful fallback
 */
const cache = {
  /**
   * Get a value from cache
   * @param {string} key
   * @returns {Promise<any|null>} Parsed JSON value or null
   */
  async get(key) {
    if (!client || !isConnected) return null;
    try {
      const value = await client.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (err) {
      console.error(`[Cache] Error getting ${key}:`, err.message);
      return null;
    }
  },

  /**
   * Set a value in cache with TTL (in seconds)
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds (default 5 minutes)
   */
  async set(key, value, ttl = 300) {
    if (!client || !isConnected) return false;
    try {
      await client.set(key, JSON.stringify(value), { EX: ttl });
      return true;
    } catch (err) {
      console.error(`[Cache] Error setting ${key}:`, err.message);
      return false;
    }
  },

  /**
   * Delete a key from cache
   * @param {string} key
   */
  async del(key) {
    if (!client || !isConnected) return false;
    try {
      await client.del(key);
      return true;
    } catch (err) {
      console.error(`[Cache] Error deleting ${key}:`, err.message);
      return false;
    }
  },

  /**
   * Delete all keys matching a pattern (e.g., 'user:*')
   * @param {string} pattern
   */
  async delByPattern(pattern) {
    if (!client || !isConnected) return 0;
    try {
      let deleted = 0;
      let cursor = 0;
      do {
        const reply = await client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = reply.cursor;
        if (reply.keys.length > 0) {
          await client.del(reply.keys);
          deleted += reply.keys.length;
        }
      } while (cursor !== 0);
      return deleted;
    } catch (err) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, err.message);
      return 0;
    }
  },

  /**
   * Cache-aside helper: returns cached value OR fetches fresh + caches it
   * @param {string} key
   * @param {Function} fetchFn - async function that returns the fresh data
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>}
   */
  async wrap(key, fetchFn, ttl = 300) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  },

  /**
   * Check if Redis is available
   */
  isReady() {
    return client !== null && isConnected;
  },

  /**
   * Get cache statistics
   */
  async stats() {
    return {
      enabled: REDIS_ENABLED,
      connected: isConnected,
      url: REDIS_URL.replace(/:[^:@]+@/, ':***@'),
    };
  },

  /**
   * Gracefully close the connection (called on shutdown)
   */
  async close() {
    if (client && isConnected) {
      try {
        await client.quit();
        console.log('[Redis] Connection closed');
      } catch (err) {
        console.error('[Redis] Error closing connection:', err.message);
      }
    }
  },
};

/**
 * Cache key helpers (consistent key naming)
 */
const cacheKeys = {
  user: (idOrUsername) => `user:${idOrUsername}`,
  userProfile: (username) => `user:profile:${username.toLowerCase()}`,
  userPosts: (userId) => `user:posts:${userId}`,
  userFollowers: (userId, page) => `user:${userId}:followers:${page}`,
  userFollowing: (userId, page) => `user:${userId}:following:${page}`,
  feed: (page, limit) => `feed:page:${page}:limit:${limit}`,
  explore: (page, limit) => `explore:page:${page}:limit:${limit}`,
  suggested: (userId) => `suggested:${userId}`,
  search: (query) => `search:${query.toLowerCase()}`,
  post: (postId) => `post:${postId}`,
};

module.exports = {
  cache,
  cacheKeys,
  client,
};