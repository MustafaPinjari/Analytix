import { useState, useEffect } from 'react';
import {
  Database,
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  Code,
  CheckCircle,
  HelpCircle,
  X,
  Play
} from 'lucide-react';
import { cn } from '../../../utils';

interface QueryBuilderProps {
  onApplyQuery: (sql: string) => void;
  onClose: () => void;
  connectionType: string;
}

// Structured schema for SQL visual building
const DB_SCHEMA: Record<string, { table: string; columns: { name: string; type: 'string' | 'number' | 'date' }[] }> = {
  sales_performance_2026: {
    table: 'sales_performance_2026',
    columns: [
      { name: 'id', type: 'number' },
      { name: 'date', type: 'date' },
      { name: 'region', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'revenue', type: 'number' },
      { name: 'units_sold', type: 'number' },
    ]
  },
  inventory_levels: {
    table: 'inventory_levels',
    columns: [
      { name: 'id', type: 'number' },
      { name: 'product_id', type: 'string' },
      { name: 'warehouse_location', type: 'string' },
      { name: 'stock_qty', type: 'number' },
      { name: 'reorder_point', type: 'number' },
    ]
  },
  customer_segments: {
    table: 'customer_segments',
    columns: [
      { name: 'id', type: 'number' },
      { name: 'company_name', type: 'string' },
      { name: 'industry', type: 'string' },
      { name: 'annual_spend', type: 'number' },
      { name: 'tier', type: 'string' },
    ]
  }
};

