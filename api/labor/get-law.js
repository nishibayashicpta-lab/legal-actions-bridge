import { sendJson, requireQuery, getQuery } from '../../lib/common.js';
import { getLaborLawArticle } from '../../lib/labor-egov.js';

export default async function handler(req, res) {
  try {
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
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
