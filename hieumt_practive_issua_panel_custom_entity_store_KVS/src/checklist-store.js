import { kvs, Sort } from '@forge/kvs';

export const ENTITY_NAME = 'checklist-item';

export const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

export const buildItemKey = (issueKey) => `${issueKey}:${Date.now()}`;

export const mapEntityResult = (result) => ({
  key: result.key,
  title: result.value?.title ?? '',
  isDone: Boolean(result.value?.isDone),
  priority: Number(result.value?.priority ?? 0),
  issueKey: result.value?.issueKey ?? ''
});

export const fetchItemsByIssue = async (issueKey) => {
  const items = [];
  let cursor;

  do {
    let query = kvs
      .entity(ENTITY_NAME)
      .query()
      .index('by-issue-status', { partition: [issueKey] })
      .sort(Sort.ASC)
      .limit(100);

    if (cursor) {
      query = query.cursor(cursor);
    }

    const page = await query.getMany();
    const results = page?.results ?? [];
    items.push(...results.map(mapEntityResult));
    cursor = page?.nextCursor;
  } while (cursor);

  return items.sort((a, b) => a.priority - b.priority);
};

export const countDoneItems = async (issueKey) => {
  const items = await fetchItemsByIssue(issueKey);
  const total = items.length;
  const done = items.filter((item) => item.isDone).length;
  return { done, total };
};

export const countDoneViaIsDoneIndex = async (issueKey) => {
  const doneItems = [];
  let cursor;

  do {
    let query = kvs.entity(ENTITY_NAME).query().index('isDone').limit(100);

    if (cursor) {
      query = query.cursor(cursor);
    }

    const page = await query.getMany();
    const results = (page?.results ?? []).filter(
      (row) => row.value?.issueKey === issueKey && row.value?.isDone === true
    );
    doneItems.push(...results);
    cursor = page?.nextCursor;
  } while (cursor);

  return doneItems.length;
};

export const getIssueKeyFromRequest = (req) =>
  req?.context?.extension?.issue?.key ||
  req?.payload?.issueKey ||
  req?.payload?.extension?.issue?.key ||
  null;
