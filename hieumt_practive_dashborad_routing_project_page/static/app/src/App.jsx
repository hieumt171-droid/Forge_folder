import React, { useEffect, useRef, useState } from 'react';
import { Router, Route, Routes } from 'react-router-dom';
import { view } from '@forge/bridge';
import Sidebar from './components/Sidebar';
import BurndownPage from './pages/BurndownPage';
import IssuesPage from './pages/IssuesPage';
import OverviewPage from './pages/OverviewPage';
import { formatLog, normalizePath, ROUTES } from './data/mockData';
import './App.css';

function AppLayout({ projectKey }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path={ROUTES.overview} element={<OverviewPage projectKey={projectKey} />} />
          <Route path={ROUTES.burndown} element={<BurndownPage projectKey={projectKey} />} />
          <Route path={ROUTES.issues} element={<IssuesPage projectKey={projectKey} />} />
          <Route path="*" element={<OverviewPage projectKey={projectKey} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [historyState, setHistoryState] = useState(null);
  const [navigator, setNavigator] = useState(null);
  const [projectKey, setProjectKey] = useState('');
  const [error, setError] = useState('');
  const historyCleanupRef = useRef(null);
  const mountTimeRef = useRef(performance.now());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [context, history] = await Promise.all([view.getContext(), view.createHistory()]);
        if (cancelled) return;

        const key = context?.extension?.project?.key || 'UNKNOWN';
        const initialPath = normalizePath(history.location?.pathname) || ROUTES.overview;

        if (history.location?.pathname !== initialPath) {
          history.replace(initialPath);
        }

        setNavigator(history);
        setProjectKey(key);
        setHistoryState({
          action: history.action,
          location: { ...history.location, pathname: initialPath }
        });

        const unsubscribe = await history.listen((location, action) => {
          console.log(
            JSON.stringify(
              formatLog('history.listen', {
                action,
                pathname: location?.pathname
              })
            )
          );

          setHistoryState({ action, location });
        });

        historyCleanupRef.current = unsubscribe;
        const loadMs = Math.round(performance.now() - mountTimeRef.current);
        console.log(
          JSON.stringify(
            formatLog('SprintDashboard.ready', {
              stack: 'custom-ui',
              projectKey: key,
              path: initialPath,
              loadMs
            })
          )
        );
      } catch (e) {
        const message = e?.message || String(e);
        console.log(JSON.stringify(formatLog('App.init.error', { message })));
        if (!cancelled) setError(message);
      }
    })();

    return () => {
      cancelled = true;
      if (historyCleanupRef.current) {
        historyCleanupRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      if (historyCleanupRef.current) {
        historyCleanupRef.current();
      }
    };
    window.addEventListener('unload', handleUnload);
    return () => window.removeEventListener('unload', handleUnload);
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!navigator || !historyState) {
    return <div className="loading">Đang khởi tạo routing...</div>;
  }

  return (
    <Router
      navigator={navigator}
      navigationType={historyState.action}
      location={historyState.location}
    >
      <AppLayout projectKey={projectKey} />
    </Router>
  );
}

export default App;
