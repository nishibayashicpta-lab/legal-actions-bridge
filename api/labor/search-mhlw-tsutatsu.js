import { sendJson, requireQuery, getQuery } from '../../lib/common.js';
import { searchMhlwTsutatsu } from '../../lib/labor-mhlw.js';

export default async function handler(req, res) {
  try {
    const keyword = requireQuery(req, 'keyword');
    const page = getQuery(req, 'page', '0');
    const result = await searchMhlwTsutatsu({ keyword, page: Number(page) });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
