import React, { useEffect, useMemo, useState } from 'react';
import ForgeReconciler, { Heading, Inline, Lozenge, SectionMessage, Spinner, Stack, Tag, Text } from '@forge/react';
import { invoke, view } from '@forge/bridge';
import { Route, Routes, unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';

const ROUTES = {
  overview: '/overview',
  recentIssues: '/recent-issues',
  team: '/team'
};

const normalizePath = (pathname) => {
  if (!pathname || pathname === '/') return ROUTES.overview;
  if (pathname === ROUTES.overview || pathname === ROUTES.recentIssues || pathname === ROUTES.team) {
    return pathname;
  }
  return ROUTES.overview;
};

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('vi-VN');
};

const OverviewPage = ({ projectContext }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    invoke('getOverviewData', { project: projectContext })
      .then((res) => isMounted && setData(res))
      .catch((err) => isMounted && setError(err?.message || 'Failed to load overview'));
    return () => {
      isMounted = false;
    };
  }, [projectContext]);

  if (error) {
    return <SectionMessage appearance='error' title='Overview error'><Text>{error}</Text></SectionMessage>;
  }
  if (!data) {
    return <Spinner size='medium' label='Loading overview...' />;
  }
  return (
    <Stack space='space.150'>
      <Heading size='medium'>Project Overview</Heading>
      <Inline alignInline='space-between'><Text>Project Key</Text><Tag text={String(data.projectKey ?? '—')} /></Inline>
      <Inline alignInline='space-between'><Text>Project Type</Text><Tag text={String(data.projectType ?? '—')} /></Inline>
      <Inline alignInline='space-between'><Text>Total Issues</Text><Lozenge appearance='inprogress'>{String(data.issueCount)}</Lozenge></Inline>
    </Stack>
  );
};

const RecentIssuesPage = ({ projectContext }) => {
  const [issues, setIssues] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    invoke('getRecentIssues', { project: projectContext })
      .then((res) => isMounted && setIssues(res))
      .catch((err) => isMounted && setError(err?.message || 'Failed to load recent issues'));
    return () => {
      isMounted = false;
    };
  }, [projectContext]);

  if (error) {
    return <SectionMessage appearance='error' title='Recent Issues error'><Text>{error}</Text></SectionMessage>;
  }
  if (!issues) {
    return <Spinner size='medium' label='Loading recent issues...' />;
  }
  return (
    <Stack space='space.150'>
      <Heading size='medium'>Recent Issues</Heading>
      {issues.length === 0 && <Text>No issues found.</Text>}
      {issues.map((issue) => (
        <Stack key={issue.key} space='space.050'>
          <Inline alignInline='space-between'><Text>{issue.key}</Text><Tag text={String(issue.priority || 'None')} /></Inline>
          <Text>{issue.summary}</Text>
          <Inline alignInline='space-between'><Text>Status: {issue.status}</Text><Text>Created: {formatDate(issue.created)}</Text></Inline>
        </Stack>
      ))}
    </Stack>
  );
};

const TeamPage = ({ projectContext }) => {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    invoke('getTeamAssignments', { project: projectContext })
      .then((res) => isMounted && setUsers(res))
      .catch((err) => isMounted && setError(err?.message || 'Failed to load team'));
    return () => {
      isMounted = false;
    };
  }, [projectContext]);

  if (error) {
    return <SectionMessage appearance='error' title='Team error'><Text>{error}</Text></SectionMessage>;
  }
  if (!users) {
    return <Spinner size='medium' label='Loading team...' />;
  }
  return (
    <Stack space='space.150'>
      <Heading size='medium'>Team Assignments (7 days)</Heading>
      {users.length === 0 && <Text>No assignees in last 7 days.</Text>}
      {users.map((user) => (
        <Inline key={user.accountId} alignInline='space-between'>
          <Text>{user.displayName}</Text>
          <Tag text={String(user.accountId)} />
        </Inline>
      ))}
    </Stack>
  );
};

const App = () => {
  const [history, setHistory] = useState(null);
  const [projectContext, setProjectContext] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    let isMounted = true;

    Promise.all([view.getContext(), view.createHistory()])
      .then(([context, forgeHistory]) => {
        if (!isMounted) {
          return;
        }
        const project = context?.extension?.project || {};
        const normalized = normalizePath(forgeHistory.location?.pathname);
        if (forgeHistory.location?.pathname !== normalized) {
          forgeHistory.replace(normalized);
        }

        unsubscribe = forgeHistory.listen((location) => {
          const nextPath = normalizePath(location?.pathname);
          if (location?.pathname !== nextPath) {
            forgeHistory.replace(nextPath);
          }
        });

        setProjectContext({
          key: project.key || 'UNKNOWN',
          type: project.type || project.projectTypeKey || 'unknown'
        });
        setHistory(forgeHistory);
      })
      .catch((err) => setError(err?.message || 'Failed to initialize project page'));

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const content = useMemo(() => {
    if (error) {
      return <SectionMessage appearance='error' title='Initialization error'><Text>{error}</Text></SectionMessage>;
    }
    if (!history || !projectContext) {
      return <Spinner size='medium' label='Initializing project page...' />;
    }

    return (
      <HistoryRouter history={history}>
        <Stack space='space.200'>
          <Routes>
            <Route path={ROUTES.overview} element={<OverviewPage projectContext={projectContext} />} />
            <Route path={ROUTES.recentIssues} element={<RecentIssuesPage projectContext={projectContext} />} />
            <Route path={ROUTES.team} element={<TeamPage projectContext={projectContext} />} />
            <Route path='*' element={<OverviewPage projectContext={projectContext} />} />
          </Routes>
        </Stack>
      </HistoryRouter>
    );
  }, [error, history, projectContext]);

  return content;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
