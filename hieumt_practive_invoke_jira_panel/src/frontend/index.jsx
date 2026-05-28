import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Badge,
  Button,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Strong,
  Text
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return String(iso);
  }
};

const mapStatusToLozenge = (statusColor) => {
  // Jira statusCategory.colorName thường gặp: green, yellow, red, blue, gray
  // UI Kit Lozenge types: default | inprogress | moved | new | removed | success
  switch (String(statusColor || '').toLowerCase()) {
    case 'green':
      return 'success';
    case 'yellow':
      return 'inprogress';
    case 'blue':
      return 'new';
    case 'red':
      return 'removed';
    default:
      return 'default';
  }
};

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoke('getIssueDetails');
      setData(res);
    } catch (e) {
      setError(e?.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const onRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Nút Refresh luôn hiển thị
  const refreshButton = (
    <Button appearance='primary' onClick={onRefresh}>
      Refresh
    </Button>
  );

  if (loading) {
    return (
      <Stack space='space.150'>
        {refreshButton}
        <Spinner size='medium' label='Đang tải dữ liệu issue...' />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack space='space.150'>
        {refreshButton}
        <SectionMessage appearance='error' title='Lỗi'>
          <Text>{error}</Text>
        </SectionMessage>
      </Stack>
    );
  }

  if (!data) {
    return (
      <Stack space='space.150'>
        {refreshButton}
        <Text>Không có dữ liệu cho Issue này</Text>
      </Stack>
    );
  }

  const statusAppearance = mapStatusToLozenge(data.statusColor);

  return (
    <Stack space='space.150'>
      {refreshButton}

      <Text>
        <Strong>{data.summary || '(No summary)'}</Strong>
      </Text>

      <Stack space='space.100'>
        <Text>
          Status:{' '}
          <Lozenge appearance={statusAppearance}>{data.statusName || 'Unknown'}</Lozenge>
        </Text>

        <Text>
          Priority: <Badge>{data.priorityName || 'Unknown'}</Badge>
        </Text>

        <Text>Assignee: {data.assigneeName || 'Unassigned'}</Text>
        <Text>Created: {formatDate(data.created)}</Text>
        <Text>Comments: {String(data.commentCount ?? 0)}</Text>
      </Stack>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
