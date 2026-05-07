import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('getIssueDetails', async ({ payload, context }) => {
  const { issueKey } = payload || {};
  if (!issueKey) {
    throw new Error('Missing issueKey in payload');
  }

  const startTime = Date.now();
  const requestPath = `/rest/api/3/issue/${issueKey}?fields=priority,issuetype,assignee,created`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Jira API request started',
    functionName: 'getIssueDetails',
    issueKey,
    accountId: context?.accountId,
    request: {
      method: 'GET',
      path: requestPath
    },
    timestamp: new Date().toISOString()
  }));

  try {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=priority,issuetype,assignee,created`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      }
    );

    console.log(JSON.stringify({
      level: 'info',
      message: 'Jira API response received',
      functionName: 'getIssueDetails',
      issueKey,
      accountId: context?.accountId,
      response: {
        status: response.status,
        ok: response.ok
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }));

    if (!response.ok) {
      const errorText = await response.text();
      console.log(JSON.stringify({
        level: 'error',
        message: 'Jira API call failed',
        functionName: 'getIssueDetails',
        issueKey,
        accountId: context?.accountId,
        request: {
          method: 'GET',
          path: requestPath
        },
        response: {
          status: response.status,
          ok: response.ok
        },
        errorText: errorText.substring(0, 200),
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }));
      throw new Error(`Không thể tải issue ${issueKey}. Status: ${response.status}`);
    }

    const issue = await response.json();
    const assigneeName = issue.fields?.assignee?.displayName ?? 'Chưa được giao';
    const priorityName = issue.fields?.priority?.name ?? 'Không xác định';
    const issueTypeName = issue.fields?.issuetype?.name ?? 'Không xác định';

    const result = {
      key: issueKey,
      priority: priorityName,
      issueType: issueTypeName,
      assignee: assigneeName,
      created: issue.fields?.created ?? null
    };

    console.log(JSON.stringify({
      level: 'info',
      message: 'Operation completed',
      functionName: 'getIssueDetails',
      issueKey,
      accountId: context?.accountId,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }));

    return result;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Operation failed',
      functionName: 'getIssueDetails',
      issueKey,
      accountId: context?.accountId,
      errorMessage: error?.message,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }));
    throw error;
  }
});

export const handler = resolver.getDefinitions();
