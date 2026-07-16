import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Button,
  DynamicTable,
  EmptyState,
  Heading,
  Inline,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  User,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const fmtMin = (m) => {
  if (!m) return '—';
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}h ${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
};

const statusAppearance = (category) => {
  if (category === 'done') return 'success';
  if (category === 'indeterminate') return 'inprogress';
  return 'default';
};

const App = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [totalMin, setTotalMin] = useState(0);
  const [workType, setWorkType] = useState('');
  const [issueStatus, setIssueStatus] = useState('');
  const [issueStatusCategory, setIssueStatusCategory] = useState('');
  const [summary, setSummary] = useState('');

  const load = useCallback(async () => {
    if (!issueKey) return;
    setLoading(true);
    setError('');
    try {
      const data = await invoke('getWorkLogs', { issueKey, allUsers: true });
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setTotalMin(Number(data?.totalMin ?? 0));
      setWorkType(data?.workType ?? '');
      setIssueStatus(data?.issueStatus ?? '');
      setIssueStatusCategory(data?.issueStatusCategory ?? '');
      setSummary(data?.summary ?? '');
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (!issueKey) return null;

  if (loading) {
    return (
      <Inline space="space.100" alignBlock="center">
        <Spinner label="Đang tải work log..." size="small" />
        <Text>Đang tải work log…</Text>
      </Inline>
    );
  }

  if (error) {
    return (
      <Stack space="space.100">
        <SectionMessage appearance="error" title="Không tải được work log">
          <Text>{error}</Text>
        </SectionMessage>
        <Button appearance="subtle" onClick={load}>
          Thử lại
        </Button>
      </Stack>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        header="Chưa có work log"
        description="Dùng … → Log Work (TimeForge) hoặc panel TimeForge để ghi giờ đầu tiên."
      />
    );
  }

  const head = {
    cells: [
      { key: 'user', content: 'Người log', isSortable: false },
      { key: 'cat', content: 'Loại', isSortable: false },
      { key: 'dur', content: 'Thời gian', isSortable: false },
      { key: 'date', content: 'Ngày', isSortable: false },
      { key: 'note', content: 'Ghi chú', isSortable: false },
      { key: 'jiraStatus', content: 'Trạng thái', isSortable: false }
    ]
  };

  const rows = logs.map((log) => ({
    key: String(log.id),
    cells: [
      {
        key: 'user',
        content: log.accountId ? <User accountId={log.accountId} /> : <Text>—</Text>
      },
      {
        key: 'cat',
        content: <Lozenge appearance="new">{log.category || workType || '—'}</Lozenge>
      },
      {
        key: 'dur',
        content: <Text weight="bold">{fmtMin(log.durationMin)}</Text>
      },
      {
        key: 'date',
        content: <Text>{log.loggedAt || '—'}</Text>
      },
      {
        key: 'note',
        content: <Text>{log.note || '—'}</Text>
      },
      {
        key: 'jiraStatus',
        content: (
          <Lozenge appearance={statusAppearance(issueStatusCategory)}>
            {issueStatus || '—'}
          </Lozenge>
        )
      }
    ]
  }));

  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center" spread="space-between">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Heading size="xsmall">
            Work log · {summary || issueKey}
          </Heading>
          <Lozenge appearance="inprogress">{fmtMin(totalMin)}</Lozenge>
          <Text>{logs.length} mục</Text>
        </Inline>
        <Button appearance="subtle" onClick={load}>
          Làm mới
        </Button>
      </Inline>

      <DynamicTable
        head={head}
        rows={rows}
        rowsPerPage={10}
        emptyView="Không có work log"
      />
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
