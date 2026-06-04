import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';
import {
  ENTITY_NAME,
  buildItemKey,
  countDoneItems,
  countDoneViaIsDoneIndex,
  fetchItemsByIssue,
  formatLog,
  getIssueKeyFromRequest
} from '../checklist-store';

const resolver = new Resolver();

const requireIssueKey = (req) => {
  const issueKey = getIssueKeyFromRequest(req);
  if (!issueKey) {
    throw new Error('Thiếu issueKey trong context.');
  }
  return issueKey;
};

resolver.define('listChecklistItems', async (req) => {
  const issueKey = requireIssueKey(req);
  const items = await fetchItemsByIssue(issueKey);
  const counter = await countDoneItems(issueKey);

  console.log(
    JSON.stringify(
      formatLog('listChecklistItems', {
        issueKey,
        count: items.length,
        done: counter.done,
        total: counter.total
      })
    )
  );

  return { items, counter };
});

resolver.define('addChecklistItem', async (req) => {
  const issueKey = requireIssueKey(req);
  const title = String(req?.payload?.title ?? '').trim();
  const priority = Number(req?.payload?.priority);

  if (!title) {
    throw new Error('Tiêu đề không được để trống.');
  }
  if (!Number.isInteger(priority) || priority < 1 || priority > 3) {
    throw new Error('Priority phải là 1, 2 hoặc 3.');
  }

  const key = buildItemKey(issueKey);
  const value = {
    title,
    isDone: false,
    priority,
    issueKey
  };

  await kvs.entity(ENTITY_NAME).set(key, value);

  console.log(JSON.stringify(formatLog('addChecklistItem', { issueKey, key, priority })));

  const items = await fetchItemsByIssue(issueKey);
  const counter = await countDoneItems(issueKey);

  return { success: true, key, items, counter };
});

resolver.define('toggleChecklistItem', async (req) => {
  const issueKey = requireIssueKey(req);
  const key = String(req?.payload?.key ?? '');

  if (!key) {
    throw new Error('Thiếu key của checklist item.');
  }

  const current = await kvs.entity(ENTITY_NAME).get(key);
  if (!current) {
    throw new Error('Không tìm thấy checklist item.');
  }

  const nextValue = {
    ...current,
    isDone: !Boolean(current.isDone),
    issueKey: current.issueKey ?? issueKey
  };

  await kvs.entity(ENTITY_NAME).set(key, nextValue);

  console.log(
    JSON.stringify(
      formatLog('toggleChecklistItem', {
        issueKey,
        key,
        isDone: nextValue.isDone
      })
    )
  );

  const items = await fetchItemsByIssue(issueKey);
  const counter = await countDoneItems(issueKey);

  return { success: true, items, counter };
});

resolver.define('deleteChecklistItem', async (req) => {
  const issueKey = requireIssueKey(req);
  const key = String(req?.payload?.key ?? '');

  if (!key) {
    throw new Error('Thiếu key của checklist item.');
  }

  await kvs.entity(ENTITY_NAME).delete(key);

  console.log(JSON.stringify(formatLog('deleteChecklistItem', { issueKey, key })));

  const items = await fetchItemsByIssue(issueKey);
  const counter = await countDoneItems(issueKey);

  return { success: true, items, counter };
});

resolver.define('getChecklistCounter', async (req) => {
  const issueKey = requireIssueKey(req);
  const counter = await countDoneItems(issueKey);
  const doneViaIndex = await countDoneViaIsDoneIndex(issueKey);

  console.log(
    JSON.stringify(
      formatLog('getChecklistCounter', {
        issueKey,
        ...counter,
        doneViaIndex
      })
    )
  );

  return { ...counter, doneViaIndex };
});

export const handler = resolver.getDefinitions();
