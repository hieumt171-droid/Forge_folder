import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Heading,
  HelperMessage,
  Label,
  LoadingButton,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  Textfield
} from '@forge/react';
import { invoke } from '@forge/bridge';

const ConfigureAdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    let alive = true;
    invoke('getAdminSettings', { forEdit: true })
      .then((res) => {
        if (!alive) return;
        setApiKey(res?.apiKey || '');
      })
      .catch((e) => alive && setLoadError(e?.message || 'Không tải được cấu hình'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      await invoke('saveAdminSettings', { apiKey: apiKey.trim() });
      setSaveOk(true);
    } catch (e) {
      setSaveError(e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }, [apiKey]);

  if (loading) {
    return <Spinner size='medium' label='Đang tải…' />;
  }

  return (
    <Stack space='space.200'>
      <Heading size='large'>Cấu hình API key</Heading>
      <Text>Trang Configure (useAsConfig) — lưu vào Forge Key-Value Storage qua resolver.</Text>

      {loadError && (
        <SectionMessage appearance='error' title='Lỗi tải'>
          <Text>{loadError}</Text>
        </SectionMessage>
      )}

      <Stack space='space.100'>
        <Label labelFor='api-key-field'>API key</Label>
        <Textfield
          id='api-key-field'
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <HelperMessage>Giá trị được lưu app-scoped; không log ra console từ resolver.</HelperMessage>
      </Stack>

      {saveError && (
        <SectionMessage appearance='error' title='Lưu'>
          <Text>{saveError}</Text>
        </SectionMessage>
      )}
      {saveOk && (
        <SectionMessage appearance='success' title='Đã lưu'>
          <Text>API key đã được ghi vào Forge Storage.</Text>
        </SectionMessage>
      )}

      <LoadingButton appearance='primary' onClick={handleSave} isLoading={saving}>
        Save
      </LoadingButton>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <ConfigureAdminPage />
  </React.StrictMode>
);
