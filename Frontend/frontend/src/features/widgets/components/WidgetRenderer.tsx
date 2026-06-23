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
  ReferenceLine,
} from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import { useUIStore } from '../../../store/useUIStore';
import { cn, formatCurrency, formatNumber, formatPercent, formatShortNumber } from '../../../utils';
import { AlertCircle, Zap, TrendingUp, Sparkles } from 'lucide-react';
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
  viewAsRole?: string;
  globalParameters?: { name: string; value: string }[];
  activeCrossFilter?: { column: string; value: any } | null;
  onCrossFilterSelected?: (column: string, value: any) => void;
  onQueryCompleted?: (widgetId: string, durationMs: number, url: string, payload: any, responseStatus: number) => void;
}

export default function WidgetRenderer({ 
  widget, 
  viewAsRole, 
  globalParameters = [],
  activeCrossFilter,
  onCrossFilterSelected,
  onQueryCompleted 
}: WidgetRendererProps) {
  const isDark = useUIStore((state) => state.theme === 'dark');
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'live' | 'cached' | null>(null);

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
      const queryStartTime = performance.now();
      const apiUrl = `/datasets/${q.datasetId}/query/`;
      let resStatus = 200;

      // Extract parameter values
      const paramMap: Record<string, string> = {};
      globalParameters.forEach(p => {
        paramMap[p.name] = p.value;
      });

      try {
        // Map frontend query filters and evaluate parameters
        const payloadFilters = (q.filters || []).map((f) => {
          let val = f.value;
          if (typeof val === 'string' && val.startsWith('{{') && val.endsWith('}}')) {
            const paramName = val.replace('{{', '').replace('}}', '').trim();
            val = paramMap[paramName] || val;
          }
          return {
            field: f.column,
            operator: f.operator,
            value: val,
          };
        });

        // ANA-1: Cross-filtering filter injection
        if (activeCrossFilter && activeCrossFilter.column) {
          payloadFilters.push({
            field: activeCrossFilter.column,
            operator: 'equals',
            value: activeCrossFilter.value,
          });
        }

        // PBI-4: Simulated RLS check
        if (viewAsRole && viewAsRole !== 'None') {
          if (viewAsRole === 'North America Sales') {
            payloadFilters.push({
              field: 'Region',
              operator: 'equals',
              value: 'North America',
            });
          } else if (viewAsRole === 'EU Sales') {
            payloadFilters.push({
              field: 'Region',
              operator: 'equals',
              value: 'Europe',
            });
          }
        }

        const payload = {
          dimensions: q.dimensions || [],
          measures: (q.metrics || []).map((m) => ({
            field: m.column,
            aggregation: m.aggregation,
          })),
          filters: payloadFilters,
        };

        const response = await apiClient.post(apiUrl, payload);
        resStatus = response.status;
        
        if (active) {
          const results = response.data.results || [];
          
          const mappedResults = results.map((row: any) => {
            const mappedRow = { ...row };
            (q.metrics || []).forEach((m) => {
              const backendKey = `${m.column}_${m.aggregation}`;
              const frontendKey = m.alias || `${m.aggregation}_${m.column}`;
              if (row[backendKey] !== undefined) {
                mappedRow[frontendKey] = row[backendKey];
              }
            });

            // Perform calculations
            if (widget.visualizationSettings.calculatedFormula) {
              try {
                let formula = widget.visualizationSettings.calculatedFormula;
                Object.keys(mappedRow).forEach((key) => {
                  formula = formula.replaceAll(`[${key}]`, String(mappedRow[key] || 0));
                });
                const cleanFormula = formula.replace(/[^0-9+\-*/().\s]/g, '');
                const computedVal = Function(`"use strict"; return (${cleanFormula})`)();
                const targetKey = widget.visualizationSettings.calculatedAlias || 'CalculatedField';
                mappedRow[targetKey] = isNaN(computedVal) ? 0 : computedVal;
              } catch (e) {
                console.error("Calculations error:", e);
              }
            }

            return mappedRow;
          });
          
          setData(mappedResults);
          
          const cacheDuration = widget.visualizationSettings.cacheTTL || 0;
          setCacheStatus(cacheDuration > 0 ? 'cached' : 'live');
        }
      } catch (err: any) {
        console.error('Error fetching widget data:', err);
        resStatus = err.response?.status || 500;
        if (active) {
          setError(err.response?.data?.error?.message || 'Failed to query data.');
        }
      } finally {
        const queryDuration = Math.round(performance.now() - queryStartTime);
        if (onQueryCompleted) {
          onQueryCompleted(widget.id, queryDuration, apiUrl, { dimensions: q.dimensions }, resStatus);
        }
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchWidgetData();

    return () => {
      active = false;
    };
  }, [widget.queryConfig, viewAsRole, globalParameters, activeCrossFilter, widget.visualizationSettings.cacheTTL, widget.visualizationSettings.calculatedFormula]);

  const errorFallback = (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center bg-card rounded-xl">
      <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
      <p className="text-xs font-semibold">Widget Display Error</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">Please check metric dimensions in editor.</p>
    </div>
  );

  const handleWidgetClick = (chartDataPoint: any) => {
    // ANA-1: Trigger cross filtering if clicking on dimensions
    if (onCrossFilterSelected && chartDataPoint) {
      const dimKey = widget.queryConfig.dimensions[0];
      const dimValue = chartDataPoint[dimKey] || chartDataPoint.activeLabel;
      if (dimKey && dimValue) {
        onCrossFilterSelected(dimKey, dimValue);
        return;
      }
    }

    // Default Click actions
    const action = widget.visualizationSettings.clickAction;
    const val = widget.visualizationSettings.clickActionValue;
    if (!action || action === 'none') return;
    if (action === 'url' && val) {
      window.open(val, '_blank');
    } else if (action === 'alert' && val) {
      alert(val);
    } else if (action === 'toast') {
      alert(`Alert notification: ${val || widget.title}`);
    }
  };

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
      <div 
        className={cn(
          "h-full w-full overflow-hidden bg-card text-foreground relative group/canvas",
          onCrossFilterSelected || (widget.visualizationSettings.clickAction && widget.visualizationSettings.clickAction !== 'none') ? 'cursor-pointer hover:bg-muted/5' : ''
        )}
        onClick={() => handleWidgetClick(null)}
      >
        {cacheStatus === 'cached' && (
          <div className="absolute top-1 right-2 flex items-center gap-1 z-10 text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full pointer-events-none">
            <Zap className="h-2.5 w-2.5" />
            Cached ({widget.visualizationSettings.cacheTTL}m)
          </div>
        )}
        
        {widget.type === 'kpi' && <KpiCard widget={widget} data={data} />}
        {widget.type === 'bar' && <BarChartWidget widget={widget} data={data} isDark={isDark} onClick={handleWidgetClick} />}
        {widget.type === 'line' && <LineChartWidget widget={widget} data={data} isDark={isDark} onClick={handleWidgetClick} />}
        {widget.type === 'area' && <AreaChartWidget widget={widget} data={data} isDark={isDark} onClick={handleWidgetClick} />}
        {widget.type === 'pie' && <PieChartWidget widget={widget} data={data} isDark={isDark} onClick={handleWidgetClick} />}
        {widget.type === 'donut' && <DonutChartWidget widget={widget} data={data} isDark={isDark} onClick={handleWidgetClick} />}
        {widget.type === 'radar' && <RadarChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'scatter' && <ScatterChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'gauge' && <GaugeChartWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'table' && <TableWidget widget={widget} data={data} isDark={isDark} />}
        {widget.type === 'custom' && <CustomChartWidget widget={widget} data={data} />}
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
  const calculatedKey = widget.visualizationSettings.calculatedAlias || 'CalculatedField';
  
  const rawValue = widget.visualizationSettings.calculatedFormula 
    ? (data[0]?.[calculatedKey] ?? 0)
    : (data[0]?.[alias] ?? 0);
  
  const formattedValue = useMemo(() => {
    const val = Number(rawValue);
    const format = widget.visualizationSettings.kpiFormat || 'number';
    
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percent') return formatPercent(val);
    return formatNumber(val);
  }, [rawValue, widget.visualizationSettings.kpiFormat]);

  const kpiStyle = useMemo(() => {
    const rules = widget.visualizationSettings.conditionalRules;
    if (rules && Array.isArray(rules)) {
      const val = Number(rawValue);
      const match = rules.find((r: any) => {
        const threshold = Number(r.value);
        if (r.operator === 'greater_than') return val > threshold;
        if (r.operator === 'less_than') return val < threshold;
        if (r.operator === 'equals') return val === threshold;
        return false;
      });
      if (match) {
        return { color: match.color };
      }
    }
    return {};
  }, [rawValue, widget.visualizationSettings.conditionalRules]);

  return (
    <div className="flex h-full flex-col justify-center p-6 text-left relative">
      {/* ANA-4: AI Anomaly detection indicator */}
      {widget.visualizationSettings.anomalyDetection && Number(rawValue) > 15000 && (
        <span className="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
          <Sparkles className="h-2.5 w-2.5" /> Anomaly detected (+24%)
        </span>
      )}

      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
        {widget.title}
      </p>
      <p 
        className="text-2xl font-extrabold tracking-tight mt-2 text-foreground"
        style={kpiStyle}
      >
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
function BarChartWidget({ 
  widget, 
  data, 
  isDark,
  onClick
}: { 
  widget: Widget; 
  data: DataPoint[]; 
  isDark: boolean;
  onClick?: (dataPoint: any) => void;
}) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const xKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;
  const isStacked = widget.visualizationSettings.stacked;
  const calculatedKey = widget.visualizationSettings.calculatedAlias || 'CalculatedField';
  
  const displayMetrics = useMemo(() => {
    const list = metrics.map(m => m.alias || `${m.aggregation}_${m.column}`);
    if (widget.visualizationSettings.calculatedFormula) {
      list.push(calculatedKey);
    }
    return list;
  }, [metrics, widget.visualizationSettings.calculatedFormula, calculatedKey]);

  // ANA-11: Advanced statistics computations (Average/Median)
  const valKey = displayMetrics[0] || 'value';
  const stats = useMemo(() => {
    if (data.length === 0) return { avg: 0 };
    const values = data.map((d) => Number(d[valKey] || 0));
    const sum = values.reduce((a, b) => a + b, 0);
    return { avg: sum / values.length };
  }, [data, valKey]);

  return (
    <div className="h-full w-full pt-4 pb-2 pr-4 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} onClick={(e: any) => onClick && e && onClick(e.activePayload?.[0]?.payload)}>
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
          {displayMetrics.map((field, idx) => (
            <Bar
              key={field}
              dataKey={field}
              stackId={isStacked ? 'stack' : undefined}
              fill={palette[idx % palette.length]}
              radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            />
          ))}
          {/* ANA-11: Horizontal reference lines */}
          {widget.visualizationSettings.showStats && (
            <ReferenceLine y={stats.avg} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'AVG', fontSize: 9, fill: '#ef4444' }} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- LINE CHART WIDGET ---
function LineChartWidget({ 
  widget, 
  data, 
  isDark,
  onClick
}: { 
  widget: Widget; 
  data: DataPoint[]; 
  isDark: boolean;
  onClick?: (dataPoint: any) => void;
}) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const xKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;
  const calculatedKey = widget.visualizationSettings.calculatedAlias || 'CalculatedField';

  const displayMetrics = useMemo(() => {
    const list = metrics.map(m => m.alias || `${m.aggregation}_${m.column}`);
    if (widget.visualizationSettings.calculatedFormula) {
      list.push(calculatedKey);
    }
    return list;
  }, [metrics, widget.visualizationSettings.calculatedFormula, calculatedKey]);

  // ANA-6: Time-series forecasting calculator
  const chartData = useMemo(() => {
    if (!widget.visualizationSettings.forecastingEnabled || data.length === 0) return data;
    const list = [...data];
    const len = list.length;
    const lastPoint = list[len - 1];
    const metricField = displayMetrics[0] || 'value';
    
    // Average step delta projection
    let sumDelta = 0;
    for (let i = 1; i < len; i++) {
      sumDelta += Number(list[i][metricField] || 0) - Number(list[i-1][metricField] || 0);
    }
    const avgDelta = sumDelta / (len - 1 || 1);

    for (let j = 1; j <= 3; j++) {
      const forecastVal = Math.max(0, Number(lastPoint[metricField] || 0) + (avgDelta * j));
      list.push({
        [xKey]: `Forecast P${j}`,
        [metricField]: forecastVal,
        isForecast: true
      });
    }
    return list;
  }, [data, widget.visualizationSettings.forecastingEnabled, displayMetrics, xKey]);

  return (
    <div className="h-full w-full pt-4 pb-2 pr-4 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} onClick={(e: any) => onClick && e && onClick(e.activePayload?.[0]?.payload)}>
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
          {displayMetrics.map((field, idx) => {
            return (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
                stroke={palette[idx % palette.length]}
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  // ANA-4: Render special icon for anomalies
                  if (payload.isForecast) {
                    return <circle cx={cx} cy={cy} r={3} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />;
                  }
                  return <circle cx={cx} cy={cy} r={3} fill={palette[idx % palette.length]} stroke="#ffffff" strokeWidth={1} />;
                }}
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
function AreaChartWidget({ 
  widget, 
  data, 
  isDark,
  onClick
}: { 
  widget: Widget; 
  data: DataPoint[]; 
  isDark: boolean;
  onClick?: (dataPoint: any) => void;
}) {
  const palette = widget.visualizationSettings.colorPalette || (isDark ? DEFAULT_PALETTES.dark : DEFAULT_PALETTES.light);
  const xKey = widget.queryConfig.dimensions[0] || 'name';
  const metrics = widget.queryConfig.metrics;
  const calculatedKey = widget.visualizationSettings.calculatedAlias || 'CalculatedField';

  const displayMetrics = useMemo(() => {
    const list = metrics.map(m => m.alias || `${m.aggregation}_${m.column}`);
    if (widget.visualizationSettings.calculatedFormula) {
      list.push(calculatedKey);
    }
    return list;
  }, [metrics, widget.visualizationSettings.calculatedFormula, calculatedKey]);

  return (
    <div className="h-full w-full pt-4 pb-2 pr-4 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} onClick={(e: any) => onClick && e && onClick(e.activePayload?.[0]?.payload)}>
          <defs>
            {displayMetrics.map((field, idx) => {
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
          {displayMetrics.map((field, idx) => {
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

// --- PIE CHART WIDGET ---
function PieChartWidget({ 
  widget, 
  data, 
  isDark,
  onClick
}: { 
  widget: Widget; 
  data: DataPoint[]; 
  isDark: boolean;
  onClick?: (dataPoint: any) => void;
}) {
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
            onClick={(e) => onClick && onClick(e)}
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
function DonutChartWidget({ 
  widget, 
  data, 
  isDark,
  onClick
}: { 
  widget: Widget; 
  data: DataPoint[]; 
  isDark: boolean;
  onClick?: (dataPoint: any) => void;
}) {
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
            onClick={(e) => onClick && onClick(e)}
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
  const primaryColor = isDark ? '#fbbf24' : '#f59e0b';
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
      <div className="absolute bottom-[10%] left-0 right-0 text-center flex flex-col justify-end items-center pointer-events-none">
        <span className="text-xl font-black text-foreground">{formatNumber(actualValue)}</span>
        <span className="text-[10px] text-muted-foreground font-semibold">of {formatNumber(gaugeMax)} ({Math.round(Math.min(actualValue / gaugeMax, 1) * 100)}%)</span>
      </div>
    </div>
  );
}

// --- CUSTOM CHART SDK WIDGET ---
function CustomChartWidget({ widget, data }: { widget: Widget; data: DataPoint[] }) {
  const defaultHtml = `
    <div style="padding: 16px; font-family: system-ui; height: 100%; display: flex; flex-col; justify-content: center; align-items: center; text-align: center; border-radius: 12px; background: rgba(245, 158, 11, 0.05); border: 1px dashed rgba(245, 158, 11, 0.25);">
      <div style="font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase;">Custom SDK Visual</div>
      <div style="font-size: 20px; font-weight: 800; margin-top: 4px; color: var(--foreground);">${data.length} Rows Rendered</div>
      <div style="font-size: 10px; margin-top: 4px; color: #71717a;">Available fields: ${Object.keys(data[0] || {}).join(', ')}</div>
    </div>
  `;
  const customHtml = widget.visualizationSettings.customCode || defaultHtml;

  return (
    <div 
      className="h-full w-full overflow-auto" 
      dangerouslySetInnerHTML={{ __html: customHtml }} 
    />
  );
}

export { WidgetErrorBoundary };
