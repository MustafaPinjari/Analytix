import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_DASHBOARDS, MOCK_DATASETS } from '../../../utils/mockData';
import { Dashboard, Widget, WidgetType } from '../../../types';
import {
  ArrowLeft,
  Eye,
  Edit3,
  Share2,
  Save,
  Trash2,
  Settings,
  LayoutGrid,
  X,
  Copy,
  UserPlus,
} from 'lucide-react';
// @ts-ignore
import RGL from 'react-grid-layout';
const GridCanvas: any = RGL;
import WidgetRenderer from '../../widgets/components/WidgetRenderer';
import { cn } from '../../../utils';

// Custom Resize Observer HOC to avoid buggy exports in react-grid-layout
function ResponsiveWidthWrapper({ children }: { children: (width: number) => React.ReactNode }) {
  const [width, setWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children(width)}
    </div>
  );
}


export default function DashboardBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Dashboard workspace states
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sharing states
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('viewer');
  const [copiedLink, setCopiedLink] = useState(false);

  // Load dashboard from list
  useEffect(() => {
    const found = MOCK_DASHBOARDS.find((d) => d.id === id);
    if (found) {
      // Create deep copy to allow modifications
      setDashboard(JSON.parse(JSON.stringify(found)));
    } else {
      // Create a fallback new dashboard
      setDashboard({
        id: id || 'dash-new',
        name: 'Untitled Dashboard',
        description: 'Configure your datasets and widget layout.',
        widgets: [],
        isShared: false,
        sharedWith: [],
        ownerId: 'usr-001',
        ownerName: 'Sarah Connor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [id]);

  if (!dashboard) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Handle saving configurations
  const handleSave = async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 800)); // Network simulation
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Handle Grid coordinate update
  const handleLayoutChange = (layout: any[]) => {
    if (!isEditMode) return;
    
    setDashboard((prev) => {
      if (!prev) return null;
      const updatedWidgets = prev.widgets.map((widget) => {
        const item = layout.find((l) => l.i === widget.id);
        if (item) {
          return {
            ...widget,
            layout: {
              ...widget.layout,
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            },
          };
        }
        return widget;
      });
      return { ...prev, widgets: updatedWidgets };
    });
  };

  // Add Widget template onto grid
  const handleAddWidget = (type: WidgetType) => {
    const newId = `widget-${Date.now()}`;
    const defaultQueryConfig = {
      datasetId: MOCK_DATASETS[0].id,
      dimensions: [MOCK_DATASETS[0].columns[0].name],
      metrics: [
        {
          column: MOCK_DATASETS[0].columns.find((c) => c.type === 'number')?.name || 'value',
          aggregation: 'sum' as const,
          alias: 'Metric Value',
        },
      ],
      filters: [],
    };

    const newWidget: Widget = {
      id: newId,
      type,
      title: `New ${type.toUpperCase()} Visual`,
      queryConfig: defaultQueryConfig,
      visualizationSettings: {
        showLegend: true,
      },
      layout: {
        i: newId,
        x: (dashboard.widgets.length * 4) % 12,
        y: Infinity, // put at bottom
        w: type === 'kpi' ? 4 : type === 'table' ? 12 : 6,
        h: type === 'kpi' ? 2 : 4,
        minW: 3,
        minH: 2,
      },
    };

    setDashboard((prev) => {
      if (!prev) return null;
      return { ...prev, widgets: [...prev.widgets, newWidget] };
    });
    
    // Automatically select to configure
    setSelectedWidget(newWidget);
    setConfigDrawerOpen(true);
  };

  // Delete widget from board
  const handleDeleteWidget = (widgetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDashboard((prev) => {
      if (!prev) return null;
      return { ...prev, widgets: prev.widgets.filter((w) => w.id !== widgetId) };
    });
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
      setConfigDrawerOpen(false);
    }
  };

  // Open configuration drawer for widget
  const handleConfigureWidget = (widget: Widget) => {
    if (!isEditMode) return;
    setSelectedWidget(widget);
    setConfigDrawerOpen(true);
  };

  // Update selected widget parameters inside editor panel
  const handleUpdateWidget = (updated: Widget) => {
    setDashboard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        widgets: prev.widgets.map((w) => (w.id === updated.id ? updated : w)),
      };
    });
    setSelectedWidget(updated);
  };

  // Copy shareable link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Add collaborator invite
  const handleAddCollaborator = () => {
    if (!shareEmail) return;
    setDashboard((prev) => {
      if (!prev) return null;
      const sharedWith = [...prev.sharedWith, { email: shareEmail, role: shareRole }];
      return { ...prev, isShared: true, sharedWith };
    });
    setShareEmail('');
  };

  // Remove collaborator
  const handleRemoveCollaborator = (email: string) => {
    setDashboard((prev) => {
      if (!prev) return null;
      const sharedWith = prev.sharedWith.filter((s) => s.email !== email);
      const isShared = sharedWith.length > 0;
      return { ...prev, isShared, sharedWith };
    });
  };

  return (
    <div className="flex flex-col gap-6 text-left relative min-h-screen">
      {/* 1. BUILDER TOPBAR CONTROL HEADER */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboards')}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <input
              type="text"
              disabled={!isEditMode}
              value={dashboard.name}
              onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
              className="text-xl font-bold tracking-tight bg-transparent border-b border-transparent focus:border-primary outline-none text-foreground py-0.5"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-bold">
              {isEditMode ? 'Design Workspace' : 'Presentation View'} • By {dashboard.ownerName}
            </p>
          </div>
        </div>

        {/* Action button groupings */}
        <div className="flex items-center gap-2.5">
          {/* Edit/Preview Toggle */}
          <div className="flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => {
                setIsEditMode(false);
                setConfigDrawerOpen(false);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                !isEditMode
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                isEditMode
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>

          {/* Share Modal Trigger */}
          <button
            onClick={() => setSharingModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: WORKSPACE GRID CANVAS */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Draggable Widget Templates Panel */}
        {isEditMode && (
          <div className="w-full lg:w-56 shrink-0 rounded-2xl border border-border bg-card p-4 flex flex-col gap-4 animate-fade-in-up">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Widget Templates</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Click templates to instantiate onto grid canvas.</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {(['kpi', 'bar', 'line', 'area', 'pie', 'table'] as WidgetType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddWidget(type)}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5 text-xs text-left font-semibold hover:border-primary/50 hover:bg-primary/5 transition-all text-foreground cursor-pointer group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <span className="capitalize">{type === 'kpi' ? 'KPI Card' : `${type} Chart`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Center Grid Area */}
        <div className="flex-1 w-full rounded-2xl border border-border bg-background/50 backdrop-blur-xs p-4 min-h-[500px]">
          {dashboard.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[420px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold">Workspace is empty</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                To start visualization, drag or click widget elements from the templates sidebar on the left.
              </p>
            </div>
          ) : (
            <ResponsiveWidthWrapper>
              {(width) => (
                <GridCanvas
                  className="layout"
                  layout={dashboard.widgets.map((w) => w.layout)}
                  cols={12}
                  rowHeight={80}
                  width={width}
                  isDraggable={isEditMode}
                  isResizable={isEditMode}
                  draggableHandle=".grid-drag-handle"
                  onLayoutChange={(layout: any) => handleLayoutChange(layout)}
                >
                  {dashboard.widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={cn(
                        'group/item rounded-2xl border border-border bg-card flex flex-col justify-between overflow-hidden relative shadow-sm',
                        isEditMode ? 'hover:border-primary/40' : ''
                      )}
                    >
                      {/* Widget Card Header Controls */}
                      <div className="flex h-10 items-center justify-between border-b border-border bg-card px-4 shrink-0">
                        <div
                          className={cn(
                            'text-xs font-bold truncate flex items-center gap-1.5 text-foreground',
                            isEditMode ? 'grid-drag-handle cursor-grab active:cursor-grabbing flex-1' : ''
                          )}
                        >
                          {isEditMode && <span className="text-muted-foreground select-none">⠿</span>}
                          <span>{widget.title}</span>
                        </div>

                        {isEditMode && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleConfigureWidget(widget)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Configure Widget"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteWidget(widget.id, e)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                              title="Delete Widget"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render Visual */}
                      <div className="flex-1 w-full overflow-hidden p-2">
                        <WidgetRenderer widget={widget} />
                      </div>
                    </div>
                  ))}
                </GridCanvas>
              )}
            </ResponsiveWidthWrapper>
          )}
        </div>
      </div>

      {/* 3. RIGHT SIDE: WIDGET EDITOR CONFIGURATOR DRAWER */}
      {configDrawerOpen && selectedWidget && (
        <>
          {/* Backdrop (blocks interactions in background on desktop edit mode if preferred, or leaves visible) */}
          <div
            className="fixed inset-0 z-30 bg-zinc-950/20 backdrop-blur-xs lg:hidden"
            onClick={() => setConfigDrawerOpen(false)}
          />
          
          <div className="fixed top-0 right-0 bottom-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card text-foreground shadow-2xl animate-fade-in-up">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <h2 className="text-sm font-bold">Configure Visualization</h2>
              <button
                onClick={() => setConfigDrawerOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-left">
              {/* Widget Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Widget Title</label>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => handleUpdateWidget({ ...selectedWidget, title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Dataset Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Select Source Dataset</label>
                <select
                  value={selectedWidget.queryConfig.datasetId}
                  onChange={(e) => {
                    const nextDsId = e.target.value;
                    const nextDs = MOCK_DATASETS.find(d => d.id === nextDsId) || MOCK_DATASETS[0];
                    handleUpdateWidget({
                      ...selectedWidget,
                      queryConfig: {
                        datasetId: nextDsId,
                        dimensions: [nextDs.columns[0].name],
                        metrics: [{
                          column: nextDs.columns.find(c => c.type === 'number')?.name || 'value',
                          aggregation: 'sum',
                          alias: 'Value',
                        }],
                        filters: [],
                      }
                    });
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {MOCK_DATASETS.map((ds) => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </select>
              </div>

              {/* Dimensions (Group By Columns) */}
              {selectedWidget.type !== 'kpi' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-muted-foreground">Dimension (X-Axis)</label>
                  <select
                    value={selectedWidget.queryConfig.dimensions[0] || ''}
                    onChange={(e) => {
                      handleUpdateWidget({
                        ...selectedWidget,
                        queryConfig: {
                          ...selectedWidget.queryConfig,
                          dimensions: [e.target.value],
                        }
                      });
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {MOCK_DATASETS.find(d => d.id === selectedWidget.queryConfig.datasetId)
                      ?.columns.filter(c => c.type === 'string' || c.type === 'date')
                      .map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Metrics (aggregations) */}
              <div className="flex flex-col gap-2.5">
                <label className="font-semibold text-muted-foreground">Metric Configuration (Y-Axis)</label>
                {selectedWidget.queryConfig.metrics.map((metric, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-muted/20 p-2.5 rounded-lg border border-border/40">
                    <select
                      value={metric.column}
                      onChange={(e) => {
                        const updatedMetrics = [...selectedWidget.queryConfig.metrics];
                        updatedMetrics[idx].column = e.target.value;
                        handleUpdateWidget({
                          ...selectedWidget,
                          queryConfig: { ...selectedWidget.queryConfig, metrics: updatedMetrics }
                        });
                      }}
                      className="rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary flex-1"
                    >
                      {MOCK_DATASETS.find(d => d.id === selectedWidget.queryConfig.datasetId)
                        ?.columns.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
                        ))}
                    </select>

                    <select
                      value={metric.aggregation}
                      onChange={(e) => {
                        const updatedMetrics = [...selectedWidget.queryConfig.metrics];
                        updatedMetrics[idx].aggregation = e.target.value as any;
                        handleUpdateWidget({
                          ...selectedWidget,
                          queryConfig: { ...selectedWidget.queryConfig, metrics: updatedMetrics }
                        });
                      }}
                      className="rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary shrink-0"
                    >
                      {['sum', 'avg', 'count', 'min', 'max'].map((agg) => (
                        <option key={agg} value={agg}>{agg.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Advanced visual attributes */}
              <div className="border-t border-border pt-4 space-y-4">
                <h4 className="font-bold text-foreground">Visual settings</h4>
                
                {selectedWidget.type === 'kpi' ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-muted-foreground">KPI Value Format</label>
                      <select
                        value={selectedWidget.visualizationSettings.kpiFormat || 'number'}
                        onChange={(e) => handleUpdateWidget({
                          ...selectedWidget,
                          visualizationSettings: {
                            ...selectedWidget.visualizationSettings,
                            kpiFormat: e.target.value as any
                          }
                        })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="number">Raw Number</option>
                        <option value="currency">Currency ($ USD)</option>
                        <option value="percent">Percentage (%)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-muted-foreground">Growth Target Sublabel</label>
                      <input
                        type="text"
                        placeholder="e.g. vs Q3 Budget target"
                        value={selectedWidget.visualizationSettings.kpiLabel || ''}
                        onChange={(e) => handleUpdateWidget({
                          ...selectedWidget,
                          visualizationSettings: {
                            ...selectedWidget.visualizationSettings,
                            kpiLabel: e.target.value
                          }
                        })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Grid Stack options */}
                    {selectedWidget.type === 'bar' && (
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={selectedWidget.visualizationSettings.stacked || false}
                          onChange={(e) => handleUpdateWidget({
                            ...selectedWidget,
                            visualizationSettings: {
                              ...selectedWidget.visualizationSettings,
                              stacked: e.target.checked
                            }
                          })}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        Stacked aggregation display
                      </label>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={selectedWidget.visualizationSettings.showLegend !== false}
                        onChange={(e) => handleUpdateWidget({
                          ...selectedWidget,
                          visualizationSettings: {
                            ...selectedWidget.visualizationSettings,
                            showLegend: e.target.checked
                          }
                        })}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      Display Chart Legend
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-border p-4 bg-card">
              <button
                onClick={() => setConfigDrawerOpen(false)}
                className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground shadow hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* 4. SHARING PERMISSIONS OVERLAY MODAL */}
      {sharingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-xs" onClick={() => setSharingModalOpen(false)} />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in-up text-left text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Share2 className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold">Dashboard Sharing Configuration</h3>
              </div>
              <button
                onClick={() => setSharingModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Share Link */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label className="font-semibold text-muted-foreground">Copy Workspace Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 outline-none select-all truncate font-mono text-[11px]"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1 rounded-lg bg-primary/10 px-4 py-2 font-semibold text-primary hover:bg-primary/20 transition-all shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Invite Collaborator Form */}
            <div className="mt-6 flex flex-col gap-2">
              <label className="font-semibold text-muted-foreground">Invite Collaborator</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                />
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as any)}
                  className="rounded-lg border border-border bg-background px-2 py-2 outline-none focus:border-primary shrink-0"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={handleAddCollaborator}
                  className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Invite
                </button>
              </div>
            </div>

            {/* Active Collaborators list */}
            <div className="mt-6">
              <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Access Ledger</p>
              <div className="border border-border rounded-xl mt-2 overflow-hidden max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between p-3 bg-muted/10 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">SC</div>
                    <span className="font-semibold">Sarah Connor (You)</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Owner</span>
                </div>
                {dashboard.sharedWith.map((share) => (
                  <div key={share.email} className="flex items-center justify-between p-3 border-b border-border/50">
                    <span className="font-medium text-foreground">{share.email}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase capitalize">{share.role}</span>
                      <button
                        onClick={() => handleRemoveCollaborator(share.email)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Remove Access"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
