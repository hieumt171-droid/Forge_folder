import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

const JIRA_NOT_INSTALLED_HINT =
  'App chưa được cài trên Jira cùng site. Sau khi deploy manifest mới: chạy `forge install -p jira --site <site-url>` (app đã cài trên Confluence trước đó), hoặc trong Jira: Settings → Apps → cài/upgrade app này cho Jira.';

const isJiraNotInstalledError = (status, body) =>
  status === 403 && typeof body === 'string' && body.includes('not installed on this instance');

const formatJiraFailure = (status, errText) => {
  if (isJiraNotInstalledError(status, errText)) {
    return JIRA_NOT_INSTALLED_HINT;
  }
  return `HTTP ${status}: ${errText.substring(0, 200)}`;
};

resolver.define('getProjectIssueTypes', async ({ payload }) => {
  const project = payload?.project || {};
  let projectId = project.id;

  if (!projectId && project.key) {
    const metaRes = await api.asUser().requestJira(route`/rest/api/3/project/${project.key}`, {
      headers: { Accept: 'application/json' }
    });
    if (!metaRes.ok) {
      const errText = await metaRes.text();
      throw new Error(`Không đọc được project — ${formatJiraFailure(metaRes.status, errText)}`);
    }
    const meta = await metaRes.json();
    projectId = meta.id;
  }

  if (!projectId) {
    throw new Error('Thiếu project id để tải issue types');
  }

  const response = await api.asUser().requestJira(route`/rest/api/3/issuetype/project?projectId=${projectId}`, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Không tải issue types — ${formatJiraFailure(response.status, errText)}`);
  }

  const list = await response.json();
  const issueTypes = (Array.isArray(list) ? list : []).map((it) => ({
    id: String(it.id),
    name: it.name || it.untranslatedName || String(it.id)
  }));

  return { issueTypes };
});

resolver.define('createIssueFromSelection', async ({ payload }) => {
  const { project, summary, issueTypeId } = payload || {};

  if (!project?.key) {
    throw new Error('Thiếu project key');
  }
  if (!summary || !String(summary).trim()) {
    throw new Error('Thiếu summary');
  }
  if (!issueTypeId) {
    throw new Error('Thiếu issue type');
  }

  const response = await api.asUser().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        project: { key: project.key },
        summary: String(summary).trim().slice(0, 255),
        issuetype: { id: String(issueTypeId) }
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Tạo issue thất bại — ${formatJiraFailure(response.status, errText)}`);
  }

  const data = await response.json();
  return {
    key: data.key,
    id: data.id,
    self: data.self
  };
});

export const handler = resolver.getDefinitions();
