import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('getIssueDetails', async ({ context }) => {
  const issueKey = context?.extension?.issue?.key;

  console.log(JSON.stringify({ level: 'INFO', message: 'Đang fetch dữ liệu issue', issueKey }));

  if (!issueKey) {
    return null;
  }

  const res = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=summary,status,priority,assignee,comment,created`
    );

  if (!res.ok) {
    throw new Error('Không thể lấy thông tin issue từ Jira API');
  }

  const data = await res.json();
  if (!data) return null;

  const summary = data.fields?.summary ?? null;
  const statusName = data.fields?.status?.name ?? null;
  const statusColor = data.fields?.status?.statusCategory?.colorName ?? null;
  const priorityName = data.fields?.priority?.name ?? null;
  const assigneeName = data.fields?.assignee?.displayName ?? 'Unassigned';
  const commentCount = Array.isArray(data.fields?.comment?.comments) ? data.fields.comment.comments.length : 0;
  const created = data.fields?.created ?? null;

  return {
    summary,
    statusName,
    statusColor,
    priorityName,
    assigneeName,
    commentCount,
    created
  };
});

export const handler = resolver.getDefinitions();
