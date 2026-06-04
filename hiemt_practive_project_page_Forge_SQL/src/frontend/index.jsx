import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  BarChart,
  Button,
  DynamicTable,
  EmptyState,
  Form,
  FormFooter,
  Heading,
  Label,
  Lozenge,
  LoadingButton,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Text,
  Textfield,
  TextArea,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const STATUS_FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'todo', value: 'todo' },
  { label: 'in_progress', value: 'in_progress' },
  { label: 'done', value: 'done' }
];

const STATUS_ROW_OPTIONS = [
  { label: 'todo', value: 'todo' },
  { label: 'in_progress', value: 'in_progress' },
  { label: 'done', value: 'done' }
];

const statusLozengeAppearance = (status) => {
  if (status === 'done') return 'success';
  if (status === 'in_progress') return 'inprogress';
  return 'new';
};

const PRIORITY_OPTIONS = [
  { label: '1 — Cao', value: '1' },
  { label: '2 — Trung bình', value: '2' },
  { label: '3 — Thấp', value: '3' }
];

const ASSIGNEE_OPTIONS = [
  { label: 'Unassigned', value: 'Unassigned' },
  { label: 'Hieu MT', value: 'Hieu MT' },
  { label: 'Forge Dev 1', value: 'Forge Dev 1' },
  { label: 'Forge Dev 2', value: 'Forge Dev 2' }
];

