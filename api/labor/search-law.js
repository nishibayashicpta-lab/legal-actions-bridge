import { sendJson, requireQuery, getQuery } from '../../lib/common.js';
import { searchLaborLaws } from '../../lib/labor-egov.js';

export default async function handler(req, res) {
  try {
    const keyword = requireQuery(req, 'keyword');
    const law_type = getQuery(req, 'law_type');
    const limit = getQuery(req, 'limit', '10');
    const results = await searchLaborLaws({ keyword, lawType: law_type, limit: Number(limit) });
    sendJson(res, 200, { keyword, law_type: law_type || null, limit: Number(limit), results });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
