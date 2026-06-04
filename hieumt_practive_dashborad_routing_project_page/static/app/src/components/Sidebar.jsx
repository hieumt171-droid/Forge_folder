import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../data/mockData';

function SidebarLink({ to, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <a
      href={to}
      className={isActive ? 'sidebar__link active' : 'sidebar__link'}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Project dashboard navigation">
      <p className="sidebar__title">Dashboard</p>
      <SidebarLink to={ROUTES.overview}>Overview</SidebarLink>
      <SidebarLink to={ROUTES.burndown}>Burndown Chart</SidebarLink>
      <SidebarLink to={ROUTES.issues}>Issues</SidebarLink>
    </nav>
  );
}

export default Sidebar;
