import { sendJson, requireQuery, getQuery } from '../../lib/common.js';
import { getMhlwTsutatsu } from '../../lib/labor-mhlw.js';

export default async function handler(req, res) {
  try {
    const data_id = requireQuery(req, 'data_id');
    const page_no = getQuery(req, 'page_no', '1');
    const result = await getMhlwTsutatsu({ dataId: data_id, pageNo: Number(page_no) });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
