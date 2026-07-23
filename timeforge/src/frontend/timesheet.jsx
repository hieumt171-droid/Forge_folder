import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Box,
  Button,
  EmptyState,
  Heading,
  Inline,
  Label,
  LoadingButton,
  Lozenge,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  Textfield,
  User,
  UserPicker,
  xcss
} from '@forge/react';
import { invoke, showFlag } from '@forge/bridge';

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

const approvalAppearance = (status) => {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'removed';
  if (status === 'pending') return 'inprogress';
  return 'default';
};

const approvalLabel = (status) => {
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'rejected') return 'Từ chối';
  if (status === 'pending') return 'Chờ duyệt';
  return 'Chưa nộp';
};

/** Toast kiểu Jira Flag — tự ẩn */
const toast = (type, title, description) => {
  showFlag({
    id: `timeforge-ts-${type}-${Date.now()}`,
    title,
    description,
    type,
    appearance: type,
    isAutoDismiss: true
  });
};

const downloadXlsx = (base64, filename) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'timesheet.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* ——— Table styles (Clean UI via design tokens) ——— */
const tableShell = xcss({
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderColor: 'color.border',
  borderRadius: 'radius.medium',
  overflow: 'hidden',
  backgroundColor: 'elevation.surface'
});

const tableScroll = xcss({
  width: '100%',
  overflowX: 'auto'
});

const tableInner = xcss({
  minWidth: '920px'
});

const headerRow = xcss({
  backgroundColor: 'color.background.neutral.bold',
  paddingBlock: 'space.150',
  paddingInline: 'space.100',
  gap: 'space.0'
});

const rowEven = xcss({
  backgroundColor: 'elevation.surface',
  paddingBlock: 'space.150',
  paddingInline: 'space.100',
  borderTopWidth: 'border.width',
  borderTopStyle: 'solid',
  borderTopColor: 'color.border',
  ':hover': {
    backgroundColor: 'elevation.surface.hovered'
  }
});

const rowOdd = xcss({
  backgroundColor: 'color.background.neutral.subtle',
  paddingBlock: 'space.150',
  paddingInline: 'space.100',
  borderTopWidth: 'border.width',
  borderTopStyle: 'solid',
  borderTopColor: 'color.border',
  ':hover': {
    backgroundColor: 'color.background.neutral.subtle.hovered'
  }
});

const totalRowStyle = xcss({
  backgroundColor: 'color.background.neutral',
  paddingBlock: 'space.150',
  paddingInline: 'space.100',
  borderTopWidth: 'border.width',
  borderTopStyle: 'solid',
  borderTopColor: 'color.border'
});

const colWork = xcss({ width: '200px', paddingInline: 'space.150', flexShrink: '0' });
const colKey = xcss({ width: '88px', paddingInline: 'space.150', flexShrink: '0' });
const colType = xcss({ width: '96px', paddingInline: 'space.150', flexShrink: '0' });
const colLogged = xcss({ width: '72px', paddingInline: 'space.150', flexShrink: '0' });
const colDay = xcss({ width: '64px', paddingInline: 'space.100', flexShrink: '0' });

const reviewTableInner = xcss({ minWidth: '680px' });
const reviewColUser = xcss({ width: '200px', paddingInline: 'space.150', flexShrink: '0' });
const reviewColWeek = xcss({ width: '160px', paddingInline: 'space.150', flexShrink: '0' });
const reviewColWhen = xcss({ width: '160px', paddingInline: 'space.150', flexShrink: '0' });
const reviewColAct = xcss({ width: '140px', paddingInline: 'space.150', flexShrink: '0' });

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

