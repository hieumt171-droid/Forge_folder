export const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

export const ROUTES = {
  overview: '/overview',
  burndown: '/burndown',
  issues: '/issues'
};

const ROUTE_LIST = Object.values(ROUTES);

export const normalizePath = (pathname) => {
  if (!pathname || pathname === '/') return ROUTES.overview;

  const pathOnly = String(pathname).split('?')[0].split('#')[0];

  if (ROUTE_LIST.includes(pathOnly)) return pathOnly;

  const matched = ROUTE_LIST.find((route) => pathOnly.endsWith(route));
  if (matched) return matched;

  return null;
};

export const sprintOverview = {
  name: 'Sprint 24 — Forge Dashboard',
  startDate: '2026-05-20',
  endDate: '2026-06-03',
  totalIssues: 42
};

export const burndownData = [
  { day: 'Day 1', ideal: 42, actual: 42 },
  { day: 'Day 2', ideal: 36, actual: 40 },
  { day: 'Day 3', ideal: 30, actual: 35 },
  { day: 'Day 4', ideal: 24, actual: 28 },
  { day: 'Day 5', ideal: 18, actual: 22 },
  { day: 'Day 6', ideal: 12, actual: 15 },
  { day: 'Day 7', ideal: 6, actual: 9 },
  { day: 'Day 8', ideal: 0, actual: 4 }
];

export const compareIssueKeys = (keyA, keyB) => {
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

export const mockIssues = [
  { key: 'HSF-12', summary: 'Setup Forge project page routing', status: 'Done', priority: 'High' },
  { key: 'HSF-8', summary: 'Integrate Recharts burndown', status: 'In Progress', priority: 'Medium' },
  { key: 'HSF-5', summary: 'Custom UI sidebar navigation', status: 'To Do', priority: 'Low' },
  { key: 'HSF-3', summary: 'Mock sprint overview data', status: 'In Progress', priority: 'Highest' },
  { key: 'HSF-1', summary: 'Initial project dashboard', status: 'Done', priority: 'Medium' }
];
