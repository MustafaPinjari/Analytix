import { useState, useMemo } from 'react';
import { MOCK_DATASETS, getDatasetData } from '../../../utils/mockData';
import { Dataset } from '../../../types';
import {
  Database,
  Search,
  Plus,
  Play,
  FileCode,
  Table,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { useUIStore } from '../../../store/useUIStore';
import { cn } from '../../../utils';

export default function DatasetsManager() {
  const isDark = useUIStore((state) => state.theme === 'dark');
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS);
  const [selectedDataset, setSelectedDataset] = useState<Dataset>(MOCK_DATASETS[0]);
  const [activeTab, setActiveTab] = useState<'list' | 'workspace'>('list');
  
  // SQL Workspace States
  const [sqlQuery, setSqlQuery] = useState(`SELECT date, region, category, revenue, units_sold \nFROM sales_performance_2026 \nWHERE revenue > 15000 \nLIMIT 100;`);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [runTime, setRunTime] = useState<number | null>(null);

  // Retrieve data columns mapped to AG Grid column definitions
  const gridColDefs = useMemo(() => {
    if (!selectedDataset) return [];
    return selectedDataset.columns.map((col) => ({
      field: col.name,
      headerName: col.name.toUpperCase().replace('_', ' '),
      sortable: true,
      filter: true,
      resizable: true,
      filterParams: { buttons: ['reset', 'apply'] },
      type: col.type === 'number' ? 'numericColumn' : undefined,
      valueFormatter: (params: any) => {
        if (col.type === 'number' && params.value !== undefined) {
          if (col.name === 'revenue' || col.name === 'margin') {
            return col.name === 'margin' ? `${(params.value * 100).toFixed(1)}%` : `$${params.value.toLocaleString()}`;
          }
          return params.value.toLocaleString();
        }
        return params.value;
      }
    }));
  }, [selectedDataset]);

  const handleRunQuery = async () => {
    setIsRunning(true);
    setQueryError(null);
    setRunTime(null);
    
    const startTime = performance.now();
    try {
      await new Promise((resolve) => setTimeout(resolve, 600)); // Latency simulation
      
      if (sqlQuery.toLowerCase().includes('syntax error')) {
        throw new Error("Syntax error in SQL input near 'WHERE' line 3.");
      }
      
      // Load mock rows for currently selected dataset schema
      const results = getDatasetData(selectedDataset.id);
      setQueryResults(results);
      setRunTime(parseFloat((performance.now() - startTime).toFixed(0)));
    } catch (err: any) {
      setQueryError(err.message || 'Database query execution failed.');
      setQueryResults([]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in-up">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Datasets & SQL Workspace</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure data warehouse connections, inspect metadata schemas, and construct queries.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Table className="inline-block mr-1 h-3.5 w-3.5" />
            Connected Sources
          </button>
          <button
            onClick={() => {
              setActiveTab('workspace');
              handleRunQuery(); // load initial rows
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'workspace'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode className="inline-block mr-1 h-3.5 w-3.5" />
            SQL Query Lab
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        /* TAB 1: CONNECTED SOURCES LIST */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                onClick={() => setSelectedDataset(ds)}
                className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                  selectedDataset.id === ds.id
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{ds.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">
                        {ds.connectionType} • {ds.rowCount.toLocaleString()} rows
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-normal">
                  {ds.description || 'No description added to this source.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {ds.columns.map((col) => (
                    <span
                      key={col.name}
                      className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border"
                    >
                      {col.name}: <span className="text-[9px] font-semibold">{col.type}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <Database className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-bold">Connection Config</h3>
              </div>
              <div className="space-y-4 mt-4 text-xs">
                <div>
                  <p className="font-semibold text-muted-foreground">Source Type</p>
                  <p className="text-sm font-bold mt-0.5 capitalize">{selectedDataset.connectionType}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Database Schema Host</p>
                  <p className="text-sm font-bold mt-0.5">warehouse-cluster-01.us-east.net</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Synchronization Mode</p>
                  <p className="text-sm font-bold mt-0.5">Real-time Incremental (10m latency)</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Credentials Key</p>
                  <p className="text-sm font-mono text-zinc-500 mt-0.5">cyberdyne_readonly_role_sha256...</p>
                </div>
              </div>
            </div>
            
            <button className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add Connection Credential
            </button>
          </div>
        </div>
      ) : (
        /* TAB 2: SQL WORKSPACE LAB */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Column Left: Schema Selector */}
          <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Database className="h-4 w-4 text-violet-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Schema Browser</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Tables</p>
                <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-left bg-primary/5 text-primary border border-primary/10 font-semibold">
                  <Table className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{selectedDataset.id.replace('ds-', '')}_data</span>
                </button>
              </div>

              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Columns Schema</p>
                <div className="space-y-1">
                  {selectedDataset.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between rounded px-2 py-1 text-xs border border-transparent hover:bg-muted transition-colors"
                    >
                      <span className="font-mono text-foreground truncate">{col.name}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column Right: SQL Workspace Editor + Result Table */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Editor Area */}
            <div className="rounded-2xl border border-border bg-zinc-950 p-4 shadow-inner flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-zinc-400">Interactive Editor Console</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">PostgreSQL v15</span>
              </div>
              
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={5}
                className="w-full bg-transparent font-mono text-xs leading-relaxed text-zinc-100 outline-none resize-y"
              />
              
              <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <span className="text-xs text-zinc-500 animate-pulse">Running server tasks...</span>
                  )}
                  {runTime !== null && !queryError && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Completed in {runTime}ms ({queryResults.length} records)</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRunQuery}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  Run Script
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Result Preview Ledger</h3>
                {queryResults.length > 0 && (
                  <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                )}
              </div>

              {queryError && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 flex gap-3 text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Execution Error</p>
                    <p className="mt-1 leading-normal text-red-300 font-mono">{queryError}</p>
                  </div>
                </div>
              )}

              {!queryError && queryResults.length === 0 && !isRunning && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center h-[260px] bg-card">
                  <p className="text-xs text-muted-foreground">Write a SQL script and click "Run Script" to inspect dataset outputs.</p>
                </div>
              )}

              {!queryError && queryResults.length > 0 && (
                <div
                  className={cn(
                    "flex-1 w-full rounded-2xl border border-border overflow-hidden",
                    isDark ? "ag-theme-alpine-dark" : "ag-theme-alpine"
                  )}
                  style={{ height: '320px' }}
                >
                  <AgGridReact
                    rowData={queryResults}
                    columnDefs={gridColDefs}
                    pagination={true}
                    paginationPageSize={10}
                    domLayout="normal"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
