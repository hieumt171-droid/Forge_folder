import {
  countDoneItems,
  formatLog,
  getIssueKeyFromRequest
} from './checklist-store';

export const handler = async (req) => {
  const issueKey = getIssueKeyFromRequest(req);

  if (!issueKey) {
    console.log(JSON.stringify(formatLog('dynamicProperties.missingIssueKey', {})));
    return {
      status: {
        type: 'badge',
        value: { label: '0/0' }
      }
    };
  }

  try {
    const { done, total } = await countDoneItems(issueKey);
    const label = `${done}/${total} hoàn thành`;

    console.log(
      JSON.stringify(
        formatLog('dynamicProperties.success', {
          issueKey,
          done,
          total,
          label
        })
      )
    );

    return {
      status: {
        type: 'badge',
        value: { label }
      }
    };
  } catch (e) {
    const message = e?.message || String(e);
    console.log(JSON.stringify(formatLog('dynamicProperties.error', { issueKey, message })));
    return {
      status: {
        type: 'badge',
        value: { label: '—' }
      }
    };
  }
};
