function getClientIp(req) {
  try {
    const xff = req.headers['x-forwarded-for'];
    if (xff && typeof xff === 'string') {
      // x-forwarded-for may contain a list: client, proxy1, proxy2
      const parts = xff.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts[0];
    }
    // Fallbacks
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      '127.0.0.1'
    );
  } catch {
    return '127.0.0.1';
  }
}

function isPrivateIp(ip) {
  if (!ip) return true;
  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  // IPv6 localhost
  if (ip === '::1') return true;
  // IPv4 localhost
  if (ip === '127.0.0.1') return true;
  // Private ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  // 172.16.0.0 – 172.31.255.255
  const octets = ip.split('.').map(n => parseInt(n, 10));
  if (octets.length === 4 && octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  return false;
}

module.exports = { getClientIp, isPrivateIp };
