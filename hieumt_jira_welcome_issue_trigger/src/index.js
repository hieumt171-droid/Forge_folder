import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

/** Phải khớp filter.expression trong manifest.yml */
const TARGET_PROJECT_KEY = 'HSF';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const DEDUP_TTL = { unit: 'HOURS', value: 24 };

const buildDedupKey = (issueKey) => `dedupe:comment:${issueKey}`;

const formatTimestamp = (date = new Date()) =>
  date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

const resolveReporterLabel = async (event, issueKey) => {
  const associated = event?.associatedUsers;
  const users = Array.isArray(associated) ? associated : associated?.users ?? [];

  if (users.length > 0) {
    const user = users[0];
    return (
      user?.displayName ||
      user?.publicName ||
      user?.accountId ||
      'Unknown reporter'
    );
  }

  const response = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=reporter`
  );

  if (!response.ok) {
    const body = await response.text();
    console.log(
      JSON.stringify(
        formatLog('resolveReporter.error', {
          issueKey,
          status: response.status,
          body: body.slice(0, 300)
        })
      )
    );
    return 'Unknown reporter';
  }

  const issue = await response.json();
  const reporter = issue?.fields?.reporter;
  return reporter?.displayName || reporter?.accountId || 'Unknown reporter';
};

const buildWelcomeCommentAdf = ({ timestampLabel, reporterLabel }) => ({
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Chào mừng issue mới!',
          marks: [{ type: 'strong' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: `Thời gian: ${timestampLabel}` }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: `Reporter: ${reporterLabel}` }]
    }
  ]
});

const addWelcomeComment = async (issueKey, adfBody) => {
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
        formatLog('addWelcomeComment.error', {
          issueKey,
          status: response.status,
          body: body.slice(0, 400)
        })
      )
    );
    throw new Error(`Không thêm được comment: ${response.status}`);
  }

  return response.json();
};

/**
 * Handler chính — Forge gọi khi avi:jira:created:issue vượt filter.
 * Idempotent: KVS dedupe:comment:{issueKey} (TTL 24h) tránh comment trùng khi at-least-once delivery.
 */
export async function run(event) {
  const issueKey = String(event?.issue?.key ?? '').trim();
  const projectKey = String(event?.issue?.fields?.project?.key ?? '').trim();
  const selfGenerated = Boolean(event?.selfGenerated);

  console.log(
    JSON.stringify(
      formatLog('welcomeIssueTrigger.run.request', {
        issueKey,
        projectKey,
        selfGenerated,
        eventType: event?.eventType
      })
    )
  );

  if (!issueKey) {
    console.log(JSON.stringify(formatLog('welcomeIssueTrigger.run.skip', { reason: 'missing_issue_key' })));
    return { ok: false, reason: 'missing_issue_key' };
  }

  // Validate handler (bổ sung cho filter.expression server-side)
  if (projectKey !== TARGET_PROJECT_KEY) {
    console.log(
      JSON.stringify(
        formatLog('welcomeIssueTrigger.run.skip', {
          reason: 'project_mismatch',
          projectKey,
          expected: TARGET_PROJECT_KEY
        })
      )
    );
    return { ok: false, reason: 'project_mismatch' };
  }

  const dedupKey = buildDedupKey(issueKey);
  const existing = await kvs.get(dedupKey);

  if (existing) {
    console.log(
      JSON.stringify(
        formatLog('welcomeIssueTrigger.run.idempotent_skip', {
          issueKey,
          dedupKey,
          claimedAt: existing?.claimedAt
        })
      )
    );
    return { ok: true, skipped: true, reason: 'already_processed', issueKey };
  }

  let dedupClaimed = false;

  try {
    await kvs.set(
      dedupKey,
      { issueKey, claimedAt: new Date().toISOString() },
      { ttl: DEDUP_TTL }
    );
    dedupClaimed = true;

    const timestampLabel = formatTimestamp();
    const reporterLabel = await resolveReporterLabel(event, issueKey);
    const adfBody = buildWelcomeCommentAdf({ timestampLabel, reporterLabel });
    const comment = await addWelcomeComment(issueKey, adfBody);

    console.log(
      JSON.stringify(
        formatLog('welcomeIssueTrigger.run.success', {
          issueKey,
          commentId: comment?.id,
          reporterLabel
        })
      )
    );

    return {
      ok: true,
      issueKey,
      commentId: comment?.id ?? null
    };
  } catch (error) {
    if (dedupClaimed) {
      await kvs.delete(dedupKey);
      console.log(
        JSON.stringify(
          formatLog('welcomeIssueTrigger.run.dedup_rollback', {
            issueKey,
            dedupKey
          })
        )
      );
    }

    console.log(
      JSON.stringify(
        formatLog('welcomeIssueTrigger.run.error', {
          issueKey,
          message: error?.message
        })
      )
    );
    throw error;
  }
}
