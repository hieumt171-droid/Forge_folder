import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const safeDateMs = (iso) => {
  const ms = Date.parse(String(iso || ''));
  return Number.isFinite(ms) ? ms : null;
};

resolver.define('getProjectHealthData', async (req) => {
  const projectKey = req?.context?.extension?.project?.key;
  console.log(JSON.stringify(formatLog('getProjectHealthData.request', { projectKey })));

  const jql = `project=${projectKey}`;
  const response = await api.asUser().requestJira(
    route`/rest/api/3/search/jql?jql=${jql}&fields=summary,status,priority,assignee,issuetype,updated,created`
  );

  if (!response.ok) {
    const text = await response.text();
    console.log(
      JSON.stringify(
        formatLog('getProjectHealthData.error', {
          projectKey,
          status: response.status,
          statusText: response.statusText,
          body: text
        })
      )
    );
    throw new Error(`Jira search failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  const issuesRaw = Array.isArray(raw?.issues) ? raw.issues : [];

  const issues = issuesRaw.map((issue) => {
    const fields = issue?.fields || {};
    const status = fields?.status || {};
    const statusCategory = status?.statusCategory || {};
    const priority = fields?.priority || {};
    const assignee = fields?.assignee || null;
    const issuetype = fields?.issuetype || {};

    return {
      key: issue?.key ?? '',
      summary: fields?.summary ?? '',
      statusName: status?.name ?? '',
      statusCategory: statusCategory?.key ?? statusCategory?.name ?? '',
      priorityName: priority?.name ?? '',
      assigneeName: assignee?.displayName ?? 'Unassigned',
      issueType: issuetype?.name ?? '',
      created: fields?.created ?? null,
      updated: fields?.updated ?? null
    };
  });

  const totalIssues = issues.length;
  const inProgressCount = issues.filter(
    (it) => String(it?.statusCategory || '').toLowerCase() === 'indeterminate'
  ).length;
  const doneCount = issues.filter((it) => String(it?.statusCategory || '').toLowerCase() === 'done')
    .length;
  const bugCount = issues.filter((it) => String(it?.issueType || '').toLowerCase() === 'bug').length;

  const statusCounts = new Map();
  for (const it of issues) {
    const label = String(it?.statusName || 'Unknown');
    statusCounts.set(label, (statusCounts.get(label) || 0) + 1);
  }

  const distribution = Array.from(statusCounts.entries())
    .map(([label, value]) => ({
      type: label,
      label,
      value
    }))
    .sort((a, b) => b.value - a.value);

  const latestIssues = [...issues]
    .sort((a, b) => {
      const aMs = safeDateMs(a?.created) ?? 0;
      const bMs = safeDateMs(b?.created) ?? 0;
      return bMs - aMs;
    })
    .slice(0, 10)
    .map((it) => ({
      key: it.key,
      summary: it.summary,
      statusName: it.statusName,
      statusCategory: it.statusCategory,
      priorityName: it.priorityName,
      assigneeName: it.assigneeName,
      created: it.created
    }));

  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const staleIssues = issues.filter((it) => {
    const updatedMs = safeDateMs(it?.updated);
    if (!updatedMs) return false;
    return nowMs - updatedMs >= sevenDaysMs;
  });

  const bugPriorityOrder = ['Highest', 'High', 'Medium', 'Low'];
  const bugPriorityCounts = new Map(bugPriorityOrder.map((p) => [p, 0]));
  for (const it of issues) {
    if (String(it?.issueType || '').toLowerCase() !== 'bug') continue;
    const p = String(it?.priorityName || '');
    if (bugPriorityCounts.has(p)) bugPriorityCounts.set(p, bugPriorityCounts.get(p) + 1);
  }

  const bugsPriorityData = bugPriorityOrder.map((p) => ({
    x: p,
    y: bugPriorityCounts.get(p) || 0
  }));

  const result = {
    overview: {
      totalIssues,
      inProgress: inProgressCount,
      done: doneCount,
      totalBugs: bugCount,
      distribution
    },
    latestIssues,
    staleIssues,
    bugsPriorityData
  };

  console.log(
    JSON.stringify(
      formatLog('getProjectHealthData.success', {
        projectKey,
        totalIssues,
        inProgress: inProgressCount,
        done: doneCount,
        totalBugs: bugCount,
        latestCount: latestIssues.length,
        staleCount: staleIssues.length
      })
    )
  );

  return result;
});

export const handler = resolver.getDefinitions();