export default function QueryBuilder({ onApplyQuery, onClose, connectionType }: QueryBuilderProps) {
  const [selectedTable, setSelectedTable] = useState<string>('sales_performance_2026');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['date', 'region', 'revenue']);
  
  // Group By & Aggregation settings
  const [enableAggregation, setEnableAggregation] = useState<boolean>(false);
  const [columnOperations, setColumnOperations] = useState<Record<string, 'group' | 'sum' | 'avg' | 'count' | 'min' | 'max'>>({});

  // Filter conditions
  const [filters, setFilters] = useState<{ column: string; operator: string; value: string }[]>([]);
  
  // Joins setup
  const [joins, setJoins] = useState<{ joinType: 'INNER' | 'LEFT' | 'RIGHT'; targetTable: string; sourceKey: string; targetKey: string }[]>([]);
  
  // Limit settings
  const [limit, setLimit] = useState<number>(100);

  // Auto-initialize operations when aggregation is enabled
  useEffect(() => {
    if (enableAggregation) {
      const ops: Record<string, 'group' | 'sum' | 'avg' | 'count' | 'min' | 'max'> = {};
      selectedColumns.forEach(col => {
        const colDef = DB_SCHEMA[selectedTable]?.columns.find(c => c.name === col);
        if (colDef?.type === 'number') {
          ops[col] = 'sum';
        } else {
          ops[col] = 'group';
        }
      });
      setColumnOperations(ops);
    } else {
      setColumnOperations({});
    }
  }, [enableAggregation, selectedTable, selectedColumns]);

  const handleToggleColumn = (colName: string) => {
    if (selectedColumns.includes(colName)) {
      setSelectedColumns(selectedColumns.filter(c => c !== colName));
    } else {
      setSelectedColumns([...selectedColumns, colName]);
    }
  };

  const handleAddFilter = () => {
    const availableCols = DB_SCHEMA[selectedTable]?.columns || [];
    if (availableCols.length > 0) {
      setFilters([...filters, { column: availableCols[0].name, operator: '=', value: '' }]);
    }
  };

  const handleUpdateFilter = (index: number, key: 'column' | 'operator' | 'value', val: string) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: val };
    setFilters(updated);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleAddJoin = () => {
    const tables = Object.keys(DB_SCHEMA).filter(t => t !== selectedTable);
    if (tables.length > 0) {
      setJoins([...joins, { joinType: 'INNER', targetTable: tables[0], sourceKey: 'id', targetKey: 'id' }]);
    }
  };

  const handleUpdateJoin = (index: number, key: string, val: string) => {
    const updated = [...joins] as any;
    updated[index][key] = val;
    setJoins(updated);
  };

  const handleRemoveJoin = (index: number) => {
    setJoins(joins.filter((_, i) => i !== index));
  };

  // Compile visual options to SQL string
  const compileSQL = (): string => {
    if (!selectedTable) return '';

    let selectList: string[] = [];

    if (enableAggregation) {
      selectedColumns.forEach(col => {
        const op = columnOperations[col] || 'group';
        if (op === 'group') {
          selectList.push(`${selectedTable}.${col}`);
        } else {
          selectList.push(`${op.toUpperCase()}(${selectedTable}.${col}) AS ${op}_${col}`);
        }
      });
    } else {
      selectList = selectedColumns.map(col => `${selectedTable}.${col}`);
    }

    if (selectList.length === 0) {
      selectList = ['*'];
    }

    let sql = `SELECT ${selectList.join(', ')}\nFROM ${selectedTable}`;

    // Appending Joins
    joins.forEach(j => {
      sql += `\n${j.joinType} JOIN ${j.targetTable} ON ${selectedTable}.${j.sourceKey} = ${j.targetTable}.${j.targetKey}`;
    });

    // Appending Filters
    if (filters.length > 0) {
      const filterClauses = filters.map(f => {
        const isNumeric = DB_SCHEMA[selectedTable]?.columns.find(c => c.name === f.column)?.type === 'number';
        const safeVal = isNumeric ? f.value : `'${f.value}'`;
        return `${selectedTable}.${f.column} ${f.operator} ${safeVal}`;
      });
      sql += `\nWHERE ${filterClauses.join(' AND ')}`;
    }

    // Appending Group By
    if (enableAggregation) {
      const groups = selectedColumns.filter(col => columnOperations[col] === 'group');
      if (groups.length > 0) {
        sql += `\nGROUP BY ${groups.map(col => `${selectedTable}.${col}`).join(', ')}`;
      }
    }

    // Appending Limit
    if (limit > 0) {
      sql += `\nLIMIT ${limit}`;
    }

    return sql + ';';
  };

  const generatedSQL = compileSQL();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl h-[85vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden text-left text-xs text-foreground">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold">Visual SQL Query Builder</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                Connection: {connectionType} Adapter Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Builder Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Schema and Column Selector */}
          <div className="w-1/3 border-r border-border p-4 flex flex-col gap-4 overflow-y-auto bg-muted/20">
            <div>
              <label className="block font-bold text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">
                Primary Query Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => {
                  setSelectedTable(e.target.value);
                  setSelectedColumns([]);
                }}
                className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-primary"
              >
                {Object.keys(DB_SCHEMA).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-muted-foreground mb-2 uppercase tracking-wider text-[10px]">
                Toggle Columns & Dimensions
              </label>
              <div className="space-y-1">
                {DB_SCHEMA[selectedTable]?.columns.map(col => (
                  <label
                    key={col.name}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all hover:bg-muted/80",
                      selectedColumns.includes(col.name)
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.name)}
                        onChange={() => handleToggleColumn(col.name)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="font-semibold text-foreground">{col.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded border border-border">
                      {col.type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column: Joins, Aggregations & Filters */}
          <div className="w-2/3 p-5 flex flex-col gap-5 overflow-y-auto">
            
            {/* Aggregations Config */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-agg"
                    checked={enableAggregation}
                    onChange={(e) => setEnableAggregation(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="enable-agg" className="font-bold text-foreground cursor-pointer">
                    Enable Aggregations (Group By)
                  </label>
                </div>
              </div>

              {enableAggregation && (
                <div className="space-y-2 mt-2">
                  {selectedColumns.map(col => {
                    const colDef = DB_SCHEMA[selectedTable]?.columns.find(c => c.name === col);
                    const op = columnOperations[col] || 'group';
                    return (
                      <div key={col} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                        <span className="font-semibold">{col}</span>
                        <select
                          value={op}
                          onChange={(e) => setColumnOperations({ ...columnOperations, [col]: e.target.value as any })}
                          className="rounded border border-border bg-background px-2 py-1 text-xs outline-none"
                        >
                          <option value="group">Group By</option>
                          {colDef?.type === 'number' && (
                            <>
                              <option value="sum">Sum</option>
                              <option value="avg">Average</option>
                              <option value="min">Minimum</option>
                              <option value="max">Maximum</option>
                            </>
                          )}
                          <option value="count">Record Count</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SQL Filters */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-foreground">Query Filter Parameters</span>
                <button
                  type="button"
                  onClick={handleAddFilter}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Filter
                </button>
              </div>

              {filters.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-2">No active filters configured.</p>
              ) : (
                <div className="space-y-2">
                  {filters.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={f.column}
                        onChange={(e) => handleUpdateFilter(i, 'column', e.target.value)}
                        className="flex-1 rounded border border-border bg-background p-1.5 text-xs outline-none"
                      >
                        {DB_SCHEMA[selectedTable]?.columns.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={f.operator}
                        onChange={(e) => handleUpdateFilter(i, 'operator', e.target.value)}
                        className="rounded border border-border bg-background p-1.5 text-xs outline-none"
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="LIKE">LIKE</option>
                      </select>
                      <input
                        type="text"
                        placeholder="value"
                        value={f.value}
                        onChange={(e) => handleUpdateFilter(i, 'value', e.target.value)}
                        className="flex-1 rounded border border-border bg-background p-1.5 text-xs outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFilter(i)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-muted"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SQL Table Joins */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-foreground">Relational Joins (Optional)</span>
                <button
                  type="button"
                  onClick={handleAddJoin}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Join Table
                </button>
              </div>

              {joins.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-2">No joins mapped.</p>
              ) : (
                <div className="space-y-3">
                  {joins.map((j, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 p-2 rounded bg-muted/20 border border-border">
                      <select
                        value={j.joinType}
                        onChange={(e) => handleUpdateJoin(i, 'joinType', e.target.value)}
                        className="rounded border border-border bg-background p-1.5 text-xs outline-none"
                      >
                        <option value="INNER">INNER JOIN</option>
                        <option value="LEFT">LEFT JOIN</option>
                        <option value="RIGHT">RIGHT JOIN</option>
                      </select>
                      <select
                        value={j.targetTable}
                        onChange={(e) => handleUpdateJoin(i, 'targetTable', e.target.value)}
                        className="rounded border border-border bg-background p-1.5 text-xs outline-none"
                      >
                        {Object.keys(DB_SCHEMA).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="font-mono text-zinc-500">ON {selectedTable}.</span>
                      <select
                        value={j.sourceKey}
                        onChange={(e) => handleUpdateJoin(i, 'sourceKey', e.target.value)}
                        className="rounded border border-border bg-background p-1.5 text-xs outline-none"
                      >
                        {DB_SCHEMA[selectedTable]?.columns.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <span className="font-mono text-zinc-500">= {j.targetTable}.</span>
                      <select
                        value={j.targetKey}
                        onChange={(e) => handleUpdateJoin(i, 'targetKey', e.target.value)}
                        className="rounded border border-border bg-background p-1.5 text-xs outline-none"
                      >
                        {(DB_SCHEMA[j.targetTable]?.columns || []).map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveJoin(i)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 rounded hover:bg-muted"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Limit Config */}
            <div className="flex items-center gap-3">
              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Record limit:</span>
              <input
                type="number"
                min="0"
                max="5000"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                className="w-24 rounded border border-border bg-card p-1.5 font-semibold text-center text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer with SQL compiling preview */}
        <div className="border-t border-border bg-zinc-950 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Code className="h-4 w-4 text-primary animate-pulse" />
              <span className="font-semibold text-xs">Live SQL Query Compiler</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-800 px-4 py-2 hover:bg-zinc-900 transition-all font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyQuery(generatedSQL);
                  onClose();
                }}
                className="rounded-lg bg-primary px-5 py-2 hover:brightness-110 active:scale-[0.98] transition-all font-semibold text-primary-foreground shadow shadow-primary/20"
              >
                Apply Query string
              </button>
            </div>
          </div>
          
          <pre className="font-mono text-[10px] leading-relaxed text-emerald-400 max-h-24 overflow-y-auto whitespace-pre-wrap p-2.5 rounded bg-zinc-900 border border-zinc-800 shadow-inner">
            {generatedSQL}
          </pre>
        </div>

      </div>
    </div>
  );
}
