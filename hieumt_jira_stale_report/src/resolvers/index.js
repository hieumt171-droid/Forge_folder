import Resolver from '@forge/resolver';
import { createLogger } from '../lib/logger.js';
import { getStoredStaleReport } from '../stale-report';

const logger = createLogger('stale-report-resolver');
const resolver = new Resolver();

resolver.define('getStaleReport', (req) =>
  logger.run('getStaleReport', {}, async () => {
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
  })
);

export const handler = resolver.getDefinitions();
