import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, { Badge, Spinner, Stack, Text, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const ContextBadge = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key || '';
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState({ done: 0, total: 0 });

  const loadCounter = useCallback(async () => {
    if (!issueKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await invoke('getChecklistCounter', { issueKey });
      setCounter({ done: res?.done ?? 0, total: res?.total ?? 0 });
      console.log(JSON.stringify(formatLog('getChecklistCounter.ui.success', { issueKey, ...res })));
    } catch (e) {
      console.log(
        JSON.stringify(formatLog('getChecklistCounter.ui.error', { message: e?.message || String(e) }))
      );
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    loadCounter();
  }, [loadCounter]);

  if (loading) {
    return <Spinner label="Đang tải counter..." />;
  }

  return (
    <Stack space="space.100">
      <Text>Checklist progress (issueContext)</Text>
      <Badge>
        {counter.done}/{counter.total} hoàn thành
      </Badge>
      <Text>Badge khi thu gọn panel cập nhật qua dynamicProperties.</Text>
    </Stack>
  );
};

ForgeReconciler.render(<ContextBadge />);
