import React, { useCallback, useEffect, useRef, useState } from 'react';
import ForgeReconciler, {
  Button,
  ButtonGroup,
  EmptyState,
  Heading,
  List,
  ListItem,
  LoadingButton,
  SectionMessage,
  Spinner,
  Stack,
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

const formatViewedAt = (iso) => {
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso || '—';
  }
};

const initInflight = new Map();

const App = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key || '';
  const accountId = context?.accountId || '—';
  const keyPrefix = issueKey ? `view-log:${issueKey}:` : '—';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const applyListResult = useCallback((res) => {
    setLogs(Array.isArray(res?.logs) ? res.logs : []);
    setNextCursor(res?.nextCursor ?? null);
  }, []);

  const listLogs = useCallback(async () => {
    const res = await invoke('listViewLogs');
    applyListResult(res);
    return res;
  }, [applyListResult]);

  useEffect(() => {
    mountedRef.current = true;

    if (!issueKey) {
      setLoading(false);
      setError('Không xác định được issueKey.');
      return undefined;
    }

    const inflightKey = `${issueKey}:${accountId}`;
    if (initInflight.has(inflightKey)) {
      return undefined;
    }
    initInflight.set(inflightKey, true);

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await invoke('recordViewAndListLogs');
        if (!mountedRef.current) return;
        applyListResult(res);
        console.log(
          JSON.stringify(
            formatLog('recordViewAndListLogs.ui.success', {
              issueKey,
              count: res?.logs?.length ?? 0,
              hasNextCursor: Boolean(res?.nextCursor)
            })
          )
        );
      } catch (e) {
        if (!mountedRef.current) return;
        const message = e?.message || String(e);
        setError(message);
        console.log(JSON.stringify(formatLog('recordViewAndListLogs.ui.error', { message })));
      } finally {
        if (mountedRef.current) setLoading(false);
        window.setTimeout(() => initInflight.delete(inflightKey), 3000);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [issueKey, accountId, applyListResult]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const res = await listLogs();
      console.log(
        JSON.stringify(
          formatLog('listViewLogs.ui.success', {
            issueKey,
            count: res?.logs?.length ?? 0
          })
        )
      );
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('listViewLogs.ui.error', { message })));
    } finally {
      setRefreshing(false);
    }
  }, [issueKey, listLogs]);

  const onLoadMore = useCallback(async () => {
    if (!nextCursor) return;

    setLoadingMore(true);
    setError('');
    try {
      const res = await invoke('loadMoreViewLogs', { cursor: nextCursor });
      const more = Array.isArray(res?.logs) ? res.logs : [];
      setLogs((prev) => [...prev, ...more]);
      setNextCursor(res?.nextCursor ?? null);
      console.log(
        JSON.stringify(
          formatLog('loadMoreViewLogs.ui.success', {
            added: more.length,
            hasNextCursor: Boolean(res?.nextCursor)
          })
        )
      );
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('loadMoreViewLogs.ui.error', { message })));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor]);

  const onClearHistory = useCallback(async () => {
    setClearing(true);
    setError('');
    try {
      const res = await invoke('clearViewLogs');
      setLogs([]);
      setNextCursor(null);
      console.log(
        JSON.stringify(formatLog('clearViewLogs.ui.success', { deleted: res?.deleted ?? 0 }))
      );
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('clearViewLogs.ui.error', { message })));
    } finally {
      setClearing(false);
    }
  }, []);

  if (loading) {
    return <Spinner label="Đang ghi log và tải lịch sử..." />;
  }

  return (
    <Stack space="space.200">
      <Stack space="space.100">
        <Heading size="small">Lịch sử hoạt động</Heading>
        <Text>Issue: {issueKey || '—'}</Text>
        <Text>Prefix query: {keyPrefix}</Text>
        <Text>User hiện tại: {accountId}</Text>
      </Stack>

      {error ? (
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      {logs.length === 0 ? (
        <EmptyState header="Chưa có lịch sử xem" description="Mỗi lần mở panel sẽ ghi một log mới." />
      ) : (
        <List type="unordered">
          {logs.map((log) => (
            <ListItem key={log.key}>
              <Text>
                {formatViewedAt(log.viewedAt)} — {log.accountId}
              </Text>
            </ListItem>
          ))}
        </List>
      )}

      <ButtonGroup>
        <LoadingButton
          appearance="default"
          isLoading={loadingMore}
          isDisabled={!nextCursor || loadingMore}
          onClick={onLoadMore}
        >
          Xem thêm
        </LoadingButton>
        <LoadingButton appearance="danger" isLoading={clearing} onClick={onClearHistory}>
          Xóa lịch sử
        </LoadingButton>
        <LoadingButton appearance="subtle" isLoading={refreshing} onClick={onRefresh}>
          Làm mới
        </LoadingButton>
      </ButtonGroup>

      {nextCursor ? (
        <Text>Còn thêm log — bấm Xem thêm (cursor pagination)</Text>
      ) : logs.length > 0 ? (
        <Text>Đã hiển thị hết log cho issue này.</Text>
      ) : null}
    </Stack>
  );
};

ForgeReconciler.render(<App />);
