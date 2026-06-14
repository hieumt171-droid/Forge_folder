import Resolver from '@forge/resolver';
import { getStoredStaleReport } from '../stale-report';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const resolver = new Resolver();

resolver.define('getStaleReport', async () => {
  console.log(JSON.stringify(formatLog('getStaleReport.request', {})));

  try {
    const report = await getStoredStaleReport();

    if (!report) {
      return {
        found: false,
        report: null,
        message: 'Chưa có report — gọi webtrigger test-report để tạo.'
      };
    }

    return {
      found: true,
      report
    };
  } catch (error) {
    console.log(
      JSON.stringify(
        formatLog('getStaleReport.error', {
          message: error?.message
        })
      )
    );
    throw error;
  }
});

export const handler = resolver.getDefinitions();
