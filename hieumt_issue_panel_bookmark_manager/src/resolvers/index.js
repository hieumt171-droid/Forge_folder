import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';

const BOOKMARK_LIST_LIMIT = 100;

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const requireAccountId = (req) => {
  const accountId = req?.context?.accountId;
  if (!accountId) {
    throw new Error('Không xác định được accountId.');
  }
  return accountId;
};

const buildBookmarkPrefix = (accountId) => `bookmark:${accountId}:`;

const buildBookmarkKey = (accountId, issueKey) =>
  `${buildBookmarkPrefix(accountId)}${String(issueKey).trim()}`;

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

const resolver = new Resolver();

resolver.define('getCurrentBookmark', async (req) => {
  const accountId = requireAccountId(req);
  const issueKey = String(req?.payload?.issueKey ?? '').trim();

  console.log(JSON.stringify(formatLog('getCurrentBookmark.request', { accountId, issueKey })));

  if (!issueKey) {
    throw new Error('issueKey là bắt buộc.');
  }

  try {
    const key = buildBookmarkKey(accountId, issueKey);
    const stored = await kvs.get(key);
    const isBookmarked = Boolean(stored);

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
  const accountId = requireAccountId(req);
  const issueKey = String(req?.payload?.issueKey ?? '').trim();

  console.log(JSON.stringify(formatLog('toggleBookmark.request', { accountId, issueKey })));

  if (!issueKey) {
    throw new Error('issueKey là bắt buộc.');
  }

  try {
    const key = buildBookmarkKey(accountId, issueKey);
    const existing = await kvs.get(key);

    if (existing) {
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

resolver.define('listMyBookmarks', async (req) => {
  const accountId = requireAccountId(req);

  console.log(JSON.stringify(formatLog('listMyBookmarks.request', { accountId })));

  try {
    const prefix = buildBookmarkPrefix(accountId);
    const { results } = await kvs
      .query()
      .where('key', WhereConditions.beginsWith(prefix))
      .limit(BOOKMARK_LIST_LIMIT)
      .getMany();

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
  const accountId = requireAccountId(req);
  const issueKey = String(req?.payload?.issueKey ?? '').trim();

  console.log(JSON.stringify(formatLog('removeBookmark.request', { accountId, issueKey })));

  if (!issueKey) {
    throw new Error('issueKey là bắt buộc.');
  }

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
