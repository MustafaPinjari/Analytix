import { useMemo, useState, useEffect } from 'react';
import { Widget, DataPoint } from '../../../types';
import { apiClient } from '../../../services/apiClient';
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
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
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchWidgetData = async () => {
      const q = widget.queryConfig;
      if (!q || !q.datasetId) {
        setData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Map frontend query configuration to match backend QueryConfigSerializer schema
        const payload = {
          dimensions: q.dimensions || [],
          measures: (q.metrics || []).map((m) => ({
            field: m.column,
            aggregation: m.aggregation,
          })),
          filters: (q.filters || []).map((f) => ({
            field: f.column,
            operator: f.operator,
            value: f.value,
          })),
        };

        const response = await apiClient.post(`/datasets/${q.datasetId}/query/`, payload);
        
        if (active) {
          const results = response.data.results || [];
          
          // Map backend key format (field_aggregation) to frontend expected keys (alias or aggregation_field)
          const mappedResults = results.map((row: any) => {
            const mappedRow = { ...row };
            (q.metrics || []).forEach((m) => {
              const backendKey = `${m.column}_${m.aggregation}`;
              const frontendKey = m.alias || `${m.aggregation}_${m.column}`;
              if (row[backendKey] !== undefined) {
                mappedRow[frontendKey] = row[backendKey];
              }
            });
            return mappedRow;
          });
          
          setData(mappedResults);
        }
      } catch (err: any) {
        console.error('Error fetching widget data:', err);
        if (active) {
          setError(err.response?.data?.error?.message || 'Failed to query data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchWidgetData();

    return () => {
      active = false;
    };
  }, [widget.queryConfig]);

  const errorFallback = (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center bg-card rounded-xl">
      <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
      <p className="text-xs font-semibold">Widget Display Error</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">Please check metric dimensions in editor.</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-card p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] w-full p-4 text-center bg-card rounded-xl">
        <AlertCircle className="h-5 w-5 text-red-500 mb-1 shrink-0" />
        <p className="text-[10px] font-semibold text-foreground">Query Failed</p>
        <p className="text-[9px] text-muted-foreground mt-0.5 max-w-[200px] truncate">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] w-full p-4 text-center bg-card rounded-xl">
        <p className="text-xs text-muted-foreground">No records returned</p>
      </div>
    );
  }

  return (
    <WidgetErrorBoundary fallback={errorFallback}>
      <div className="h-full w-full overflow-hidden bg-card text-foreground">
        {widget.type === 'kpi' && <KpiCard widget={widget} data={data} />}
        {widget.type === 'bar' && <BarChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'line' && <LineChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'area' && <AreaChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'pie' && <PieChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'donut' && <DonutChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'radar' && <RadarChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'scatter' && <ScatterChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'gauge' && <GaugeChartWidget widget={widget} data={data} isDark={isDark} />}
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

  const pieData = useMemo(() => {
    return data.map((d) => ({
      name: String(d[nameKey] || 'Unknown'),
      value: Number(d[valKey] || 0),
    })).filter(item => item.value > 0).slice(0, 8);
  }, [data, nameKey, valKey]);

  return (
    <div className="h-full w-full pt-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={0}
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
// --- DONUT CHART WIDGET ---
function DonutChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const nameKey = widget.queryConfig.dimensions[0] || 'name';
  const metric = widget.queryConfig.metrics[0];
  const valKey = metric ? (metric.alias || `${metric.aggregation}_${metric.column}`) : 'value';

  const donutData = useMemo(() => {
    return data.map((d) => ({
      name: String(d[nameKey] || 'Unknown'),
      value: Number(d[valKey] || 0),
    })).filter(item => item.value > 0).slice(0, 8);
  }, [data, nameKey, valKey]);

  return (
    <div className="h-full w-full pt-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={donutData}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
          >
            {donutData.map((_, index) => (
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

// --- RADAR CHART WIDGET ---
function RadarChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const angleKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;

  return (
    <div className="h-full w-full pt-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <PolarAngleAxis dataKey={angleKey} stroke={isDark ? '#71717a' : '#888888'} fontSize={9} />
          <PolarRadiusAxis stroke={isDark ? '#71717a' : '#888888'} fontSize={9} />
          {metrics.map((m, idx) => {
            const field = m.alias || `${m.aggregation}_${m.column}`;
            const color = palette[idx % palette.length];
            return (
              <Radar
                key={field}
                name={field}
                dataKey={field}
                stroke={color}
                fill={color}
                fillOpacity={0.3}
              />
            );
          })}
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
            <Legend wrapperStyle={{ fontSize: '9px', marginTop: '10px' }} />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- SCATTER CHART WIDGET ---
function ScatterChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const xKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;
  const yKey = metrics[0] ? (metrics[0].alias || `${metrics[0].aggregation}_${metrics[0].column}`) : 'value';

  return (
    <div className="h-full w-full pt-4 pb-2 pr-4 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <XAxis
            dataKey={xKey}
            name={xKey}
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey={yKey}
            name={yKey}
            stroke={isDark ? '#71717a' : '#888888'}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatShortNumber(v)}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '11px',
            }}
          />
          <Scatter name={widget.title} data={data} fill={palette[0 % palette.length]} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- GAUGE CHART WIDGET ---
function GaugeChartWidget({ widget, data, isDark }: { widget: Widget; data: DataPoint[]; isDark: boolean }) {
  const primaryColor = isDark ? '#fbbf24' : '#f59e0b'; // Gold/Yellow
  const trackColor = isDark ? '#27272a' : '#e4e4e7';
  
  const metric = widget.queryConfig.metrics[0];
  const valKey = metric ? (metric.alias || `${metric.aggregation}_${metric.column}`) : 'value';
  const actualValue = Number(data[0]?.[valKey] ?? 0);
  const gaugeMax = Number(widget.visualizationSettings.gaugeMax || 100);
  
  const gaugeData = [
    { name: 'Value', value: Math.min(actualValue, gaugeMax), fill: primaryColor },
    { name: 'Remaining', value: Math.max(0, gaugeMax - actualValue), fill: trackColor }
  ];

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative">
      <div className="h-full w-full pt-4">
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="95%"
              dataKey="value"
              stroke="none"
            >
              {gaugeData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={gaugeData[index].fill} />
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute bottom-[10%] left-0 right-0 text-center flex flex-col justify-end items-center">
        <span className="text-xl font-black text-foreground">{formatNumber(actualValue)}</span>
        <span className="text-[10px] text-muted-foreground font-semibold">of {formatNumber(gaugeMax)} ({Math.round(Math.min(actualValue / gaugeMax, 1) * 100)}%)</span>
      </div>
    </div>
  );
}

export { WidgetErrorBoundary };
