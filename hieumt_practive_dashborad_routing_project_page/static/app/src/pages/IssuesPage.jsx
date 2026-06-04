import { useEffect, useMemo, useState } from 'react';
import { compareIssueKeys, formatLog, mockIssues } from '../data/mockData';

function IssuesPage({ projectKey }) {
  const [sortOrder, setSortOrder] = useState('ASC');

  useEffect(() => {
    console.log(JSON.stringify(formatLog('IssuesPage.mount', { projectKey })));
  }, [projectKey]);

  const sortedIssues = useMemo(() => {
    const list = [...mockIssues];
    list.sort((a, b) => {
      const cmp = compareIssueKeys(a.key, b.key);
      return sortOrder === 'DESC' ? -cmp : cmp;
    });
    return list;
  }, [sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
  };

  return (
    <section className="page">
      <h2>Issues</h2>
      <p className="page__hint">Sortable table — click Key header</p>

      <table className="data-table">
        <thead>
          <tr>
            <th>
              <button type="button" className="sort-btn" onClick={toggleSort}>
                Key {sortOrder === 'ASC' ? '↑' : '↓'}
              </button>
            </th>
            <th>Summary</th>
            <th>Status</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {sortedIssues.map((issue) => (
            <tr key={issue.key}>
              <td>{issue.key}</td>
              <td>{issue.summary}</td>
              <td>{issue.status}</td>
              <td>{issue.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default IssuesPage;
