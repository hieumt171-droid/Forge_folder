import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';
import {
  assertBookmarkOwnership,
  assertSelfOnly,
  buildBookmarkKey,
  buildBookmarkPrefix,
  validateIssueKey,
  validateOptionalCursor
} from './validation.js';

const BOOKMARK_LIST_LIMIT = 100;

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const getAppVersion = () => process.env.APP_VERSION ?? 'unknown';

const isApiDebugMode = () =>
  String(process.env.API_DEBUG_MODE ?? 'false').toLowerCase() === 'true';

/** Log mỗi request — APP_VERSION luôn có; chi tiết payload khi API_DEBUG_MODE=true. */
const logIncomingRequest = (resolverName, req) => {
  const accountId = req?.context?.accountId ?? null;
  const payload = req?.payload ?? {};
  const appVersion = getAppVersion();
  const debugMode = isApiDebugMode();

  if (debugMode) {
    console.log(
      JSON.stringify(
        formatLog('resolver.request', {
          appVersion,
          debugMode,
          resolver: resolverName,
          accountId,
          payload,
          contextKeys: Object.keys(req?.context ?? {})
        })
      )
    );
    return;
  }

  console.log(
    JSON.stringify(
      formatLog('resolver.request', {
        appVersion,
        debugMode,
        resolver: resolverName,
        accountId,
        payloadKeys: Object.keys(payload)
      })
    )
  );
};

const parseIssueKeyFromBookmarkKey = (key, accountId) => {
  const prefix = buildBookmarkPrefix(accountId);
  if (!String(key).startsWith(prefix)) {
    return null;
  }
  return String(key).slice(prefix.length);
};

