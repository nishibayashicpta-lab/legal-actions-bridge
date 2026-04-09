import iconv from 'iconv-lite';

export function sendJson(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data, null, 2));
}

export function getQuery(req, key, fallback = undefined) {
  const value = req.query?.[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export async function fetchText(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
  }
  return await response.text();
}

export async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
  }
  return await response.json();
}

export async function fetchBuffer(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function decodeShiftJis(buffer) {
  return iconv.decode(buffer, 'Shift_JIS');
}

export function stripTags(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

export function requireQuery(req, key) {
  const value = getQuery(req, key);
  if (!value) {
    const err = new Error(`Missing required query parameter: ${key}`);
    err.statusCode = 400;
    throw err;
  }
  return value;
}

export function normalizeArticleNumber(input = '') {
  return String(input)
    .replace(/^第/, '')
    .replace(/条$/, '')
    .replace(/の/g, '_')
    .trim();
}

export function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}
