import api, { route } from '@forge/api';

const TARGET_PROJECT_KEY = 'HSF';

const HIGHEST_PRIORITY_NAMES = new Set(['highest', 'cao nhất', 'blocker']);

const normalizeLabel = (value) => String(value ?? '').trim().toLowerCase();

const isHighestPriority = (label) => HIGHEST_PRIORITY_NAMES.has(normalizeLabel(label));

const getIssueTypeName = (event) =>
  String(
    event?.issue?.fields?.issueType?.name ??
      event?.issue?.fields?.issuetype?.name ??
      ''
  );

const getPriorityName = (event) =>
  String(event?.issue?.fields?.priority?.name ?? '');

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

/** Handler validate: priority phải *vừa đổi* sang Highest (changelog), không chỉ đang là Highest */
const priorityChangedToHighest = (event) => {
  const items = event?.changelog?.items;
  if (!Array.isArray(items)) {
    return false;
  }

  return items.some((item) => {
    const field = String(item?.field ?? '').toLowerCase();
    if (field !== 'priority') {
      return false;
    }

    const toLabel = String(item?.toString ?? item?.to ?? '').trim();
    const fromLabel = String(item?.fromString ?? item?.from ?? '').trim();

    return isHighestPriority(toLabel) && !isHighestPriority(fromLabel);
  });
};

const isBugIssue = (event) => normalizeLabel(getIssueTypeName(event)) === 'bug';

const buildWarningCommentAdf = ({ issueKey, projectKey, leadLabel, timestampLabel }) => ({
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Cảnh báo: Bug được nâng priority lên Highest',
          marks: [{ type: 'strong' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: `Issue: ${issueKey}` }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: `Project: ${projectKey}` }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: `Thời gian: ${timestampLabel}` }]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `Đã assign cho project lead: ${leadLabel}`
        }
      ]
    }
  ]
});

const fetchProjectLeadAccountId = async (projectKey) => {
  const response = await api.asApp().requestJira(
    route`/rest/api/3/project/${projectKey}`
  );

  if (!response.ok) {
    const body = await response.text();
    console.log(
      JSON.stringify(
        formatLog('fetchProjectLead.error', {
          projectKey,
          status: response.status,
          body: body.slice(0, 300)
        })
      )
    );
    throw new Error(`Không lấy được project lead: ${response.status}`);
  }

  const project = await response.json();
  const lead = project?.lead;

  return {
    accountId: lead?.accountId ?? null,
    displayName: lead?.displayName ?? lead?.accountId ?? 'Unknown lead'
  };
};

const assignIssueToLead = async (issueKey, accountId) => {
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/assignee`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accountId })
  });

  if (!response.ok) {
    const body = await response.text();
    console.log(
      JSON.stringify(
        formatLog('assignIssue.error', {
          issueKey,
          accountId,
          status: response.status,
          body: body.slice(0, 300)
        })
      )
    );
    throw new Error(`Assign thất bại: ${response.status}`);
  }
};

const addWarningComment = async (issueKey, adfBody) => {
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: adfBody })
  });

  if (!response.ok) {
    const body = await response.text();
    console.log(
      JSON.stringify(
        formatLog('addWarningComment.error', {
          issueKey,
          status: response.status,
          body: body.slice(0, 300)
        })
      )
    );
    throw new Error(`Không thêm được comment: ${response.status}`);
  }

  return response.json();
};

export async function run(event) {
  const issueKey = String(event?.issue?.key ?? '').trim();
  const projectKey = String(event?.issue?.fields?.project?.key ?? '').trim();
  const priorityName = getPriorityName(event);
  const issueTypeName = getIssueTypeName(event);

  console.log(
    JSON.stringify(
      formatLog('bugPriorityTrigger.run.request', {
        issueKey,
        projectKey,
        issueTypeName,
        priorityName,
        selfGenerated: Boolean(event?.selfGenerated),
        changelog: (event?.changelog?.items ?? []).map((i) => ({
          field: i?.field,
          from: i?.fromString ?? i?.from,
          to: i?.toString ?? i?.to
        }))
      })
    )
  );

  if (!issueKey) {
    return { ok: false, reason: 'missing_issue_key' };
  }

  if (projectKey && projectKey !== TARGET_PROJECT_KEY) {
    console.log(
      JSON.stringify(
        formatLog('bugPriorityTrigger.run.skip', {
          reason: 'project_mismatch',
          projectKey,
          expected: TARGET_PROJECT_KEY
        })
      )
    );
    return { ok: false, reason: 'project_mismatch' };
  }

  if (!isBugIssue(event)) {
    console.log(JSON.stringify(formatLog('bugPriorityTrigger.run.skip', { reason: 'not_bug' })));
    return { ok: false, reason: 'not_bug' };
  }

  if (!priorityChangedToHighest(event)) {
    console.log(
      JSON.stringify(
        formatLog('bugPriorityTrigger.run.skip', {
          reason: 'priority_not_changed_to_highest',
          priorityName
        })
      )
    );
    return { ok: false, reason: 'priority_not_changed_to_highest' };
  }

  try {
    const { accountId: leadAccountId, displayName: leadLabel } =
      await fetchProjectLeadAccountId(projectKey);

    if (!leadAccountId) {
      throw new Error(`Project ${projectKey} không có project lead.`);
    }

    await assignIssueToLead(issueKey, leadAccountId);

    const timestampLabel = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh'
    });
    const adfBody = buildWarningCommentAdf({
      issueKey,
      projectKey,
      leadLabel,
      timestampLabel
    });
    const comment = await addWarningComment(issueKey, adfBody);

    console.log(
      JSON.stringify(
        formatLog('bugPriorityTrigger.run.success', {
          issueKey,
          projectKey,
          leadAccountId,
          commentId: comment?.id
        })
      )
    );

    return {
      ok: true,
      issueKey,
      assignedTo: leadAccountId,
      commentId: comment?.id ?? null
    };
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('bugPriorityTrigger.run.error', {
          issueKey,
          message: error?.message
        })
      )
    );
    throw error;
  }
}
