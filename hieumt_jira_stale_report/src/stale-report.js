import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { createLogger } from './lib/logger.js';

export const STALE_REPORT_KEY = 'stale-report:latest';
export const STALE_JQL = 'status = "In Progress" AND updated <= -5d';
const REPORT_TIMEZONE = 'Asia/Ho_Chi_Minh';
const SCHEDULED_HOUR = 8;

const logger = createLogger('stale-report');

const getHourInTimezone = (date = new Date()) => {
  const hourText = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    timeZone: REPORT_TIMEZONE
  }).format(date);
  return Number(hourText);
};

export const shouldRunScheduledJob = () => getHourInTimezone() === SCHEDULED_HOUR;

const mapIssueRow = (issue) => {
  const fields = issue?.fields ?? {};
  return {
    key: issue?.key ?? '',
    summary: fields?.summary ?? '',
    statusName: fields?.status?.name ?? '',
    priorityName: fields?.priority?.name ?? '',
    assigneeName: fields?.assignee?.displayName ?? 'Unassigned',
    updated: fields?.updated ?? ''
  };
};

export const fetchStaleIssues = async () => {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/search/jql?jql=${STALE_JQL}&maxResults=100&fields=summary,status,priority,assignee,updated`
  );

  if (!response.ok) {
    const body = await response.text();
    logger.error('fetchStaleIssues', {
      jql: STALE_JQL,
      status: response.status,
      bodyPreview: body.slice(0, 400)
    });
    throw new Error(`JQL search failed: ${response.status}`);
  }

  const data = await response.json();
  return (Array.isArray(data?.issues) ? data.issues : []).map(mapIssueRow);
};

export const buildAndSaveStaleReport = async (source = 'unknown') => {
  const issues = await fetchStaleIssues();
  const generatedAt = new Date().toISOString();

  const report = {
    generatedAt,
    source,
    jql: STALE_JQL,
    timezone: REPORT_TIMEZONE,
    total: issues.length,
    issues
  };

  await kvs.set(STALE_REPORT_KEY, report);
  return report;
};

export const getStoredStaleReport = async () => {
  const report = await kvs.get(STALE_REPORT_KEY);
  return report ?? null;
};

export const isWebTriggerInvocation = (event) =>
  Boolean(event?.method || event?.headers || event?.queryParameters);

const toWebResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': ['application/json'] },
  body: JSON.stringify(payload)
});

export const executeGenerateStaleReport = async ({
  source,
  enforceScheduleWindow = false
}) => {
  if (enforceScheduleWindow && !shouldRunScheduledJob()) {
    const hour = getHourInTimezone();
    return {
      ok: true,
      skipped: true,
      reason: 'not_8am',
      hour,
      timezone: REPORT_TIMEZONE
    };
  }

  const report = await buildAndSaveStaleReport(source);

  return {
    ok: true,
    skipped: false,
    source,
    generatedAt: report.generatedAt,
    total: report.total,
    jql: report.jql
  };
};

export const runScheduledStaleReport = async () =>
  logger.run('scheduled', { source: 'scheduledTrigger' }, () =>
    executeGenerateStaleReport({
      source: 'scheduledTrigger',
      enforceScheduleWindow: true
    })
  );

export const runWebStaleReport = async (event = {}) => {
  try {
    return await logger.run(
      'webtrigger',
      { source: 'webtrigger', method: event?.method ?? null },
      async () => {
        const result = await executeGenerateStaleReport({
          source: 'webtrigger',
          enforceScheduleWindow: false
        });
        return toWebResponse(200, result);
      }
    );
  } catch (error) {
    return toWebResponse(500, { ok: false, message: error?.message });
  }
};
