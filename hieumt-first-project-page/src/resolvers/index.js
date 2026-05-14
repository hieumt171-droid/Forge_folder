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

const buildLogBase = ({ functionName, projectKey, accountId }) => ({
  functionName,
  projectKey,
  accountId,
  timestamp: new Date().toISOString()
});

resolver.define('getOverviewData', async ({ payload, context }) => {
  const startTime = Date.now();
  const { key: projectKey, type: projectType } = getProjectFromPayload(payload);

  if (!projectKey) {
    throw new Error('Missing project key in payload');
  }

  const jql = `project = ${projectKey}`;
  const requestPath = '/rest/api/3/search/approximate-count';
  console.log(JSON.stringify({
    level: 'info',
    message: 'Jira API request started',
    ...buildLogBase({ functionName: 'getOverviewData', projectKey, accountId: context?.accountId }),
    request: { method: 'POST', path: requestPath, jql }
  }));

  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/search/approximate-count`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jql })
    });
    console.log(JSON.stringify({
      level: 'info',
      message: 'Jira API response received',
      ...buildLogBase({ functionName: 'getOverviewData', projectKey, accountId: context?.accountId }),
      response: { status: response.status, ok: response.ok },
      durationMs: Date.now() - startTime
    }));

    if (!response.ok) {
      const errorText = await response.text();
      console.log(JSON.stringify({
        level: 'error',
        message: 'Jira API call failed',
        ...buildLogBase({ functionName: 'getOverviewData', projectKey, accountId: context?.accountId }),
        response: { status: response.status, ok: response.ok },
        errorText: errorText.substring(0, 300),
        durationMs: Date.now() - startTime
      }));
      throw new Error(`Failed to load issue count. Status: ${response.status}`);
    }

    const data = await response.json();
    const result = {
      projectKey,
      projectType: projectType || 'unknown',
      issueCount: data.count ?? 0
    };

    console.log(JSON.stringify({
      level: 'info',
      message: 'Operation completed',
      ...buildLogBase({ functionName: 'getOverviewData', projectKey, accountId: context?.accountId }),
      durationMs: Date.now() - startTime
    }));

    return result;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Operation failed',
      ...buildLogBase({ functionName: 'getOverviewData', projectKey, accountId: context?.accountId }),
      errorMessage: error?.message,
      durationMs: Date.now() - startTime
    }));
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

  console.log(JSON.stringify({
    level: 'info',
    message: 'Jira API request started',
    ...buildLogBase({ functionName: 'getRecentIssues', projectKey, accountId: context?.accountId }),
    request: { method: 'POST', path: requestPath, jql, maxResults: 5, fields }
  }));

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

    console.log(JSON.stringify({
      level: 'info',
      message: 'Jira API response received',
      ...buildLogBase({ functionName: 'getRecentIssues', projectKey, accountId: context?.accountId }),
      response: { status: response.status, ok: response.ok },
      durationMs: Date.now() - startTime
    }));

    if (!response.ok) {
      const errorText = await response.text();
      console.log(JSON.stringify({
        level: 'error',
        message: 'Jira API call failed',
        ...buildLogBase({ functionName: 'getRecentIssues', projectKey, accountId: context?.accountId }),
        response: { status: response.status, ok: response.ok },
        errorText: errorText.substring(0, 300),
        durationMs: Date.now() - startTime
      }));
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

    console.log(JSON.stringify({
      level: 'info',
      message: 'Operation completed',
      ...buildLogBase({ functionName: 'getRecentIssues', projectKey, accountId: context?.accountId }),
      durationMs: Date.now() - startTime
    }));

    return result;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Operation failed',
      ...buildLogBase({ functionName: 'getRecentIssues', projectKey, accountId: context?.accountId }),
      errorMessage: error?.message,
      durationMs: Date.now() - startTime
    }));
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

  console.log(JSON.stringify({
    level: 'info',
    message: 'Jira API request started',
    ...buildLogBase({ functionName: 'getTeamAssignments', projectKey, accountId: context?.accountId }),
    request: { method: 'POST', path: requestPath, jql, maxResults: 50, fields }
  }));

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

    console.log(JSON.stringify({
      level: 'info',
      message: 'Jira API response received',
      ...buildLogBase({ functionName: 'getTeamAssignments', projectKey, accountId: context?.accountId }),
      response: { status: response.status, ok: response.ok },
      durationMs: Date.now() - startTime
    }));

    if (!response.ok) {
      const errorText = await response.text();
      console.log(JSON.stringify({
        level: 'error',
        message: 'Jira API call failed',
        ...buildLogBase({ functionName: 'getTeamAssignments', projectKey, accountId: context?.accountId }),
        response: { status: response.status, ok: response.ok },
        errorText: errorText.substring(0, 300),
        durationMs: Date.now() - startTime
      }));
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
    console.log(JSON.stringify({
      level: 'info',
      message: 'Operation completed',
      ...buildLogBase({ functionName: 'getTeamAssignments', projectKey, accountId: context?.accountId }),
      durationMs: Date.now() - startTime
    }));

    return result;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Operation failed',
      ...buildLogBase({ functionName: 'getTeamAssignments', projectKey, accountId: context?.accountId }),
      errorMessage: error?.message,
      durationMs: Date.now() - startTime
    }));
    throw error;
  }
});

export const handler = resolver.getDefinitions();
