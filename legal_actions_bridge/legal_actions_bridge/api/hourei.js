import { sendJson, requireQuery, getQuery, fetchText } from '../lib/common.js';

export default async function handler(req, res) {
  try {
    const action = requireQuery(req, 'action');
    if (action === 'search_law') {
      const keyword = requireQuery(req, 'keyword');
      const category = getQuery(req, 'category');
      const params = new URLSearchParams({ keyword });
      if (category) params.set('category', category);
      const xml = await fetchText(`https://laws.e-gov.go.jp/api/1/lawlists/1?${params.toString()}`);
      return sendJson(res, 200, {
        action,
        keyword,
        category: category || null,
        raw_xml: xml,
        source_api: 'e-Gov API v1 /lawlists/1'
      });
    }

    if (action === 'get_law_data') {
      const lawNum = requireQuery(req, 'lawNum');
      const xml = await fetchText(`https://laws.e-gov.go.jp/api/1/lawdata/${encodeURIComponent(lawNum)}`);
      return sendJson(res, 200, {
        action,
        lawNum,
        raw_xml: xml,
        source_api: 'e-Gov API v1 /lawdata/{lawNum}'
      });
    }

    if (action === 'get_law_revision') {
      const lawNum = requireQuery(req, 'lawNum');
      const xml = await fetchText(`https://laws.e-gov.go.jp/api/1/lawrevisions/${encodeURIComponent(lawNum)}`);
      return sendJson(res, 200, {
        action,
        lawNum,
        raw_xml: xml,
        source_api: 'e-Gov API v1 /lawrevisions/{lawNum}'
      });
    }

    return sendJson(res, 400, {
      error: `Unsupported action: ${action}`,
      supported_actions: ['search_law', 'get_law_data', 'get_law_revision']
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
