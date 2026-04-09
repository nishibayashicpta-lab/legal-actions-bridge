import { sendJson, requireQuery } from '../../lib/common.js';
import { getJaishTsutatsu } from '../../lib/labor-jaish.js';

export default async function handler(req, res) {
  try {
    const path = requireQuery(req, 'path');
    const result = await getJaishTsutatsu({ path });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
