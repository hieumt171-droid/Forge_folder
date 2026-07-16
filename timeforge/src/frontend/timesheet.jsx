import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Button,
  DynamicTable,
  EmptyState,
  Heading,
  Inline,
  LoadingButton,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  TextArea
} from '@forge/react';
import { invoke } from '@forge/bridge';

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DOW_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const toYMD = (d) => d.toISOString().slice(0, 10);

const currentWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return toYMD(d);
};

const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return toYMD(d);
};

const dayMeta = (ymd) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  const dow = d.getUTCDay();
  const dayNum = String(d.getUTCDate()).padStart(2, '0');
  return {
    ymd,
    dayNum,
    dow,
    labelEn: DOW[dow],
    labelVi: DOW_VI[dow],
    isWeekend: dow === 0 || dow === 6,
    isToday: ymd === toYMD(new Date())
  };
};

/** Giờ dạng số thập phân như timesheet chuẩn (1.5) */
const fmtHours = (min) => {
  const m = Number(min) || 0;
  if (!m) return '';
  const h = m / 60;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
};

const fmtMin = (m) => {
  if (!m) return '0h';
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}h ${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
};

const fmtRange = (start, end) => {
  const a = start.split('-');
  const b = end.split('-');
  return `${a[2]}/${a[1]}/${a[0].slice(2)} – ${b[2]}/${b[1]}/${b[0].slice(2)}`;
};

