import { useMemo } from 'react';
import { Widget, DataPoint } from '../../../types';
import { queryMockData } from '../../../utils/mockData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import { useUIStore } from '../../../store/useUIStore';
import { cn, formatCurrency, formatNumber, formatPercent, formatShortNumber } from '../../../utils';
import { AlertCircle } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

// ==========================================
// 1. LOCAL ERROR BOUNDARY FOR WIDGETS
// ==========================================
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget render crashed:", error, errorInfo);
  }
  public render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ==========================================
// 2. MAIN WIDGET SWITCHER
// ==========================================
interface WidgetRendererProps {
  widget: Widget;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  const isDark = useUIStore((state) => state.theme === 'dark');

  // Compute queried data reactively
  const data = useMemo(() => {
    try {
      const q = widget.queryConfig;
      if (!q.datasetId) return [];
      
      // Map metric arrays
      const metricsMap = q.metrics.map(m => ({
        column: m.column,
        aggregation: m.aggregation,
        alias: m.alias || `${m.aggregation}_${m.column}`
      }));
      
      return queryMockData(q.datasetId, q.dimensions, metricsMap, q.filters);
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [widget.queryConfig]);

  const errorFallback = (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center bg-card rounded-xl">
      <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
      <p className="text-xs font-semibold">Widget Display Error</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">Please check metric dimensions in editor.</p>
    </div>
  );

  return (
    <WidgetErrorBoundary fallback={errorFallback}>
      <div className="h-full w-full overflow-hidden bg-card text-foreground">
        {widget.type === 'kpi' && <KpiCard widget={widget} data={data} />}
        {widget.type === 'bar' && <BarChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'line' && <LineChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'area' && <AreaChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'pie' && <PieChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'table' && <TableWidget widget={widget} data={data} isDark={isDark} />}
      </div>
    </WidgetErrorBoundary>
  );
}

// ==========================================
// 3. WIDGET VISUAL IMPLEMENTATIONS
// ==========================================

// --- KPI CARD WIDGET ---
function KpiCard({ widget, data }: { widget: Widget; data: DataPoint[] }) {
  const metric = widget.queryConfig.metrics[0];
  const alias = metric ? (metric.alias || `${metric.aggregation}_${metric.column}`) : '';
  const rawValue = data[0]?.[alias] ?? 0;
  
  const formattedValue = useMemo(() => {
    const val = Number(rawValue);
    const format = widget.visualizationSettings.kpiFormat || 'number';
    
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percent') return formatPercent(val);
    return formatNumber(val);
  }, [rawValue, widget.visualizationSettings.kpiFormat]);

  return (
    <div className="flex h-full flex-col justify-center p-6 text-left">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
        {widget.title}
      </p>
      <p className="text-2xl font-extrabold tracking-tight mt-2 text-foreground">
        {formattedValue}
      </p>
      {widget.visualizationSettings.kpiLabel && (
        <span className="text-[10px] font-semibold text-emerald-500 mt-1.5 leading-none">
          {widget.visualizationSettings.kpiLabel}
        </span>
      )}
    </div>
  );
}

// --- COLOR PALETTE GENERATOR ---
const DEFAULT_PALETTES = {
  light: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'],
  dark: ['#8b5cf6', '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#f472b6'],
};

// --- BAR CHART WIDGET ---
function BarChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const xKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;
  const isStacked = widget.visualizationSettings.stacked;

  return (
    <div className="h-full w-full pt-4 pb-2 pr-4 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <XAxis
            dataKey={xKey}
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatShortNumber(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '11px',
            }}
            formatter={(v: any) => [formatNumber(Number(v))]}
          />
          {widget.visualizationSettings.showLegend !== false && (
            <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
          )}
          {metrics.map((m, idx) => {
            const field = m.alias || `${m.aggregation}_${m.column}`;
            return (
              <Bar
                key={field}
                dataKey={field}
                stackId={isStacked ? 'stack' : undefined}
                fill={palette[idx % palette.length]}
                radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- LINE CHART WIDGET ---
function LineChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const xKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;

  return (
    <div className="h-full w-full pt-4 pb-2 pr-4 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <XAxis
            dataKey={xKey}
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatShortNumber(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '11px',
            }}
          />
          {widget.visualizationSettings.showLegend !== false && (
            <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
          )}
          {metrics.map((m, idx) => {
            const field = m.alias || `${m.aggregation}_${m.column}`;
            return (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
                stroke={palette[idx % palette.length]}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1 }}
                activeDot={{ r: 5 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- AREA CHART WIDGET ---
function AreaChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const xKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;

  return (
    <div className="h-full w-full pt-4 pb-2 pr-4 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            {metrics.map((m, idx) => {
              const field = m.alias || `${m.aggregation}_${m.column}`;
              const color = palette[idx % palette.length];
              return (
                <linearGradient key={`grad-${field}`} id={`color-${field}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <XAxis
            dataKey={xKey}
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatShortNumber(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '11px',
            }}
          />
          {widget.visualizationSettings.showLegend !== false && (
            <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
          )}
          {metrics.map((m, idx) => {
            const field = m.alias || `${m.aggregation}_${m.column}`;
            const color = palette[idx % palette.length];
            return (
              <Area
                key={field}
                type="monotone"
                dataKey={field}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${field})`}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- PIES CHART WIDGET ---
function PieChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const nameKey = widget.queryConfig.dimensions[0] || 'name';
  const metric = widget.queryConfig.metrics[0];
  const valKey = metric ? (metric.alias || `${metric.aggregation}_${metric.column}`) : 'value';

  // Group and sort data for cleanliness
  const pieData = useMemo(() => {
    return data.map((d) => ({
      name: String(d[nameKey] || 'Unknown'),
      value: Number(d[valKey] || 0),
    })).filter(item => item.value > 0).slice(0, 8); // limit slices
  }, [data, nameKey, valKey]);

  return (
    <div className="h-full w-full pt-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="50%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} stroke={isDark ? '#18181b' : '#ffffff'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '11px',
            }}
            formatter={(v: any) => [formatNumber(Number(v))]}
          />
          {widget.visualizationSettings.showLegend !== false && (
            <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '9px', marginTop: '10px' }} />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- TABLE WIDGET (AG GRID) ---
function TableWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const colDefs = useMemo(() => {
    if (data.length === 0) return [];
    
    // Create column headers from data keys
    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      field: key,
      headerName: key.toUpperCase().replace('_', ' '),
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: (params: any) => {
        if (typeof params.value === 'number') {
          if (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('sales')) {
            return formatCurrency(params.value);
          }
          if (key.toLowerCase().includes('margin')) {
            return formatPercent(params.value);
          }
          return formatNumber(params.value);
        }
        return params.value;
      }
    }));
  }, [data]);

  return (
    <div
      className={cn(
        "h-full w-full overflow-hidden border-t border-border mt-1",
        isDark ? "ag-theme-alpine-dark" : "ag-theme-alpine"
      )}
    >
      <AgGridReact
        rowData={data}
        columnDefs={colDefs}
        pagination={true}
        paginationPageSize={5}
        domLayout="normal"
      />
    </div>
  );
}
export { WidgetErrorBoundary };
