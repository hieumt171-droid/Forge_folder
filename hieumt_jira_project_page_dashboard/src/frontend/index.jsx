import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Badge,
  BarChart,
  Box,
  Button,
  DonutChart,
  DynamicTable,
  EmptyState,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Strong,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const mapStatusToLozengeAppearance = (statusCategory) => {
  switch (String(statusCategory || '').toLowerCase()) {
    case 'done':
      return 'success';
    case 'new':
    case 'todo':
    case 'to do':
      return 'new';
    case 'indeterminate':
    case 'in progress':
    case 'in-progress':
      return 'inprogress';
    default:
      return 'default';
  }
};

const buildIssuesTable = (issues) => {
  const list = Array.isArray(issues) ? issues : [];

  const head = {
    cells: [
      { key: 'key', content: 'Key', isSortable: true },
      { key: 'summary', content: 'Summary' },
      { key: 'status', content: 'Status' },
      { key: 'priority', content: 'Priority' },
      { key: 'assignee', content: 'Assignee' }
    ]
  };

  const rows = list.map((it) => ({
    key: it?.key || Math.random().toString(36),
    cells: [
      { key: 'key', content: <Text>{it?.key || '—'}</Text> },
      { key: 'summary', content: <Text>{it?.summary || '—'}</Text> },
      {
        key: 'status',
        content: (
          <Lozenge appearance={mapStatusToLozengeAppearance(it?.statusCategory)}>
            {it?.statusName || '—'}
          </Lozenge>
        )
      },
      { key: 'priority', content: <Badge>{it?.priorityName || '—'}</Badge> },
      { key: 'assignee', content: <Text>{it?.assigneeName || 'Unassigned'}</Text> }
    ]
  }));

  return { head, rows };
};

const StatCard = ({ label, value }) => (
  <Box padding='space.200' backgroundColor='neutral.subtle' borderRadius='border.radius.200'>
    <Stack space='space.050'>
      <Text>{label}</Text>
      <Text>
        <Strong>{String(value ?? 0)}</Strong>
      </Text>
    </Stack>
  </Box>
);

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [tableSortKey, setTableSortKey] = useState('key');
  const [tableSortOrder, setTableSortOrder] = useState('ASC');

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await invoke('getProjectHealthData');
        if (cancelled) return;
        setData(res || null);
        console.log(JSON.stringify(formatLog('getProjectHealthData.ui.success', { ok: true })));
      } catch (e) {
        const message = e?.message || String(e);
        console.log(JSON.stringify(formatLog('getProjectHealthData.ui.error', { message })));
        if (!cancelled) {
          setError(message);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  const onRefresh = useCallback(() => {
    setRefreshTrigger((x) => x + 1);
  }, []);

  const overview = data?.overview || {};
  const distribution = Array.isArray(overview?.distribution) ? overview.distribution : [];
  const bugsPriorityData = Array.isArray(data?.bugsPriorityData) ? data.bugsPriorityData : [];

  const latestTable = useMemo(() => buildIssuesTable(data?.latestIssues), [data?.latestIssues]);
  const staleTable = useMemo(() => buildIssuesTable(data?.staleIssues), [data?.staleIssues]);

  const sortedLatestRows = useMemo(() => {
    if (tableSortKey !== 'key') return latestTable.rows;
    const dir = tableSortOrder === 'DESC' ? -1 : 1;
    return [...latestTable.rows].sort((a, b) => String(a.key).localeCompare(String(b.key)) * dir);
  }, [latestTable.rows, tableSortKey, tableSortOrder]);

  const onSortLatest = useCallback((params) => {
    if (params?.key) setTableSortKey(params.key);
    if (params?.sortOrder) setTableSortOrder(params.sortOrder);
  }, []);

  return (
    <Stack space='space.200'>
      <Stack space='space.100'>
        <Text>
          <Strong>Project Health Dashboard</Strong>
        </Text>
        <Button appearance='primary' onClick={onRefresh}>
          Refresh Data
        </Button>
      </Stack>

      {loading ? (
        <Spinner size='large' label='Đang tải dữ liệu...' />
      ) : error ? (
        <SectionMessage appearance='error' title='Lỗi'>
          <Text>{error}</Text>
        </SectionMessage>
      ) : !data ? (
        <EmptyState header='Không có dữ liệu' description='Không lấy được dữ liệu dự án.' />
      ) : (
        <Tabs id='project-health-tabs'>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Issues Table</Tab>
            <Tab>Stale Issues</Tab>
            <Tab>Bugs Chart</Tab>
          </TabList>

          <TabPanel>
            <Stack space='space.200'>
              <Stack space='space.150'>
                <StatCard label='Total Issues' value={overview?.totalIssues ?? 0} />
                <StatCard label='In Progress' value={overview?.inProgress ?? 0} />
                <StatCard label='Done' value={overview?.done ?? 0} />
                <StatCard label='Total Bugs' value={overview?.totalBugs ?? 0} />
              </Stack>

              <Box padding='space.150' backgroundColor='neutral.subtle' borderRadius='border.radius.200'>
                <DonutChart
                  title='Status distribution'
                  data={distribution}
                  colorAccessor='type'
                  labelAccessor='label'
                  valueAccessor='value'
                  height={320}
                />
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel>
            <DynamicTable
              head={latestTable.head}
              rows={sortedLatestRows}
              rowsPerPage={10}
              sortKey={tableSortKey}
              sortOrder={tableSortOrder}
              onSort={onSortLatest}
            />
          </TabPanel>

          <TabPanel>
            {Array.isArray(data?.staleIssues) && data.staleIssues.length > 0 ? (
              <DynamicTable head={staleTable.head} rows={staleTable.rows} rowsPerPage={10} />
            ) : (
              <EmptyState
                header='Dự án hoàn hảo!'
                description='Không có issue nào bị bỏ quên quá 7 ngày.'
                width='wide'
              />
            )}
          </TabPanel>

          <TabPanel>
            <Box padding='space.150' backgroundColor='neutral.subtle' borderRadius='border.radius.200'>
              <BarChart
                title='Bugs by priority'
                data={bugsPriorityData}
                xAccessor='x'
                yAccessor='y'
                height={320}
              />
            </Box>
          </TabPanel>
        </Tabs>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
