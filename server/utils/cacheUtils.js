const { redisService } = require('../config/redis');

const cacheResult = async (key, data, ttl = 3600) => {
  if (redisService.getConnectionStatus()) {
    await redisService.set(key, JSON.stringify(data), ttl);
  }
};

const getCachedResult = async (key) => {
  if (redisService.getConnectionStatus()) {
    const cachedData = await redisService.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  }
  return null;
};

module.exports = {
  cacheResult,
  getCachedResult,
};

