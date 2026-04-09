import { fetchJson, normalizeArticleNumber } from './common.js';

const EGOV_API_BASE = 'https://laws.e-gov.go.jp/api/2';

const LAW_ALIAS_MAP = {
  '労基法': '労働基準法',
  '労契法': '労働契約法',
  '最賃法': '最低賃金法',
  '安衛法': '労働安全衛生法',
  '派遣法': '労働者派遣事業の適正な運営の確保及び派遣労働者の保護等に関する法律',
  '雇保法': '雇用保険法',
  '労災法': '労働者災害補償保険法',
  '健保法': '健康保険法',
  '厚年法': '厚生年金保険法',
  '国年法': '国民年金法',
  '育介法': '育児休業、介護休業等育児又は家族介護を行う労働者の福祉に関する法律',
  '均等法': '雇用の分野における男女の均等な機会及び待遇の確保等に関する法律',
  'パート法': '短時間労働者及び有期雇用労働者の雇用管理の改善等に関する法律',
  'パワハラ防止法': '労働施策の総合的な推進並びに労働者の雇用の安定及び職業生活の充実等に関する法律'
};

function resolveLawName(name) {
  return LAW_ALIAS_MAP[name] || name;
}

export async function searchLaborLaws({ keyword, limit = 10, lawType }) {
  const params = new URLSearchParams({
    law_title: resolveLawName(keyword),
    limit: String(Math.min(Math.max(Number(limit || 10), 1), 20)),
    response_format: 'json'
  });
  if (lawType) params.set('law_type', lawType);
  const json = await fetchJson(`${EGOV_API_BASE}/laws?${params.toString()}`, {
    'Accept': 'application/json',
    'User-Agent': 'legal-actions-bridge/1.0'
  });
  return json.laws ?? [];
}

async function resolveLawId(lawNameOrId) {
  const normalized = resolveLawName(lawNameOrId);
  if (/^\d{3}[A-Z]{2}\d{10}$/.test(normalized)) return normalized;
  const results = await searchLaborLaws({ keyword: normalized, limit: 1 });
  if (!results.length) throw new Error(`法令が見つかりません: ${normalized}`);
  return results[0].law_info?.law_id || results[0].law_id;
}

export async function fetchLaborLawData(lawNameOrId) {
  const lawId = await resolveLawId(lawNameOrId);
  const data = await fetchJson(`${EGOV_API_BASE}/law_data/${lawId}`, {
    'Accept': 'application/json',
    'User-Agent': 'legal-actions-bridge/1.0'
  });
  return { lawId, data };
}

function getChildren(node) {
  if (!node || typeof node !== 'object') return [];
  return Array.isArray(node.children) ? node.children : [];
}

function getText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  const children = getChildren(node);
  return children.map(getText).join('');
}

function findNode(node, tag) {
  if (!node || typeof node !== 'object') return null;
  if (node.tag === tag) return node;
  for (const child of getChildren(node)) {
    if (typeof child === 'string') continue;
    const found = findNode(child, tag);
    if (found) return found;
  }
  return null;
}

function findArticleNode(node, normalizedNum) {
  if (!node || typeof node !== 'object') return null;
  if (node.tag === 'Article') {
    const num = node.attr?.Num;
    if (num && normalizeArticleNumber(num) === normalizedNum) return node;
  }
  for (const child of getChildren(node)) {
    if (typeof child === 'string') continue;
    const found = findArticleNode(child, normalizedNum);
    if (found) return found;
  }
  return null;
}

function findParagraphNode(articleNode, paragraphNum) {
  for (const child of getChildren(articleNode)) {
    if (typeof child === 'string') continue;
    if (child.tag === 'Paragraph' && parseInt(child.attr?.Num || '', 10) === paragraphNum) return child;
  }
  return null;
}

function findItemNode(paragraphNode, itemNum) {
  for (const child of getChildren(paragraphNode)) {
    if (typeof child === 'string') continue;
    if (child.tag === 'Item' && parseInt(child.attr?.Num || '', 10) === itemNum) return child;
  }
  return null;
}

function pushIfText(lines, text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (cleaned) lines.push(cleaned);
}

function parseGeneric(node, lines) {
  if (!node || typeof node !== 'object') return;
  if (!node.children) return;
  for (const child of node.children) {
    if (typeof child === 'string') {
      pushIfText(lines, child);
      continue;
    }
    switch (child.tag) {
      case 'ArticleTitle':
      case 'ArticleCaption':
      case 'ParagraphCaption':
      case 'ItemTitle':
      case 'ClassTitle':
      case 'SubitemTitle':
        pushIfText(lines, getText(child));
        break;
      default:
        parseGeneric(child, lines);
    }
  }
}

function extractLawTitle(data) {
  return data?.law_info?.law_title || data?.law_full_text?.attr?.LawTitle || '';
}

function collectToc(node, lines, depth = 0) {
  if (!node || typeof node !== 'object') return;
  const headingTags = new Set(['Part','Chapter','Section','Subsection','Division','Article']);
  if (headingTags.has(node.tag)) {
    const title = getText(findNode(node, `${node.tag}Title`)) || getText(findNode(node, 'ArticleTitle')) || getText(findNode(node, 'ArticleCaption'));
    if (title) lines.push(`${'  '.repeat(depth)}- ${title}`);
    depth += 1;
  }
  for (const child of getChildren(node)) {
    if (typeof child === 'string') continue;
    collectToc(child, lines, depth);
  }
}

export async function getLaborLawArticle({ lawName, article, paragraph, item, format = 'markdown' }) {
  const { lawId, data } = await fetchLaborLawData(lawName);
  const lawTitle = extractLawTitle(data);
  const root = data.law_full_text || data.lawFullText || data;
  if (format === 'toc') {
    const lines = [];
    collectToc(root, lines, 0);
    return {
      law_id: lawId,
      law_title: lawTitle,
      format: 'toc',
      toc: lines.join('\n'),
      egov_url: `https://laws.e-gov.go.jp/law/${lawId}`
    };
  }
  if (!article) throw new Error('article は必須です');
  const normalized = normalizeArticleNumber(article);
  const mainProvision = findNode(root, 'MainProvision') || root;
  let articleNode = findArticleNode(mainProvision, normalized);
  if (!articleNode) {
    const base = normalized.split('_')[0];
    const intBase = String(parseInt(base, 10));
    if (intBase && intBase !== 'NaN' && intBase !== base) {
      articleNode = findArticleNode(mainProvision, normalized.replace(/^\d+/, intBase));
    }
  }
  if (!articleNode) throw new Error(`条文が見つかりません: ${article}`);
  let targetNode = articleNode;
  if (paragraph !== undefined && paragraph !== null && paragraph !== '') {
    const para = findParagraphNode(articleNode, Number(paragraph));
    if (!para) throw new Error(`項が見つかりません: ${paragraph}`);
    targetNode = para;
    if (item !== undefined && item !== null && item !== '') {
      const itemNode = findItemNode(para, Number(item));
      if (!itemNode) throw new Error(`号が見つかりません: ${item}`);
      targetNode = itemNode;
    }
  }
  const lines = [];
  parseGeneric(targetNode, lines);
  return {
    law_id: lawId,
    law_title: lawTitle,
    article: article,
    paragraph: paragraph !== undefined ? Number(paragraph) : null,
    item: item !== undefined ? Number(item) : null,
    format: 'markdown',
    text: lines.join('\n\n').trim(),
    egov_url: `https://laws.e-gov.go.jp/law/${lawId}`
  };
}
