import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Badge,
  Button,
  DynamicTable,
  EmptyState,
  Heading,
  SectionMessage,
  Spinner,
  Stack,
  Text
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const formatUpdated = (iso) => {
  const ms = Date.parse(String(iso || ''));
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString('vi-VN');
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await invoke('getStaleReport');
      setReport(data?.report ?? null);
      console.log(JSON.stringify(formatLog('getStaleReport.ui.success', { found: data?.found })));
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('getStaleReport.ui.error', { message })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const tableHead = useMemo(
    () => ({
      cells: [
        { key: 'key', content: 'Key', isSortable: false },
        { key: 'summary', content: 'Summary', isSortable: false },
        { key: 'status', content: 'Status', isSortable: false },
        { key: 'priority', content: 'Priority', isSortable: false },
        { key: 'assignee', content: 'Assignee', isSortable: false },
        { key: 'updated', content: 'Updated', isSortable: false }
      ]
    }),
    []
  );

  const tableRows = useMemo(() => {
    const issues = report?.issues ?? [];
    return issues.map((issue) => ({
      key: issue.key,
      cells: [
        { key: 'key', content: <Text>{issue.key}</Text> },
        { key: 'summary', content: <Text>{issue.summary || '—'}</Text> },
        { key: 'status', content: <Text>{issue.statusName || '—'}</Text> },
        { key: 'priority', content: <Text>{issue.priorityName || '—'}</Text> },
        { key: 'assignee', content: <Text>{issue.assigneeName || '—'}</Text> },
        { key: 'updated', content: <Text>{formatUpdated(issue.updated)}</Text> }
      ]
    }));
  }, [report?.issues]);

  if (loading) {
    return <Spinner label="Đang tải Stale Report..." />;
  }

  return (
    <Stack space="space.250">
      <Stack space="space.100">
        <Heading size="medium">Stale Report</Heading>
        <Text>JQL: status = &quot;In Progress&quot; AND updated &lt;= -5d</Text>
      </Stack>

      {error ? (
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      {!report ? (
        <EmptyState
          header="Chưa có report"
          description='Chạy: forge webtrigger → test-report → curl URL. Sau đó bấm "Tải lại".'
        />
      ) : (
        <Stack space="space.150">
          <Stack space="space.050">
            <Text>
              Generated: {formatUpdated(report.generatedAt)} ({report.source || '—'})
            </Text>
            <Text>
              Tổng stale issues: <Badge appearance="primary">{String(report.total ?? 0)}</Badge>
            </Text>
          </Stack>
          {(report.issues ?? []).length === 0 ? (
            <Text>Không có issue In Progress stale &gt; 5 ngày.</Text>
          ) : (
            <DynamicTable head={tableHead} rows={tableRows} />
          )}
        </Stack>
      )}

      <Button appearance="primary" onClick={loadReport}>
        Tải lại
      </Button>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
