import { sendJson, requireQuery, fetchText } from '../../lib/common.js';

export default async function handler(req, res) {
  try {
    const lawNum = requireQuery(req, 'lawNum');
    const xml = await fetchText(`https://laws.e-gov.go.jp/api/1/lawdata/${encodeURIComponent(lawNum)}`);
    sendJson(res, 200, { lawNum, raw_xml: xml, source_api: 'e-Gov API v1 /lawdata/{lawNum}' });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
}
