import { sendJson, requireQuery, getQuery, fetchText } from '../../lib/common.js';

export default async function handler(req, res) {
  try {
    const keyword = requireQuery(req, 'keyword');
    const category = getQuery(req, 'category');
    const limit = getQuery(req, 'limit', '100');
    const params = new URLSearchParams({ keyword });
    if (category) params.set('category', category);
    const xml = await fetchText(`https://laws.e-gov.go.jp/api/1/lawlists/1?${params.toString()}`);
    sendJson(res, 200, { keyword, category: category || null, limit: Number(limit), raw_xml: xml, source_api: 'e-Gov API v1 /lawlists/1' });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
