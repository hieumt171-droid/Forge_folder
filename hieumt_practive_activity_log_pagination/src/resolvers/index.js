import Resolver from '@forge/resolver';
import { kvs, WhereConditions } from '@forge/kvs';

const PAGE_SIZE = 5;

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const DEDUPE_WINDOW_MS = 5000;

const buildPrefix = (issueKey) => `view-log:${issueKey}:`;

const buildViewLogKey = (issueKey, accountId) => {
  const timestamp = Date.now();
  return {
    key: `view-log:${issueKey}:${timestamp}:${accountId}`,
    timestamp
  };
};

const parseViewLogKey = (key) => {
  const prefix = 'view-log:';
  if (!String(key).startsWith(prefix)) return null;

  const rest = String(key).slice(prefix.length);
  const accountSep = rest.lastIndexOf(':');
  if (accountSep <= 0) return null;

  const accountId = rest.slice(accountSep + 1);
  const beforeAccount = rest.slice(0, accountSep);
  const tsSep = beforeAccount.lastIndexOf(':');
  if (tsSep <= 0) return null;

  const timestamp = Number(beforeAccount.slice(tsSep + 1));
  const issueKey = beforeAccount.slice(0, tsSep);

  return {
    issueKey,
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    accountId
  };
};

const mapAndSortLogs = (results) => {
  const list = (Array.isArray(results) ? results : []).map(({ key, value }) => {
    const parsed = parseViewLogKey(key) || {};
    return {
      key,
      issueKey: value?.issueKey ?? parsed.issueKey ?? '',
      accountId: value?.accountId ?? parsed.accountId ?? '',
      viewedAt: value?.viewedAt ?? new Date(parsed.timestamp || 0).toISOString(),
      viewedAtMs: parsed.timestamp || Date.parse(value?.viewedAt) || 0
    };
  });

  return list.sort((a, b) => b.viewedAtMs - a.viewedAtMs);
};

const queryViewLogs = async (issueKey, cursor) => {
  let query = kvs
    .query()
    .where('key', WhereConditions.beginsWith(buildPrefix(issueKey)))
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.cursor(cursor);
  }

  return query.getMany();
};

const hasRecentViewLog = async (issueKey, accountId) => {
  const { results } = await kvs
    .query()
    .where('key', WhereConditions.beginsWith(buildPrefix(issueKey)))
    .limit(20)
    .getMany();

  const now = Date.now();

  return (Array.isArray(results) ? results : []).some((item) => {
    const parsed = parseViewLogKey(item.key);
    return (
      parsed?.accountId === accountId &&
      parsed.timestamp > 0 &&
      now - parsed.timestamp < DEDUPE_WINDOW_MS
    );
  });
};

const recordViewIfNeeded = async (issueKey, accountId) => {
  const duplicate = await hasRecentViewLog(issueKey, accountId);
  if (duplicate) {
    console.log(
      JSON.stringify(
        formatLog('recordViewLog.skipped', {
          issueKey,
          accountId,
          reason: 'duplicate_within_window',
          windowMs: DEDUPE_WINDOW_MS
        })
      )
    );
    return { skipped: true };
  }

  const { key, timestamp } = buildViewLogKey(issueKey, accountId);
  const viewedAt = new Date(timestamp).toISOString();

  await kvs.set(key, {
    viewedAt,
    accountId,
    issueKey
  });

  console.log(
    JSON.stringify(
      formatLog('recordViewLog.write', {
        issueKey,
        accountId,
        key
      })
    )
  );

  return { skipped: false, key };
};

const listViewLogsPage = async (issueKey, cursor) => {
  const { results, nextCursor } = await queryViewLogs(issueKey, cursor);

  console.log(
    JSON.stringify(
      formatLog('listViewLogs', {
        issueKey,
        count: results?.length ?? 0,
        hasNextCursor: Boolean(nextCursor),
        hasCursor: Boolean(cursor)
      })
    )
  );

  return {
    logs: mapAndSortLogs(results),
    nextCursor: nextCursor ?? null,
    pageSize: PAGE_SIZE
  };
};

const resolver = new Resolver();

resolver.define('recordViewAndListLogs', async (req) => {
  const accountId = req?.context?.accountId;
  const issueKey = req?.context?.extension?.issue?.key;

  if (!accountId || !issueKey) {
    throw new Error('Thiếu accountId hoặc issueKey trong context.');
  }

  await recordViewIfNeeded(issueKey, accountId);
  return listViewLogsPage(issueKey);
});

resolver.define('listViewLogs', async (req) => {
  const issueKey = req?.context?.extension?.issue?.key;
  const cursor = req?.payload?.cursor ?? undefined;

  if (!issueKey) {
    throw new Error('Thiếu issueKey trong context.');
  }

  return listViewLogsPage(issueKey, cursor);
});

resolver.define('loadMoreViewLogs', async (req) => {
  const issueKey = req?.context?.extension?.issue?.key;
  const cursor = req?.payload?.cursor;

  if (!issueKey) {
    throw new Error('Thiếu issueKey trong context.');
  }
  if (!cursor) {
    throw new Error('Thiếu cursor để tải trang tiếp theo.');
  }

  const { results, nextCursor } = await queryViewLogs(issueKey, cursor);

  console.log(
    JSON.stringify(
      formatLog('loadMoreViewLogs', {
        issueKey,
        count: results?.length ?? 0,
        hasNextCursor: Boolean(nextCursor)
      })
    )
  );

  return {
    logs: mapAndSortLogs(results),
    nextCursor: nextCursor ?? null,
    pageSize: PAGE_SIZE
  };
});

resolver.define('clearViewLogs', async (req) => {
  const issueKey = req?.context?.extension?.issue?.key;

  if (!issueKey) {
    throw new Error('Thiếu issueKey trong context.');
  }

  const prefix = buildPrefix(issueKey);
  let cursor;
  let deleted = 0;
  let pages = 0;

  do {
    let query = kvs
      .query()
      .where('key', WhereConditions.beginsWith(prefix))
      .limit(20);

    if (cursor) {
      query = query.cursor(cursor);
    }

    const page = await query.getMany();
    const results = page?.results ?? [];
    cursor = page?.nextCursor;

    for (const item of results) {
      await kvs.delete(item.key);
      deleted += 1;
    }

    pages += 1;
  } while (cursor);

  console.log(
    JSON.stringify(
      formatLog('clearViewLogs.success', {
        issueKey,
        deleted,
        pages
      })
    )
  );

  return { success: true, deleted };
});

export const handler = resolver.getDefinitions();
