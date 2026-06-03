import React, { useEffect, useMemo, useState } from 'react';
import { requestJira, showFlag, view } from '@forge/bridge';
import TunnelBadge from './TunnelBadge';
import './App.css';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return String(iso);
  }
};

const flattenContext = (ctx, prefix = '') => {
  const rows = [];
  if (ctx === null || ctx === undefined) return rows;

  if (typeof ctx !== 'object') {
    rows.push({ key: prefix || 'value', value: String(ctx) });
    return rows;
  }

  for (const [k, v] of Object.entries(ctx)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      rows.push(...flattenContext(v, path));
    } else {
      rows.push({
        key: path,
        value: Array.isArray(v) ? JSON.stringify(v) : String(v ?? '')
      });
    }
  }
  return rows;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [context, setContext] = useState(null);
  const [issue, setIssue] = useState(null);

  const debugRows = useMemo(() => flattenContext(context), [context]);

  const issueRows = useMemo(() => {
    if (!issue) return [];
    return [
      { label: 'Key', value: issue.key },
      { label: 'Summary', value: issue.summary },
      { label: 'Status', value: issue.status },
      { label: 'Priority', value: issue.priority },
      { label: 'Assignee', value: issue.assignee },
      { label: 'Created', value: issue.created }
    ];
  }, [issue]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const ctx = await view.getContext();
        if (cancelled) return;

        setContext(ctx);
        console.log(JSON.stringify(formatLog('view.getContext.success', { hasContext: Boolean(ctx) })));

        const issueKey = ctx?.extension?.issue?.key;
        if (!issueKey) {
          throw new Error('Không tìm thấy issue key trong context');
        }

        const res = await requestJira(
          `/rest/api/3/issue/${issueKey}?fields=summary,status,priority,assignee,created`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`requestJira failed: ${res.status} ${text}`);
        }

        const raw = await res.json();
        if (cancelled) return;

        const fields = raw?.fields || {};
        const mapped = {
          key: raw?.key ?? issueKey,
          summary: fields?.summary ?? '—',
          status: fields?.status?.name ?? '—',
          priority: fields?.priority?.name ?? '—',
          assignee: fields?.assignee?.displayName ?? 'Unassigned',
          created: formatDate(fields?.created)
        };

        setIssue(mapped);
        console.log(JSON.stringify(formatLog('requestJira.success', { issueKey: mapped.key })));

        showFlag({
          id: `issue-loaded-${mapped.key}`,
          type: 'success',
          title: `Issue loaded: ${mapped.key}`,
          description: mapped.summary,
          isAutoDismiss: true
        });
      } catch (e) {
        const message = e?.message || String(e);
        console.log(JSON.stringify(formatLog('load.error', { message })));
        if (!cancelled) {
          setError(message);
          setIssue(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="loading">Đang tải issue...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="panel">
      <TunnelBadge />
      <h2>Issue Panel — Custom UI (Bridge APIs)</h2>

      <h3>Debug — view.getContext()</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {debugRows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.key}</th>
              <td className="debug-value">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Issue — requestJira()</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {issueRows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
