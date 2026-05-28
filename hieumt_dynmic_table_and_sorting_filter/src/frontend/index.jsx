import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Badge,
  Button,
  ButtonGroup,
  DynamicTable,
  Lozenge,
  Spinner,
  Stack,
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
    case 'in-progress':
    case 'in progress':
      return 'inprogress';
    default:
      return 'default';
  }
};

const App = () => {
  const [originalIssues, setOriginalIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const [sortKey, setSortKey] = useState('key');
  const [sortOrder, setSortOrder] = useState('ASC');

  useEffect(() => {
    let cancelled = false;

    const fetchIssues = async () => {
      setLoading(true);
      try {
        const res = await invoke('getProjectIssues');
        const list = Array.isArray(res) ? res : [];
        if (cancelled) return;

        console.log(JSON.stringify(formatLog('getProjectIssues.ui.success', { count: list.length })));
        setOriginalIssues(list);
        setFilteredIssues(list);
      } catch (e) {
        console.log(
          JSON.stringify(
            formatLog('getProjectIssues.ui.error', {
              message: e?.message || String(e)
            })
          )
        );
        if (!cancelled) {
          setOriginalIssues([]);
          setFilteredIssues([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchIssues();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilter = useCallback(
    (filterType) => {
      setActiveFilter(filterType);

      if (filterType === 'ALL') {
        setFilteredIssues(originalIssues);
        return;
      }

      if (filterType === 'OPEN') {
        const openStatuses = new Set(['open', 'to do', 'todo']);
        const next = originalIssues.filter((it) => {
          const statusName = String(it?.statusName || '').toLowerCase();
          const statusCategory = String(it?.statusCategory || '').toLowerCase();
          return openStatuses.has(statusName) || statusCategory === 'new' || statusCategory === 'todo';
        });
        setFilteredIssues(next);
        return;
      }

      if (filterType === 'BUGS') {
        const next = originalIssues.filter(
          (it) => String(it?.issueType || '').toLowerCase() === 'bug'
        );
        setFilteredIssues(next);
      }
    },
    [originalIssues]
  );

  const head = useMemo(
    () => ({
      cells: [
        { key: 'key', content: 'Key', isSortable: true },
        { key: 'summary', content: 'Summary' },
        { key: 'status', content: 'Status' },
        { key: 'priority', content: 'Priority' },
        { key: 'assignee', content: 'Assignee' }
      ]
    }),
    []
  );

  const sortedIssues = useMemo(() => {
    const list = Array.isArray(filteredIssues) ? [...filteredIssues] : [];
    if (sortKey !== 'key') return list;

    const dir = sortOrder === 'DESC' ? -1 : 1;
    return list.sort((a, b) => String(a?.key || '').localeCompare(String(b?.key || '')) * dir);
  }, [filteredIssues, sortKey, sortOrder]);

  const rows = useMemo(
    () =>
      sortedIssues.map((it) => ({
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
      })),
    [sortedIssues]
  );

  const onSort = useCallback((params) => {
    // params: { key: string, sortOrder: 'ASC' | 'DESC' }
    if (params?.key) setSortKey(params.key);
    if (params?.sortOrder) setSortOrder(params.sortOrder);
  }, []);

  return (
    <Stack space='space.150'>
      <ButtonGroup>
        <Button
          appearance={activeFilter === 'ALL' ? 'primary' : 'default'}
          onClick={() => handleFilter('ALL')}
        >
          All
        </Button>
        <Button
          appearance={activeFilter === 'OPEN' ? 'primary' : 'default'}
          onClick={() => handleFilter('OPEN')}
        >
          Open
        </Button>
        <Button
          appearance={activeFilter === 'BUGS' ? 'primary' : 'default'}
          onClick={() => handleFilter('BUGS')}
        >
          Bugs
        </Button>
      </ButtonGroup>

      {loading ? (
        <Spinner size='medium' label='Đang tải issues...' />
      ) : (
        <DynamicTable
          head={head}
          rows={rows}
          rowsPerPage={10}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
