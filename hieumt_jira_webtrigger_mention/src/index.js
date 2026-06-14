import api, { route } from '@forge/api';

const ISSUE_KEY_REGEX = /[A-Z]+-\d+/g;
const MENTION_COMMENT = 'Được mention trong request';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const jsonResponse = (statusCode, payload, extraHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': ['application/json'],
    ...extraHeaders
  },
  body: JSON.stringify(payload)
});

const parseRequestBody = (rawBody) => {
  if (!rawBody) {
    return {};
  }

  if (typeof rawBody === 'object') {
    return rawBody;
  }

  return JSON.parse(String(rawBody));
};

const extractIssueKeys = (message) => {
  const text = String(message ?? '');
  const matches = text.match(ISSUE_KEY_REGEX) ?? [];
  return [...new Set(matches)];
};

const buildCommentAdf = (text) => ({
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text }]
    }
  ]
});

const addMentionComment = async (issueKey) => {
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: buildCommentAdf(MENTION_COMMENT) })
  });

  if (!response.ok) {
    const body = await response.text();
    console.log(
      JSON.stringify(
        formatLog('addMentionComment.error', {
          issueKey,
          status: response.status,
          body: body.slice(0, 300)
        })
      )
    );
    throw new Error(`Không comment được ${issueKey}: ${response.status}`);
  }

  return response.json();
};

export async function mentionWebhook(event = {}) {
  const method = String(event?.method ?? 'GET').toUpperCase();
  const eventType = event?.queryParameters?.event ?? event?.queryStringParameters?.event ?? null;

  console.log(
    JSON.stringify(
      formatLog('mentionWebhook.request', {
        method,
        eventType,
        hasBody: Boolean(event?.body)
      })
    )
  );

  if (method !== 'POST') {
    console.log(JSON.stringify(formatLog('mentionWebhook.reject', { reason: 'method_not_allowed', method })));
    return jsonResponse(
      405,
      { processed: false, error: 'Method Not Allowed. Use POST.' },
      { Allow: ['POST'] }
    );
  }

  try {
    const payload = parseRequestBody(event?.body);
    const message = payload?.message ?? '';
    const author = payload?.author ?? 'unknown';
    const issuesFound = extractIssueKeys(message);

    console.log(
      JSON.stringify(
        formatLog('mentionWebhook.parsed', {
          eventType,
          author,
          issuesFound
        })
      )
    );

    const commented = [];

    for (const issueKey of issuesFound) {
      await addMentionComment(issueKey);
      commented.push(issueKey);
    }

    const result = {
      processed: true,
      event: eventType,
      issuesFound: commented,
      author
    };

    console.log(JSON.stringify(formatLog('mentionWebhook.success', result)));

    return jsonResponse(200, result);
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('mentionWebhook.error', {
          message: error?.message
        })
      )
    );

    return jsonResponse(500, {
      processed: false,
      error: error?.message || 'Internal error'
    });
  }
}
