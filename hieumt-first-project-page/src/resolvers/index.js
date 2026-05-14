import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

const getProjectFromPayload = (payload) => {
  const project = payload?.project || {};
  return {
    key: project.key || payload?.projectKey || null,
    type: project.type || project.projectTypeKey || payload?.projectType || null
  };
};

/**
 * JSON log một dòng — cùng contract với `formatLog` ở root repo:
 * level, message, functionName, accountId, timestamp; thêm field phẳng (projectKey, durationMs, …).
 */
const logEvent = ({
  level = 'info',
  message,
  functionName,
  projectKey,
  accountId,
  durationMs,
  ...extra
}) => {
  const record = {
    level,
    message,
    functionName,
    ...(projectKey != null ? { projectKey } : {}),
    accountId: accountId ?? null,
    timestamp: new Date().toISOString(),
    ...extra,
    ...(durationMs != null ? { durationMs } : {})
  };
  console.log(JSON.stringify(record));
};

resolver.define('getOverviewData', async ({ payload, context }) => {
  const startTime = Date.now();
  const { key: projectKey, type: projectType } = getProjectFromPayload(payload);

  if (!projectKey) {
    throw new Error('Missing project key in payload');
  }

  const jql = `project = ${projectKey}`;
  const requestPath = '/rest/api/3/search/approximate-count';

  logEvent({
    level: 'info',
    message: 'Jira API request started',
    functionName: 'getOverviewData',
    projectKey,
    accountId: context?.accountId,
    requestMethod: 'POST',
    requestPath,
    jql
  });

  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/search/approximate-count`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jql })
    });

    logEvent({
      level: 'info',
      message: 'Jira API response received',
      functionName: 'getOverviewData',
      projectKey,
      accountId: context?.accountId,
      responseStatus: response.status,
      responseOk: response.ok,
      durationMs: Date.now() - startTime
    });

    if (!response.ok) {
      const errorText = await response.text();
      logEvent({
        level: 'error',
        message: 'Jira API call failed',
        functionName: 'getOverviewData',
        projectKey,
        accountId: context?.accountId,
        responseStatus: response.status,
        responseOk: response.ok,
        errorText: errorText.substring(0, 300),
        durationMs: Date.now() - startTime
      });
      throw new Error(`Failed to load issue count. Status: ${response.status}`);
    }

    const data = await response.json();
    const result = {
      projectKey,
      projectType: projectType || 'unknown',
      issueCount: data.count ?? 0
    };

    logEvent({
      level: 'info',
      message: 'Operation completed',
      functionName: 'getOverviewData',
      projectKey,
      accountId: context?.accountId,
      issueCount: result.issueCount,
      durationMs: Date.now() - startTime
    });

    return result;
  } catch (error) {
    logEvent({
      level: 'error',
      message: 'Operation failed',
      functionName: 'getOverviewData',
      projectKey,
      accountId: context?.accountId,
      errorMessage: error?.message,
      durationMs: Date.now() - startTime
    });
    throw error;
  }
});

resolver.define('getRecentIssues', async ({ payload, context }) => {
  const startTime = Date.now();
  const { key: projectKey } = getProjectFromPayload(payload);
  if (!projectKey) {
    throw new Error('Missing project key in payload');
  }

  const jql = `project = ${projectKey} ORDER BY created DESC`;
  const requestPath = '/rest/api/3/search/jql';
  const fields = ['summary', 'status', 'assignee', 'created', 'priority'];

  logEvent({
    level: 'info',
    message: 'Jira API request started',
    functionName: 'getRecentIssues',
    projectKey,
    accountId: context?.accountId,
    requestMethod: 'POST',
    requestPath,
    jql,
    maxResults: 5,
    fields: fields.join(',')
  });

  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql,
        maxResults: 5,
        fields
      })
    });

    logEvent({
      level: 'info',
      message: 'Jira API response received',
      functionName: 'getRecentIssues',
      projectKey,
      accountId: context?.accountId,
      responseStatus: response.status,
      responseOk: response.ok,
      durationMs: Date.now() - startTime
    });

    if (!response.ok) {
      const errorText = await response.text();
      logEvent({
        level: 'error',
        message: 'Jira API call failed',
        functionName: 'getRecentIssues',
        projectKey,
        accountId: context?.accountId,
        responseStatus: response.status,
        responseOk: response.ok,
        errorText: errorText.substring(0, 300),
        durationMs: Date.now() - startTime
      });
      throw new Error(`Failed to load recent issues. Status: ${response.status}`);
    }

    const data = await response.json();
    const result = (data.issues || []).map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary || '(No summary)',
      status: issue.fields?.status?.name || 'Unknown',
      priority: issue.fields?.priority?.name || 'Unknown',
      assignee: issue.fields?.assignee?.displayName || 'Unassigned',
      created: issue.fields?.created || null
    }));

    logEvent({
      level: 'info',
      message: 'Operation completed',
      functionName: 'getRecentIssues',
      projectKey,
      accountId: context?.accountId,
      resultRowCount: result.length,
      durationMs: Date.now() - startTime
    });

    return result;
  } catch (error) {
    logEvent({
      level: 'error',
      message: 'Operation failed',
      functionName: 'getRecentIssues',
      projectKey,
      accountId: context?.accountId,
      errorMessage: error?.message,
      durationMs: Date.now() - startTime
    });
    throw error;
  }
});

resolver.define('getTeamAssignments', async ({ payload, context }) => {
  const startTime = Date.now();
  const { key: projectKey } = getProjectFromPayload(payload);
  if (!projectKey) {
    throw new Error('Missing project key in payload');
  }

  const jql = `project = ${projectKey} AND assignee IS NOT EMPTY AND updated >= -7d ORDER BY updated DESC`;
  const requestPath = '/rest/api/3/search/jql';
  const fields = ['assignee'];

  logEvent({
    level: 'info',
    message: 'Jira API request started',
    functionName: 'getTeamAssignments',
    projectKey,
    accountId: context?.accountId,
    requestMethod: 'POST',
    requestPath,
    jql,
    maxResults: 50,
    fields: fields.join(',')
  });

  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql,
        maxResults: 50,
        fields
      })
    });

    logEvent({
      level: 'info',
      message: 'Jira API response received',
      functionName: 'getTeamAssignments',
      projectKey,
      accountId: context?.accountId,
      responseStatus: response.status,
      responseOk: response.ok,
      durationMs: Date.now() - startTime
    });

    if (!response.ok) {
      const errorText = await response.text();
      logEvent({
        level: 'error',
        message: 'Jira API call failed',
        functionName: 'getTeamAssignments',
        projectKey,
        accountId: context?.accountId,
        responseStatus: response.status,
        responseOk: response.ok,
        errorText: errorText.substring(0, 300),
        durationMs: Date.now() - startTime
      });
      throw new Error(`Failed to load team assignments. Status: ${response.status}`);
    }

    const data = await response.json();
    const uniqueUsers = new Map();
    (data.issues || []).forEach((issue) => {
      const assignee = issue.fields?.assignee;
      if (assignee?.accountId && !uniqueUsers.has(assignee.accountId)) {
        uniqueUsers.set(assignee.accountId, {
          accountId: assignee.accountId,
          displayName: assignee.displayName || 'Unknown user'
        });
      }
    });

    const result = Array.from(uniqueUsers.values());
    logEvent({
      level: 'info',
      message: 'Operation completed',
      functionName: 'getTeamAssignments',
      projectKey,
      accountId: context?.accountId,
      resultRowCount: result.length,
      durationMs: Date.now() - startTime
    });

    return result;
  } catch (error) {
    logEvent({
      level: 'error',
      message: 'Operation failed',
      functionName: 'getTeamAssignments',
      projectKey,
      accountId: context?.accountId,
      errorMessage: error?.message,
      durationMs: Date.now() - startTime
    });
    throw error;
  }
});

export const handler = resolver.getDefinitions();
