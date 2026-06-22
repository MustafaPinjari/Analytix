import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_DASHBOARDS } from '../../../utils/mockData';
import { Dashboard } from '../../../types';
import {
  LayoutDashboard,
  Search,
  Plus,
  ArrowUpRight,
  Trash2,
  Share2,
  User,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatDate } from '../../../utils';

export default function DashboardsList() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>(MOCK_DASHBOARDS);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click navigation
    if (confirm('Are you sure you want to delete this dashboard?')) {
      setDashboards((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleCreateNew = () => {
    const newId = `dash-${Date.now()}`;
    // Create new blank dashboard structure
    const newDash: Dashboard = {
      id: newId,
      name: 'Untitled Dashboard',
      description: 'A new blank analytics canvas. Connect a dataset and configure your widgets.',
      widgets: [],
      isShared: false,
      sharedWith: [],
      ownerId: 'usr-001',
      ownerName: 'Sarah Connor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to state
    setDashboards((prev) => [newDash, ...prev]);
    // Navigate to builder
    navigate(`/builder/${newId}`);
  };

  const filteredDashboards = dashboards.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 text-left animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboards</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Access and manage your visual workspaces, KPI reports, and charts.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          New Dashboard
        </button>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Dashboards</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{dashboards.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shared Dashboards</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{dashboards.filter(d => d.isShared).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Widgets Active</p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {dashboards.reduce((acc, curr) => acc + curr.widgets.length, 0)}
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dashboards by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pr-4 pl-10 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Grid List */}
      {filteredDashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold">No dashboards found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Try adjusting your search query, or create a new dashboard to get started with building charts.
          </p>
          <button
            onClick={handleCreateNew}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDashboards.map((dash) => (
            <div
              key={dash.id}
              onClick={() => navigate(`/builder/${dash.id}`)}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 cursor-pointer"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 border border-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(dash.id, e)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                      title="Delete dashboard"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground mt-4 group-hover:text-primary transition-colors line-clamp-1">
                  {dash.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-normal line-clamp-2">
                  {dash.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Footer Metadata */}
              <div className="border-t border-border mt-5 pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{dash.widgets.length} widgets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(dash.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{dash.ownerName}</span>
                  </div>
                  
                  {dash.isShared ? (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-500">
                      <Users className="h-3 w-3" />
                      <span>Shared</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 font-semibold text-muted-foreground">
                      <Share2 className="h-3 w-3" />
                      <span>Private</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Absolute arrow indicator */}
              <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
