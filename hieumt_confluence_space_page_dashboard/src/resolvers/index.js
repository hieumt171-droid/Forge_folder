import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const REVIEW_LABEL = 'review-needed';
const PAGE_FETCH_LIMIT = 250;
const CQL_SEARCH_LIMIT = 50;
const TOP_LABELS_LIMIT = 15;

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const resolver = new Resolver();

const parseJsonResponse = async (response, label) => {
  if (!response.ok) {
    const body = await response.text();
    console.log(
      JSON.stringify(
        formatLog('confluence.response.error', {
          label,
          status: response.status,
          statusText: response.statusText,
          body: body.slice(0, 500)
        })
      )
    );
    throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const extractCursorFromUrl = (url) => {
  try {
    const parsed = new URL(url, 'https://placeholder.local');
    return parsed.searchParams.get('cursor');
  } catch {
    const match = String(url).match(/[?&]cursor=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
};

const getNextCursor = (payload) => payload?.['_links']?.next ?? payload?.links?.next ?? null;

/** GET /wiki/api/v2/spaces/{id}/pages — paginate toàn bộ pages trong space */
const fetchAllSpacePages = async (spaceId) => {
  const pages = [];
  let cursor = null;
  let guard = 0;

  do {
    const query = new URLSearchParams({ limit: String(PAGE_FETCH_LIMIT) });
    if (cursor) {
      query.set('cursor', cursor);
    }

    const response = await api.asUser().requestConfluence(
      route`/wiki/api/v2/spaces/${spaceId}/pages?${query}`
    );
    const data = await parseJsonResponse(response, 'getSpacePages');
    const batch = Array.isArray(data?.results) ? data.results : [];
    pages.push(...batch);

    const nextLink = getNextCursor(data);
    cursor = nextLink ? extractCursorFromUrl(nextLink) : null;
    guard += 1;
  } while (cursor && guard < 40);

  return pages;
};

const mapPageRow = (page) => ({
  id: String(page?.id ?? ''),
  title: String(page?.title ?? '(no title)'),
  status: String(page?.status ?? ''),
  createdAt: String(page?.createdAt ?? ''),
  webUrl: page?._links?.webui ? String(page._links.webui) : ''
});

const pickRecentPages = (pages, count = 5) =>
  [...pages]
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
    .slice(0, count)
    .map(mapPageRow);

/** CQL: space = KEY — gom labels từ metadata trên kết quả search */
const fetchLabelsInSpaceViaCql = async (spaceKey) => {
  const labelCounts = new Map();
  const cql = `space = "${spaceKey}" AND type = page`;
  let start = 0;
  let guard = 0;

  do {
    const query = new URLSearchParams({
      cql,
      limit: String(CQL_SEARCH_LIMIT),
      start: String(start),
      expand: 'metadata.labels'
    });

    const response = await api.asUser().requestConfluence(
      route`/wiki/rest/api/content/search?${query}`
    );
    const data = await parseJsonResponse(response, 'cqlContentSearch');
    const results = Array.isArray(data?.results) ? data.results : [];

    for (const item of results) {
      const labels = item?.metadata?.labels?.results ?? item?.metadata?.labels ?? [];
      const list = Array.isArray(labels) ? labels : [];
      for (const label of list) {
        const name = String(label?.name ?? label?.label ?? '').trim();
        if (!name) continue;
        labelCounts.set(name, (labelCounts.get(name) || 0) + 1);
      }
    }

    const size = Number(data?.size ?? results.length);
    const totalSize = Number(data?.totalSize ?? 0);
    start += size;
    guard += 1;

    if (size === 0 || start >= totalSize || guard >= 40) {
      break;
    }
  } while (true);

  return Array.from(labelCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, TOP_LABELS_LIMIT);
};

const buildSpaceHealthReport = async (spaceId, spaceKey) => {
  const rawPages = await fetchAllSpacePages(spaceId);
  const topLabels = await fetchLabelsInSpaceViaCql(spaceKey);

  return {
    spaceId,
    spaceKey,
    totalPages: rawPages.length,
    recentPages: pickRecentPages(rawPages, 5),
    topLabels
  };
};

resolver.define('getSpaceHealthReport', async (req) => {
  const spaceId = String(req?.context?.extension?.space?.id ?? req?.payload?.spaceId ?? '').trim();
  const spaceKey = String(req?.context?.extension?.space?.key ?? req?.payload?.spaceKey ?? '').trim();

  console.log(JSON.stringify(formatLog('getSpaceHealthReport.request', { spaceId, spaceKey })));

  if (!spaceId || !spaceKey) {
    throw new Error('Thiếu space id/key trong context.');
  }

  const result = await buildSpaceHealthReport(spaceId, spaceKey);

  console.log(
    JSON.stringify(
      formatLog('getSpaceHealthReport.success', {
        spaceKey,
        totalPages: result.totalPages,
        recentCount: result.recentPages.length,
        labelCount: result.topLabels.length
      })
    )
  );

  return result;
});

resolver.define('addReviewNeededLabel', async (req) => {
  const pageId = String(req?.payload?.pageId ?? '').trim();

  console.log(JSON.stringify(formatLog('addReviewNeededLabel.request', { pageId })));

  if (!pageId) {
    throw new Error('pageId là bắt buộc.');
  }

  const response = await api.asUser().requestConfluence(route`/wiki/rest/api/content/${pageId}/label`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{ prefix: 'global', name: REVIEW_LABEL }])
  });

  await parseJsonResponse(response, 'addLabel');

  const spaceId = String(req?.context?.extension?.space?.id ?? '').trim();
  const spaceKey = String(req?.context?.extension?.space?.key ?? '').trim();

  console.log(
    JSON.stringify(formatLog('addReviewNeededLabel.success', { pageId, label: REVIEW_LABEL }))
  );

  const report =
    spaceId && spaceKey ? await buildSpaceHealthReport(spaceId, spaceKey) : null;

  return { pageId, label: REVIEW_LABEL, report };
});

export const handler = resolver.getDefinitions();
