import { fetchBuffer, decodeShiftJis, stripTags, badRequest } from './common.js';

const BASE_URL = 'https://www.jaish.gr.jp';
const JAISH_INDEX_PAGES = [
  '/user/anzen/hor/tsutatsu.html',
  '/user/anzen/hor/tsutatsu_r07.html',
  '/user/anzen/hor/tsutatsu_r06.html',
  '/user/anzen/hor/tsutatsu_r05.html',
  '/user/anzen/hor/tsutatsu_r04.html',
  '/user/anzen/hor/tsutatsu_r03.html',
  '/user/anzen/hor/tsutatsu_r02.html',
  '/user/anzen/hor/tsutatsu_h31.html',
  '/user/anzen/hor/tsutatsu_h30.html',
  '/user/anzen/hor/tsutatsu_h29.html',
  '/user/anzen/hor/tsutatsu_h28.html',
  '/user/anzen/hor/tsutatsu_h27.html',
  '/user/anzen/hor/tsutatsu_h26.html',
  '/user/anzen/hor/tsutatsu_h25.html',
  '/user/anzen/hor/tsutatsu_h24.html',
  '/user/anzen/hor/tsutatsu_h23.html',
  '/user/anzen/hor/tsutatsu_h22.html',
  '/user/anzen/hor/tsutatsu_h21.html',
  '/user/anzen/hor/tsutatsu_h20.html',
  '/user/anzen/hor/tsutatsu_h19.html',
  '/user/anzen/hor/tsutatsu_h18.html',
  '/user/anzen/hor/tsutatsu_h17.html',
  '/user/anzen/hor/tsutatsu_h16.html',
  '/user/anzen/hor/tsutatsu_h15.html'
];

async function fetchJaishHtml(path) {
  const buf = await fetchBuffer(`${BASE_URL}${path}`, { 'User-Agent': 'legal-actions-bridge/1.0' });
  return decodeShiftJis(buf);
}

function parseJaishIndex(html) {
  const entries = [];
  const rowRegex = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const [, titleHtml, infoHtml] = match;
    if (titleHtml.includes('<th') || infoHtml.includes('<th')) continue;
    const linkMatch = titleHtml.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const path = linkMatch[1];
    const title = stripTags(linkMatch[2]).trim();
    const infoParts = infoHtml.split(/<br\s*\/?>/i).map((s) => stripTags(s).trim()).filter(Boolean);
    const date = infoParts[0] || '';
    const number = infoParts.slice(1).join(' / ');
    if (title) entries.push({ title, date, number, path });
  }
  return entries;
}

export async function searchJaishTsutatsu({ keyword, limit = 20 }) {
  const keywords = String(keyword).toLowerCase().split(/\s+/).filter(Boolean);
  const all = [];
  for (const path of JAISH_INDEX_PAGES) {
    const html = await fetchJaishHtml(path);
    all.push(...parseJaishIndex(html));
    if (all.length > 2000) break;
  }
  const filtered = all.filter((entry) => {
    const text = `${entry.title} ${entry.number} ${entry.date}`.toLowerCase();
    return keywords.every((kw) => text.includes(kw));
  }).slice(0, Math.min(Math.max(Number(limit || 20), 1), 50));
  return {
    keyword,
    results: filtered.map((entry) => ({ ...entry, url: `${BASE_URL}${entry.path}` })),
    searched_index_count: JAISH_INDEX_PAGES.length,
    source_root: `${BASE_URL}/user/anzen/hor/`
  };
}

function validateJaishPath(input) {
  if (!input) throw badRequest('path は必須です');
  const path = String(input).trim();
  if (!path.startsWith('/')) throw badRequest(`不正な path です: ${input}`);
  if (!/^\/((user|anzen)\/)/.test(path)) throw badRequest(`不正な path です: ${input}`);
  return path;
}

export async function getJaishTsutatsu({ path }) {
  const safePath = validateJaishPath(path);
  const html = await fetchJaishHtml(safePath);
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/[｜|]安全衛生情報センター.*$/, '').trim() : '';
  const hombunStart = html.search(/<div\s+id="hombun">/i);
  const hombunHtml = hombunStart >= 0 ? html.slice(hombunStart) : html;
  const lines = [];
  const noMatch = hombunHtml.match(/<div\s+class="seiteiNo">([\s\S]*?)<\/div>/i);
  const ymdMatch = hombunHtml.match(/<div\s+class="seiteiYmd">([\s\S]*?)<\/div>/i);
  if (noMatch) lines.push(stripTags(noMatch[1]).trim());
  if (ymdMatch) lines.push(stripTags(ymdMatch[1]).trim());
  const toRegex = /<div\s+class="To\d+">([\s\S]*?)<\/div>/gi;
  let toMatch;
  while ((toMatch = toRegex.exec(hombunHtml)) !== null) {
    const text = stripTags(toMatch[1]).trim();
    if (text) lines.push(text);
  }
  lines.push('');
  let hasPreContent = false;
  const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let preMatch;
  while ((preMatch = preRegex.exec(hombunHtml)) !== null) {
    const text = stripTags(preMatch[1]).trim();
    if (text) {
      lines.push(text);
      hasPreContent = true;
    }
  }
  if (!hasPreContent) {
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(hombunHtml)) !== null) {
      const text = stripTags(pMatch[1]).trim();
      if (text) lines.push(text);
    }
  }
  return {
    path: safePath,
    title,
    body: lines.join('\n').trim(),
    source_url: `${BASE_URL}${safePath}`
  };
}
