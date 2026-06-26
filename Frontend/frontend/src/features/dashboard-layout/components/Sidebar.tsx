import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../../../store/useUIStore';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  LayoutDashboard,
  Database,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../../utils';

interface NavItem {
  name: string;
  path: string;
  icon: any;
}

const navItems: NavItem[] = [
  { name: 'Dashboards', path: '/dashboards', icon: LayoutDashboard },
  { name: 'Datasets', path: '/datasets', icon: Database },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  const isPathActive = (path: string) => {
    if (path === '/dashboards') {
      return location.pathname.startsWith('/dashboards') || location.pathname.startsWith('/builder');
    }
    return location.pathname.startsWith(path);
  };

  const visibleNavItems = navItems.filter((item) => {
    if (item.path === '/users' || item.path === '/settings') {
      return user?.role === 'owner' || user?.role === 'admin';
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-border bg-card text-foreground transition-all duration-300 ease-in-out z-20',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Section */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4 font-bold overflow-hidden">
        <Link to="/dashboards" className="flex items-center gap-2.5 w-full">
          <img src="/Analytix_logo.png" alt="Analytix Logo" className="h-8 w-8 shrink-0 object-contain rounded-md" />
          {!sidebarCollapsed && (
            <span className="text-md tracking-tight font-extrabold text-foreground animate-fade-in-up">
              Analytix <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">BI</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav Links Section */}
      <nav className="flex-1 space-y-1.5 p-3">
        {visibleNavItems.map((item) => {
          const active = isPathActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 group relative',
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-[3px]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-[3px]'
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              
              {/* Active glowing indicator badge */}
              {active && (
                <span className="absolute right-2.5 top-[42%] h-1.5 w-1.5 rounded-full bg-white glow-active shrink-0 animate-ping" />
              )}
              
              {/* Collapsed Tooltip */}
              {sidebarCollapsed && (
                <div className="absolute left-18 z-50 hidden rounded-md bg-zinc-950 px-2 py-1 text-xs text-zinc-100 group-hover:block border border-zinc-800 shadow-xl whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg border border-border bg-background p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4.5 w-4.5" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-4.5 w-4.5" />
              <span className="text-xs font-semibold">Collapse Menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
