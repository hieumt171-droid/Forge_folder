import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Button,
  ButtonGroup,
  Checkbox,
  Form,
  FormFooter,
  FormHeader,
  FormSection,
  Label,
  LoadingButton,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Text,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' }
];

const LOCALE_OPTIONS = [
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'English', value: 'en' }
];

const DEFAULT_PREFS = {
  theme: 'light',
  showAvatar: true,
  locale: 'vi',
  notifications: true,
  version: 2
};

const formatSavedAt = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso;
  }
};

const App = () => {
  const context = useProductContext();
  const accountId = context?.accountId || '—';
  const storageKey = `user-prefs:${accountId}`;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [migratedFromV1, setMigratedFromV1] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionInfo, setActionInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [theme, setTheme] = useState(DEFAULT_PREFS.theme);
  const [showAvatar, setShowAvatar] = useState(DEFAULT_PREFS.showAvatar);
  const [locale, setLocale] = useState(DEFAULT_PREFS.locale);
  const [notifications, setNotifications] = useState(DEFAULT_PREFS.notifications);

  const applyPrefs = useCallback((prefs, meta = {}) => {
    setTheme(prefs.theme ?? DEFAULT_PREFS.theme);
    setShowAvatar(
      typeof prefs.showAvatar === 'boolean' ? prefs.showAvatar : DEFAULT_PREFS.showAvatar
    );
    setLocale(prefs.locale ?? DEFAULT_PREFS.locale);
    setNotifications(
      typeof prefs.notifications === 'boolean' ? prefs.notifications : DEFAULT_PREFS.notifications
    );
    setSavedAt(meta.savedAt ?? null);
    setMigratedFromV1(Boolean(meta.migratedFromV1));
  }, []);

  const loadPrefs = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await invoke('getUserPrefs');
      applyPrefs(res?.prefs || DEFAULT_PREFS, {
        savedAt: res?.savedAt ?? null,
        migratedFromV1: res?.migratedFromV1
      });
      console.log(
        JSON.stringify(
          formatLog('getUserPrefs.ui.success', {
            migratedFromV1: Boolean(res?.migratedFromV1),
            version: res?.prefs?.version
          })
        )
      );
    } catch (e) {
      const message = e?.message || String(e);
      setLoadError(message);
      console.log(JSON.stringify(formatLog('getUserPrefs.ui.error', { message })));
    } finally {
      setLoading(false);
    }
  }, [applyPrefs]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const selectedTheme = useMemo(
    () => THEME_OPTIONS.find((opt) => opt.value === theme) || THEME_OPTIONS[0],
    [theme]
  );

  const selectedLocale = useMemo(
    () => LOCALE_OPTIONS.find((opt) => opt.value === locale) || LOCALE_OPTIONS[0],
    [locale]
  );

  const onSave = useCallback(async () => {
    setActionError('');
    setActionInfo('');
    setSaving(true);
    try {
      const res = await invoke('saveUserPrefs', {
        theme,
        showAvatar,
        locale,
        notifications
      });
      setSavedAt(res?.savedAt ?? null);
      setMigratedFromV1(false);
      setActionInfo('Đã lưu v2 — theme/showAvatar cũ được giữ nguyên.');
      console.log(JSON.stringify(formatLog('saveUserPrefs.ui.success', { version: 2 })));
    } catch (e) {
      const message = e?.message || String(e);
      setActionError(message);
      console.log(JSON.stringify(formatLog('saveUserPrefs.ui.error', { message })));
    } finally {
      setSaving(false);
    }
  }, [theme, showAvatar, locale, notifications]);

  const onSeedV1 = useCallback(async () => {
    setActionError('');
    setActionInfo('');
    setSeeding(true);
    try {
      await invoke('seedV1UserPrefs', { theme: 'dark', showAvatar: true });
      await loadPrefs();
      setActionInfo('Đã seed v1: { theme: "dark", showAvatar: true } — reload để xem migrate.');
      console.log(JSON.stringify(formatLog('seedV1UserPrefs.ui.success', {})));
    } catch (e) {
      const message = e?.message || String(e);
      setActionError(message);
    } finally {
      setSeeding(false);
    }
  }, [loadPrefs]);

  const onReset = useCallback(async () => {
    setActionError('');
    setActionInfo('');
    try {
      await invoke('resetUserPrefs');
      applyPrefs(DEFAULT_PREFS, { savedAt: null, migratedFromV1: false });
    } catch (e) {
      setActionError(e?.message || String(e));
    }
  }, [applyPrefs]);

  if (loading) {
    return <Spinner label="Đang tải preferences..." />;
  }

  if (loadError) {
    return (
      <SectionMessage appearance="error" title="Không tải được preferences">
        <Text>{loadError}</Text>
      </SectionMessage>
    );
  }

  return (
    <Form>
      <Stack space="space.200">
        <FormHeader title="User Preferences (v2)" />
        <Text>KVS key: {storageKey}</Text>

        {migratedFromV1 ? (
          <SectionMessage appearance="information" title="Đã migrate từ v1">
            <Text>
              Đọc được data cũ (không có version). locale/notifications dùng default: vi / true.
            </Text>
          </SectionMessage>
        ) : null}

        {savedAt ? (
          <SectionMessage appearance="success">
            <Text>Đã lưu lúc {formatSavedAt(savedAt)} — schema v2</Text>
          </SectionMessage>
        ) : null}

        {actionInfo ? (
          <SectionMessage appearance="information">
            <Text>{actionInfo}</Text>
          </SectionMessage>
        ) : null}

        {actionError ? (
          <SectionMessage appearance="error" title="Lỗi">
            <Text>{actionError}</Text>
          </SectionMessage>
        ) : null}

        <FormSection>
          <Stack space="space.150">
            <Label labelFor="theme-select">Theme</Label>
            <Select
              id="theme-select"
              options={THEME_OPTIONS}
              value={selectedTheme}
              onChange={(option) => setTheme(option?.value ?? DEFAULT_PREFS.theme)}
            />

            <Checkbox
              label="Hiển thị avatar"
              isChecked={showAvatar}
              onChange={(value) => setShowAvatar(Boolean(value))}
            />

            <Label labelFor="locale-select">Locale</Label>
            <Select
              id="locale-select"
              options={LOCALE_OPTIONS}
              value={selectedLocale}
              onChange={(option) => setLocale(option?.value ?? DEFAULT_PREFS.locale)}
            />

            <Checkbox
              label="Bật notifications"
              isChecked={notifications}
              onChange={(value) => setNotifications(Boolean(value))}
            />
          </Stack>
        </FormSection>

        <FormFooter>
          <ButtonGroup>
            <LoadingButton appearance="primary" isLoading={saving} onClick={onSave}>
              Lưu (v2)
            </LoadingButton>
            <LoadingButton appearance="default" isLoading={seeding} onClick={onSeedV1}>
              Seed v1 (test)
            </LoadingButton>
            <Button appearance="subtle" onClick={onReset}>
              Reset
            </Button>
          </ButtonGroup>
        </FormFooter>
      </Stack>
    </Form>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
