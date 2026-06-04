import { useEffect } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { burndownData, formatLog } from '../data/mockData';

function BurndownPage({ projectKey }) {
  useEffect(() => {
    console.log(JSON.stringify(formatLog('BurndownPage.mount', { projectKey })));
  }, [projectKey]);

  return (
    <section className="page">
      <h2>Burndown Chart</h2>
      <p className="page__hint">Ideal vs Actual remaining work (mock data)</p>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={burndownData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} label={{ value: 'Remaining', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#0052cc" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#de350b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default BurndownPage;
