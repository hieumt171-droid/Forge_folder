import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Badge,
  Box,
  DynamicTable,
  LineChart,
  Lozenge,
  Stack,
  Strong,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  useProductContext
} from '@forge/react';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const sprintOverview = {
  name: 'Sprint 24 — Forge Dashboard',
  startDate: '2026-05-20',
  endDate: '2026-06-03',
  totalIssues: 42
};

const burndownData = [
  { day: 'Day 1', ideal: 42, actual: 42 },
  { day: 'Day 2', ideal: 36, actual: 40 },
  { day: 'Day 3', ideal: 30, actual: 35 },
  { day: 'Day 4', ideal: 24, actual: 28 },
  { day: 'Day 5', ideal: 18, actual: 22 },
  { day: 'Day 6', ideal: 12, actual: 15 },
  { day: 'Day 7', ideal: 6, actual: 9 },
  { day: 'Day 8', ideal: 0, actual: 4 }
];

const mockIssues = [
  { key: 'HSF-12', summary: 'Setup Forge project page routing', status: 'Done', priority: 'High' },
  { key: 'HSF-8', summary: 'Integrate Recharts burndown', status: 'In Progress', priority: 'Medium' },
  { key: 'HSF-5', summary: 'Custom UI sidebar navigation', status: 'To Do', priority: 'Low' },
  { key: 'HSF-3', summary: 'Mock sprint overview data', status: 'In Progress', priority: 'Highest' },
  { key: 'HSF-1', summary: 'Initial project dashboard', status: 'Done', priority: 'Medium' }
];

const compareIssueKeys = (keyA, keyB) => {
  const parse = (key) => {
    const match = String(key).match(/^(.*-)(\d+)$/);
    if (!match) return { prefix: String(key), num: null };
    return { prefix: match[1], num: Number(match[2]) };
  };

  const a = parse(keyA);
  const b = parse(keyB);

  const prefixCmp = a.prefix.localeCompare(b.prefix);
  if (prefixCmp !== 0) return prefixCmp;

  if (a.num !== null && b.num !== null) return a.num - b.num;
  return String(keyA).localeCompare(String(keyB));
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
};

const mapStatusAppearance = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'done') return 'success';
  if (s === 'to do') return 'new';
  if (s === 'in progress') return 'inprogress';
  return 'default';
};

const burndownLineData = burndownData.flatMap((point) => [
  [point.day, point.ideal, 'Ideal'],
  [point.day, point.actual, 'Actual']
]);

const StatCard = ({ label, value }) => (
  <Box padding="space.200" backgroundColor="neutral.subtle" borderRadius="border.radius.200">
    <Stack space="space.050">
      <Text>{label}</Text>
      <Text>
        <Strong>{String(value ?? '—')}</Strong>
      </Text>
    </Stack>
  </Box>
);

const App = () => {
  const context = useProductContext();
  const projectKey = context?.extension?.project?.key || 'UNKNOWN';

  const [tableSortKey, setTableSortKey] = useState('key');
  const [tableSortOrder, setTableSortOrder] = useState('ASC');
  const mountTimeRef = React.useRef(performance.now());

  useEffect(() => {
    const loadMs = Math.round(performance.now() - mountTimeRef.current);
    console.log(
      JSON.stringify(
        formatLog('SprintDashboard.ready', {
          stack: 'ui-kit',
          projectKey,
          loadMs
        })
      )
    );
  }, [projectKey]);

  const issuesTableHead = useMemo(
    () => ({
      cells: [
        { key: 'key', content: 'Key', isSortable: true },
        { key: 'summary', content: 'Summary' },
        { key: 'status', content: 'Status' },
        { key: 'priority', content: 'Priority' }
      ]
    }),
    []
  );

  const issuesTableRows = useMemo(
    () =>
      mockIssues.map((issue) => ({
        key: issue.key,
        cells: [
          { key: 'key', content: <Text>{issue.key}</Text> },
          { key: 'summary', content: <Text>{issue.summary}</Text> },
          {
            key: 'status',
            content: <Lozenge appearance={mapStatusAppearance(issue.status)}>{issue.status}</Lozenge>
          },
          { key: 'priority', content: <Badge>{issue.priority}</Badge> }
        ]
      })),
    []
  );

  const sortedIssueRows = useMemo(() => {
    if (tableSortKey !== 'key') return issuesTableRows;

    const dir = tableSortOrder === 'DESC' ? -1 : 1;
    return [...issuesTableRows].sort((a, b) => compareIssueKeys(a.key, b.key) * dir);
  }, [issuesTableRows, tableSortKey, tableSortOrder]);

  const onSortIssues = useCallback((params) => {
    if (params?.key) setTableSortKey(params.key);
    if (params?.sortOrder) setTableSortOrder(params.sortOrder);
  }, []);

  return (
    <Stack space="space.200">
      <Stack space="space.100">
        <Text>
          <Strong>Sprint Dashboard (UI Kit)</Strong>
        </Text>
        <Text>Project: {projectKey}</Text>
        <Text>Overview · Burndown · Issues — cùng mock data với Custom UI bài 4.4</Text>
      </Stack>

      <Tabs id="sprint-dashboard-tabs">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Burndown Chart</Tab>
          <Tab>Issues</Tab>
        </TabList>

        <TabPanel>
          <Stack space="space.150">
            <StatCard label="Sprint name" value={sprintOverview.name} />
            <StatCard label="Start date" value={formatDate(sprintOverview.startDate)} />
            <StatCard label="End date" value={formatDate(sprintOverview.endDate)} />
            <StatCard label="Total issues" value={sprintOverview.totalIssues} />
          </Stack>
        </TabPanel>

        <TabPanel>
          <Stack space="space.100">
            <Text>Ideal vs Actual remaining work (mock data)</Text>
            <Box padding="space.150" backgroundColor="neutral.subtle" borderRadius="border.radius.200">
              <LineChart
                title="Burndown"
                data={burndownLineData}
                xAccessor={0}
                yAccessor={1}
                colorAccessor={2}
                height={320}
              />
            </Box>
          </Stack>
        </TabPanel>

        <TabPanel>
          <Stack space="space.100">
            <Text>Sortable table — click Key header</Text>
            <DynamicTable
              head={issuesTableHead}
              rows={sortedIssueRows}
              sortKey={tableSortKey}
              sortOrder={tableSortOrder}
              onSort={onSortIssues}
            />
          </Stack>
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
