import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Badge,
  Button,
  DynamicTable,
  Heading,
  Inline,
  LoadingButton,
  SectionMessage,
  Spinner,
  Stack,
  Tag,
  TagGroup,
  Text,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const formatCreatedAt = (iso) => {
  const ms = Date.parse(String(iso || ''));
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString();
};

const tableHead = {
  cells: [
    { key: 'title', content: 'Title', isSortable: false },
    { key: 'status', content: 'Status', isSortable: false },
    { key: 'createdAt', content: 'Created', isSortable: false },
    { key: 'select', content: 'Chọn', isSortable: false }
  ]
};

const App = () => {
  const context = useProductContext();
  const spaceKey = context?.extension?.space?.key ?? '';
  const spaceId = context?.extension?.space?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [labeling, setLabeling] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState('');

  const applyReport = useCallback((data) => {
    setReport(data);
    setSelectedPageId((prev) => {
      const recentIds = new Set((data?.recentPages ?? []).map((p) => p.id));
      return prev && recentIds.has(prev) ? prev : '';
    });
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await invoke('getSpaceHealthReport', { spaceKey, spaceId });
      applyReport(data);
      console.log(JSON.stringify(formatLog('getSpaceHealthReport.ui.success', { spaceKey })));
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('getSpaceHealthReport.ui.error', { message })));
    } finally {
      setLoading(false);
    }
  }, [spaceKey, spaceId, applyReport]);

  useEffect(() => {
    if (spaceKey && spaceId) {
      loadReport();
    } else {
      setLoading(false);
    }
  }, [spaceKey, spaceId, loadReport]);

  const onAddReviewLabel = useCallback(async () => {
    if (!selectedPageId) return;
    setLabeling(true);
    setError('');
    try {
      const res = await invoke('addReviewNeededLabel', { pageId: selectedPageId });
      if (res?.report) {
        applyReport(res.report);
      } else {
        await loadReport();
      }
      console.log(
        JSON.stringify(
          formatLog('addReviewNeededLabel.ui.success', { pageId: selectedPageId })
        )
      );
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('addReviewNeededLabel.ui.error', { message })));
    } finally {
      setLabeling(false);
    }
  }, [selectedPageId, applyReport, loadReport]);

  const tableRows = useMemo(() => {
    const pages = report?.recentPages ?? [];
    return pages.map((page) => ({
      key: `page-${page.id}`,
      cells: [
        { key: 'title', content: <Text>{page.title}</Text> },
        { key: 'status', content: <Text>{page.status || '—'}</Text> },
        { key: 'createdAt', content: <Text>{formatCreatedAt(page.createdAt)}</Text> },
        {
          key: 'select',
          content: (
            <Button
              appearance={selectedPageId === page.id ? 'primary' : 'subtle'}
              onClick={() => setSelectedPageId(page.id)}
            >
              {selectedPageId === page.id ? 'Đã chọn' : 'Chọn'}
            </Button>
          )
        }
      ]
    }));
  }, [report?.recentPages, selectedPageId]);

  const selectedPageTitle = useMemo(() => {
    const page = (report?.recentPages ?? []).find((p) => p.id === selectedPageId);
    return page?.title ?? '';
  }, [report?.recentPages, selectedPageId]);

  if (loading) {
    return <Spinner label="Đang tải Space Health Report..." />;
  }

  return (
    <Stack space="space.250">
      <Stack space="space.100">
        <Heading size="medium">Space Health Report</Heading>
        <Text>
          Space: {spaceKey || '—'} (id: {spaceId || '—'})
        </Text>
      </Stack>

      {error ? (
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      <Inline space="space.150" alignBlock="center">
        <Text>Tổng số pages trong space</Text>
        <Badge appearance="primary">{String(report?.totalPages ?? 0)}</Badge>
        <Button appearance="subtle" onClick={loadReport}>
          Tải lại
        </Button>
      </Inline>

      <Stack space="space.150">
        <Heading size="small">5 pages tạo gần nhất</Heading>
        {(report?.recentPages ?? []).length === 0 ? (
          <Text>Chưa có page nào trong space.</Text>
        ) : (
          <DynamicTable head={tableHead} rows={tableRows} />
        )}
        <Inline space="space.100" alignBlock="center">
          <LoadingButton
            appearance="primary"
            isLoading={labeling}
            isDisabled={!selectedPageId}
            onClick={onAddReviewLabel}
          >
            Thêm label review-needed
          </LoadingButton>
          {selectedPageId ? (
            <Text>
              Page đã chọn: {selectedPageTitle} (id: {selectedPageId})
            </Text>
          ) : (
            <Text>Chọn một page trong bảng để gắn label.</Text>
          )}
        </Inline>
      </Stack>

      <Stack space="space.150">
        <Heading size="small">Top labels trong space (CQL)</Heading>
        {(report?.topLabels ?? []).length === 0 ? (
          <Text>Chưa có label hoặc không đọc được qua CQL.</Text>
        ) : (
          <TagGroup alignment="start">
            {(report?.topLabels ?? []).map((item) => (
              <Tag
                key={item.name}
                text={`${item.name} (${item.count})`}
                color="blueLight"
              />
            ))}
          </TagGroup>
        )}
      </Stack>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
