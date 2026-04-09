import { sendJson } from '../../lib/common.js';
import { proxyTax } from '../../lib/tax-proxy.js';

export default async function handler(req, res) {
  try {
    const result = await proxyTax('/api/search-saiketsu', req.query || {});
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
