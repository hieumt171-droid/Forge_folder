import React from 'react';
import ForgeReconciler, { Stack, Text } from '@forge/react';

/**
 * UI tối thiểu trên Jira — chỉ để app được cài trên Jira cùng site,
 * cho phép resolver gọi requestJira từ ngữ cảnh Confluence.
 */
const JiraInstallStub = () => (
  <Stack space='space.150'>
    <Text>
      Chức năng &quot;Tạo Jira issue từ text chọn&quot; dùng trong Confluence (bôi đen text → menu). Cài app
      này lên Jira là bắt buộc để API Jira hoạt động.
    </Text>
  </Stack>
);

ForgeReconciler.render(
  <React.StrictMode>
    <JiraInstallStub />
  </React.StrictMode>
);
