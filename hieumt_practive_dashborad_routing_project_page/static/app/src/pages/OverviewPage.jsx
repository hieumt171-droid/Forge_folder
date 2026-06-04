import { useEffect } from 'react';
import { formatLog, sprintOverview } from '../data/mockData';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
};

function OverviewPage({ projectKey }) {
  useEffect(() => {
    console.log(JSON.stringify(formatLog('OverviewPage.mount', { projectKey })));
  }, [projectKey]);

  return (
    <section className="page">
      <h2>Overview</h2>
      <p className="page__hint">Project: {projectKey || '—'}</p>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Sprint name</span>
          <span className="stat-card__value">{sprintOverview.name}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Start date</span>
          <span className="stat-card__value">{formatDate(sprintOverview.startDate)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">End date</span>
          <span className="stat-card__value">{formatDate(sprintOverview.endDate)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Total issues</span>
          <span className="stat-card__value">{sprintOverview.totalIssues}</span>
        </div>
      </div>
    </section>
  );
}

export default OverviewPage;
