import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();

const SETTINGS_KEY = 'hieumt-jira-admin-page-settings';

const maskApiKey = (key) => {
  const s = String(key);
  if (!s) return null;
  if (s.length <= 4) return '****';
  return `****${s.slice(-4)}`;
};

resolver.define('getAdminSettings', async ({ payload }) => {
  const forEdit = Boolean(payload?.forEdit);
  const data = (await kvs.get(SETTINGS_KEY)) || {};
  const apiKey = typeof data.apiKey === 'string' ? data.apiKey : '';

  if (!apiKey) {
    return {
      hasApiKey: false,
      apiKey: '',
      apiKeyPreview: null,
      updatedAt: null
    };
  }

  return {
    hasApiKey: true,
    apiKey: forEdit ? apiKey : '',
    apiKeyPreview: maskApiKey(apiKey),
    updatedAt: data.updatedAt || null
  };
});

resolver.define('saveAdminSettings', async ({ payload }) => {
  const apiKey = String(payload?.apiKey ?? '').trim();
  if (!apiKey) {
    throw new Error('API key không được để trống.');
  }

  await kvs.set(SETTINGS_KEY, {
    apiKey,
    updatedAt: new Date().toISOString()
  });

  return { ok: true };
});

export const handler = resolver.getDefinitions();
