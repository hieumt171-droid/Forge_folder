import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { sql, errorCodes } from '@forge/sql';
import { createLogger } from '../lib/logger.js';
import { applyMigrations } from '../sql/migration.js';
import {
  assertSelfOnly,
  validateIssueKey,
  validateDurationMin,
  validateLoggedAt,
  validateNote,
  validateEntryId,
  EXPORT_ROW_LIMIT
} from './validation.js';

const logger = createLogger('timeforge-resolver');

const resolverMeta = (req) => ({
  accountId: req?.context?.accountId ?? null,
  payloadKeys: Object.keys(req?.payload ?? {})
});

const withSchema = async (label, fn) => {
  try {
    await applyMigrations();
    return await fn();
  } catch (err) {
    logger.error(label, {
      message: err?.message,
      code: err?.code,
      debug: err?.debug ?? null
    });
    if (err?.code === errorCodes.SQL_EXECUTION_ERROR && err?.debug?.message) {
      throw new Error(err.debug.message);
    }
    throw new Error(err?.message || 'Lỗi SQL không xác định.');
  }
};

const toDateStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
};

const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const mapEntryRow = (row) => ({
  id: Number(row?.id ?? 0),
  accountId: String(row?.account_id ?? ''),
  issueKey: String(row?.issue_key ?? ''),
  projectKey: String(row?.project_key ?? ''),
  category: String(row?.category ?? ''),
  durationMin: Number(row?.duration_min ?? 0),
  loggedAt: toDateStr(row?.logged_at),
  note: String(row?.note ?? ''),
  status: String(row?.status ?? 'draft'),
  createdAt: row?.created_at ? toDateStr(row.created_at) : ''
});

