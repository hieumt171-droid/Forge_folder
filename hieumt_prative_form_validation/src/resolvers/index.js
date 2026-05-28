import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const resolver = new Resolver();

resolver.define('saveQuickNote', async (req) => {
  const accountId = req?.context?.accountId;
  const issueKey = req?.context?.extension?.issue?.key;
  const { note, reminderDate } = req?.payload || {};

  const key = `note:${accountId}:${issueKey}`;

  console.log(
    JSON.stringify(
      formatLog('saveQuickNote.request', {
        accountId,
        issueKey,
        key,
        hasNote: Boolean(note),
        reminderDate: reminderDate ?? null
      })
    )
  );

  await kvs.set(key, {
    note,
    reminderDate,
    createdAt: new Date().toISOString()
  });

  console.log(JSON.stringify(formatLog('saveQuickNote.success', { key })));

  return { success: true };
});

export const handler = resolver.getDefinitions();

