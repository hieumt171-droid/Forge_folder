import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Button,
  DatePicker,
  Heading,
  Inline,
  Label,
  LoadingButton,
  Lozenge,
  SectionMessage,
  Stack,
  Text,
  Textfield,
  useProductContext
} from '@forge/react';
import { invoke, showFlag, view } from '@forge/bridge';

const DURATION_PRESETS = [15, 30, 60, 90, 120];

const today = () => new Date().toISOString().slice(0, 10);

const fmtMin = (m) => {
  if (!m) return '—';
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}h ${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
};

const toast = (type, title, description) => {
  showFlag({
    id: `timeforge-${type}-${Date.now()}`,
    title,
    description,
    type,
    appearance: type,
    isAutoDismiss: true
  });
};

const App = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key ?? '';
  const contextType = context?.extension?.issue?.type ?? '';

  const [workType, setWorkType] = useState(contextType || '');
  const [durationMin, setDurationMin] = useState('60');
  const [loggedAt, setLoggedAt] = useState(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!issueKey) return;
    let cancelled = false;
    (async () => {
      try {
        const meta = await invoke('getIssueMeta', { issueKey });
        if (!cancelled && meta?.workType) setWorkType(meta.workType);
      } catch {
        /* giữ type từ context */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [issueKey]);

  const onSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await invoke('logWork', {
        issueKey,
        durationMin: Number(durationMin),
        loggedAt,
        note
      });
      toast(
        'success',
        'Work log đã lưu',
        `${issueKey} · ${fmtMin(Number(durationMin) || 0)}${workType ? ` · ${workType}` : ''}`
      );
      await view.close();
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      toast('error', 'Không lưu được work log', msg);
    } finally {
      setSaving(false);
    }
  }, [issueKey, durationMin, loggedAt, note, workType]);

  const onCancel = useCallback(() => {
    view.close();
  }, []);

  if (!issueKey) {
    return (
      <SectionMessage appearance="warning" title="Thiếu context">
        <Text>Mở form này trên một Jira issue để ghi giờ.</Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.250">
      <Stack space="space.050">
        <Heading size="small">Log Work</Heading>
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Text>
            Issue <Text weight="bold">{issueKey}</Text>
          </Text>
          {workType ? <Lozenge appearance="new">{workType}</Lozenge> : null}
        </Inline>
        <Text>Loại lấy theo work type của issue (Bug / Task / …) — cấu hình ở Project settings → Work types.</Text>
      </Stack>

      {error ? (
        <SectionMessage appearance="error" title="Không lưu được">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      <Stack space="space.100">
        <Label labelFor="lwf-duration">Thời gian</Label>
        <Inline space="space.050" shouldWrap>
          {DURATION_PRESETS.map((m) => (
            <Button
              key={m}
              appearance={Number(durationMin) === m ? 'primary' : 'default'}
              onClick={() => setDurationMin(String(m))}
            >
              {fmtMin(m)}
            </Button>
          ))}
        </Inline>
        <Textfield
          id="lwf-duration"
          value={durationMin}
          onChange={(e) => setDurationMin(e.target.value)}
          placeholder="Hoặc nhập phút (1–480)"
        />
        <Text>Đã chọn: {fmtMin(Number(durationMin) || 0)}</Text>
      </Stack>

      <Stack space="space.050">
        <Label labelFor="lwf-date">Ngày làm việc</Label>
        <DatePicker
          id="lwf-date"
          value={loggedAt}
          onChange={(val) =>
            setLoggedAt(
              typeof val === 'string' ? val : val?.target?.value ?? loggedAt
            )
          }
        />
      </Stack>

      <Stack space="space.050">
        <Label labelFor="lwf-note">Ghi chú</Label>
        <Textfield
          id="lwf-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Mô tả ngắn về công việc..."
        />
      </Stack>

      <Inline space="space.100">
        <LoadingButton appearance="primary" isLoading={saving} onClick={onSave}>
          Lưu giờ
        </LoadingButton>
        <Button appearance="subtle" onClick={onCancel}>
          Hủy
        </Button>
      </Inline>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
