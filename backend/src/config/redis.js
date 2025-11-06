const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => {
  console.log('✓ Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('✗ Redis error:', err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('✗ Redis connection error:', error);
  }
};

module.exports = { redisClient, connectRedis };
