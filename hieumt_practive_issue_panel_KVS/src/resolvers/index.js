import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const DEFAULT_SETTINGS = {
  language: 'vi',
  showAvatar: true,
  itemsPerPage: 10
};

const buildUserSettingsKey = (accountId) => `user-settings:${accountId}`;

const resolver = new Resolver();

resolver.define('getUserSettings', async (req) => {
  const accountId = req?.context?.accountId;
  if (!accountId) {
    throw new Error('Không xác định được accountId.');
  }

  const key = buildUserSettingsKey(accountId);
  const stored = await kvs.get(key);

  console.log(
    JSON.stringify(
      formatLog('getUserSettings', {
        accountId,
        key,
        found: Boolean(stored)
      })
    )
  );

  if (!stored) {
    return {
      settings: { ...DEFAULT_SETTINGS },
      savedAt: null,
      isDefault: true
    };
  }

  return {
    settings: {
      language: stored.language ?? DEFAULT_SETTINGS.language,
      showAvatar:
        typeof stored.showAvatar === 'boolean' ? stored.showAvatar : DEFAULT_SETTINGS.showAvatar,
      itemsPerPage: stored.itemsPerPage ?? DEFAULT_SETTINGS.itemsPerPage
    },
    savedAt: stored.savedAt ?? null,
    isDefault: false
  };
});

resolver.define('saveUserSettings', async (req) => {
  const accountId = req?.context?.accountId;
  const { language, showAvatar, itemsPerPage } = req?.payload || {};

  if (!accountId) {
    throw new Error('Không xác định được accountId.');
  }

  const parsedItems = Number(itemsPerPage);
  if (!Number.isFinite(parsedItems) || parsedItems < 1 || parsedItems > 100) {
    throw new Error('Số items/trang phải từ 1 đến 100.');
  }

  const key = buildUserSettingsKey(accountId);
  const savedAt = new Date().toISOString();
  const value = {
    language: String(language || DEFAULT_SETTINGS.language),
    showAvatar: Boolean(showAvatar),
    itemsPerPage: parsedItems,
    savedAt
  };

  console.log(
    JSON.stringify(
      formatLog('saveUserSettings.request', {
        accountId,
        key,
        language: value.language,
        showAvatar: value.showAvatar,
        itemsPerPage: value.itemsPerPage
      })
    )
  );

  await kvs.set(key, value);

  console.log(JSON.stringify(formatLog('saveUserSettings.success', { key, savedAt })));

  return { success: true, savedAt, settings: value };
});

resolver.define('resetUserSettings', async (req) => {
  const accountId = req?.context?.accountId;
  if (!accountId) {
    throw new Error('Không xác định được accountId.');
  }

  const key = buildUserSettingsKey(accountId);

  console.log(JSON.stringify(formatLog('resetUserSettings.request', { accountId, key })));

  await kvs.delete(key);

  console.log(JSON.stringify(formatLog('resetUserSettings.success', { key })));

  return {
    success: true,
    settings: { ...DEFAULT_SETTINGS },
    savedAt: null
  };
});

export const handler = resolver.getDefinitions();
