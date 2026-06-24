import { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../../services/apiClient';
import { Dataset, DatabaseConnection } from '../../../types';
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
  Upload,
  X,
  Compass,
  HardDrive,
  Sparkles
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { useUIStore } from '../../../store/useUIStore';
import { cn } from '../../../utils';
import QueryBuilder from './QueryBuilder';

export default function DatasetsManager() {
  const isDark = useUIStore((state) => state.theme === 'dark');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'connections' | 'workspace'>('list');
  const [loading, setLoading] = useState(false);

  // SQL Workspace States
  const [sqlQuery, setSqlQuery] = useState(`SELECT date, region, category, revenue, units_sold \nFROM sales_performance_2026 \nWHERE revenue > 15000 \nLIMIT 100;`);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [runTime, setRunTime] = useState<number | null>(null);
  
  // AI SQL Copilot States
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // Connections List & Creation States
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [fetchingConns, setFetchingConns] = useState(false);
  const [showNewConnModal, setShowNewConnModal] = useState(false);

  // New Connection Form
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState<'postgresql' | 'mysql' | 'sqlite' | 'bigquery' | 'gsheets'>('sqlite');
  const [newConnHost, setNewConnHost] = useState('');
  const [newConnPort, setNewConnPort] = useState('');
  const [newConnDBName, setNewConnDBName] = useState('');
  const [newConnUser, setNewConnUser] = useState('');
  const [newConnPassword, setNewConnPassword] = useState('');
  const [newConnSheetUrl, setNewConnSheetUrl] = useState('');
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingConn, setSavingConn] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);

  // Upload/Create Dataset Modal States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'file' | 'database'>('file');
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDesc, setNewDatasetDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [databaseQueryText, setDatabaseQueryText] = useState('SELECT * FROM sales_performance_2026;');
  const [queryBuilderOpen, setQueryBuilderOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch Datasets from Backend
  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/datasets/');
      const results = response.data.results || [];
      const mapped = results.map((ds: any) => ({
        id: ds.id,
        name: ds.name,
        description: ds.description,
        columns: ds.columns || [],
        rowCount: ds.row_count || 0,
        connectionType: ds.connection_type || 'csv',
        db_connection: ds.db_connection,
        sql_query: ds.sql_query,
        createdAt: ds.created_at,
        updatedAt: ds.updated_at,
      }));
      setDatasets(mapped);
      if (mapped.length > 0) {
        setSelectedDataset(mapped[0]);
      } else {
        setSelectedDataset(null);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Connections from Backend
  const fetchConnections = async () => {
    setFetchingConns(true);
    try {
      const response = await apiClient.get('/datasets/connections/');
      const results = response.data.results || [];
      setConnections(results);
      if (results.length > 0 && !selectedConnectionId) {
        setSelectedConnectionId(results[0].id);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setFetchingConns(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
    fetchConnections();
  }, []);

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
    if (!selectedDataset) return;
    setIsRunning(true);
    setQueryError(null);
    setRunTime(null);
    
    const startTime = performance.now();
    try {
      let payload: any = {};
      if (selectedDataset.db_connection) {
        // Query from DB adapter with direct SQL query (supports raw SQL custom editor fields)
        payload = {
          raw_sql: sqlQuery || selectedDataset.sql_query,
          measures: []
        };
      } else {
        // Ingested CSV file query (dimensions, measures)
        const selectFields = selectedDataset.columns.map(c => c.name);
        const numericField = selectedDataset.columns.find(c => c.type === 'number')?.name;
        
        payload = {
          dimensions: selectedDataset.columns.filter(c => c.type === 'string' || c.type === 'date').map(c => c.name).slice(0, 2),
          measures: numericField ? [{ field: numericField, aggregation: 'sum' }] : [{ field: selectFields[0], aggregation: 'count' }],
          filters: []
        };
      }

      const response = await apiClient.post(`/datasets/${selectedDataset.id}/query/`, payload);
      setQueryResults(response.data.results || []);
      setRunTime(parseFloat((performance.now() - startTime).toFixed(0)));
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Query execution failed.';
      setQueryError(errMsg);
      setQueryResults([]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAskCopilot = async () => {
    if (!copilotPrompt.trim() || !selectedDataset) return;
    setIsCopilotLoading(true);
    try {
      const response = await apiClient.post(`/datasets/${selectedDataset.id}/sql-copilot/`, {
        prompt: copilotPrompt
      });
      if (response.data.success && response.data.generated_sql) {
        setSqlQuery(response.data.generated_sql);
        setCopilotPrompt('');
      }
    } catch (err: any) {
      console.error('Error calling SQL Copilot:', err);
      alert('AI SQL Copilot was unable to compile the query.');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestResult(null);
    setConnError(null);
    try {
      const payload = {
        name: newConnName || 'Test Connection',
        connection_type: newConnType,
        host: newConnHost || null,
        port: newConnPort ? parseInt(newConnPort) : null,
        database_name: newConnDBName || null,
        username: newConnUser || null,
        password: newConnPassword || null,
        spreadsheet_url: newConnSheetUrl || null,
      };
      const res = await apiClient.post('/datasets/connections/test/', payload);
      setTestResult({ success: res.data.success, message: res.data.message });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Connection check failed.';
      setTestResult({ success: false, message: msg });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName) {
      setConnError('Connection Name is required.');
      return;
    }
    setSavingConn(true);
    setConnError(null);
    try {
      const payload = {
        name: newConnName,
        connection_type: newConnType,
        host: newConnHost || null,
        port: newConnPort ? parseInt(newConnPort) : null,
        database_name: newConnDBName || null,
        username: newConnUser || null,
        password: newConnPassword || null,
        spreadsheet_url: newConnSheetUrl || null,
      };
      await apiClient.post('/datasets/connections/', payload);
      setShowNewConnModal(false);
      
      // Reset connection fields
      setNewConnName('');
      setNewConnType('sqlite');
      setNewConnHost('');
      setNewConnPort('');
      setNewConnDBName('');
      setNewConnUser('');
      setNewConnPassword('');
      setNewConnSheetUrl('');
      setTestResult(null);

      await fetchConnections();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to save connection.';
      setConnError(msg);
    } finally {
      setSavingConn(false);
    }
  };

  const handleUploadDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDatasetName) {
      setUploadError('Dataset Name is required.');
      return;
    }
    if (creationMode === 'file' && !selectedFile) {
      setUploadError('Please select a CSV or XLSX file.');
      return;
    }
    if (creationMode === 'database' && !selectedConnectionId) {
      setUploadError('Please select a database connection.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      if (creationMode === 'file') {
        // 1. Create dataset profile
        const createRes = await apiClient.post('/datasets/', {
          name: newDatasetName,
          description: newDatasetDesc,
        });
        const datasetId = createRes.data.data.id;

        // 2. Upload file via FormData
        const formData = new FormData();
        formData.append('file', selectedFile!);

        await apiClient.post(`/datasets/${datasetId}/upload/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Create database query dataset directly
        await apiClient.post('/datasets/', {
          name: newDatasetName,
          description: newDatasetDesc,
          db_connection: selectedConnectionId,
          sql_query: databaseQueryText,
        });
      }

      // Close modal, refresh datasets, reset form
      setUploadModalOpen(false);
      setNewDatasetName('');
      setNewDatasetDesc('');
      setSelectedFile(null);
      setDatabaseQueryText('SELECT * FROM sales_performance_2026;');
      await fetchDatasets();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to create dataset.';
      setUploadError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in-up">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Datasets & Ingestion</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure datasets, database connections, and run custom analytical queries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Connect Dataset
          </button>
          
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
                setActiveTab('connections');
                fetchConnections();
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'connections'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="inline-block mr-1 h-3.5 w-3.5" />
              Databases
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
      </div>

      {loading && datasets.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : activeTab === 'list' ? (
        datasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center h-[300px] bg-card">
            <Database className="h-10 w-10 text-muted-foreground mb-4 animate-pulse" />
            <h3 className="text-sm font-semibold">No datasets connected</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Connect a file source or database queries to start building interactive dashboards.
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect First Source
            </button>
          </div>
        ) : (
          /* TAB 1: CONNECTED SOURCES LIST */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDataset(ds)}
                  className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                    selectedDataset?.id === ds.id
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                        {ds.db_connection ? <Database className="h-5 w-5" /> : <Table className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{ds.name}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">
                          {ds.connectionType} • {ds.rowCount.toLocaleString()} rows
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      Processed
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-normal">
                    {ds.description || 'No description added to this source.'}
                  </p>
                  {ds.db_connection && (
                    <div className="mt-3 p-2.5 rounded bg-muted/40 border border-border">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">SQL Query Config</p>
                      <pre className="font-mono text-[9px] text-foreground truncate">{ds.sql_query}</pre>
                    </div>
                  )}
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

            {selectedDataset && (
              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-4 border-b border-border">
                    <Database className="h-4 w-4 text-violet-500" />
                    <h3 className="text-sm font-bold">Metadata Details</h3>
                  </div>
                  <div className="space-y-4 mt-4 text-xs">
                    <div>
                      <p className="font-semibold text-muted-foreground">Ingested Type</p>
                      <p className="text-sm font-bold mt-0.5 capitalize">{selectedDataset.connectionType}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Storage Engine</p>
                      <p className="text-sm font-bold mt-0.5">
                        {selectedDataset.db_connection ? 'Live Connection Pipeline' : 'Apache Parquet Storage'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Datatype Schema</p>
                      <p className="text-sm font-bold mt-0.5">{selectedDataset.columns.length} columns detected</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Dataset UUID</p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">{selectedDataset.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ) : activeTab === 'connections' ? (
        /* TAB 2: DATABASES CONNECTIONS */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Database Connections</h2>
              <p className="text-[10px] text-muted-foreground">Persist connection credentials for remote data warehouses or spreadsheets.</p>
            </div>
            <button
              onClick={() => setShowNewConnModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Connection
            </button>
          </div>

          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center h-[240px] bg-card">
              <Database className="h-8 w-8 text-muted-foreground mb-3 animate-pulse" />
              <p className="text-xs font-semibold">No database connections configured</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-xs text-center">
                Add connection credentials for SQLite, PostgreSQL, MySQL, BigQuery, or Google Sheets to query live tables.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((conn) => (
                <div key={conn.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                        <Database className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{conn.name}</h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">
                          {conn.connection_type}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">
                      Connected
                    </span>
                  </div>
                  
                  <div className="border-t border-border mt-4 pt-3 text-[10px] space-y-1.5 text-muted-foreground font-medium">
                    {conn.connection_type === 'gsheets' ? (
                      <p className="truncate">URL: <span className="font-semibold text-foreground font-mono">{conn.spreadsheet_url}</span></p>
                    ) : (
                      <>
                        <p>Host: <span className="font-semibold text-foreground font-mono">{conn.host || 'local'}</span></p>
                        <p>Database: <span className="font-semibold text-foreground font-mono">{conn.database_name || 'default'}</span></p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !selectedDataset ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center h-[300px] bg-card">
          <p className="text-xs text-muted-foreground">Please upload a dataset first to access the SQL Query Lab.</p>
        </div>
      ) : (
        /* TAB 3: SQL WORKSPACE LAB */
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
                  <span className="truncate">
                    {selectedDataset.db_connection ? 'sales_performance_2026' : `${selectedDataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_data`}
                  </span>
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
                  <span className="text-xs font-semibold text-zinc-400">Interactive Query Canvas</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {selectedDataset.db_connection ? `${selectedDataset.connectionType.toUpperCase()} Engine` : 'Parquet Engine'}
                </span>
              </div>
              
              {/* AI SQL Copilot Input */}
              <div className="flex items-center gap-2 bg-zinc-900/60 rounded-lg p-2 border border-zinc-800">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
                <input
                  type="text"
                  placeholder="Ask the AI Copilot to generate a query (e.g. Total sales by category)..."
                  value={copilotPrompt}
                  onChange={(e) => setCopilotPrompt(e.target.value)}
                  className="flex-grow bg-transparent text-xs text-zinc-200 outline-none placeholder-zinc-500"
                />
                <button
                  type="button"
                  onClick={handleAskCopilot}
                  disabled={isCopilotLoading || !copilotPrompt.trim()}
                  className="rounded bg-primary px-3 py-1 text-[10px] font-bold text-white shadow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isCopilotLoading ? 'Generating...' : 'Ask AI'}
                </button>
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
                  Run query
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
                  <p className="text-xs text-muted-foreground">Execute query config to inspect backend outputs.</p>
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

      {/* NEW CONNECTION MODAL */}
      {showNewConnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-xs" onClick={() => setShowNewConnModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in-up text-left text-xs text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold">New Database Connection</h3>
              </div>
              <button
                onClick={() => setShowNewConnModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {connError && (
              <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-red-400">
                {connError}
              </div>
            )}

            <form onSubmit={handleSaveConnection} className="mt-4 space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-muted-foreground">Connection Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SQLite local test"
                  value={newConnName}
                  onChange={(e) => setNewConnName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-muted-foreground">Connection Engine Type</label>
                <select
                  value={newConnType}
                  onChange={(e) => setNewConnType(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="sqlite">SQLite Database (Local File)</option>
                  <option value="postgresql">PostgreSQL Engine</option>
                  <option value="mysql">MySQL Engine</option>
                  <option value="bigquery">Google BigQuery Lake</option>
                  <option value="gsheets">Google Sheets URL</option>
                </select>
              </div>

              {newConnType === 'gsheets' ? (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-muted-foreground">Spreadsheet URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={newConnSheetUrl}
                    onChange={(e) => setNewConnSheetUrl(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="font-semibold text-muted-foreground">Host Address</label>
                      <input
                        type="text"
                        placeholder="e.g. localhost"
                        value={newConnHost}
                        onChange={(e) => setNewConnHost(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-muted-foreground">Port</label>
                      <input
                        type="text"
                        placeholder="e.g. 5432"
                        value={newConnPort}
                        onChange={(e) => setNewConnPort(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-muted-foreground">Database Name</label>
                    <input
                      type="text"
                      placeholder="db.sqlite3"
                      value={newConnDBName}
                      onChange={(e) => setNewConnDBName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-muted-foreground">Username</label>
                      <input
                        type="text"
                        placeholder="db_user"
                        value={newConnUser}
                        onChange={(e) => setNewConnUser(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-muted-foreground">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newConnPassword}
                        onChange={(e) => setNewConnPassword(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              {testResult && (
                <div className={cn(
                  "rounded-lg p-2.5 flex items-center gap-2 font-semibold text-[10px] border mt-4",
                  testResult.success 
                    ? "border-emerald-900 bg-emerald-950/20 text-emerald-400"
                    : "border-red-900 bg-red-950/20 text-red-400"
                )}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex gap-2 border-t border-border pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConn}
                  className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-semibold hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {testingConn ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  type="submit"
                  disabled={savingConn}
                  className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {savingConn ? 'Saving...' : 'Save Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONNECT DATASET SOURCE MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-xs" onClick={() => setUploadModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in-up text-left text-xs text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Upload className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-sm font-bold">Connect New Dataset Source</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ingestion Mode Choice */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-1 mt-4">
              <button
                type="button"
                onClick={() => setCreationMode('file')}
                className={`flex-1 rounded-md py-1.5 text-center text-[10px] font-semibold transition-all ${
                  creationMode === 'file'
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                File Upload (CSV/XLSX)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreationMode('database');
                  fetchConnections();
                }}
                className={`flex-1 rounded-md py-1.5 text-center text-[10px] font-semibold transition-all ${
                  creationMode === 'database'
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Direct DB Query (SQL)
              </button>
            </div>

            {uploadError && (
              <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-red-400">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadDataset} className="mt-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Dataset View Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Metrics View"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-muted-foreground">Description</label>
                <textarea
                  placeholder="Describe the dataset's purpose..."
                  rows={2}
                  value={newDatasetDesc}
                  onChange={(e) => setNewDatasetDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {creationMode === 'file' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-muted-foreground">Choose Dataset File (CSV, XLSX)</label>
                  <input
                    type="file"
                    required
                    accept=".csv,.xlsx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-muted-foreground">Saved Database Connection</label>
                    {connections.length === 0 ? (
                      <p className="text-red-400 font-semibold text-[10px]">
                        No connections found. Go to "Databases" tab to configure one first.
                      </p>
                    ) : (
                      <select
                        value={selectedConnectionId}
                        onChange={(e) => setSelectedConnectionId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                      >
                        {connections.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.connection_type.toUpperCase()})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-muted-foreground">SQL Query Editor</label>
                      {connections.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setQueryBuilderOpen(true)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/85 bg-primary/10 px-2 py-0.5 rounded border border-primary/10 transition-colors"
                        >
                          <Compass className="h-3 w-3 animate-spin-slow" />
                          Launch Query Builder
                        </button>
                      )}
                    </div>
                    <textarea
                      required
                      placeholder="SELECT * FROM table;"
                      rows={4}
                      value={databaseQueryText}
                      onChange={(e) => setDatabaseQueryText(e.target.value)}
                      className="w-full bg-zinc-950 font-mono text-[10px] text-zinc-100 rounded-lg border border-border p-3 outline-none resize-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || (creationMode === 'database' && connections.length === 0)}
                className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Process & Ingest Source
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Query Builder Modal Overlay */}
      {queryBuilderOpen && (
        <QueryBuilder
          connectionType={connections.find(c => c.id === selectedConnectionId)?.connection_type || 'sqlite'}
          onApplyQuery={(sql) => setDatabaseQueryText(sql)}
          onClose={() => setQueryBuilderOpen(false)}
        />
      )}
    </div>
  );
}
