import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Button,
  DatePicker,
  DynamicTable,
  EmptyState,
  Heading,
  Inline,
  Label,
  LoadingButton,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  Textfield,
  useProductContext
} from '@forge/react';
import { invoke, showFlag } from '@forge/bridge';

const DURATION_PRESETS = [15, 30, 60, 90, 120];

const fmtMin = (m) => {
  if (!m) return '—';
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}h ${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
};

const today = () => new Date().toISOString().slice(0, 10);

const toast = (type, title, description) => {
  showFlag({
    id: `timeforge-panel-${type}-${Date.now()}`,
    title,
    description,
    type,
    appearance: type,
    isAutoDismiss: true
  });
};

const DurationField = ({ id, value, onChange }) => (
  <Stack space="space.100">
    <Label labelFor={id}>Thời gian</Label>
    <Inline space="space.050" shouldWrap>
      {DURATION_PRESETS.map((m) => (
        <Button
          key={m}
          appearance={Number(value) === m ? 'primary' : 'default'}
          onClick={() => onChange(String(m))}
        >
          {fmtMin(m)}
        </Button>
      ))}
    </Inline>
    <Textfield
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Hoặc nhập phút (1–480)"
    />
    <Text>Đã chọn: {fmtMin(Number(value) || 0)}</Text>
  </Stack>
);

const EntryForm = ({ issueKey, workType, initial, submitLabel, onSubmit, onCancel }) => {
  const [durationMin, setDurationMin] = useState(
    String(initial?.durationMin ?? 60)
  );
  const [loggedAt, setLoggedAt] = useState(initial?.loggedAt ?? today());
  const [note, setNote] = useState(initial?.note ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSubmit({
        issueKey,
        durationMin: Number(durationMin),
        loggedAt,
        note
      });
      toast(
        'success',
        initial ? 'Đã cập nhật work log' : 'Work log đã lưu',
        `${issueKey} · ${fmtMin(Number(durationMin) || 0)}${workType ? ` · ${workType}` : ''}`
      );
      if (!initial) {
        setDurationMin('60');
        setNote('');
        setLoggedAt(today());
      }
    } catch (e) {
      toast('error', 'Không lưu được work log', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }, [issueKey, durationMin, loggedAt, note, onSubmit, initial, workType]);

  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Text>Loại (work type):</Text>
        <Lozenge appearance="new">{workType || '…'}</Lozenge>
      </Inline>
      <Text>Lấy từ Jira issue type — cấu hình Project settings → Work types.</Text>

      <DurationField
        id="tf-duration"
        value={durationMin}
        onChange={setDurationMin}
      />

      <Stack space="space.050">
        <Label labelFor="tf-date">Ngày làm việc</Label>
        <DatePicker
          id="tf-date"
          value={loggedAt}
          onChange={(val) =>
            setLoggedAt(
              typeof val === 'string' ? val : val?.target?.value ?? loggedAt
            )
          }
        />
      </Stack>

      <Stack space="space.050">
        <Label labelFor="tf-note">Ghi chú</Label>
        <Textfield
          id="tf-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: Fix API login, review PR #12..."
        />
      </Stack>

      <Inline space="space.100">
        <LoadingButton
          appearance="primary"
          isLoading={saving}
          onClick={handleSave}
        >
          {submitLabel}
        </LoadingButton>
        {onCancel ? (
          <Button appearance="subtle" onClick={onCancel}>
            Hủy
          </Button>
        ) : null}
      </Inline>
    </Stack>
  );
};

