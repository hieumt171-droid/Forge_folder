import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';

const PREFS_VERSION = 2;

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const DEFAULT_V2_PREFS = {
  theme: 'light',
  showAvatar: true,
  locale: 'vi',
  notifications: true,
  version: PREFS_VERSION
};

const buildUserPrefsKey = (accountId) => `user-prefs:${accountId}`;

const requireAccountId = (req) => {
  const accountId = req?.context?.accountId;
  if (!accountId) {
    throw new Error('Không xác định được accountId.');
  }
  return accountId;
};

/** v1 không có field version; v2 có version === 2 */
const isV1Prefs = (stored) => stored != null && stored.version !== PREFS_VERSION;

/**
 * Đọc v1 hoặc v2 từ KVS, luôn trả về object v2 (không ghi đè storage ở đây).
 */
const migrateToV2 = (stored) => {
  if (!stored) {
    return { ...DEFAULT_V2_PREFS };
  }

  if (!isV1Prefs(stored)) {
    return {
      theme: stored.theme ?? DEFAULT_V2_PREFS.theme,
      showAvatar:
        typeof stored.showAvatar === 'boolean'
          ? stored.showAvatar
          : DEFAULT_V2_PREFS.showAvatar,
      locale: stored.locale ?? DEFAULT_V2_PREFS.locale,
      notifications:
        typeof stored.notifications === 'boolean'
          ? stored.notifications
          : DEFAULT_V2_PREFS.notifications,
      version: PREFS_VERSION
    };
  }

  return {
    theme: stored.theme ?? DEFAULT_V2_PREFS.theme,
    showAvatar:
      typeof stored.showAvatar === 'boolean'
        ? stored.showAvatar
        : DEFAULT_V2_PREFS.showAvatar,
    locale: DEFAULT_V2_PREFS.locale,
    notifications: DEFAULT_V2_PREFS.notifications,
    version: PREFS_VERSION
  };
};

const normalizeV2ForSave = (payload) => ({
  theme: String(payload?.theme ?? DEFAULT_V2_PREFS.theme),
  showAvatar: Boolean(payload?.showAvatar),
  locale: String(payload?.locale ?? DEFAULT_V2_PREFS.locale),
  notifications: Boolean(payload?.notifications),
  version: PREFS_VERSION,
  savedAt: new Date().toISOString()
});

const resolver = new Resolver();

resolver.define('getUserPrefs', async (req) => {
  const accountId = requireAccountId(req);
  const key = buildUserPrefsKey(accountId);
  const stored = await kvs.get(key);
  const migratedFromV1 = isV1Prefs(stored);
  const prefs = migrateToV2(stored);

  console.log(
    JSON.stringify(
      formatLog('getUserPrefs', {
        accountId,
        key,
        found: Boolean(stored),
        migratedFromV1,
        storedVersion: stored?.version ?? 'v1'
      })
    )
  );

  return {
    prefs,
    migratedFromV1,
    isDefault: !stored,
    savedAt: stored?.savedAt ?? null
  };
});

resolver.define('saveUserPrefs', async (req) => {
  const accountId = requireAccountId(req);
  const key = buildUserPrefsKey(accountId);
  const value = normalizeV2ForSave(req?.payload);

  console.log(
    JSON.stringify(
      formatLog('saveUserPrefs.request', {
        accountId,
        key,
        theme: value.theme,
        showAvatar: value.showAvatar,
        locale: value.locale,
        notifications: value.notifications,
        version: value.version
      })
    )
  );

  await kvs.set(key, value);

  console.log(JSON.stringify(formatLog('saveUserPrefs.success', { key, savedAt: value.savedAt })));

  return { success: true, prefs: value, savedAt: value.savedAt };
});

/** Chỉ dùng khi test: ghi thẳng v1 data vào KVS (không có version). */
resolver.define('seedV1UserPrefs', async (req) => {
  const accountId = requireAccountId(req);
  const key = buildUserPrefsKey(accountId);
  const theme = String(req?.payload?.theme ?? 'dark');
  const showAvatar =
    typeof req?.payload?.showAvatar === 'boolean'
      ? req.payload.showAvatar
      : true;

  const v1Value = { theme, showAvatar };

  await kvs.set(key, v1Value);

  console.log(
    JSON.stringify(formatLog('seedV1UserPrefs', { accountId, key, v1Value }))
  );

  return { success: true, seeded: v1Value };
});

resolver.define('resetUserPrefs', async (req) => {
  const accountId = requireAccountId(req);
  const key = buildUserPrefsKey(accountId);

  await kvs.delete(key);

  console.log(JSON.stringify(formatLog('resetUserPrefs', { accountId, key })));

  return { success: true, prefs: { ...DEFAULT_V2_PREFS }, savedAt: null };
});

export const handler = resolver.getDefinitions();