const fetchIssueFields = async (issueKey, accountId) => {
  console.log(JSON.stringify(formatLog('fetchIssueFields.request', { issueKey, accountId })));

  const response = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=summary,status`
  );

  if (!response.ok) {
    const body = await response.text();
    console.log(
      JSON.stringify(
        formatLog('fetchIssueFields.error', {
          issueKey,
          status: response.status,
          body: body.slice(0, 400)
        })
      )
    );
    throw new Error(`Không lấy được issue ${issueKey}: ${response.status}`);
  }

  const issue = await response.json();
  const fields = issue?.fields ?? {};
  const status = fields?.status ?? {};
  const statusCategory = status?.statusCategory ?? {};

  const snapshot = {
    issueKey,
    summary: String(fields?.summary ?? ''),
    statusName: String(status?.name ?? ''),
    statusCategory: String(statusCategory?.key ?? statusCategory?.name ?? ''),
    bookmarkedAt: new Date().toISOString(),
    accountId
  };

  console.log(
    JSON.stringify(
      formatLog('fetchIssueFields.success', {
        issueKey,
        statusName: snapshot.statusName
      })
    )
  );

  return snapshot;
};

const mapBookmarkResults = (results, accountId) => {
  const list = (Array.isArray(results) ? results : []).map(({ key, value }) => {
    const issueKey = value?.issueKey ?? parseIssueKeyFromBookmarkKey(key, accountId) ?? '';
    return {
      key,
      issueKey,
      summary: value?.summary ?? '',
      statusName: value?.statusName ?? '',
      statusCategory: value?.statusCategory ?? '',
      bookmarkedAt: value?.bookmarkedAt ?? ''
    };
  });

  return list.sort(
    (a, b) => Date.parse(b.bookmarkedAt || 0) - Date.parse(a.bookmarkedAt || 0)
  );
};

const queryMyBookmarks = async (accountId, cursor) => {
  let query = kvs
    .query()
    .where('key', WhereConditions.beginsWith(buildBookmarkPrefix(accountId)))
    .limit(BOOKMARK_LIST_LIMIT);

  if (cursor) {
    query = query.cursor(cursor);
  }

  return query.getMany();
};

const resolver = new Resolver();

resolver.define('getCurrentBookmark', async (req) => {
  logIncomingRequest('getCurrentBookmark', req);
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);

  try {
    const key = buildBookmarkKey(accountId, issueKey);
    const stored = await kvs.get(key);
    const isBookmarked = Boolean(stored);

    if (stored) {
      assertBookmarkOwnership(stored, accountId);
    }

    console.log(
      JSON.stringify(
        formatLog('getCurrentBookmark.success', { accountId, issueKey, isBookmarked })
      )
    );

    return {
      issueKey,
      isBookmarked,
      bookmark: stored ?? null
    };
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('getCurrentBookmark.error', {
          accountId,
          issueKey,
          message: error?.message
        })
      )
    );
    throw error;
  }
});

resolver.define('toggleBookmark', async (req) => {
  logIncomingRequest('toggleBookmark', req);
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);

  try {
    const key = buildBookmarkKey(accountId, issueKey);
    const existing = await kvs.get(key);

    if (existing) {
      assertBookmarkOwnership(existing, accountId);
      await kvs.delete(key);
      console.log(
        JSON.stringify(formatLog('toggleBookmark.removed', { accountId, issueKey }))
      );
      return {
        action: 'removed',
        issueKey,
        isBookmarked: false,
        message: `Đã bỏ bookmark ${issueKey}.`
      };
    }

    const bookmark = await fetchIssueFields(issueKey, accountId);
    await kvs.set(key, bookmark);

    console.log(
      JSON.stringify(formatLog('toggleBookmark.added', { accountId, issueKey }))
    );

    return {
      action: 'added',
      issueKey,
      isBookmarked: true,
      bookmark,
      message: `Đã lưu bookmark ${issueKey}.`
    };
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('toggleBookmark.error', {
          accountId,
          issueKey,
          message: error?.message
        })
      )
    );
    throw error;
  }
});

resolver.define('getMyBookmarks', async (req) => {
  logIncomingRequest('getMyBookmarks', req);
  const accountId = assertSelfOnly(req);
  const cursor = validateOptionalCursor(req?.payload?.cursor);

  try {
    const { results, nextCursor } = await queryMyBookmarks(accountId, cursor);
    const bookmarks = mapBookmarkResults(results, accountId);

    console.log(
      JSON.stringify(
        formatLog('getMyBookmarks.success', {
          accountId,
          count: bookmarks.length,
          hasNextCursor: Boolean(nextCursor)
        })
      )
    );

    return { bookmarks, nextCursor: nextCursor ?? null };
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('getMyBookmarks.error', { accountId, message: error?.message })
      )
    );
    throw error;
  }
});

resolver.define('listMyBookmarks', async (req) => {
  logIncomingRequest('listMyBookmarks', req);
  const accountId = assertSelfOnly(req);

  try {
    const { results } = await queryMyBookmarks(accountId, undefined);
    const bookmarks = mapBookmarkResults(results, accountId);

    console.log(
      JSON.stringify(
        formatLog('listMyBookmarks.success', { accountId, count: bookmarks.length })
      )
    );

    return { bookmarks };
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('listMyBookmarks.error', { accountId, message: error?.message })
      )
    );
    throw error;
  }
});

resolver.define('removeBookmark', async (req) => {
  logIncomingRequest('removeBookmark', req);
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);

  try {
    const key = buildBookmarkKey(accountId, issueKey);
    const existing = await kvs.get(key);

    if (!existing) {
      console.log(
        JSON.stringify(formatLog('removeBookmark.notFound', { accountId, issueKey }))
      );
      return {
        issueKey,
        removed: false,
        message: `Bookmark ${issueKey} không tồn tại.`
      };
    }

    assertBookmarkOwnership(existing, accountId);
    await kvs.delete(key);

    console.log(
      JSON.stringify(formatLog('removeBookmark.success', { accountId, issueKey }))
    );

    return {
      issueKey,
      removed: true,
      message: `Đã xóa bookmark ${issueKey}.`
    };
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('removeBookmark.error', { accountId, issueKey, message: error?.message })
      )
    );
    throw error;
  }
});

export const handler = resolver.getDefinitions();
