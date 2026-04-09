import { sendJson, requireQuery, getQuery } from '../lib/common.js';
import { searchLaborLaws, getLaborLawArticle } from '../lib/labor-egov.js';
import { searchMhlwTsutatsu, getMhlwTsutatsu } from '../lib/labor-mhlw.js';
import { searchJaishTsutatsu, getJaishTsutatsu } from '../lib/labor-jaish.js';

export default async function handler(req, res) {
  try {
    const action = requireQuery(req, 'action');

    if (action === 'search_law') {
      const keyword = requireQuery(req, 'keyword');
      const law_type = getQuery(req, 'law_type');
      const limit = Number(getQuery(req, 'limit', '10'));
      const results = await searchLaborLaws({ keyword, lawType: law_type, limit });
      return sendJson(res, 200, { action, keyword, law_type: law_type || null, limit, results });
    }

    if (action === 'get_law') {
      const law_name = requireQuery(req, 'law_name');
      const article = getQuery(req, 'article');
      const paragraph = getQuery(req, 'paragraph');
      const item = getQuery(req, 'item');
      const format = getQuery(req, 'format', 'markdown');
      const result = await getLaborLawArticle({
        lawName: law_name,
        article,
        paragraph,
        item,
        format
      });
      return sendJson(res, 200, { action, ...result });
    }

    if (action === 'search_mhlw_tsutatsu') {
      const keyword = requireQuery(req, 'keyword');
      const page = Number(getQuery(req, 'page', '0'));
      const result = await searchMhlwTsutatsu({ keyword, page });
      return sendJson(res, 200, { action, ...result });
    }

    if (action === 'get_mhlw_tsutatsu') {
      const data_id = requireQuery(req, 'data_id');
      const page_no = Number(getQuery(req, 'page_no', '1'));
      const result = await getMhlwTsutatsu({ dataId: data_id, pageNo: page_no });
      return sendJson(res, 200, { action, ...result });
    }

    if (action === 'search_jaish_tsutatsu') {
      const keyword = requireQuery(req, 'keyword');
      const limit = Number(getQuery(req, 'limit', '20'));
      const result = await searchJaishTsutatsu({ keyword, limit });
      return sendJson(res, 200, { action, ...result });
    }

    if (action === 'get_jaish_tsutatsu') {
      const path = requireQuery(req, 'path');
      const result = await getJaishTsutatsu({ path });
      return sendJson(res, 200, { action, ...result });
    }

    return sendJson(res, 400, {
      error: `Unsupported action: ${action}`,
      supported_actions: [
        'search_law',
        'get_law',
        'search_mhlw_tsutatsu',
        'get_mhlw_tsutatsu',
        'search_jaish_tsutatsu',
        'get_jaish_tsutatsu'
      ]
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
