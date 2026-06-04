import { migrationRunner } from '@forge/sql';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

export const CREATE_SPRINT_TASKS_TABLE = `CREATE TABLE IF NOT EXISTS sprint_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  issue_key VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  priority INT NOT NULL,
  assignee VARCHAR(200) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const migrationChain = migrationRunner.enqueue(
  'v001_create_sprint_tasks_table',
  CREATE_SPRINT_TASKS_TABLE
);

export const applyMigrations = async () => {
  const applied = await migrationChain.run();
  console.log(JSON.stringify(formatLog('applyMigrations', { applied })));
  return applied;
};

export const runMigration = async () => {
  try {
    await applyMigrations();

    const migrations = await migrationRunner.list();
    for (const item of migrations) {
      console.log(
        JSON.stringify(
          formatLog('runMigration.checkpoint', {
            name: item.name,
            migratedAt: item.migratedAt?.toISOString?.() ?? item.migratedAt
          })
        )
      );
    }
  } catch (e) {
    const message = e?.message || String(e);
    console.log(
      JSON.stringify(
        formatLog('runMigration.error', {
          message,
          code: e?.code,
          debug: e?.debug
        })
      )
    );
    throw e;
  }
};
