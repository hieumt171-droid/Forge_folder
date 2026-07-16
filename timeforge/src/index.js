const { handler } = require('./resolvers/index.js');
const { runMigration } = require('./sql/migration.js');

module.exports = { handler, runMigration };
