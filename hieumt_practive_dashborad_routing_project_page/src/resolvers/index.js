import Resolver from '@forge/resolver';

const resolver = new Resolver();

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

resolver.define('ping', (req) => {
  const projectKey = req?.context?.extension?.project?.key;
  console.log(JSON.stringify(formatLog('ping', { projectKey })));
  return { ok: true, projectKey };
});

export const handler = resolver.getDefinitions();
