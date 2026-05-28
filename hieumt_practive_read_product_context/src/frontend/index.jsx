import React from 'react';
import ForgeReconciler, { DynamicTable, Spinner, Stack, Text, useProductContext } from '@forge/react';

const head = {
  cells: [{ key: 'property', content: 'Property' }, { key: 'value', content: 'Value' }]
};

const safeValue = (value) => {
  if (value === null || value === undefined) return '—';
  return String(value);
};

const App = () => {
  const context = useProductContext();

  // Hooks phải luôn chạy cùng thứ tự; chỉ return sớm sau khi đã gọi hook.
  if (!context) return <Spinner size='medium' label='Đang tải context...' />;

  const rows = [
    { property: 'Account ID', value: context.accountId },
    { property: 'Cloud ID', value: context.cloudId },
    { property: 'Locale', value: context.locale },
    { property: 'Timezone', value: context.timezone },
    { property: 'Issue Key', value: context.extension?.issue?.key },
    { property: 'Project Key', value: context.extension?.project?.key }
  ].map((item) => ({
    key: item.property,
    cells: [{ content: item.property }, { content: safeValue(item.value) }]
  }));

  return (
    <Stack space='space.150'>
      <Text>Jira Issue Panel — Product context</Text>
      <DynamicTable head={head} rows={rows} />
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