/** Lấy meta issue: project, work type (issuetype), status, summary */
const fetchIssueMeta = async (issueKey) => {
  const res = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=project,issuetype,status,summary`
  );
  if (!res.ok) {
    throw new Error(`Issue ${issueKey} không tồn tại hoặc bạn không có quyền truy cập.`);
  }
  const data = await res.json();
  const workType = String(data?.fields?.issuetype?.name ?? 'Task').trim() || 'Task';
  return {
    projectKey: String(data?.fields?.project?.key ?? issueKey.split('-')[0]),
    workType: workType.slice(0, 64),
    issueStatus: String(data?.fields?.status?.name ?? ''),
    issueStatusCategory: String(data?.fields?.status?.statusCategory?.key ?? ''),
    summary: String(data?.fields?.summary ?? '')
  };
};

const fetchIssueSummaries = async (issueKeys) => {
  const unique = [...new Set(issueKeys.filter(Boolean))];
  if (unique.length === 0) return {};

  const results = await Promise.all(
    unique.map(async (key) => {
      try {
        const res = await api.asUser().requestJira(
          route`/rest/api/3/issue/${key}?fields=summary,issuetype`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return {
          key,
          summary: String(data?.fields?.summary ?? '').trim(),
          workType: String(data?.fields?.issuetype?.name ?? '').trim()
        };
      } catch {
        return null;
      }
    })
  );

  const map = {};
  for (const item of results) {
    if (!item?.key) continue;
    map[item.key] = {
      summary: item.summary,
      workType: item.workType
    };
  }
  return map;
};

const fmtMin = (m) => {
  const min = Number(m) || 0;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  if (h > 0 && rest > 0) return `${h}h ${rest}m`;
  if (h > 0) return `${h}h`;
  return `${rest}m`;
};

const loadOwnedEntry = async (label, id, accountId) => {
  const checkResult = await withSchema(label, () =>
    sql
      .prepare(
        `SELECT id, account_id, issue_key, project_key, category, duration_min, logged_at, note, status, created_at
         FROM time_entries WHERE id = ?`
      )
      .bindParams(id)
      .execute()
  );
  const rows = Array.isArray(checkResult?.rows) ? checkResult.rows : [];
  if (rows.length === 0) throw new Error(`Entry ${id} không tồn tại.`);
  if (String(rows[0]?.account_id ?? '') !== accountId) {
    throw new Error('Không được thao tác entry của user khác.');
  }
  return mapEntryRow(rows[0]);
};

const insertEntry = async (label, { accountId, issueKey, durationMin, loggedAt, note }) => {
  const meta = await fetchIssueMeta(issueKey);
  const result = await withSchema(label, () =>
    sql
      .prepare(
        `INSERT INTO time_entries (account_id, issue_key, project_key, category, duration_min, logged_at, note, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`
      )
      .bindParams(
        accountId,
        issueKey,
        meta.projectKey,
        meta.workType,
        durationMin,
        loggedAt,
        note
      )
      .execute()
  );
  return {
    insertId: Number(result?.rows?.insertId ?? 0),
    projectKey: meta.projectKey,
    workType: meta.workType,
    issueStatus: meta.issueStatus
  };
};

const resolver = new Resolver();

const define = (name, handler) => {
  resolver.define(name, (req) => logger.run(name, resolverMeta(req), () => handler(req)));
};

define('getIssueMeta', async (req) => {
  assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);
  const meta = await fetchIssueMeta(issueKey);
  return { ok: true, issueKey, ...meta };
});

define('logTimeEntry', async (req) => {
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);
  const durationMin = validateDurationMin(req?.payload?.durationMin);
  const loggedAt = validateLoggedAt(req?.payload?.loggedAt);
  const note = validateNote(req?.payload?.note);

  const { insertId, projectKey, workType } = await insertEntry('logTimeEntry.sql', {
    accountId,
    issueKey,
    durationMin,
    loggedAt,
    note
  });

  return {
    success: true,
    insertId,
    issueKey,
    projectKey,
    category: workType,
    workType,
    durationMin,
    loggedAt
  };
});

define('logWork', async (req) => {
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);
  const durationMin = validateDurationMin(req?.payload?.durationMin);
  const loggedAt = validateLoggedAt(req?.payload?.loggedAt);
  const note = validateNote(req?.payload?.note);

  const { insertId, projectKey, workType } = await insertEntry('logWork.sql', {
    accountId,
    issueKey,
    durationMin,
    loggedAt,
    note
  });

  return {
    ok: true,
    record: {
      id: insertId,
      accountId,
      issueKey,
      projectKey,
      category: workType,
      workType,
      durationMin,
      loggedAt,
      note,
      status: 'draft'
    }
  };
});

define('getWorkLogs', async (req) => {
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);
  const allUsers = Boolean(req?.payload?.allUsers);

  const [result, meta] = await Promise.all([
    withSchema('getWorkLogs.sql', () =>
      (allUsers
        ? sql
            .prepare(
              `SELECT id, account_id, issue_key, project_key, category, duration_min, logged_at, note, status, created_at
             FROM time_entries
             WHERE issue_key = ?
             ORDER BY logged_at DESC, created_at DESC
             LIMIT 100`
            )
            .bindParams(issueKey)
        : sql
            .prepare(
              `SELECT id, account_id, issue_key, project_key, category, duration_min, logged_at, note, status, created_at
             FROM time_entries
             WHERE issue_key = ? AND account_id = ?
             ORDER BY logged_at DESC, created_at DESC
             LIMIT 100`
            )
            .bindParams(issueKey, accountId)
      ).execute()
    ),
    fetchIssueMeta(issueKey)
  ]);

  const logs = (Array.isArray(result?.rows) ? result.rows : []).map(mapEntryRow);
  const totalMin = logs.reduce((s, e) => s + e.durationMin, 0);

  return {
    logs,
    totalMin,
    totalFormatted: fmtMin(totalMin),
    issueKey,
    workType: meta.workType,
    issueStatus: meta.issueStatus,
    issueStatusCategory: meta.issueStatusCategory,
    summary: meta.summary
  };
});

define('getIssueTimeLogs', async (req) => {
  const accountId = assertSelfOnly(req);
  const issueKey = validateIssueKey(req?.payload?.issueKey);

  const [result, meta] = await Promise.all([
    withSchema('getIssueTimeLogs.sql', () =>
      sql
        .prepare(
          `SELECT id, account_id, issue_key, project_key, category, duration_min, logged_at, note, status, created_at
         FROM time_entries
         WHERE account_id = ? AND issue_key = ?
         ORDER BY logged_at DESC, created_at DESC
         LIMIT 50`
        )
        .bindParams(accountId, issueKey)
        .execute()
    ),
    fetchIssueMeta(issueKey)
  ]);

  const entries = (Array.isArray(result?.rows) ? result.rows : []).map(mapEntryRow);
  const totalMin = entries.reduce((s, e) => s + e.durationMin, 0);

  return {
    entries,
    totalMin,
    issueKey,
    workType: meta.workType,
    issueStatus: meta.issueStatus
  };
});

define('updateTimeEntry', async (req) => {
  const accountId = assertSelfOnly(req);
  const id = validateEntryId(req?.payload?.id);
  const durationMin = validateDurationMin(req?.payload?.durationMin);
  const loggedAt = validateLoggedAt(req?.payload?.loggedAt);
  const note = validateNote(req?.payload?.note);

  const existing = await loadOwnedEntry('updateTimeEntry.check', id, accountId);
  if (existing.status === 'submitted') {
    throw new Error('Không thể sửa entry đã nộp tuần.');
  }

  const meta = await fetchIssueMeta(existing.issueKey);
  const workType = meta.workType;

  await withSchema('updateTimeEntry.sql', () =>
    sql
      .prepare(
        `UPDATE time_entries
         SET category = ?, duration_min = ?, logged_at = ?, note = ?
         WHERE id = ? AND account_id = ? AND status = 'draft'`
      )
      .bindParams(workType, durationMin, loggedAt, note, id, accountId)
      .execute()
  );

  return {
    success: true,
    entry: {
      ...existing,
      category: workType,
      workType,
      durationMin,
      loggedAt,
      note
    }
  };
});

define('deleteTimeEntry', async (req) => {
  const accountId = assertSelfOnly(req);
  const id = validateEntryId(req?.payload?.id);

  const existing = await loadOwnedEntry('deleteTimeEntry.check', id, accountId);
  if (existing.status === 'submitted') {
    throw new Error('Không thể xóa entry đã nộp.');
  }

  await withSchema('deleteTimeEntry.sql', () =>
    sql
      .prepare(`DELETE FROM time_entries WHERE id = ? AND account_id = ? AND status = 'draft'`)
      .bindParams(id, accountId)
      .execute()
  );

  return { success: true, deletedId: id };
});

define('getMyTimesheet', async (req) => {
  const accountId = assertSelfOnly(req);
  const weekStart = validateLoggedAt(req?.payload?.weekStart);
  const weekEnd = addDays(weekStart, 6);

  const [entriesResult, submissionResult, categoryResult] = await Promise.all([
    withSchema('getMyTimesheet.entries', () =>
      sql
        .prepare(
          `SELECT issue_key, project_key, category, logged_at, SUM(duration_min) AS total_min
           FROM time_entries
           WHERE account_id = ? AND logged_at >= ? AND logged_at <= ?
           GROUP BY issue_key, project_key, category, logged_at
           ORDER BY issue_key ASC, logged_at ASC`
        )
        .bindParams(accountId, weekStart, weekEnd)
        .execute()
    ),
    withSchema('getMyTimesheet.submission', () =>
      sql
        .prepare(`SELECT account_id FROM week_submissions WHERE account_id = ? AND week_start = ?`)
        .bindParams(accountId, weekStart)
        .execute()
    ),
    withSchema('getMyTimesheet.byCategory', () =>
      sql
        .prepare(
          `SELECT category, SUM(duration_min) AS total_min
           FROM time_entries
           WHERE account_id = ? AND logged_at >= ? AND logged_at <= ?
           GROUP BY category`
        )
        .bindParams(accountId, weekStart, weekEnd)
        .execute()
    )
  ]);

  const rawRows = Array.isArray(entriesResult?.rows) ? entriesResult.rows : [];
  const submitted =
    (Array.isArray(submissionResult?.rows) ? submissionResult.rows : []).length > 0;

  const grouped = {};
  for (const row of rawRows) {
    const key = String(row?.issue_key ?? '');
    const day = toDateStr(row?.logged_at);
    const min = Number(row?.total_min ?? 0);
    const category = String(row?.category ?? '').trim();
    if (!grouped[key]) {
      grouped[key] = {
        issueKey: key,
        projectKey: String(row?.project_key ?? ''),
        workType: category,
        days: {},
        total: 0
      };
    }
    if (!grouped[key].workType && category) grouped[key].workType = category;
    grouped[key].days[day] = (grouped[key].days[day] || 0) + min;
    grouped[key].total += min;
  }

  const rows = Object.values(grouped).sort((a, b) => a.issueKey.localeCompare(b.issueKey));
  const weekTotal = rows.reduce((s, r) => s + r.total, 0);

  const byCategory = {};
  for (const row of Array.isArray(categoryResult?.rows) ? categoryResult.rows : []) {
    byCategory[String(row?.category ?? '')] = Number(row?.total_min ?? 0);
  }

  const summaries = await fetchIssueSummaries(rows.map((r) => r.issueKey));
  for (const r of rows) {
    const info = summaries[r.issueKey] || {};
    r.summary = info.summary || r.issueKey;
    r.workType = info.workType || r.workType || '';
  }

  return {
    weekStart,
    weekEnd,
    rows,
    weekTotal,
    byCategory,
    byWorkType: byCategory,
    submitted,
    capacityMin: 5 * 8 * 60
  };
});

define('submitWeek', async (req) => {
  const accountId = assertSelfOnly(req);
  const weekStart = validateLoggedAt(req?.payload?.weekStart);
  const weekEnd = addDays(weekStart, 6);

  const checkResult = await withSchema('submitWeek.check', () =>
    sql
      .prepare(`SELECT account_id FROM week_submissions WHERE account_id = ? AND week_start = ?`)
      .bindParams(accountId, weekStart)
      .execute()
  );

  if ((Array.isArray(checkResult?.rows) ? checkResult.rows : []).length > 0) {
    return { success: true, alreadySubmitted: true, weekStart, weekEnd, submittedCount: 0 };
  }

  const countResult = await withSchema('submitWeek.count', () =>
    sql
      .prepare(
        `SELECT COUNT(*) AS cnt FROM time_entries
         WHERE account_id = ? AND logged_at >= ? AND logged_at <= ? AND status = 'draft'`
      )
      .bindParams(accountId, weekStart, weekEnd)
      .execute()
  );
  const draftCount = Number(countResult?.rows?.[0]?.cnt ?? 0);
  if (draftCount === 0) {
    throw new Error('Không có entry draft nào để nộp trong tuần này.');
  }

  await withSchema('submitWeek.update', () =>
    sql
      .prepare(
        `UPDATE time_entries SET status = 'submitted'
         WHERE account_id = ? AND logged_at >= ? AND logged_at <= ? AND status = 'draft'`
      )
      .bindParams(accountId, weekStart, weekEnd)
      .execute()
  );

  await withSchema('submitWeek.insert', () =>
    sql
      .prepare(`INSERT INTO week_submissions (account_id, week_start) VALUES (?, ?)`)
      .bindParams(accountId, weekStart)
      .execute()
  );

  return { success: true, alreadySubmitted: false, weekStart, weekEnd, submittedCount: draftCount };
});

define('exportTimesheetCsv', async (req) => {
  const accountId = assertSelfOnly(req);
  const weekStart = validateLoggedAt(req?.payload?.weekStart);
  const weekEnd = addDays(weekStart, 6);

  const result = await withSchema('exportTimesheetCsv.sql', () =>
    sql
      .prepare(
        `SELECT issue_key, project_key, category, duration_min, logged_at, note, status
         FROM time_entries
         WHERE account_id = ? AND logged_at >= ? AND logged_at <= ?
         ORDER BY logged_at ASC, issue_key ASC
         LIMIT ${EXPORT_ROW_LIMIT}`
      )
      .bindParams(accountId, weekStart, weekEnd)
      .execute()
  );

  const rows = Array.isArray(result?.rows) ? result.rows : [];
  const truncated = rows.length >= EXPORT_ROW_LIMIT;

  // Lấy summary + work type cho từng issue key
  const summaryMap = await fetchIssueSummaries([...new Set(rows.map((r) => r?.issue_key).filter(Boolean))]);

  // Header Excel-friendly: dùng tab-separated để paste thẳng vào Excel khỏi cần import wizard
  // Nhưng CSV với BOM vẫn là chuẩn nhất — giữ comma, thêm cột Summary & Work Type
  const header = 'Issue Key,Summary,Project,Work Type,Duration (h),Date,Note';
  const lines = rows.map((r) => {
    const key = String(r?.issue_key ?? '');
    const info = summaryMap[key] || {};
    const summary = String(info.summary ?? '').replace(/"/g, '""');
    const workType = String(info.workType || r?.category || '').replace(/"/g, '""');
    const note = String(r?.note ?? '').replace(/"/g, '""');
    const hours = (Number(r?.duration_min ?? 0) / 60).toFixed(2);
    return [
      key,
      `"${summary}"`,
      String(r?.project_key ?? ''),
      `"${workType}"`,
      hours,
      toDateStr(r?.logged_at),
      `"${note}"`
    ].join(',');
  });

  // UTF-8 BOM — Excel auto-detect tiếng Việt
  const csv = `\uFEFF${[header, ...lines].join('\r\n')}`;
  const totalMin = rows.reduce((s, r) => s + Number(r?.duration_min ?? 0), 0);
  const filename = `timesheet_${weekStart}_to_${weekEnd}.csv`;

  return {
    csv,
    filename,
    totalMin,
    weekStart,
    weekEnd,
    rowCount: rows.length,
    truncated,
    limit: EXPORT_ROW_LIMIT
  };
});

export const handler = resolver.getDefinitions();
