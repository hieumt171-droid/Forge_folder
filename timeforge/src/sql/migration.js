import { migrationRunner } from '@forge/sql';

const CREATE_TIME_ENTRIES = `
CREATE TABLE IF NOT EXISTS time_entries (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  account_id  VARCHAR(128) NOT NULL,
  issue_key   VARCHAR(50)  NOT NULL,
  project_key VARCHAR(50)  NOT NULL,
  category    VARCHAR(20)  NOT NULL,
  duration_min INT         NOT NULL,
  logged_at   DATE         NOT NULL,
  note        VARCHAR(500) NOT NULL DEFAULT '',
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_date (account_id, logged_at),
  INDEX idx_issue (account_id, issue_key)
)`;

const CREATE_WEEK_SUBMISSIONS = `
CREATE TABLE IF NOT EXISTS week_submissions (
  account_id  VARCHAR(128) NOT NULL,
  week_start  DATE         NOT NULL,
  submitted_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, week_start)
)`;

/** Loại = Jira work type (Bug/Task/…) — cần cột rộng hơn enum cũ */
const ALTER_CATEGORY_TO_WORK_TYPE = `
ALTER TABLE time_entries MODIFY COLUMN category VARCHAR(64) NOT NULL
`;

const chain = migrationRunner
  .enqueue('v001_create_time_entries', CREATE_TIME_ENTRIES)
  .enqueue('v002_create_week_submissions', CREATE_WEEK_SUBMISSIONS)
  .enqueue('v003_category_work_type', ALTER_CATEGORY_TO_WORK_TYPE);

export const applyMigrations = async () => {
  return chain.run();
};

export const runMigration = async () => {
  try {
    const applied = await applyMigrations();
    const list = await migrationRunner.list();
    for (const item of list) {
      console.log(
        JSON.stringify({
          '@formatLog': true,
          event: 'migration.checkpoint',
          name: item.name,
          migratedAt: item.migratedAt?.toISOString?.() ?? String(item.migratedAt)
        })
      );
    }
    return applied;
  } catch (e) {
    console.log(
      JSON.stringify({
        '@formatLog': true,
        event: 'migration.error',
        message: e?.message,
        code: e?.code,
        debug: e?.debug
      })
    );
    throw e;
  }
};
