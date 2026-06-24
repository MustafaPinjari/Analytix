import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/apiClient';
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
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDate, cn } from '../../../utils';
import { useAuthStore } from '../../../store/useAuthStore';

export default function DashboardsList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // CUST Extra States
  const [datasets, setDatasets] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [recentDashboards, setRecentDashboards] = useState<any[]>([]);
  const [pinnedHomeKpis, setPinnedHomeKpis] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/dashboards/');
      const results = response.data.results || [];
      const mapped = results.map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        widgets: (d.widgets || []).map((w: any) => ({
          id: w.id,
          type: w.type,
          title: w.name,
          queryConfig: w.query_config,
          visualizationSettings: {},
          layout: {
            i: w.id,
            x: w.position_x,
            y: w.position_y,
            w: w.width,
            h: w.height,
          }
        })),
        isShared: false,
        sharedWith: [],
        ownerId: d.owner_id || '',
        ownerName: d.owner_name || 'Unknown',
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
      setDashboards(mapped);
    } catch (err) {
      console.error('Error fetching dashboards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
    
    // Fetch datasets and reports (CUST-5 Searchable Unified Hub)
    const fetchExtraData = async () => {
      try {
        const dsRes = await apiClient.get('/datasets/');
        setDatasets(dsRes.data.results || []);
        
        const repRes = await apiClient.get('/reports/');
        setReports(repRes.data.results || []);
      } catch (err) {
        console.error('Error fetching extra data for global search:', err);
      }
    };
    fetchExtraData();

    // Load recent activity and pinned home KPIs (CUST-9 & CUST-13)
    try {
      setRecentDashboards(JSON.parse(localStorage.getItem('analytix_recently_viewed') || '[]'));
      setPinnedHomeKpis(JSON.parse(localStorage.getItem('analytix_pinned_home_kpis') || '[]'));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click navigation
    if (confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await apiClient.delete(`/dashboards/${id}/`);
        setDashboards((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        console.error('Error deleting dashboard:', err);
      }
    }
  };

  const handleCreateNew = async () => {
    try {
      const response = await apiClient.post('/dashboards/', {
        name: 'Untitled Dashboard',
        description: 'A new blank analytics canvas. Connect a dataset and configure your widgets.',
      });
      const newDash = response.data.data;
      navigate(`/builder/${newDash.id}`);
    } catch (err) {
      console.error('Error creating dashboard:', err);
    }
  };

  const filteredDashboards = dashboards.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // CUST-5: Autocomplete suggestions list compiler
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    
    const matchedDashboards = dashboards.filter(
      d => d.name.toLowerCase().includes(query) || (d.description && d.description.toLowerCase().includes(query))
    );
    
    const matchedDatasets = datasets.filter(
      d => d.name?.toLowerCase().includes(query) || d.table_name?.toLowerCase().includes(query)
    );
    
    const matchedReports = reports.filter(
      r => r.name?.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query)
    );
    
    // Unique owners from dashboards
    const matchedOwners: string[] = [];
    dashboards.forEach(d => {
      if (d.ownerName && d.ownerName.toLowerCase().includes(query) && !matchedOwners.includes(d.ownerName)) {
        matchedOwners.push(d.ownerName);
      }
    });

    const hasAny = matchedDashboards.length > 0 || matchedDatasets.length > 0 || matchedReports.length > 0 || matchedOwners.length > 0;
    if (!hasAny) return null;

    return {
      dashboards: matchedDashboards.slice(0, 3),
      datasets: matchedDatasets.slice(0, 3),
      reports: matchedReports.slice(0, 3),
      owners: matchedOwners.slice(0, 3)
    };
  }, [searchQuery, dashboards, datasets, reports]);

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
        {user?.role !== 'viewer' && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            New Dashboard
          </button>
        )}
      </div>

      {/* CUST-13: Pinned KPI Strip Home Panel */}
      {pinnedHomeKpis.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-foreground">Pinned Performance Indicators</h2>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('analytix_pinned_home_kpis');
                setPinnedHomeKpis([]);
              }}
              className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors font-medium"
            >
              Clear All Pinned
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {pinnedHomeKpis.map((kpi: any) => (
              <div key={kpi.id} className="rounded-xl bg-muted/40 p-3.5 border border-border/40 hover:border-primary/30 transition-all flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground truncate uppercase tracking-wider">{kpi.title}</span>
                <div className="flex items-baseline justify-between gap-1.5 mt-2">
                  <span className="text-lg font-bold tracking-tight text-foreground">
                    {typeof kpi.value === 'number' ? `$${kpi.value.toLocaleString()}` : kpi.value}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold flex items-center shrink-0",
                    kpi.positive ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {kpi.positive ? <TrendingUp className="h-3 w-3 mr-0.5 inline" /> : <TrendingDown className="h-3 w-3 mr-0.5 inline" />}
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* CUST-9: Personal Activity Metrics Tracker ("Recently Viewed") */}
      {recentDashboards.length > 0 && (
        <div className="flex flex-col gap-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Recently Viewed Workspaces</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentDashboards.map((dash: any) => (
              <div
                key={dash.id}
                onClick={() => navigate(`/builder/${dash.id}`)}
                className="group border border-border bg-card/60 p-4 rounded-xl shadow-xs hover:border-primary/40 hover:shadow-xs cursor-pointer transition-all duration-200"
              >
                <h3 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {dash.name}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                  {dash.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-3 pt-2 border-t border-border/40">
                  <span className="truncate">by {dash.ownerName}</span>
                  <span>{formatDate(dash.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search unified hub (dashboards, datasets, reports, or owners)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowAutocomplete(true);
            }}
            onFocus={() => setShowAutocomplete(true)}
            className="w-full rounded-lg border border-border bg-card py-2 pr-4 pl-10 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
          />

          {/* CUST-5: Autocomplete Suggestion Dropdown */}
          {showAutocomplete && suggestions && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAutocomplete(false)} 
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card p-3 shadow-xl max-h-96 overflow-y-auto animate-fade-in-up text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Autocomplete Suggestions</span>
                  <button 
                    onClick={() => setShowAutocomplete(false)}
                    className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                  >
                    Close
                  </button>
                </div>
                
                {suggestions.dashboards.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Dashboards</span>
                    <div className="flex flex-col gap-1">
                      {suggestions.dashboards.map(d => (
                        <div
                          key={d.id}
                          onClick={() => {
                            navigate(`/builder/${d.id}`);
                            setShowAutocomplete(false);
                          }}
                          className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/60 cursor-pointer text-xs transition-colors"
                        >
                          <span className="font-semibold text-foreground truncate">{d.name}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">{d.ownerName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.reports.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Reports</span>
                    <div className="flex flex-col gap-1">
                      {suggestions.reports.map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            navigate(`/builder/${r.dashboard_id || r.dashboard || ''}`);
                            setShowAutocomplete(false);
                          }}
                          className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/60 cursor-pointer text-xs transition-colors"
                        >
                          <span className="font-semibold text-foreground truncate">{r.name}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">{r.frequency || 'Scheduled'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.datasets.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Datasets</span>
                    <div className="flex flex-col gap-1">
                      {suggestions.datasets.map(ds => (
                        <div
                          key={ds.id}
                          className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/10 text-xs"
                        >
                          <span className="font-semibold text-foreground truncate">{ds.name}</span>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">{ds.connection_type || 'Source'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.owners.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Owners</span>
                    <div className="flex flex-col gap-1">
                      {suggestions.owners.map(owner => (
                        <div
                          key={owner}
                          onClick={() => {
                            setSearchQuery(owner);
                            setShowAutocomplete(false);
                          }}
                          className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/60 cursor-pointer text-xs transition-colors"
                        >
                          <span className="font-semibold text-foreground">{owner}</span>
                          <span className="text-[9px] text-muted-foreground">Filter by Owner</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid List */}
      {loading && dashboards.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredDashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold">No dashboards found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Try adjusting your search query, or create a new dashboard to get started with building charts.
          </p>
          {user?.role !== 'viewer' && (
            <button
              onClick={handleCreateNew}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Dashboard
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDashboards.map((dash) => (
            <div
              key={dash.id}
              onClick={() => navigate(`/builder/${dash.id}`)}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 cursor-pointer animate-fade-in-up"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 border border-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  {user?.role !== 'viewer' && (
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDelete(dash.id, e)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                        title="Delete dashboard"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
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
