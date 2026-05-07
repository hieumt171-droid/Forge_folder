import api, { route } from '@forge/api';

const normalizePriority = (priorityName) => {
  if (!priorityName) return 'low';
  const normalized = priorityName.trim().toLowerCase();
  if (normalized === 'highest' || normalized === 'critical') return 'critical';
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'low') return 'low';
  if (normalized === 'lowest') return 'lowest';
  return 'low';
};

const getRiskProperties = (priorityName) => {
  const priority = normalizePriority(priorityName);
  if (priority === 'critical') {
    return { label: 'High Risk', style: 'removed' };
  }
  if (priority === 'high') {
    return { label: 'Medium Risk', style: 'moved' };
  }
  return { label: 'Low Risk', style: 'success' };
};

const getIssueKeyFromRequest = (req) => {
  console.log(JSON.stringify({
    level: 'debug',
    message: 'dynamicProperties input snapshot',
    functionName: 'dynamicProperties',
    payload: req?.payload,
    context: req?.context,
    timestamp: new Date().toISOString()
  }));
  return (
    req?.payload?.extension?.issue?.key ||
    req?.context?.extension?.issue?.key ||
    req?.payload?.issue?.key ||
    req?.context?.issue?.key ||
    null
  );
};

export const handler = async (req) => {
  const issueKey = getIssueKeyFromRequest(req);
  if (!issueKey) {
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Missing issue key in dynamicProperties request; returning fallback property',
      functionName: 'dynamicProperties',
      accountId: req.context?.accountId,
      payloadKeys: Object.keys(req?.payload ?? {}),
      contextKeys: Object.keys(req?.context ?? {}),
      timestamp: new Date().toISOString()
    }));

    return {
      properties: [
        {
          key: 'riskScore',
          label: 'Risk Score',
          value: 'Unknown',
          style: 'default',
          title: 'Issue key is not available in dynamicProperties payload'
        }
      ]
    };
  }

  const startTime = Date.now();
  const requestPath = `/rest/api/3/issue/${issueKey}?fields=priority`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Jira API request started',
    functionName: 'dynamicProperties',
    issueKey,
    accountId: req.context?.accountId,
    request: {
      method: 'GET',
      path: requestPath
    },
    timestamp: new Date().toISOString()
  }));

  try {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=priority`,
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
      functionName: 'dynamicProperties',
      issueKey,
      accountId: req.context?.accountId,
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
        functionName: 'dynamicProperties',
        issueKey,
        accountId: req.context?.accountId,
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
      throw new Error(
        `Failed to load issue priority for ${issueKey}: ${response.status} ${errorText}`
      );
    }


    const issue = await response.json();
    const priorityName = issue?.fields?.priority?.name ?? 'Unknown';
    const risk = getRiskProperties(priorityName);

    const result = {
      properties: [
        {
          key: 'riskScore',
          label: 'Risk Score',
          value: risk.label,
          style: risk.style,
          title: `Priority: ${priorityName}`
        }
      ]
    };

    console.log(JSON.stringify({
      level: 'info',
      message: 'Operation completed',
      functionName: 'dynamicProperties',
      issueKey,
      result:result,
      accountId: req.context?.accountId,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }));

    return result;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Operation failed',
      functionName: 'dynamicProperties',
      issueKey,
      accountId: req.context?.accountId,
      errorMessage: error?.message,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }));
    throw error;
  }
};
