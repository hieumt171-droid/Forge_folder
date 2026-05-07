import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getText', (req) => {
  const startTime = Date.now();
  
  // Log point 2: API request được gửi
  console.log(`[LOG POINT 2] API request received - Endpoint: ${req.context?.extension?.name || 'getText'}`);
  console.log(req);
  
  const result = 'Hello, world!';
  const durationMs = Date.now() - startTime;
  
  // Log point 3: Function hoàn thành thành công
  console.log(`[LOG POINT 3] Function completed successfully - Duration: ${durationMs}ms, Result: ${result}`);
  
  return result;
});

export const handler = resolver.getDefinitions();
