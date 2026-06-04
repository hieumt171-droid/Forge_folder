import Resolver from '@forge/resolver';
import { sql, errorCodes } from '@forge/sql';
import { applyMigrations } from '../sql/migration';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const INSERT_SPRINT_TASK = `INSERT INTO sprint_tasks (issue_key, title, status, priority, assignee)
VALUES (?, ?, ?, ?, ?)`;

const SELECT_SPRINT_TASKS = `SELECT id, issue_key, title, status, priority, assignee, created_at
FROM sprint_tasks
WHERE issue_key = ? AND status = ?
ORDER BY priority ASC, id ASC`;

const SELECT_SPRINT_TASKS_ALL = `SELECT id, issue_key, title, status, priority, assignee, created_at
FROM sprint_tasks
WHERE issue_key = ?
ORDER BY priority ASC, id ASC`;

const UPDATE_SPRINT_TASK_STATUS = `UPDATE sprint_tasks SET status = ? WHERE id = ? AND issue_key = ?`;

const SELECT_SPRINT_STATS = `SELECT status, COUNT(*) AS task_count
FROM sprint_tasks
WHERE issue_key = ?
GROUP BY status
ORDER BY status ASC`;

const logSqlError = (label, error) => {
  console.log(
    JSON.stringify(
      formatLog('sql.error', {
        label,
        message: error?.message,
        code: error?.code,
        debug: error?.debug ?? null
      })
    )
  );
};

const withSchema = async (label, fn) => {
  try {
    await applyMigrations();
    return await fn();
  } catch (error) {
    logSqlError(label, error);

    if (error?.code === errorCodes.SQL_EXECUTION_ERROR && error?.debug?.message) {
      throw new Error(error.debug.message);
    }

    throw new Error(error?.message || 'Unknown SQL execution error');
  }
};

const normalizeStatus = (value) => String(value ?? '').trim().toLowerCase();

const mapTaskRow = (row) => ({
  id: Number(row?.id ?? 0),
  issue_key: String(row?.issue_key ?? row?.issueKey ?? ''),
  title: String(row?.title ?? ''),
  status: normalizeStatus(row?.status ?? row?.STATUS),
  priority: Number(row?.priority ?? 0),
  assignee: String(row?.assignee ?? ''),
  created_at: row?.created_at != null ? String(row.created_at) : ''
});

const resolver = new Resolver();

resolver.define('createSprintTask', async (req) => {
  const issueKey = String(req?.payload?.issueKey ?? '').trim();
  const title = String(req?.payload?.title ?? '').trim();
  const status = String(req?.payload?.status ?? 'todo').trim();
  const priority = Number(req?.payload?.priority);
  const assignee = String(req?.payload?.assignee ?? 'Unassigned').trim();

  if (!issueKey || !title) {
    throw new Error('issueKey và title là bắt buộc.');
  }
  if (!Number.isInteger(priority) || priority < 1 || priority > 3) {
    throw new Error('priority phải là 1, 2 hoặc 3.');
  }

  console.log(
    JSON.stringify(
      formatLog('createSprintTask.request', {
        issueKey,
        status,
        priority,
        assignee
      })
    )
  );

  const result = await withSchema('createSprintTask', () =>
    sql.prepare(INSERT_SPRINT_TASK).bindParams(issueKey, title, status, priority, assignee).execute()
  );

  const insertResult = result?.rows;
  const insertId =
    typeof insertResult === 'object' && insertResult !== null && !Array.isArray(insertResult)
      ? insertResult.insertId
      : null;

  console.log(
    JSON.stringify(
      formatLog('createSprintTask.success', {
        insertId,
        affectedRows: insertResult?.affectedRows
      })
    )
  );

  return {
    success: true,
    insertId
  };
});

resolver.define('getSprintTasks', async (req) => {
  const issueKey = String(req?.payload?.issueKey ?? '').trim();
  const status = String(req?.payload?.status ?? 'all').trim();

  if (!issueKey) {
    throw new Error('issueKey là bắt buộc.');
  }

  console.log(JSON.stringify(formatLog('getSprintTasks.request', { issueKey, status })));

  const result = await withSchema('getSprintTasks', () => {
    if (status === 'all') {
      return sql.prepare(SELECT_SPRINT_TASKS_ALL).bindParams(issueKey).execute();
    }
    return sql.prepare(SELECT_SPRINT_TASKS).bindParams(issueKey, status).execute();
  });

  const tasks = (Array.isArray(result?.rows) ? result.rows : []).map(mapTaskRow);

  console.log(JSON.stringify(formatLog('getSprintTasks.success', { issueKey, status, count: tasks.length })));

  return { tasks };
});

resolver.define('updateSprintTaskStatus', async (req) => {
  const issueKey = String(req?.payload?.issueKey ?? '').trim();
  const taskId = Number(req?.payload?.taskId);
  const status = normalizeStatus(req?.payload?.status);

  if (!issueKey || !taskId) {
    throw new Error('issueKey và taskId là bắt buộc.');
  }
  if (!['todo', 'in_progress', 'done'].includes(status)) {
    throw new Error('status không hợp lệ.');
  }

  await withSchema('updateSprintTaskStatus', () =>
    sql.prepare(UPDATE_SPRINT_TASK_STATUS).bindParams(status, taskId, issueKey).execute()
  );

  console.log(JSON.stringify(formatLog('updateSprintTaskStatus.success', { issueKey, taskId, status })));

  const listResult = await withSchema('getSprintTasks.reload', () =>
    sql.prepare(SELECT_SPRINT_TASKS_ALL).bindParams(issueKey).execute()
  );
  const tasks = (Array.isArray(listResult?.rows) ? listResult.rows : []).map(mapTaskRow);
  const statsResult = await withSchema('getSprintStats.reload', () =>
    sql.prepare(SELECT_SPRINT_STATS).bindParams(issueKey).execute()
  );
  const statsRows = Array.isArray(statsResult?.rows) ? statsResult.rows : [];
  const stats = statsRows.map((row) => ({
    status: row.status,
    count: Number(row.task_count ?? row.count ?? 0)
  }));
  const total = stats.reduce((sum, row) => sum + row.count, 0);

  return { success: true, tasks, stats, total };
});

resolver.define('getSprintStats', async (req) => {
  const issueKey = String(req?.payload?.issueKey ?? '').trim();

  if (!issueKey) {
    throw new Error('issueKey là bắt buộc.');
  }

  console.log(JSON.stringify(formatLog('getSprintStats.request', { issueKey })));

  const result = await withSchema('getSprintStats', () =>
    sql.prepare(SELECT_SPRINT_STATS).bindParams(issueKey).execute()
  );
  const rows = Array.isArray(result?.rows) ? result.rows : [];

  const stats = rows.map((row) => ({
    status: row.status,
    count: Number(row.task_count ?? row.count ?? 0)
  }));

  const total = stats.reduce((sum, row) => sum + row.count, 0);

  console.log(JSON.stringify(formatLog('getSprintStats.success', { issueKey, total, stats })));

  return { issueKey, total, stats };
});

export const handler = resolver.getDefinitions();
