import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  ButtonGroup,
  Checkbox,
  Form,
  FormFooter,
  FormHeader,
  FormSection,
  HelperMessage,
  Label,
  LoadingButton,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Text,
  Textfield,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const LANGUAGE_OPTIONS = [
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' }
];

const DEFAULT_SETTINGS = {
  language: 'vi',
  showAvatar: true,
  itemsPerPage: '10'
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
  const storageKey = `user-settings:${accountId}`;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [language, setLanguage] = useState(DEFAULT_SETTINGS.language);
  const [showAvatar, setShowAvatar] = useState(DEFAULT_SETTINGS.showAvatar);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_SETTINGS.itemsPerPage);

  const applySettings = useCallback((settings, nextSavedAt) => {
    setLanguage(settings.language ?? DEFAULT_SETTINGS.language);
    setShowAvatar(
      typeof settings.showAvatar === 'boolean' ? settings.showAvatar : DEFAULT_SETTINGS.showAvatar
    );
    setItemsPerPage(String(settings.itemsPerPage ?? DEFAULT_SETTINGS.itemsPerPage));
    setSavedAt(nextSavedAt ?? null);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await invoke('getUserSettings');
      const settings = res?.settings || DEFAULT_SETTINGS;

      applySettings(settings, res?.savedAt ?? null);

      console.log(
        JSON.stringify(
          formatLog('getUserSettings.ui.success', {
            isDefault: Boolean(res?.isDefault),
            savedAt: res?.savedAt ?? null
          })
        )
      );
    } catch (e) {
      const message = e?.message || String(e);
      setLoadError(message);
      console.log(JSON.stringify(formatLog('getUserSettings.ui.error', { message })));
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const selectedLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((opt) => opt.value === language) || LANGUAGE_OPTIONS[0],
    [language]
  );

  const onSave = useCallback(async () => {
    setActionError('');

    const parsedItems = Number(itemsPerPage);
    if (!Number.isFinite(parsedItems) || parsedItems < 1 || parsedItems > 100) {
      setActionError('Số items/trang phải từ 1 đến 100.');
      return;
    }

    setSaving(true);
    try {
      const res = await invoke('saveUserSettings', {
        language,
        showAvatar,
        itemsPerPage: parsedItems
      });

      setSavedAt(res?.savedAt ?? null);
      console.log(JSON.stringify(formatLog('saveUserSettings.ui.success', { savedAt: res?.savedAt })));
    } catch (e) {
      const message = e?.message || String(e);
      setActionError(message);
      console.log(JSON.stringify(formatLog('saveUserSettings.ui.error', { message })));
    } finally {
      setSaving(false);
    }
  }, [language, showAvatar, itemsPerPage]);

  const onReset = useCallback(async () => {
    setActionError('');
    setResetting(true);
    try {
      await invoke('resetUserSettings');
      applySettings(DEFAULT_SETTINGS, null);
      console.log(JSON.stringify(formatLog('resetUserSettings.ui.success', {})));
    } catch (e) {
      const message = e?.message || String(e);
      setActionError(message);
      console.log(JSON.stringify(formatLog('resetUserSettings.ui.error', { message })));
    } finally {
      setResetting(false);
    }
  }, [applySettings]);

  if (loading) {
    return <Spinner label="Đang tải cài đặt..." />;
  }

  if (loadError) {
    return (
      <SectionMessage appearance="error" title="Không tải được cài đặt">
        <Text>{loadError}</Text>
      </SectionMessage>
    );
  }

  return (
    <Form>
      <Stack space="space.200">
        <FormHeader title="Cài đặt Cá nhân" />
        <Text>Preferences lưu theo user — key: {storageKey}</Text>

        {savedAt ? (
          <SectionMessage appearance="success">
            <Text>Đã lưu lúc {formatSavedAt(savedAt)}</Text>
          </SectionMessage>
        ) : null}

        {actionError ? (
          <SectionMessage appearance="error" title="Lỗi">
            <Text>{actionError}</Text>
          </SectionMessage>
        ) : null}

        <FormSection>
          <Stack space="space.150">
            <Label labelFor="language-select">Ngôn ngữ ưa thích</Label>
            <Select
              id="language-select"
              options={LANGUAGE_OPTIONS}
              value={selectedLanguage}
              onChange={(option) => {
                setLanguage(option?.value ?? DEFAULT_SETTINGS.language);
              }}
            />

            <Checkbox
              label="Hiển thị avatar"
              isChecked={showAvatar}
              onChange={(value) => {
                setShowAvatar(Boolean(value));
              }}
            />

            <Label labelFor="items-per-page">Số items/trang</Label>
            <Textfield
              id="items-per-page"
              type="number"
              value={itemsPerPage}
              onChange={(event) => {
                setItemsPerPage(String(event?.target?.value ?? event?.value ?? ''));
              }}
            />
            <HelperMessage>Nhập từ 1 đến 100</HelperMessage>
          </Stack>
        </FormSection>

        <FormFooter>
          <ButtonGroup>
            <LoadingButton appearance="primary" isLoading={saving} onClick={onSave}>
              Lưu
            </LoadingButton>
            <LoadingButton
              appearance="subtle"
              isLoading={resetting}
              onClick={(event) => {
                event?.preventDefault?.();
                onReset();
              }}
            >
              Reset về mặc định
            </LoadingButton>
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
