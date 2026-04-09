import { fetchText, stripTags } from './common.js';

const BASE_URL = 'https://www.mhlw.go.jp/web';

export async function searchMhlwTsutatsu({ keyword, page = 0 }) {
  const params = new URLSearchParams({
    keyword,
    type: '1',
    mode: '0',
    page: String(page)
  });
  const html = await fetchText(`${BASE_URL}/t_docsrch_keyword?${params.toString()}`, {
    'User-Agent': 'legal-actions-bridge/1.0'
  });

  const results = [];
  const rowRegex = /<tr>\s*<td\s+CLASS="kenmei_td"[^>]*>([\s\S]*?)<\/td>\s*<td\s+CLASS="date_td"[^>]*>([\s\S]*?)<\/td>\s*<td\s+CLASS="shubetsu_td"[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const [, kenmeiHtml, dateHtml, shubetsuHtml] = match;
    const dataIdMatch = kenmeiHtml.match(/dataId=([^&"]+)/);
    if (!dataIdMatch) continue;
    const titleMatch = kenmeiHtml.match(/<span[^>]*>([\s\S]*?)<\/span>/i) || kenmeiHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    const title = stripTags(titleMatch ? titleMatch[1] : kenmeiHtml).replace(/^・/, '').trim();
    const date = stripTags(dateHtml).replace(/^◆/, '').trim();
    const shubetsu = stripTags(shubetsuHtml).trim().replace(/\s+/g, ' ');
    results.push({ title, data_id: dataIdMatch[1], date, shubetsu });
  }
  const countMatch = html.match(/該当件数:\s*<span>(\d+)<\/span>/i);
  return {
    keyword,
    page: Number(page),
    total_count: countMatch ? Number(countMatch[1]) : results.length,
    results,
    source_url: `${BASE_URL}/t_docsrch_keyword?${params.toString()}`
  };
}

export async function getMhlwTsutatsu({ dataId, pageNo = 1 }) {
  const params = new URLSearchParams({
    dataId,
    dataType: '1',
    pageNo: String(pageNo)
  });
  const url = `${BASE_URL}/t_doc?${params.toString()}`;
  const html = await fetchText(url, { 'User-Agent': 'legal-actions-bridge/1.0' });

  const htmlTitleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = htmlTitleMatch
    ? htmlTitleMatch[1].replace(/^・/, '').replace(/[(（]◆[^)）]*[)）]$/, '').trim()
    : '';
  const contentsStart = html.search(/<div\s+id="contents"/i);
  const contentsHtml = contentsStart >= 0 ? html.slice(contentsStart) : html;
  const lines = [];
  const pRegex = /<p[^>]*?(?:\s+class="([^"]*)")?[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(contentsHtml)) !== null) {
    const className = pMatch[1] ?? '';
    let text = stripTags(pMatch[2]).trim();
    if (!text) continue;
    if (className.includes('title-irregular')) text = `## ${text.replace(/^○/, '')}`;
    else if (className === 'num') text = `### ${text}`;
    lines.push(text);
  }
  return {
    data_id: dataId,
    page_no: Number(pageNo),
    title,
    body: lines.join('\n\n').trim(),
    source_url: url
  };
}
