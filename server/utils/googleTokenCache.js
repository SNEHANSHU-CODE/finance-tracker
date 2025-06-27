const { redisService } = require('../config/redis');

const GOOGLE_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

const getGoogleTokens = async (userId) => {
  const key = `google_tokens:${userId}`;
  const tokenStr = await redisService.get(key);
  return tokenStr ? JSON.parse(tokenStr) : null;
};

const saveGoogleTokens = async (userId, tokens) => {
  const key = `google_tokens:${userId}`;
  await redisService.set(key, JSON.stringify(tokens), GOOGLE_TOKEN_TTL);
};

const deleteGoogleTokens = async (userId) => {
  const key = `google_tokens:${userId}`;
  await redisService.del(key);
};

module.exports = {
  getGoogleTokens,
  saveGoogleTokens,
  deleteGoogleTokens
};
