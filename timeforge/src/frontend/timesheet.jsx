import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Button,
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
  TextArea,
  Textfield,
  User,
  UserPicker
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
      { key: 'key', content: <Text>{r.issueKey}</Text> },
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

const ExportPanel = ({ exportData, filename }) => {
  if (!exportData?.tsv) return null;

  const previewHead = {
    cells: [
      { key: 'k', content: 'Key' },
      { key: 's', content: 'Summary' },
      { key: 'p', content: 'Project' },
      { key: 't', content: 'Loại' },
      { key: 'h', content: 'Giờ' },
      { key: 'd', content: 'Ngày' }
    ]
  };

  const previewRows = (exportData.previewRows ?? []).map((r, i) => ({
    key: String(i),
    cells: [
      { key: 'k', content: <Text>{r.issueKey}</Text> },
      { key: 's', content: <Text>{r.summary || '—'}</Text> },
      { key: 'p', content: <Text>{r.projectKey}</Text> },
      { key: 't', content: <Text>{r.workType}</Text> },
      { key: 'h', content: <Text>{r.hours}</Text> },
      { key: 'd', content: <Text>{r.date}</Text> }
    ]
  }));

  return (
    <Stack space="space.200">
      <SectionMessage appearance="information" title="Xuất Excel — 2 bước">
        <Text>
          1. Nhấn vào ô dữ liệu bên dưới → Ctrl+A → Ctrl+C{'\n'}
          2. Mở Excel → chọn ô A1 → Ctrl+V — Excel tự tách cột (định dạng
          tab).{'\n'}
          File gợi ý: <Text weight="bold">{filename}</Text>
        </Text>
      </SectionMessage>
      {previewRows.length > 0 ? (
        <Stack space="space.050">
          <Text weight="medium">Xem trước (tối đa 20 dòng)</Text>
          <DynamicTable head={previewHead} rows={previewRows} />
        </Stack>
      ) : null}
      <TextArea
        value={exportData.tsv}
        isReadOnly
        resize="vertical"
        minimumRows={8}
      />
    </Stack>
  );
};

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
  const [exportData, setExportData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [approver, setApprover] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setExportData(null);
    try {
      const payload = { weekStart };
      if (targetAccountId) payload.targetAccountId = targetAccountId;
      const result = await invoke('getTimesheet', payload);
      setData(result);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [weekStart, targetAccountId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = useCallback(async () => {
    if (!approver?.id) {
      setFeedback({ type: 'error', msg: 'Chọn người duyệt trước khi nộp.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await invoke('submitWeek', {
        weekStart,
        approverAccountId: approver.id
      });
      if (result?.alreadySubmitted) {
        setFeedback({ type: 'warning', msg: `Tuần ${weekStart} đang chờ duyệt.` });
      } else {
        setFeedback({
          type: 'success',
          msg: `Đã nộp ${result?.submittedCount ?? 0} entries · chờ người duyệt xác nhận.`
        });
        setShowSubmitForm(false);
      }
      await load();
    } catch (e) {
      setFeedback({ type: 'error', msg: e?.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  }, [weekStart, approver, load]);

  const onReview = useCallback(
    async (action) => {
      setReviewing(true);
      setFeedback(null);
      try {
        await invoke('reviewWeek', {
          submitterAccountId: targetAccountId,
          weekStart,
          action,
          reviewNote
        });
        setFeedback({
          type: 'success',
          msg: action === 'approve' ? 'Đã duyệt timesheet.' : 'Đã từ chối — người nộp có thể sửa và nộp lại.'
        });
        setReviewNote('');
        await load();
        onReviewed?.();
      } catch (e) {
        setFeedback({ type: 'error', msg: e?.message || String(e) });
      } finally {
        setReviewing(false);
      }
    },
    [targetAccountId, weekStart, reviewNote, load, onReviewed]
  );

  const onExport = useCallback(async () => {
    setExporting(true);
    setFeedback(null);
    setExportData(null);
    try {
      const payload = { weekStart };
      if (targetAccountId) payload.targetAccountId = targetAccountId;
      const result = await invoke('exportTimesheetCsv', payload);
      setExportData(result);
      if (result?.truncated) {
        setFeedback({
          type: 'warning',
          msg: `Xuất ${result.rowCount} dòng (giới hạn ${result.limit}).`
        });
      } else {
        setFeedback({
          type: 'success',
          msg: `Sẵn sàng xuất: ${result?.rowCount ?? 0} dòng · ${fmtMin(result?.totalMin ?? 0)}.`
        });
      }
    } catch (e) {
      setFeedback({ type: 'error', msg: e?.message || String(e) });
    } finally {
      setExporting(false);
    }
  }, [weekStart, targetAccountId]);

  const isEmpty = !data || (data.rows ?? []).length === 0;
  const weekTotal = data?.weekTotal ?? 0;
  const byType = data?.byWorkType || data?.byCategory || {};
  const status = data?.approvalStatus;
  const canSubmit =
    showSubmit &&
    !isEmpty &&
    (!status || status === 'rejected');
  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <Stack space="space.200">
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
          </Inline>

          {isRejected && data.reviewNote ? (
            <SectionMessage appearance="warning" title="Lý do từ chối">
              <Text>{data.reviewNote}</Text>
            </SectionMessage>
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
                Xuất Excel
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
              <SectionMessage appearance="information" title="Nộp để duyệt">
                <Text>
                  Chọn người duyệt (PM / team lead). Sau khi nộp, chỉ bạn và
                  người duyệt mới xem được timesheet tuần này.
                </Text>
              </SectionMessage>
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

          {isPending && !showReviewActions ? (
            <SectionMessage appearance="information" title="Đang chờ duyệt">
              <Text>
                Timesheet đã nộp. Bạn không thể sửa entry cho đến khi được
                duyệt hoặc bị từ chối.
              </Text>
            </SectionMessage>
          ) : null}

          {isApproved ? (
            <SectionMessage appearance="success" title="Đã duyệt">
              <Text>Timesheet tuần này đã được duyệt.</Text>
            </SectionMessage>
          ) : null}

          {showReviewActions && data.canReview ? (
            <Stack space="space.150">
              <SectionMessage appearance="warning" title="Duyệt timesheet">
                <Text>Xem kỹ bảng giờ bên trên trước khi duyệt hoặc từ chối.</Text>
              </SectionMessage>
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

          <ExportPanel exportData={exportData} filename={exportData?.filename} />
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
      setError(e?.message || String(e));
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
      {!loading && error && (
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
      )}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          header="Không có timesheet chờ duyệt"
          description="Khi ai đó nộp timesheet và chọn bạn làm người duyệt, sẽ hiện ở đây."
        />
      )}
      {!loading && !error && items.length > 0 && (
        <DynamicTable
          head={{
            cells: [
              { key: 'user', content: 'Người nộp' },
              { key: 'week', content: 'Tuần' },
              { key: 'submitted', content: 'Nộp lúc' },
              { key: 'act', content: '' }
            ]
          }}
          rows={items.map((item) => ({
            key: `${item.submitterAccountId}-${item.weekStart}`,
            cells: [
              {
                key: 'user',
                content: <User accountId={item.submitterAccountId} />
              },
              {
                key: 'week',
                content: <Text>{fmtRange(item.weekStart, item.weekEnd)}</Text>
              },
              {
                key: 'submitted',
                content: (
                  <Text>
                    {item.submittedAt
                      ? item.submittedAt.slice(0, 16).replace('T', ' ')
                      : '—'}
                  </Text>
                )
              },
              {
                key: 'act',
                content: (
                  <Button appearance="primary" onClick={() => setSelected(item)}>
                    Xem & duyệt
                  </Button>
                )
              }
            ]
          }))}
        />
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
        Ghi giờ · nộp duyệt · xuất Excel — chỉ người nộp và người duyệt xem
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
