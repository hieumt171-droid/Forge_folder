import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { createLogger } from './lib/logger.js';

/** Phải khớp filter.expression trong manifest.yml */
const TARGET_PROJECT_KEY = 'HSF';
const logger = createLogger('welcome-issue-trigger');

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
    logger.error('resolveReporter', {
      issueKey,
      status: response.status,
      bodyPreview: body.slice(0, 300)
    });
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
    logger.error('addWelcomeComment', {
      issueKey,
      status: response.status,
      bodyPreview: body.slice(0, 400)
    });
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

  return logger.run(
    'run',
    { issueKey, projectKey, selfGenerated, eventType: event?.eventType },
    async () => {
      if (!issueKey) {
        return { ok: false, reason: 'missing_issue_key' };
      }

      if (projectKey !== TARGET_PROJECT_KEY) {
        return { ok: false, reason: 'project_mismatch', projectKey, expected: TARGET_PROJECT_KEY };
      }

      const dedupKey = buildDedupKey(issueKey);
      const existing = await kvs.get(dedupKey);

      if (existing) {
        return {
          ok: true,
          skipped: true,
          reason: 'already_processed',
          issueKey,
          claimedAt: existing?.claimedAt
        };
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

        return {
          ok: true,
          issueKey,
          commentId: comment?.id ?? null,
          reporterLabel
        };
      } catch (error) {
        if (dedupClaimed) {
          await kvs.delete(dedupKey);
          logger.error('dedupRollback', { issueKey, dedupKey });
        }
        throw error;
      }
    }
  );
}
