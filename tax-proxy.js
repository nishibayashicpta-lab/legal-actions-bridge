import { fetchJson } from './common.js';

const TAX_BASE_URL = process.env.TAX_BASE_URL || 'https://tax-law-mcp.vercel.app';

export async function proxyTax(path, query) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, Array.isArray(v) ? v[0] : String(v));
  }
  const url = `${TAX_BASE_URL}${path}?${params.toString()}`;
  const data = await fetchJson(url, { 'User-Agent': 'legal-actions-bridge/1.0' });
  return { ...data, proxied_via: 'legal-actions-bridge', upstream_base_url: TAX_BASE_URL };
}