const Feedback = ({ msg, type, onDismiss }) => {
  if (!msg) return null;
  return (
    <SectionMessage
      appearance={type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error'}
      title={type === 'success' ? 'Thành công' : type === 'warning' ? 'Lưu ý' : 'Lỗi'}
    >
      <Stack space="space.100">
        <Text>{msg}</Text>
        <Button appearance="subtle" onClick={onDismiss}>
          Đóng
        </Button>
      </Stack>
    </SectionMessage>
  );
};

const PeriodBar = ({ weekStart, onPrev, onNext, onThisWeek }) => {
  const weekEnd = addDays(weekStart, 6);
  return (
    <Inline space="space.100" alignBlock="center" spread="space-between">
      <Inline space="space.100" alignBlock="center">
        <Button appearance="subtle" onClick={onPrev}>
          ‹
        </Button>
        <Heading size="xsmall">{fmtRange(weekStart, weekEnd)}</Heading>
        <Button appearance="subtle" onClick={onNext}>
          ›
        </Button>
      </Inline>
      <Button appearance="link" onClick={onThisWeek}>
        Tuần này
      </Button>
    </Inline>
  );
};

const TimesheetGrid = ({ weekStart, data }) => {
  const days = Array.from({ length: 7 }, (_, i) => dayMeta(addDays(weekStart, i)));

  const head = {
    cells: [
      { key: 'work', content: 'Work Item' },
      { key: 'key', content: 'Key' },
      { key: 'type', content: 'Loại' },
      { key: 'logged', content: 'Logged' },
      ...days.map((d) => ({
        key: d.ymd,
        content: (
          <Stack space="space.0">
            <Text weight={d.isToday ? 'bold' : 'medium'}>
              {d.dayNum} {d.labelEn}
            </Text>
            <Text>{d.isWeekend ? '· weekend' : d.labelVi}</Text>
          </Stack>
        )
      }))
    ]
  };

  const dataRows = (data?.rows ?? []).map((r) => ({
    key: r.issueKey,
    cells: [
      {
        key: 'work',
        content: (
          <Text weight="medium">
            {r.summary
              ? r.summary.length > 56
                ? `${r.summary.slice(0, 56)}…`
                : r.summary
              : '—'}
          </Text>
        )
      },
      {
        key: 'key',
        content: <Text>{r.issueKey}</Text>
      },
      {
        key: 'type',
        content: r.workType ? (
          <Lozenge appearance="new">{r.workType}</Lozenge>
        ) : (
          <Text>—</Text>
        )
      },
      {
        key: 'logged',
        content: <Text weight="bold">{fmtHours(r.total) || '0'}</Text>
      },
      ...days.map((d) => {
        const val = r.days?.[d.ymd] || 0;
        const label = fmtHours(val);
        return {
          key: d.ymd,
          content: (
            <Text weight={val ? 'bold' : 'medium'}>
              {label || (d.isWeekend ? '·' : '')}
            </Text>
          )
        };
      })
    ]
  }));

  const dayTotals = days.map((d) => {
    const sum = (data?.rows ?? []).reduce((s, r) => s + (r.days?.[d.ymd] || 0), 0);
    return {
      key: d.ymd,
      content: <Text weight="bold">{fmtHours(sum) || '0'}</Text>
    };
  });

  const totalRow = {
    key: '_total',
    cells: [
      { key: 'work', content: <Text weight="bold">Total</Text> },
      { key: 'key', content: <Text /> },
      { key: 'type', content: <Text /> },
      {
        key: 'logged',
        content: <Text weight="bold">{fmtHours(data?.weekTotal ?? 0) || '0'}</Text>
      },
      ...dayTotals
    ]
  };

  return <DynamicTable head={head} rows={[...dataRows, totalRow]} />;
};

const App = () => {
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvFilename, setCsvFilename] = useState('');
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setCsvContent('');
    try {
      const result = await invoke('getMyTimesheet', { weekStart });
      setData(result);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const onPrev = useCallback(() => setWeekStart((ws) => addDays(ws, -7)), []);
  const onNext = useCallback(() => setWeekStart((ws) => addDays(ws, 7)), []);
  const onThisWeek = useCallback(() => setWeekStart(currentWeekStart()), []);

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await invoke('submitWeek', { weekStart });
      if (result?.alreadySubmitted) {
        setFeedback({
          type: 'warning',
          msg: `Tuần ${weekStart} đã được nộp trước đó.`
        });
      } else {
        setFeedback({
          type: 'success',
          msg: `Đã nộp ${result?.submittedCount ?? 0} entries · cột “Nộp tuần” trên Work Log sẽ thành Đã nộp.`
        });
      }
      await load();
    } catch (e) {
      setFeedback({ type: 'error', msg: e?.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  }, [weekStart, load]);

  const onExport = useCallback(async () => {
    setExporting(true);
    setFeedback(null);
    setCsvContent('');
    try {
      const result = await invoke('exportTimesheetCsv', { weekStart });
      setCsvContent(result?.csv ?? '');
      setCsvFilename(result?.filename ?? `timesheet_${weekStart}.csv`);
      if (result?.truncated) {
        setFeedback({
          type: 'warning',
          msg: `Xuất ${result.rowCount} dòng (đã giới hạn ${result.limit}). Chọn khoảng tuần ngắn hơn nếu cần đầy đủ.`
        });
      } else {
        setFeedback({
          type: 'success',
          msg: `Sẵn sàng: ${result?.rowCount ?? 0} dòng · tổng ${fmtMin(result?.totalMin ?? 0)}.`
        });
      }
    } catch (e) {
      setFeedback({ type: 'error', msg: e?.message || String(e) });
    } finally {
      setExporting(false);
    }
  }, [weekStart]);

  const isEmpty = !data || (data.rows ?? []).length === 0;
  const capacity = data?.capacityMin ?? 5 * 8 * 60;
  const weekTotal = data?.weekTotal ?? 0;
  const byType = data?.byWorkType || data?.byCategory || {};

  return (
    <Stack space="space.250">
      <Inline space="space.100" alignBlock="center" spread="space-between">
        <Stack space="space.050">
          <Heading size="medium">Timesheet</Heading>
          <Text>Lưới giờ theo work item · nộp tuần · xuất CSV</Text>
        </Stack>
        <Inline space="space.100">
          {data?.submitted ? (
            <Lozenge appearance="success">Period submitted</Lozenge>
          ) : (
            <LoadingButton
              appearance="primary"
              isLoading={submitting}
              isDisabled={isEmpty}
              onClick={onSubmit}
            >
              Submit Period
            </LoadingButton>
          )}
        </Inline>
      </Inline>

      <PeriodBar
        weekStart={weekStart}
        onPrev={onPrev}
        onNext={onNext}
        onThisWeek={onThisWeek}
      />

      <Feedback
        msg={feedback?.msg}
        type={feedback?.type}
        onDismiss={() => setFeedback(null)}
      />

      {loading && <Spinner label="Đang tải timesheet..." />}

      {!loading && error && (
        <Stack space="space.100">
          <SectionMessage appearance="error" title="Lỗi">
            <Text>{error}</Text>
          </SectionMessage>
          <Button onClick={load}>Thử lại</Button>
        </Stack>
      )}

      {!loading && !error && (
        <Stack space="space.200">
          <Inline space="space.100" alignBlock="center" spread="space-between">
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <Text>
                Total Hours{' '}
                <Text weight="bold">
                  {fmtHours(weekTotal) || '0'} of {fmtHours(capacity)}
                </Text>
              </Text>
              {Object.keys(byType).map((t) => (
                <Lozenge key={t} appearance="new">
                  {t}: {fmtHours(byType[t])}
                </Lozenge>
              ))}
            </Inline>
            <Inline space="space.100">
            <LoadingButton
              appearance="default"
              isLoading={exporting}
              isDisabled={isEmpty}
              onClick={onExport}
            >
              Export CSV (Excel)
            </LoadingButton>
              <Button appearance="subtle" onClick={load}>
                Refresh
              </Button>
            </Inline>
          </Inline>

          {isEmpty ? (
            <EmptyState
              header="Chưa có giờ trong tuần này"
              description="Mở issue → Log Work (TimeForge) hoặc panel TimeForge → ghi giờ, rồi quay lại đây."
            />
          ) : (
            <TimesheetGrid weekStart={weekStart} data={data} />
          )}

          {csvContent ? (
            <Stack space="space.200">
              <SectionMessage appearance="information" title={`File: ${csvFilename}`}>
                <Text>
                  Forge không tải file trực tiếp. Làm theo 3 bước:{'\n'}
                  1. Nhấn vào ô CSV bên dưới → Ctrl+A → Ctrl+C{'\n'}
                  2. Mở Notepad → Ctrl+V → File → Save As{'\n'}
                  3. Đặt tên <Text weight="bold">{csvFilename}</Text>, chọn Encoding:{' '}
                  <Text weight="bold">UTF-8</Text>, lưu.{'\n'}
                  Sau đó mở file bằng Excel — Excel sẽ nhận đúng tiếng Việt.
                </Text>
              </SectionMessage>
              <TextArea
                value={csvContent}
                isReadOnly
                resize="vertical"
                minimumRows={10}
              />
            </Stack>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
