import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

resolver.define('getProjectIssues', async (req) => {
  const projectKey = req?.context?.extension?.project?.key;

  console.log(JSON.stringify(formatLog('getProjectIssues.request', { projectKey })));

  const jql = `project=${projectKey}`;
  const response = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/search/jql?jql=${jql}&fields=summary,status,priority,assignee,issuetype`
    );

  if (!response.ok) {
    const text = await response.text();
    console.log(
      JSON.stringify(
        formatLog('getProjectIssues.error', {
          projectKey,
          status: response.status,
          statusText: response.statusText,
          body: text
        })
      )
    );
    throw new Error(`Jira search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const issues = Array.isArray(data?.issues) ? data.issues : [];

  const mapped = issues.map((issue) => {
    const fields = issue?.fields || {};
    const status = fields?.status || {};
    const priority = fields?.priority || {};
    const assignee = fields?.assignee || null;
    const issuetype = fields?.issuetype || {};

    return {
      key: issue?.key ?? '',
      summary: fields?.summary ?? '',
      statusName: status?.name ?? '',
      statusCategory: status?.statusCategory?.key ?? status?.statusCategory?.name ?? '',
      priorityName: priority?.name ?? '',
      assigneeName: assignee?.displayName ?? 'Unassigned',
      issueType: issuetype?.name ?? ''
    };
  });

  console.log(
    JSON.stringify(formatLog('getProjectIssues.success', { projectKey, count: mapped.length }))
  );

  return mapped;
});

export const handler = resolver.getDefinitions();