/** Bảng timesheet: header tối, zebra, hover, scroll ngang */
const TimesheetGrid = ({ weekStart, data }) => {
  const days = Array.from({ length: 7 }, (_, i) => dayMeta(addDays(weekStart, i)));
  const rows = data?.rows ?? [];

  return (
    <Box xcss={tableShell}>
      <Box xcss={tableScroll}>
        <Box xcss={tableInner}>
          {/* Header */}
          <Box xcss={headerRow}>
            <Inline alignBlock="center" shouldWrap={false}>
              <Box xcss={colWork}>
                <Text weight="bold">WORK ITEM</Text>
              </Box>
              <Box xcss={colKey}>
                <Text weight="bold">KEY</Text>
              </Box>
              <Box xcss={colType}>
                <Text weight="bold">LOẠI</Text>
              </Box>
              <Box xcss={colLogged}>
                <Text weight="bold">LOGGED</Text>
              </Box>
              {days.map((d) => (
                <Box key={d.ymd} xcss={colDay}>
                  <Stack space="space.0">
                    <Text weight="bold">
                      {d.dayNum} {d.labelEn}
                    </Text>
                    <Text>{d.isWeekend ? 'weekend' : d.labelVi}</Text>
                  </Stack>
                </Box>
              ))}
            </Inline>
          </Box>

          {/* Data rows — zebra striping */}
          {rows.map((r, idx) => (
            <Box key={r.issueKey} xcss={idx % 2 === 0 ? rowEven : rowOdd}>
              <Inline alignBlock="center" shouldWrap={false}>
                <Box xcss={colWork}>
                  <Text weight="medium">
                    {r.summary
                      ? r.summary.length > 48
                        ? `${r.summary.slice(0, 48)}…`
                        : r.summary
                      : '—'}
                  </Text>
                </Box>
                <Box xcss={colKey}>
                  <Text>{r.issueKey}</Text>
                </Box>
                <Box xcss={colType}>
                  {r.workType ? (
                    <Lozenge appearance="new">{r.workType}</Lozenge>
                  ) : (
                    <Text>—</Text>
                  )}
                </Box>
                <Box xcss={colLogged}>
                  <Text weight="bold">{fmtHours(r.total) || '0'}</Text>
                </Box>
                {days.map((d) => {
                  const val = r.days?.[d.ymd] || 0;
                  const label = fmtHours(val);
                  return (
                    <Box key={d.ymd} xcss={colDay}>
                      <Text weight={val ? 'bold' : 'medium'}>
                        {label || (d.isWeekend ? '·' : '')}
                      </Text>
                    </Box>
                  );
                })}
              </Inline>
            </Box>
          ))}

          {/* Total */}
          <Box xcss={totalRowStyle}>
            <Inline alignBlock="center" shouldWrap={false}>
              <Box xcss={colWork}>
                <Text weight="bold">Total</Text>
              </Box>
              <Box xcss={colKey}>
                <Text />
              </Box>
              <Box xcss={colType}>
                <Text />
              </Box>
              <Box xcss={colLogged}>
                <Text weight="bold">{fmtHours(data?.weekTotal ?? 0) || '0'}</Text>
              </Box>
              {days.map((d) => {
                const sum = rows.reduce((s, r) => s + (r.days?.[d.ymd] || 0), 0);
                return (
                  <Box key={d.ymd} xcss={colDay}>
                    <Text weight="bold">{fmtHours(sum) || '0'}</Text>
                  </Box>
                );
              })}
            </Inline>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const ReviewTable = ({ items, onSelect }) => (
  <Box xcss={tableShell}>
    <Box xcss={tableScroll}>
      <Box xcss={reviewTableInner}>
        <Box xcss={headerRow}>
          <Inline alignBlock="center" shouldWrap={false}>
            <Box xcss={reviewColUser}>
              <Text weight="bold">NGƯỜI NỘP</Text>
            </Box>
            <Box xcss={reviewColWeek}>
              <Text weight="bold">TUẦN</Text>
            </Box>
            <Box xcss={reviewColWhen}>
              <Text weight="bold">NỘP LÚC</Text>
            </Box>
            <Box xcss={reviewColAct}>
              <Text weight="bold" />
            </Box>
          </Inline>
        </Box>
        {items.map((item, idx) => (
          <Box
            key={`${item.submitterAccountId}-${item.weekStart}`}
            xcss={idx % 2 === 0 ? rowEven : rowOdd}
          >
            <Inline alignBlock="center" shouldWrap={false}>
              <Box xcss={reviewColUser}>
                <User accountId={item.submitterAccountId} />
              </Box>
              <Box xcss={reviewColWeek}>
                <Text>{fmtRange(item.weekStart, item.weekEnd)}</Text>
              </Box>
              <Box xcss={reviewColWhen}>
                <Text>
                  {item.submittedAt
                    ? item.submittedAt.slice(0, 16).replace('T', ' ')
                    : '—'}
                </Text>
              </Box>
              <Box xcss={reviewColAct}>
                <Button appearance="primary" onClick={() => onSelect(item)}>
                  Xem & duyệt
                </Button>
              </Box>
            </Inline>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

const TimesheetView = ({
  weekStart,
  targetAccountId,
  showSubmit,
  showReviewActions,
  onReviewed
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [approver, setApprover] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = { weekStart };
      if (targetAccountId) payload.targetAccountId = targetAccountId;
      const result = await invoke('getTimesheet', payload);
      setData(result);
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      toast('error', 'Không tải được timesheet', msg);
    } finally {
      setLoading(false);
    }
  }, [weekStart, targetAccountId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = useCallback(async () => {
    if (!approver?.id) {
      toast('error', 'Thiếu người duyệt', 'Chọn người duyệt trước khi nộp.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await invoke('submitWeek', {
        weekStart,
        approverAccountId: approver.id
      });
      if (result?.alreadySubmitted) {
        toast('warning', 'Đã nộp trước đó', `Tuần ${weekStart} đang chờ duyệt.`);
      } else {
        toast(
          'success',
          'Đã nộp timesheet',
          `Đã nộp ${result?.submittedCount ?? 0} entries · chờ người duyệt xác nhận.`
        );
        setShowSubmitForm(false);
      }
      await load();
    } catch (e) {
      toast('error', 'Nộp thất bại', e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  }, [weekStart, approver, load]);

  const onReview = useCallback(
    async (action) => {
      setReviewing(true);
      try {
        await invoke('reviewWeek', {
          submitterAccountId: targetAccountId,
          weekStart,
          action,
          reviewNote
        });
        toast(
          'success',
          action === 'approve' ? 'Đã duyệt' : 'Đã từ chối',
          action === 'approve'
            ? 'Timesheet đã được duyệt.'
            : 'Người nộp có thể sửa và nộp lại.'
        );
        setReviewNote('');
        await load();
        onReviewed?.();
      } catch (e) {
        toast('error', 'Duyệt thất bại', e?.message || String(e));
      } finally {
        setReviewing(false);
      }
    },
    [targetAccountId, weekStart, reviewNote, load, onReviewed]
  );

  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const payload = { weekStart };
      if (targetAccountId) payload.targetAccountId = targetAccountId;
      const result = await invoke('exportTimesheetExcel', payload);
      if (!result?.base64) {
        throw new Error('Không nhận được file Excel từ server.');
      }
      downloadXlsx(result.base64, result.filename);
      if (result?.truncated) {
        toast(
          'warning',
          'Đã tải Excel',
          `${result.filename} (${result.rowCount} dòng, giới hạn ${result.limit}).`
        );
      } else {
        toast(
          'success',
          'Đã tải Excel',
          `${result.filename} · ${result?.rowCount ?? 0} dòng · ${fmtMin(result?.totalMin ?? 0)}.`
        );
      }
    } catch (e) {
      toast('error', 'Export thất bại', e?.message || String(e));
    } finally {
      setExporting(false);
    }
  }, [weekStart, targetAccountId]);

  const isEmpty = !data || (data.rows ?? []).length === 0;
  const weekTotal = data?.weekTotal ?? 0;
  const byType = data?.byWorkType || data?.byCategory || {};
  const status = data?.approvalStatus;
  const canSubmit = showSubmit && !isEmpty && (!status || status === 'rejected');
  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <Stack space="space.200">
      {loading && <Spinner label="Đang tải timesheet..." />}

      {!loading && error && (
        <Stack space="space.100">
          <Text>{error}</Text>
          <Button onClick={load}>Thử lại</Button>
        </Stack>
      )}

      {!loading && !error && data && (
        <Stack space="space.200">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            {targetAccountId ? (
              <Inline space="space.050" alignBlock="center">
                <Text>Người nộp:</Text>
                <User accountId={targetAccountId} />
              </Inline>
            ) : null}
            {status ? (
              <Lozenge appearance={approvalAppearance(status)}>
                {approvalLabel(status)}
              </Lozenge>
            ) : (
              <Lozenge appearance="default">Nháp</Lozenge>
            )}
            {data.approverAccountId ? (
              <Inline space="space.050" alignBlock="center">
                <Text>Người duyệt:</Text>
                <User accountId={data.approverAccountId} />
              </Inline>
            ) : null}
            {isPending && !showReviewActions ? (
              <Text>Đã nộp — không sửa được cho đến khi duyệt/từ chối.</Text>
            ) : null}
            {isApproved ? <Text>Timesheet tuần này đã được duyệt.</Text> : null}
          </Inline>

          {isRejected && data.reviewNote ? (
            <Inline space="space.050" alignBlock="center" shouldWrap>
              <Lozenge appearance="removed">Từ chối</Lozenge>
              <Text>{data.reviewNote}</Text>
            </Inline>
          ) : null}

          <Inline space="space.100" alignBlock="center" spread="space-between">
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <Text>
                Total{' '}
                <Text weight="bold">
                  {fmtHours(weekTotal) || '0'} / {fmtHours(data.capacityMin)}
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
                Export Excel
              </LoadingButton>
              <Button appearance="subtle" onClick={load}>
                Refresh
              </Button>
            </Inline>
          </Inline>

          {isEmpty ? (
            <EmptyState
              header="Chưa có giờ trong tuần này"
              description="Mở issue → Log Work (TimeForge) hoặc panel TimeForge → ghi giờ."
            />
          ) : (
            <TimesheetGrid weekStart={weekStart} data={data} />
          )}

          {canSubmit && !showSubmitForm ? (
            <Button appearance="primary" onClick={() => setShowSubmitForm(true)}>
              Nộp timesheet tuần này
            </Button>
          ) : null}

          {canSubmit && showSubmitForm ? (
            <Stack space="space.150">
              <Text>
                Chọn người duyệt (PM / team lead). Sau khi nộp, chỉ bạn và người
                duyệt mới xem được timesheet tuần này.
              </Text>
              <UserPicker
                name="approver"
                label="Người duyệt"
                placeholder="Tìm tên hoặc email..."
                isRequired
                onChange={(user) => setApprover(user)}
              />
              <Inline space="space.100">
                <LoadingButton
                  appearance="primary"
                  isLoading={submitting}
                  isDisabled={!approver?.id}
                  onClick={onSubmit}
                >
                  Gửi duyệt
                </LoadingButton>
                <Button appearance="subtle" onClick={() => setShowSubmitForm(false)}>
                  Hủy
                </Button>
              </Inline>
            </Stack>
          ) : null}

          {showReviewActions && data.canReview ? (
            <Stack space="space.150">
              <Text>Xem kỹ bảng giờ bên trên trước khi duyệt hoặc từ chối.</Text>
              <Stack space="space.050">
                <Label labelFor="review-note">Ghi chú (bắt buộc khi từ chối)</Label>
                <Textfield
                  id="review-note"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Ví dụ: thiếu giờ thứ 4, cần bổ sung note..."
                />
              </Stack>
              <Inline space="space.100">
                <LoadingButton
                  appearance="primary"
                  isLoading={reviewing}
                  onClick={() => onReview('approve')}
                >
                  Duyệt
                </LoadingButton>
                <LoadingButton
                  appearance="danger"
                  isLoading={reviewing}
                  onClick={() => onReview('reject')}
                >
                  Từ chối
                </LoadingButton>
              </Inline>
            </Stack>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
};

const ReviewTab = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await invoke('getPendingApprovals', {});
      setItems(Array.isArray(result?.items) ? result.items : []);
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      toast('error', 'Không tải danh sách duyệt', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  if (selected) {
    return (
      <Stack space="space.200">
        <Inline space="space.100" alignBlock="center">
          <Button appearance="subtle" onClick={() => setSelected(null)}>
            ← Danh sách chờ duyệt
          </Button>
          <Heading size="xsmall">
            Duyệt tuần {fmtRange(selected.weekStart, selected.weekEnd)}
          </Heading>
        </Inline>
        <TimesheetView
          weekStart={selected.weekStart}
          targetAccountId={selected.submitterAccountId}
          showSubmit={false}
          showReviewActions
          onReviewed={() => {
            setSelected(null);
            setRefreshToken((n) => n + 1);
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center" spread="space-between">
        <Text>Timesheet đang chờ bạn duyệt</Text>
        <Button appearance="subtle" onClick={load}>
          Làm mới
        </Button>
      </Inline>

      {loading && <Spinner label="Đang tải..." />}
      {!loading && error && <Text>{error}</Text>}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          header="Không có timesheet chờ duyệt"
          description="Khi ai đó nộp timesheet và chọn bạn làm người duyệt, sẽ hiện ở đây."
        />
      )}
      {!loading && !error && items.length > 0 && (
        <ReviewTable items={items} onSelect={setSelected} />
      )}
    </Stack>
  );
};

const MyTimesheetTab = () => {
  const [weekStart, setWeekStart] = useState(currentWeekStart());

  const onPrev = useCallback(() => setWeekStart((ws) => addDays(ws, -7)), []);
  const onNext = useCallback(() => setWeekStart((ws) => addDays(ws, 7)), []);
  const onThisWeek = useCallback(() => setWeekStart(currentWeekStart()), []);

  return (
    <Stack space="space.200">
      <PeriodBar
        weekStart={weekStart}
        onPrev={onPrev}
        onNext={onNext}
        onThisWeek={onThisWeek}
      />
      <TimesheetView weekStart={weekStart} showSubmit />
    </Stack>
  );
};

const App = () => (
  <Stack space="space.250">
    <Stack space="space.050">
      <Heading size="medium">Timesheet</Heading>
      <Text>
        Ghi giờ · nộp duyệt · export Excel — chỉ người nộp và người duyệt xem
        được timesheet đã nộp
      </Text>
    </Stack>

    <Tabs id="timesheet-main-tabs">
      <TabList>
        <Tab>Timesheet của tôi</Tab>
        <Tab>Chờ duyệt</Tab>
      </TabList>
      <TabPanel>
        <MyTimesheetTab />
      </TabPanel>
      <TabPanel>
        <ReviewTab />
      </TabPanel>
    </Tabs>
  </Stack>
);

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
