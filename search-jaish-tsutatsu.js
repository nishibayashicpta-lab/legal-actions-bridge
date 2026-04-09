import { sendJson, requireQuery, getQuery } from '../../lib/common.js';
import { searchJaishTsutatsu } from '../../lib/labor-jaish.js';

export default async function handler(req, res) {
  try {
    const keyword = requireQuery(req, 'keyword');
    const limit = getQuery(req, 'limit', '20');
    const result = await searchJaishTsutatsu({ keyword, limit: Number(limit) });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