const App = () => {
  const context = useProductContext();
  const projectKey = context?.extension?.project?.key || 'DEMO';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState([]);
  const [total, setTotal] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [issueKey, setIssueKey] = useState(`${projectKey}-1`);
  const [filterStatus, setFilterStatus] = useState('all');
  const [title, setTitle] = useState('');
  const [newStatus, setNewStatus] = useState('todo');
  const [priority, setPriority] = useState('2');
  const [assignee, setAssignee] = useState('Unassigned');
  const [creating, setCreating] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);

  const selectedFilterStatus = useMemo(
    () => STATUS_FILTER_OPTIONS.find((opt) => opt.value === filterStatus) || STATUS_FILTER_OPTIONS[0],
    [filterStatus]
  );
  const selectedNewStatus = useMemo(
    () =>
      STATUS_ROW_OPTIONS.find((opt) => opt.value === newStatus) ||
      STATUS_ROW_OPTIONS.find((opt) => opt.value === 'todo'),
    [newStatus]
  );
  const selectedPriority = useMemo(
    () => PRIORITY_OPTIONS.find((opt) => opt.value === priority) || PRIORITY_OPTIONS[1],
    [priority]
  );
  const selectedAssignee = useMemo(
    () => ASSIGNEE_OPTIONS.find((opt) => opt.value === assignee) || ASSIGNEE_OPTIONS[0],
    [assignee]
  );

  const chartData = useMemo(
    () => stats.map((row) => ({ x: row.status, y: row.count })),
    [stats]
  );

  const tableHead = useMemo(
    () => ({
      cells: [
        { key: 'id', content: 'ID' },
        { key: 'title', content: 'Title' },
        { key: 'status', content: 'Status' },
        { key: 'priority', content: 'Priority' },
        { key: 'assignee', content: 'Assignee' },
        { key: 'change_status', content: 'Đổi status' }
      ]
    }),
    []
  );

  const applyDashboardData = useCallback((statsRes, tasksRes) => {
    setStats(Array.isArray(statsRes?.stats) ? statsRes.stats : []);
    setTotal(Number(statsRes?.total ?? 0));
    setTasks(Array.isArray(tasksRes?.tasks) ? tasksRes.tasks : []);
  }, []);

  const loadDashboard = useCallback(async () => {
    const key = issueKey.trim();
    if (!key) return;

    setLoading(true);
    setError('');
    try {
      const [statsRes, tasksRes] = await Promise.all([
        invoke('getSprintStats', { issueKey: key }),
        invoke('getSprintTasks', { issueKey: key, status: filterStatus })
      ]);

      applyDashboardData(statsRes, tasksRes);

      console.log(
        JSON.stringify(
          formatLog('dashboard.load.success', {
            issueKey: key,
            filterStatus,
            total: statsRes?.total,
            taskCount: tasksRes?.tasks?.length
          })
        )
      );
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('dashboard.load.error', { message })));
    } finally {
      setLoading(false);
    }
  }, [issueKey, filterStatus, applyDashboardData]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onCreate = useCallback(async () => {
    setCreating(true);
    setError('');
    try {
      await invoke('createSprintTask', {
        issueKey: issueKey.trim(),
        title,
        status: newStatus,
        priority: Number(priority),
        assignee
      });
      setTitle('');
      await loadDashboard();
      console.log(JSON.stringify(formatLog('createSprintTask.ui.success', { issueKey })));
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('createSprintTask.ui.error', { message })));
    } finally {
      setCreating(false);
    }
  }, [issueKey, title, newStatus, priority, assignee, loadDashboard]);

  const onUpdateStatus = useCallback(
    async (taskId, status) => {
      setBusyTaskId(taskId);
      setError('');
      try {
        const res = await invoke('updateSprintTaskStatus', {
          issueKey: issueKey.trim(),
          taskId,
          status
        });
        applyDashboardData(
          { stats: res?.stats, total: res?.total },
          { tasks: res?.tasks }
        );
        console.log(JSON.stringify(formatLog('updateSprintTaskStatus.ui.success', { taskId, status })));
      } catch (e) {
        const message = e?.message || String(e);
        setError(message);
        console.log(JSON.stringify(formatLog('updateSprintTaskStatus.ui.error', { message })));
      } finally {
        setBusyTaskId(null);
      }
    },
    [issueKey, applyDashboardData]
  );

  const tableRows = useMemo(
    () =>
      tasks.map((task) => {
        const currentStatus =
          STATUS_ROW_OPTIONS.find((opt) => opt.value === task.status) || STATUS_ROW_OPTIONS[0];

        return {
          key: `task-${task.id}`,
          cells: [
            { key: 'id', content: <Text>{String(task.id)}</Text> },
            { key: 'title', content: <Text>{task.title}</Text> },
            {
              key: 'status',
              content: <Lozenge appearance={statusLozengeAppearance(task.status)}>{task.status}</Lozenge>
            },
            { key: 'priority', content: <Text>{String(task.priority)}</Text> },
            { key: 'assignee', content: <Text>{task.assignee}</Text> },
            {
              key: 'change_status',
              content: (
                <Select
                  options={STATUS_ROW_OPTIONS}
                  value={currentStatus}
                  isDisabled={busyTaskId === task.id}
                  onChange={(option) => {
                    const next = option?.value;
                    if (next && next !== task.status) {
                      onUpdateStatus(task.id, next);
                    }
                  }}
                />
              )
            }
          ]
        };
      }),
    [tasks, busyTaskId, onUpdateStatus]
  );

  const filterLabel =
    filterStatus === 'all' ? 'tất cả status' : `status = ${filterStatus}`;

  if (loading) {
    return <Spinner label="Đang tải Sprint Tasks..." />;
  }

  return (
    <Stack space="space.250">
      <Stack space="space.100">
        <Heading size="medium">Sprint Tasks — Forge SQL</Heading>
        <Text>Project: {projectKey}</Text>
      </Stack>

      {error ? (
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      <Stack space="space.150">
        <Label labelFor="filter-issue-key">Issue key</Label>
        <Textfield
          id="filter-issue-key"
          value={issueKey}
          onChange={(event) => setIssueKey(String(event?.target?.value ?? event?.value ?? ''))}
        />
        <Label labelFor="filter-status">Lọc danh sách tasks</Label>
        <Select
          id="filter-status"
          options={STATUS_FILTER_OPTIONS}
          value={selectedFilterStatus}
          onChange={(option) => setFilterStatus(option?.value ?? 'all')}
        />
        <Button appearance="primary" onClick={loadDashboard}>
          Tải lại
        </Button>
      </Stack>

      <Stack space="space.150">
        <Heading size="small">Stats — GROUP BY status</Heading>
        <Text>Tổng: {total} tasks</Text>
        {stats.length > 0 ? (
          <>
            <Stack space="space.050">
              {stats.map((row) => (
                <Text key={row.status}>
                  {row.status}: {row.count}
                </Text>
              ))}
            </Stack>
            <BarChart title="Tasks theo status" data={chartData} xAccessor="x" yAccessor="y" height={220} />
          </>
        ) : (
          <Text>Chưa có dữ liệu cho issue này.</Text>
        )}
      </Stack>

      <Stack space="space.100">
        <Heading size="small">Tasks ({filterLabel}) — {tasks.length} dòng</Heading>
        {tasks.length === 0 ? (
          <EmptyState
            header="Không có task"
            description={
              filterStatus === 'done'
                ? 'Chưa có task done — tạo task với status done hoặc đổi status bên dưới.'
                : `Không có task với ${filterLabel}. Thử "Tất cả" hoặc tạo task mới bên dưới.`
            }
          />
        ) : (
          <DynamicTable head={tableHead} rows={tableRows} />
        )}
      </Stack>

      <Form>
        <Stack space="space.150">
          <Heading size="small">Thêm task</Heading>
          <Label labelFor="task-title">Title</Label>
          <TextArea
            id="task-title"
            value={title}
            onChange={(event) => setTitle(String(event?.target?.value ?? event?.value ?? ''))}
          />
          <Label labelFor="task-status">Status khi tạo</Label>
          <Select
            id="task-status"
            options={STATUS_ROW_OPTIONS}
            value={selectedNewStatus}
            onChange={(option) => setNewStatus(option?.value ?? 'todo')}
          />
          <Label labelFor="task-priority">Priority</Label>
          <Select
            id="task-priority"
            options={PRIORITY_OPTIONS}
            value={selectedPriority}
            onChange={(option) => setPriority(option?.value ?? '2')}
          />
          <Label labelFor="task-assignee">Assignee</Label>
          <Select
            id="task-assignee"
            options={ASSIGNEE_OPTIONS}
            value={selectedAssignee}
            onChange={(option) => setAssignee(option?.value ?? 'Unassigned')}
          />
          <FormFooter>
            <LoadingButton appearance="primary" isLoading={creating} onClick={onCreate}>
              Thêm task
            </LoadingButton>
          </FormFooter>
        </Stack>
      </Form>
    </Stack>
  );
};

ForgeReconciler.render(<App />);
