import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Heading, SectionMessage, Spinner, Stack, Text } from '@forge/react';
import { invoke } from '@forge/bridge';

const MainAdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let alive = true;
    invoke('getAdminSettings', { forEdit: false })
      .then((res) => alive && setSettings(res))
      .catch((e) => alive && setError(e?.message || 'Không tải được cấu hình'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <Spinner size='medium' label='Đang tải…' />;
  }
  if (error) {
    return (
      <SectionMessage appearance='error' title='Lỗi'>
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space='space.200'>
      <Heading size='large'>API Key Admin</Heading>
      <Text>Trang chính — đọc cấu hình đã lưu trong Forge Storage (KVS).</Text>
      {settings?.hasApiKey ? (
        <Stack space='space.100'>
          <Text>Trạng thái: đã cấu hình API key.</Text>
          <Text>Preview: {settings.apiKeyPreview}</Text>
          {settings.updatedAt ? <Text>Cập nhật lần cuối: {settings.updatedAt}</Text> : null}
        </Stack>
      ) : (
        <SectionMessage appearance='warning' title='Chưa cấu hình'>
          <Text>Chưa có API key. Mở Manage apps → Configure để nhập và lưu.</Text>
        </SectionMessage>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <MainAdminPage />
  </React.StrictMode>
);
