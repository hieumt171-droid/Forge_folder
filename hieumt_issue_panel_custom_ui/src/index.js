import Resolver from '@forge/resolver';

const resolver = new Resolver();

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

resolver.define('getText', (req) => {
  const issueKey = req?.context?.extension?.issue?.key;
  console.log(JSON.stringify(formatLog('getText.request', { issueKey })));
  console.log(JSON.stringify(formatLog('getText.success', { issueKey })));
  return 'Hello World';
});

export const handler = resolver.getDefinitions();
