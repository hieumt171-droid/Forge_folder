import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';
import { createLogger } from '../lib/logger.js';
import {
  assertBookmarkOwnership,
  assertSelfOnly,
  buildBookmarkKey,
  buildBookmarkPrefix,
  validateIssueKey,
  validateOptionalCursor
} from './validation.js';

const BOOKMARK_LIST_LIMIT = 100;
const logger = createLogger('bookmark-resolver');

const resolverMeta = (req) => ({
  accountId: req?.context?.accountId ?? null,
  payloadKeys: Object.keys(req?.payload ?? {})
});

const parseIssueKeyFromBookmarkKey = (key, accountId) => {
  const prefix = buildBookmarkPrefix(accountId);
  if (!String(key).startsWith(prefix)) {
    return null;
  }
  return String(key).slice(prefix.length);
};

const fetchIssueFields = async (issueKey, accountId) => {
  const response = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=summary,status`
  );

  if (!response.ok) {
    const body = await response.text();
    logger.error('fetchIssueFields', {
      issueKey,
      accountId,
      status: response.status,
      bodyPreview: body.slice(0, 400)
    });
    throw new Error(`Không lấy được issue ${issueKey}: ${response.status}`);
  }

  const issue = await response.json();
  const fields = issue?.fields ?? {};
  const status = fields?.status ?? {};
  const statusCategory = status?.statusCategory ?? {};

  return {
    issueKey,
    summary: String(fields?.summary ?? ''),
    statusName: String(status?.name ?? ''),
    statusCategory: String(statusCategory?.key ?? statusCategory?.name ?? ''),
    bookmarkedAt: new Date().toISOString(),
    accountId
  };
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

const defineLogged = (name, handler) => {
  resolver.define(name, (req) => logger.run(name, resolverMeta(req), () => handler(req)));
};

defineLogged('getCurrentBookmark', async (req) => {
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);
  const key = buildBookmarkKey(accountId, issueKey);
  const stored = await kvs.get(key);

  if (stored) {
    assertBookmarkOwnership(stored, accountId);
  }

  return {
    issueKey,
    isBookmarked: Boolean(stored),
    bookmark: stored ?? null
  };
});

defineLogged('toggleBookmark', async (req) => {
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);
  const key = buildBookmarkKey(accountId, issueKey);
  const existing = await kvs.get(key);

  if (existing) {
    assertBookmarkOwnership(existing, accountId);
    await kvs.delete(key);
    return {
      action: 'removed',
      issueKey,
      isBookmarked: false,
      message: `Đã bỏ bookmark ${issueKey}.`
    };
  }

  const bookmark = await fetchIssueFields(issueKey, accountId);
  await kvs.set(key, bookmark);

  return {
    action: 'added',
    issueKey,
    isBookmarked: true,
    bookmark,
    message: `Đã lưu bookmark ${issueKey}.`
  };
});

defineLogged('getMyBookmarks', async (req) => {
  const accountId = assertSelfOnly(req);
  const cursor = validateOptionalCursor(req?.payload?.cursor);
  const { results, nextCursor } = await queryMyBookmarks(accountId, cursor);
  const bookmarks = mapBookmarkResults(results, accountId);

  return {
    bookmarks,
    nextCursor: nextCursor ?? null,
    count: bookmarks.length
  };
});

defineLogged('listMyBookmarks', async (req) => {
  const accountId = assertSelfOnly(req);
  const { results } = await queryMyBookmarks(accountId, undefined);
  const bookmarks = mapBookmarkResults(results, accountId);

  return { bookmarks, count: bookmarks.length };
});

defineLogged('removeBookmark', async (req) => {
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);
  const key = buildBookmarkKey(accountId, issueKey);
  const existing = await kvs.get(key);

  if (!existing) {
    return {
      issueKey,
      removed: false,
      message: `Bookmark ${issueKey} không tồn tại.`
    };
  }

  assertBookmarkOwnership(existing, accountId);
  await kvs.delete(key);

  return {
    issueKey,
    removed: true,
    message: `Đã xóa bookmark ${issueKey}.`
  };
});

export const handler = resolver.getDefinitions();
