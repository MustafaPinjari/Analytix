import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUIStore } from '../../../store/useUIStore';
import { Bell, Sun, Moon, LogOut, ChevronDown, Building, User, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/apiClient';
import { cn } from '../../../utils';

interface HeaderProps {
  onToggleNotifications: () => void;
  unreadCount: number;
}

export default function Header({ onToggleNotifications, unreadCount }: HeaderProps) {
  const navigate = useNavigate();
  const { user, clearAuth, setOrganization } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);
  
  const [activeOrgName, setActiveOrgName] = useState('Select Organization');
  const [orgs, setOrgs] = useState<{ id: string; name: string; role?: string }[]>([]);

  // Fetch tenant organizations list
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await apiClient.get('/organizations/');
        const results = response.data.results || [];
        setOrgs(results);
        
        const getFrontendRole = (backendRole?: string) => {
          if (user?.is_superuser) return "admin";
          if (!backendRole) return "viewer";
          return backendRole === "SUPER_ADMIN" || backendRole === "ORG_ADMIN" ? "admin" : 
                 backendRole === "ANALYST" ? "editor" : "viewer";
        };

        const currentOrgId = user?.organizationId;
        const currentOrg = results.find((o: any) => o.id === currentOrgId);
        if (currentOrg) {
          setActiveOrgName(currentOrg.name);
          const mappedRole = getFrontendRole(currentOrg.role);
          if (user?.role !== mappedRole) {
            setOrganization(currentOrg.id, mappedRole);
          }
        } else if (results.length > 0) {
          setActiveOrgName(results[0].name);
          const mappedRole = getFrontendRole(results[0].role);
          setOrganization(results[0].id, mappedRole);
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
      }
    };
    if (user) {
      fetchOrgs();
    }
  }, [user?.organizationId]);

  // Handle clicking outside of dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setOrgOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleSwitchOrg = (org: any) => {
    const getFrontendRole = (backendRole?: string) => {
      if (user?.is_superuser) return "admin";
      if (!backendRole) return "viewer";
      return backendRole === "SUPER_ADMIN" || backendRole === "ORG_ADMIN" ? "admin" : 
             backendRole === "ANALYST" ? "editor" : "viewer";
    };
    const mappedRole = getFrontendRole(org.role);
    setOrganization(org.id, mappedRole);
    setActiveOrgName(org.name);
    setOrgOpen(false);
    // Reload dashboard page contextually
    window.location.reload();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card/70 backdrop-blur-md px-6 text-foreground z-10 sticky top-0">
      {/* Left side: Org Switcher & Search */}
      <div className="flex items-center gap-6 text-xs text-left">
        {/* Org Switcher */}
        <div className="relative" ref={orgRef}>
          <button
            onClick={() => setOrgOpen(!orgOpen)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-sm font-semibold transition-all hover:bg-muted/80 focus:ring-2 focus:ring-primary/25 text-foreground"
          >
            <Building className="h-4 w-4 text-primary" />
            <span className="max-w-[140px] truncate">{activeOrgName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          
          {orgOpen && (
            <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-card/95 backdrop-blur-lg p-1.5 shadow-xl animate-fade-in-up z-20">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Switch Organization
              </div>
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitchOrg(org)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-sm text-left font-medium transition-colors hover:bg-muted/80",
                    user?.organizationId === org.id ? "text-primary bg-primary/5 font-bold animate-pulse" : "text-foreground"
                  )}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
        </div>
 
        {/* Global Search Bar */}
        <div className="relative hidden w-72 md:block">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dashboards, metrics, datasets..."
            className="w-full rounded-lg border border-border bg-background/40 py-1.5 pr-4 pl-9 text-sm outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onToggleNotifications}
          className="relative rounded-lg border border-border bg-background p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          aria-label="Open notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-full p-0.5 outline-none hover:opacity-90"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User avatar'}
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
            <div className="hidden flex-col items-start text-left md:flex">
              <span className="text-xs font-semibold leading-none">{user?.name}</span>
              <span className="text-[10px] font-medium text-muted-foreground capitalize mt-0.5">{user?.role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-fade-in-up z-20 text-xs text-left">
              <div className="border-b border-border px-3 py-2 text-left">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Organization Config
                </button>
              </div>
              <div className="border-t border-border p-1 mt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
