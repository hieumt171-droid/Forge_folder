import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tab,
  TabList,
  TabPanel,
  Tabs,
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

const statusAppearance = (category) => {
  const key = String(category || '').toLowerCase();
  if (key === 'done') return 'success';
  if (key === 'indeterminate') return 'inprogress';
  if (key === 'new') return 'new';
  return 'default';
};

const FeedbackMessage = ({ feedback, onDismiss }) => {
  if (!feedback?.message) return null;
  return (
    <SectionMessage
      appearance={feedback.type === 'success' ? 'success' : 'error'}
      title={feedback.type === 'success' ? 'Thành công' : 'Lỗi'}
    >
      <Text>{feedback.message}</Text>
      {onDismiss ? (
        <Button appearance="subtle" onClick={onDismiss}>
          Đóng
        </Button>
      ) : null}
    </SectionMessage>
  );
};

const IssueTab = ({ issueKey, onBookmarksChanged }) => {
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmark, setBookmark] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadCurrent = useCallback(async () => {
    if (!issueKey) {
      setLoading(false);
      setError('Không có issue key trong context.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await invoke('getCurrentBookmark', { issueKey });
      setIsBookmarked(Boolean(data?.isBookmarked));
      setBookmark(data?.bookmark ?? null);
      console.log(JSON.stringify(formatLog('getCurrentBookmark.ui.success', { issueKey })));
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('getCurrentBookmark.ui.error', { message })));
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  const onToggle = useCallback(async () => {
    setToggling(true);
    setFeedback(null);
    try {
      const res = await invoke('toggleBookmark', { issueKey });
      setIsBookmarked(Boolean(res?.isBookmarked));
      setBookmark(res?.bookmark ?? null);
      setFeedback({
        type: 'success',
        message: res?.message ?? (res?.action === 'added' ? 'Đã thêm bookmark.' : 'Đã bỏ bookmark.')
      });
      onBookmarksChanged?.();
      console.log(
        JSON.stringify(formatLog('toggleBookmark.ui.success', { issueKey, action: res?.action }))
      );
    } catch (e) {
      const message = e?.message || String(e);
      setFeedback({ type: 'error', message });
      console.log(JSON.stringify(formatLog('toggleBookmark.ui.error', { message })));
    } finally {
      setToggling(false);
    }
  }, [issueKey, onBookmarksChanged]);

  if (loading) {
    return <Spinner label="Đang tải bookmark issue..." />;
  }

  if (error) {
    return (
      <Stack space="space.150">
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
        <Button appearance="primary" onClick={loadCurrent}>
          Thử lại
        </Button>
      </Stack>
    );
  }

  return (
    <Stack space="space.200">
      <FeedbackMessage feedback={feedback} onDismiss={() => setFeedback(null)} />

      <Stack space="space.100">
        <Text>Issue: {issueKey}</Text>
        {isBookmarked && bookmark ? (
          <>
            <Text>Summary: {bookmark.summary || '—'}</Text>
            <Inline space="space.100" alignBlock="center">
              <Text>Status:</Text>
              <Lozenge appearance={statusAppearance(bookmark.statusCategory)}>
                {bookmark.statusName || '—'}
              </Lozenge>
            </Inline>
            <Text>Lưu lúc: {bookmark.bookmarkedAt || '—'}</Text>
          </>
        ) : (
          <Text>Issue này chưa được bookmark.</Text>
        )}
      </Stack>

      <LoadingButton
        appearance={isBookmarked ? 'warning' : 'primary'}
        isLoading={toggling}
        onClick={onToggle}
      >
        {isBookmarked ? 'Bỏ bookmark' : 'Thêm bookmark'}
      </LoadingButton>
    </Stack>
  );
};

const MyBookmarksTab = ({ refreshToken }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [removingKey, setRemovingKey] = useState('');
  const [feedback, setFeedback] = useState(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await invoke('getMyBookmarks');
      setBookmarks(Array.isArray(data?.bookmarks) ? data.bookmarks : []);
      console.log(JSON.stringify(formatLog('getMyBookmarks.ui.success', {})));
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      setBookmarks([]);
      console.log(JSON.stringify(formatLog('getMyBookmarks.ui.error', { message })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList, refreshToken]);

  const onRemove = useCallback(
    async (targetIssueKey) => {
      setRemovingKey(targetIssueKey);
      setFeedback(null);
      try {
        const res = await invoke('removeBookmark', { issueKey: targetIssueKey });
        await loadList();
        setFeedback({
          type: res?.removed ? 'success' : 'error',
          message: res?.message ?? `Đã xóa ${targetIssueKey}.`
        });
        console.log(
          JSON.stringify(formatLog('removeBookmark.ui.success', { issueKey: targetIssueKey }))
        );
      } catch (e) {
        const message = e?.message || String(e);
        setFeedback({ type: 'error', message });
        console.log(JSON.stringify(formatLog('removeBookmark.ui.error', { message })));
      } finally {
        setRemovingKey('');
      }
    },
    [loadList]
  );

  const tableHead = useMemo(
    () => ({
      cells: [
        { key: 'issueKey', content: 'Issue', isSortable: false },
        { key: 'summary', content: 'Summary', isSortable: false },
        { key: 'status', content: 'Status', isSortable: false },
        { key: 'bookmarkedAt', content: 'Lưu lúc', isSortable: false },
        { key: 'actions', content: 'Actions', isSortable: false }
      ]
    }),
    []
  );

  const tableRows = useMemo(
    () =>
      bookmarks.map((item) => ({
        key: item.key || item.issueKey,
        cells: [
          { key: 'issueKey', content: <Text>{item.issueKey}</Text> },
          { key: 'summary', content: <Text>{item.summary || '—'}</Text> },
          {
            key: 'status',
            content: (
              <Lozenge appearance={statusAppearance(item.statusCategory)}>
                {item.statusName || '—'}
              </Lozenge>
            )
          },
          { key: 'bookmarkedAt', content: <Text>{item.bookmarkedAt || '—'}</Text> },
          {
            key: 'actions',
            content: (
              <LoadingButton
                appearance="danger"
                isLoading={removingKey === item.issueKey}
                onClick={() => onRemove(item.issueKey)}
              >
                Xóa
              </LoadingButton>
            )
          }
        ]
      })),
    [bookmarks, removingKey, onRemove]
  );

  if (loading) {
    return <Spinner label="Đang tải bookmarks của bạn..." />;
  }

  if (error) {
    return (
      <Stack space="space.150">
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
        <Button appearance="primary" onClick={loadList}>
          Thử lại
        </Button>
      </Stack>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Stack space="space.150">
        <FeedbackMessage feedback={feedback} onDismiss={() => setFeedback(null)} />
        <EmptyState
          header="Chưa có bookmark"
          description='Vào tab "Issue này" và bấm "Thêm bookmark" để lưu issue hiện tại.'
        />
      </Stack>
    );
  }

  return (
    <Stack space="space.200">
      <FeedbackMessage feedback={feedback} onDismiss={() => setFeedback(null)} />
      <Inline space="space.100" alignBlock="center">
        <Text>{bookmarks.length} bookmark(s)</Text>
        <Button appearance="subtle" onClick={loadList}>
          Làm mới
        </Button>
      </Inline>
      <DynamicTable head={tableHead} rows={tableRows} />
    </Stack>
  );
};

const ValidationTestPanel = ({ issueKey }) => {
  const [running, setRunning] = useState('');
  const [result, setResult] = useState(null);

  const runTest = useCallback(async (testId, label, fn) => {
    setRunning(testId);
    setResult(null);
    try {
      const data = await fn();
      setResult({
        type: 'error',
        title: 'Không mong đợi thành công',
        message: `${label}: resolver không throw — ${JSON.stringify(data)}`
      });
    } catch (e) {
      const message = e?.message || String(e);
      setResult({ type: 'success', title: 'Validation chặn đúng', message: `${label}: ${message}` });
      console.log(JSON.stringify(formatLog('validationTest.rejected', { testId, message })));
    } finally {
      setRunning('');
    }
  }, []);

  return (
    <Stack space="space.200">
      <Text>Bấm từng nút — kỳ vọng hiện error message rõ ràng (không thay đổi bookmark thật).</Text>

      <LoadingButton
        appearance="default"
        isLoading={running === 'issueKey'}
        onClick={() =>
          runTest('issueKey', 'toggleBookmark issueKey sai', () =>
            invoke('toggleBookmark', { issueKey: 'hsf-1' })
          )
        }
      >
        Test issueKey sai (hsf-1)
      </LoadingButton>

      <LoadingButton
        appearance="default"
        isLoading={running === 'cursor'}
        onClick={() =>
          runTest('cursor', 'getMyBookmarks cursor sai', () =>
            invoke('getMyBookmarks', { cursor: 123 })
          )
        }
      >
        Test cursor sai (number)
      </LoadingButton>

      <LoadingButton
        appearance="default"
        isLoading={running === 'auth'}
        onClick={() =>
          runTest('auth', 'removeBookmark user khác', () =>
            invoke('removeBookmark', {
              issueKey: issueKey || 'HSF-1',
              accountId: 'fake-user-khac-12345'
            })
          )
        }
      >
        Test xóa bookmark user khác
      </LoadingButton>

      {result ? (
        <SectionMessage appearance={result.type === 'success' ? 'success' : 'error'} title={result.title}>
          <Text>{result.message}</Text>
        </SectionMessage>
      ) : null}
    </Stack>
  );
};

const App = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key ?? '';
  const [listRefreshToken, setListRefreshToken] = useState(0);

  const bumpListRefresh = useCallback(() => {
    setListRefreshToken((n) => n + 1);
  }, []);

  if (!issueKey) {
    return (
      <SectionMessage appearance="warning" title="Thiếu context">
        <Text>Mở panel trên một Jira issue để dùng Bookmarks.</Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.200">
      <Heading size="small">Bookmarks</Heading>
      <Tabs id="bookmarks-tabs">
        <TabList>
          <Tab>Issue này</Tab>
          <Tab>Bookmarks của tôi</Tab>
          <Tab>Test validation</Tab>
        </TabList>
        <TabPanel>
          <IssueTab issueKey={issueKey} onBookmarksChanged={bumpListRefresh} />
        </TabPanel>
        <TabPanel>
          <MyBookmarksTab refreshToken={listRefreshToken} />
        </TabPanel>
        <TabPanel>
          <ValidationTestPanel issueKey={issueKey} />
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
