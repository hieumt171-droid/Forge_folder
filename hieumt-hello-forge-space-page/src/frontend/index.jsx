// src/frontend/index.jsx
// Đây là file frontend của app Forge Confluence Space Page
// Sử dụng React để xây dựng UI, Forge UI Kit để styling
// ForgeReconciler: React reconciler đặc biệt của Forge, thay thế ReactDOM.render()

import React from 'react';
import ForgeReconciler, { Text, Heading, Stack } from '@forge/react';
import { useProductContext } from '@forge/react';

// ── Component chính của app ───────────────────────────────────────────
// App là một React functional component
// Component này sẽ được render vào trang Confluence space page
const App = () => {
  // ── Lấy context từ Forge ───────────────────────────────────────────
  // useProductContext() là hook của Forge
  // Trả về object chứa thông tin về trang hiện tại trong Confluence/Jira
  const context = useProductContext();

  // Lấy data trực tiếp từ context
  const spaceKey = context?.extension?.space?.key;
  const spaceId = context?.extension?.space?.id;

  return (
    <Stack space='space.200'>
      <Heading as='h2'>Space Page</Heading>
      {spaceKey ? (
        <>
          <Text>Space key: {spaceKey}</Text>
          <Text>Space id: {spaceId}</Text>
          <Text>
            Lưu ý: trong context hiện tại chỉ có key và id, không có tên space đầy đủ.
          </Text>
        </>
      ) : (
        <Text>Đang lấy context...</Text>
      )}
    </Stack>
  );
};

// ── Render component vào Forge sandbox ───────────────────────────────
// ForgeReconciler.render() thay thế ReactDOM.render()
// Render component App vào trang Confluence
// React.StrictMode: chế độ strict để phát hiện bugs trong development
ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