const IssueLogsList = ({ issueKey, workType, refreshToken }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [totalMin, setTotalMin] = useState(0);
  const [issueStatus, setIssueStatus] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await invoke('getIssueTimeLogs', { issueKey });
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
      setTotalMin(data?.totalMin ?? 0);
      setIssueStatus(data?.issueStatus ?? '');
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      toast('error', 'Không tải được lịch sử', msg);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const onDelete = useCallback(
    async (id) => {
      setBusyId(id);
      try {
        await invoke('deleteTimeEntry', { id });
        toast('success', 'Đã xóa work log', `Entry #${id}`);
        if (editing?.id === id) setEditing(null);
        await load();
      } catch (e) {
        toast('error', 'Không xóa được', e?.message || String(e));
      } finally {
        setBusyId(null);
      }
    },
    [load, editing]
  );

  const onUpdate = useCallback(
    async (payload) => {
      await invoke('updateTimeEntry', { id: editing.id, ...payload });
      setEditing(null);
      await load();
    },
    [editing, load]
  );

  if (loading) return <Spinner label="Đang tải lịch sử..." />;
  if (error) {
    return (
      <Stack space="space.100">
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
        <Button onClick={load}>Thử lại</Button>
      </Stack>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        header="Chưa có giờ nào"
        description="Sang tab Ghi giờ để thêm entry đầu tiên cho issue này."
      />
    );
  }

  if (editing) {
    return (
      <Stack space="space.200">
        <Heading size="xsmall">Sửa entry #{editing.id}</Heading>
        <EntryForm
          issueKey={issueKey}
          workType={workType || editing.category}
          initial={editing}
          submitLabel="Cập nhật"
          onSubmit={onUpdate}
          onCancel={() => setEditing(null)}
        />
      </Stack>
    );
  }

  const head = {
    cells: [
      { key: 'cat', content: 'Loại' },
      { key: 'dur', content: 'Giờ' },
      { key: 'date', content: 'Ngày' },
      { key: 'note', content: 'Ghi chú' },
      { key: 'jiraStatus', content: 'Trạng thái' },
      { key: 'act', content: '' }
    ]
  };

  const rows = entries.map((e) => ({
    key: String(e.id),
    cells: [
      {
        key: 'cat',
        content: <Lozenge appearance="new">{e.category}</Lozenge>
      },
      { key: 'dur', content: <Text weight="bold">{fmtMin(e.durationMin)}</Text> },
      { key: 'date', content: <Text>{e.loggedAt}</Text> },
      { key: 'note', content: <Text>{e.note || '—'}</Text> },
      {
        key: 'jiraStatus',
        content: (
          <Lozenge appearance={issueStatus === 'Done' ? 'success' : 'default'}>
            {issueStatus || '—'}
          </Lozenge>
        )
      },
      {
        key: 'act',
        content:
          e.status === 'draft' ? (
            <Inline space="space.050">
              <Button appearance="subtle" onClick={() => setEditing(e)}>
                Sửa
              </Button>
              <LoadingButton
                appearance="subtle"
                isLoading={busyId === e.id}
                onClick={() => onDelete(e.id)}
              >
                Xóa
              </LoadingButton>
            </Inline>
          ) : null
      }
    ]
  }));

  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center" spread="space-between">
        <Inline space="space.100" alignBlock="center">
          <Text>Tổng trên issue:</Text>
          <Lozenge appearance="inprogress">{fmtMin(totalMin)}</Lozenge>
          <Text>({entries.length} entries)</Text>
        </Inline>
        <Button appearance="subtle" onClick={load}>
          Làm mới
        </Button>
      </Inline>
      <DynamicTable head={head} rows={rows} rowsPerPage={8} />
    </Stack>
  );
};

const App = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key ?? '';
  const contextType = context?.extension?.issue?.type ?? '';
  const [refreshToken, setRefreshToken] = useState(0);
  const [workType, setWorkType] = useState(contextType || '');

  useEffect(() => {
    if (!issueKey) return;
    let cancelled = false;
    (async () => {
      try {
        const meta = await invoke('getIssueMeta', { issueKey });
        if (!cancelled && meta?.workType) setWorkType(meta.workType);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [issueKey]);

  if (!issueKey) {
    return (
      <SectionMessage appearance="warning" title="Thiếu context">
        <Text>Mở panel trên một Jira issue để dùng TimeForge.</Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.200">
      <Stack space="space.050">
        <Heading size="small">TimeForge</Heading>
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Text>
            Ghi giờ cho <Text weight="bold">{issueKey}</Text>
          </Text>
          {workType ? <Lozenge appearance="new">{workType}</Lozenge> : null}
        </Inline>
      </Stack>

      <Tabs id="timeforge-tabs">
        <TabList>
          <Tab>Ghi giờ</Tab>
          <Tab>Lịch sử</Tab>
        </TabList>
        <TabPanel>
          <EntryForm
            issueKey={issueKey}
            workType={workType}
            submitLabel="Lưu giờ"
            onSubmit={async (payload) => {
              await invoke('logTimeEntry', payload);
              setRefreshToken((n) => n + 1);
            }}
          />
        </TabPanel>
        <TabPanel>
          <IssueLogsList
            issueKey={issueKey}
            workType={workType}
            refreshToken={refreshToken}
          />
        </TabPanel>
      </Tabs>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
