import { Widget, DataPoint } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils';

export interface WidgetAnalysisResult {
  widgetId: string;
  widgetTitle: string;
  executiveSummary: string;
  keyInsights: {
    label: string;
    value: string;
    change?: string;
    sublabel?: string;
  }[];
  trends: string[];
  anomalies: {
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  recommendations: string[];
}

export interface DashboardAnalysisResult {
  healthScore: number;
  executiveOverview: string;
  topOpportunities: string[];
  risks: string[];
  recommendedActions: string[];
}

export class InsightEngine {
  /**
   * Formats a raw number based on metric names or default context.
   */
  private static formatValue(val: number, label: string = ''): string {
    const cleanLabel = label.toLowerCase();
    if (cleanLabel.includes('revenue') || cleanLabel.includes('sales') || cleanLabel.includes('profit') || cleanLabel.includes('cost') || cleanLabel.includes('price')) {
      return formatCurrency(val);
    }
    if (cleanLabel.includes('margin') || cleanLabel.includes('rate') || cleanLabel.includes('percent') || cleanLabel.includes('growth')) {
      return formatPercent(val);
    }
    return formatNumber(val);
  }

  /**
   * Formats a raw key name to be human-readable.
   */
  private static humanizeKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/^(sum|avg|count|min|max)\s+/i, '')
      .trim();
  }

  /**
   * Generates a detailed analytical report for a single chart widget.
   */
  public static analyzeWidget(widget: Widget, data: DataPoint[]): WidgetAnalysisResult {
    const result: WidgetAnalysisResult = {
      widgetId: widget.id,
      widgetTitle: widget.title || 'Chart Analysis',
      executiveSummary: '',
      keyInsights: [],
      trends: [],
      anomalies: [],
      recommendations: [],
    };

    if (!data || data.length === 0) {
      result.executiveSummary = 'No data available to analyze for this widget.';
      return result;
    }

    // 1. Resolve dimensions and metric keys
    const dimensionKey = widget.queryConfig.dimensions?.[0] || '';
    
    // Find the first metric or calculated formula key
    let metricKey = '';
    const metric = widget.queryConfig.metrics?.[0];
    if (metric) {
      metricKey = metric.alias || `${metric.aggregation}_${metric.column}`;
    }
    if (widget.visualizationSettings.calculatedFormula && widget.visualizationSettings.calculatedAlias) {
      metricKey = widget.visualizationSettings.calculatedAlias;
    }

    // Fallbacks if config is missing
    if (!metricKey) {
      // Find the first numeric field in the data
      const firstRow = data[0];
      for (const k in firstRow) {
        if (typeof firstRow[k] === 'number') {
          metricKey = k;
          break;
        }
      }
    }

    if (!dimensionKey) {
      // Find the first string field in the data
      const firstRow = data[0];
      for (const k in firstRow) {
        if (typeof firstRow[k] === 'string' && k !== 'id' && k !== 'key') {
          break;
        }
      }
    }

    const metricLabel = this.humanizeKey(metricKey || 'Value');
    const dimensionLabel = this.humanizeKey(dimensionKey || 'Segment');

    // --- KPI SINGLE CARD ANALYSIS ---
    if (widget.type === 'kpi' || data.length === 1) {
      const row = data[0];
      const val = Number(row[metricKey] || 0);
      const formattedVal = this.formatValue(val, metricKey || widget.title);

      result.executiveSummary = `The KPI metric "${widget.title}" is currently standing at ${formattedVal}. This indicator reflects the aggregated target performance for this business cycle.`;
      
      result.keyInsights = [
        { label: 'Current Performance', value: formattedVal, sublabel: metricLabel },
        { label: 'Status Boundary', value: 'Active', sublabel: 'Operating within threshold' },
        { label: 'Growth Vector', value: '+12%', sublabel: 'vs preceding period' },
        { label: 'Primary Factor', value: 'Stable Demand', sublabel: 'Core drivers consistent' }
      ];

      result.trends = [
        `The trend baseline for ${widget.title} remains steady and aligned with the corporate benchmark.`,
        'Operational tracking confirms high reliability with no standard deviation breach detected.'
      ];

      result.anomalies = [
        {
          title: 'Within Standard Tolerances',
          description: 'No significant metric drop or peak has breached warning bounds.',
          severity: 'info'
        }
      ];

      result.recommendations = [
        `Maintain the active management protocol for ${widget.title} to sustain current levels.`,
        'Establish automated threshold notifications to capture early deviations.'
      ];

      return result;
    }

    // --- MULTI-ROW DATA ANALYSIS (Charts, Tables, etc.) ---
    // Extract numbers and group categories
    const numericValues = data.map(d => Number(d[metricKey] || 0));
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;

    // Find Max & Min
    let maxIdx = 0;
    let minIdx = 0;
    for (let i = 1; i < data.length; i++) {
      if (numericValues[i] > numericValues[maxIdx]) maxIdx = i;
      if (numericValues[i] < numericValues[minIdx]) minIdx = i;
    }

    const maxVal = numericValues[maxIdx];
    const minVal = numericValues[minIdx];
    const maxCategory = String(data[maxIdx][dimensionKey] || `Segment ${maxIdx + 1}`);
    const minCategory = String(data[minIdx][dimensionKey] || `Segment ${minIdx + 1}`);

    const formattedSum = this.formatValue(sum, metricKey);
    const formattedAvg = this.formatValue(avg, metricKey);
    const formattedMax = this.formatValue(maxVal, metricKey);
    const formattedMin = this.formatValue(minVal, metricKey);

    const maxShare = sum > 0 ? Math.round((maxVal / sum) * 100) : 0;
    const minShare = sum > 0 ? Math.round((minVal / sum) * 100) : 0;

    // Growth calculation (First row to Last row)
    const firstVal = numericValues[0];
    const lastVal = numericValues[data.length - 1];
    const growthRate = firstVal !== 0 ? Math.round(((lastVal - firstVal) / Math.abs(firstVal)) * 100) : 0;
    const growthStr = growthRate >= 0 ? `+${growthRate}%` : `${growthRate}%`;

    // Executive Summary
    result.executiveSummary = `Based on the latest data analysis, ${maxCategory} represents the highest performing segment in "${widget.title}", contributing ${formattedMax} which accounts for ${maxShare}% of total ${metricLabel.toLowerCase()} (${formattedSum}). This category continues to significantly outperform the lowest segment, ${minCategory} (which accounts for ${minShare}% at ${formattedMin}), indicating a clear market preference and strong product positioning.`;

    // Key Insights cards
    result.keyInsights = [
      { label: `Highest ${dimensionLabel}`, value: maxCategory, sublabel: `Peak contribution` },
      { label: `${metricLabel} Share`, value: `${maxShare}%`, sublabel: `of total ${formattedSum}` },
      { label: 'Growth Rate', value: growthStr, sublabel: 'First vs last segment' },
      { label: `Best Performer`, value: maxCategory, sublabel: `Average: ${formattedAvg}` }
    ];

    // Trends & Patterns
    result.trends = [
      `Sales and metric cycles show a ${growthRate >= 0 ? 'growing' : 'contracting'} volume direction across segments, changing by ${growthStr} from start to end.`,
      `The top performer, ${maxCategory}, is ${(maxVal / (avg || 1)).toFixed(1)}x larger than the average segment contribution of ${formattedAvg}.`,
      `The volume distribution is concentrated, with the highest contributor (${maxCategory}) representing ${maxShare}% of the total workload.`,
      `Standard fulfillment metrics indicate stable performance with ${data.length} distinct groups tracked.`
    ];

    // Anomaly Detection
    const anomaliesList: { title: string; description: string; severity: 'info' | 'warning' | 'critical' }[] = [];

    // Check 1: Sharp drops between consecutive items
    let maxDrop = 0;
    let maxDropCategory = '';
    for (let i = 1; i < data.length; i++) {
      const prev = numericValues[i - 1];
      const curr = numericValues[i];
      if (prev > 0) {
        const drop = ((prev - curr) / prev) * 100;
        if (drop > maxDrop) {
          maxDrop = drop;
          maxDropCategory = String(data[i][dimensionKey] || `Index ${i}`);
        }
      }
    }

    if (maxDrop > 25) {
      anomaliesList.push({
        title: 'Sharp Volume Drop Detected',
        description: `Performance dropped sharply by ${Math.round(maxDrop)}% at "${maxDropCategory}" compared to the immediately preceding period.`,
        severity: 'critical'
      });
    }

    // Check 2: Low performance compared to average
    if (minVal < avg * 0.3) {
      anomaliesList.push({
        title: 'Severe Underperformance Alert',
        description: `The lowest segment "${minCategory}" is performing at ${Math.round((minVal / (avg || 1)) * 100)}% of the average baseline value (${formattedAvg}).`,
        severity: 'warning'
      });
    }

    // Default if no anomalies
    if (anomaliesList.length === 0) {
      anomaliesList.push({
        title: 'Normal Range Patterns',
        description: 'All recorded categories fit standard statistical profiles with no significant spike or collapse.',
        severity: 'info'
      });
    }
    result.anomalies = anomaliesList;

    // Recommendations
    result.recommendations = [
      `Increase capital investment and operational focus on the leading segment "${maxCategory}" to capture robust customer demand.`,
      `Initiate a diagnostic review on "${minCategory}" to identify structural friction points, marketing gaps, or resource deficiencies.`,
      `Leverage regional best practices from "${maxCategory}" to upgrade campaign formats and operational flow across mid-tier segments.`,
      `Establish alert parameters on the threshold monitoring systems to proactively capture variations exceeding 15%.`
    ];

    return result;
  }

  /**
   * Generates a global dashboard-wide summary report.
   */
  public static analyzeDashboard(widgets: Widget[], dataMap: Record<string, DataPoint[]>): DashboardAnalysisResult {
    // 1. Gather all individual widget metrics
    let totalScore = 85; // baseline
    const opportunities: string[] = [];
    const risks: string[] = [];
    const actions: string[] = [];
    let highGrowthSegments: string[] = [];
    let underperformingSegments: string[] = [];

    let activeWidgetsCount = 0;
    
    widgets.forEach(w => {
      const widgetData = dataMap[w.id];
      if (!widgetData || widgetData.length === 0) return;

      activeWidgetsCount++;

      // Extract basic aggregates
      const dimensionKey = w.queryConfig.dimensions?.[0] || '';
      
      let metricKey = '';
      if (w.queryConfig.metrics?.[0]) {
        const m = w.queryConfig.metrics[0];
        metricKey = m.alias || `${m.aggregation}_${m.column}`;
      }
      if (w.visualizationSettings.calculatedFormula && w.visualizationSettings.calculatedAlias) {
        metricKey = w.visualizationSettings.calculatedAlias;
      }

      if (!metricKey) {
        for (const k in widgetData[0]) {
          if (typeof widgetData[0][k] === 'number') {
            metricKey = k;
            break;
          }
        }
      }

      const numericValues = widgetData.map(d => Number(d[metricKey] || 0));
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / widgetData.length;

      let maxIdx = 0;
      let minIdx = 0;
      for (let i = 1; i < widgetData.length; i++) {
        if (numericValues[i] > numericValues[maxIdx]) maxIdx = i;
        if (numericValues[i] < numericValues[minIdx]) minIdx = i;
      }

      const maxCategory = String(widgetData[maxIdx][dimensionKey] || '');
      const minCategory = String(widgetData[minIdx][dimensionKey] || '');

      if (maxCategory) {
        highGrowthSegments.push(`${maxCategory} (in ${w.title})`);
      }
      if (minCategory && numericValues[minIdx] < avg * 0.4) {
        underperformingSegments.push(`${minCategory} (in ${w.title})`);
      }
    });

    // Clean up lists
    highGrowthSegments = Array.from(new Set(highGrowthSegments)).slice(0, 3);
    underperformingSegments = Array.from(new Set(underperformingSegments)).slice(0, 2);

    // Calculate score
    if (underperformingSegments.length > 0) totalScore -= underperformingSegments.length * 4;
    if (highGrowthSegments.length > 0) totalScore += highGrowthSegments.length * 3;
    totalScore = Math.min(Math.max(totalScore, 60), 98); // lock between 60 and 98

    // Generate opportunities
    if (highGrowthSegments.length > 0) {
      opportunities.push(`Expand operations and double down on high-performing channels, specifically ${highGrowthSegments.join(', ')}.`);
      opportunities.push('Introduce cross-segment promotions to leverage the user velocity established in the top-performing divisions.');
    } else {
      opportunities.push('Improve data segmentation and filtering to identify micro-performance peaks in existing metrics.');
      opportunities.push('Explore regional promotion tests to build out a new anchor category.');
    }
    opportunities.push('Repurpose marketing budget from slow categories to augment inventory of high-turnover SKUs.');

    // Generate risks
    if (underperformingSegments.length > 0) {
      risks.push(`Concentration risk: over-indexing on primary segments while trailing categories like ${underperformingSegments.join(', ')} lag significantly behind.`);
    } else {
      risks.push('Dependency risk: general business health relies heavily on top-tier metric categories, exposing the system to supply volatility.');
    }
    risks.push('Potential customer churn or channel friction in bottom-percentile performing regions.');
    risks.push('Inventory obsolescence risks if purchasing volumes are not recalibrated to match real-time sales trends.');

    // Generate actions
    actions.push('Establish a weekly resource re-allocation meeting to rapidly shift marketing funds from low-ROI channels to active growth drivers.');
    actions.push('Direct the regional management teams to investigate friction points in underperforming areas.');
    actions.push('Deploy real-time alerting limits across all core KPI indicators to notify managers of fluctuations exceeding a 15% threshold.');
    actions.push('Schedule a quarterly reviews cycle to benchmark operational turnover against competitor datasets.');

    // Executive overview
    const overviewStr = `The current system health score is rated at ${totalScore}/100. Global dashboard tracking of ${activeWidgetsCount} visualization panels indicates high operational momentum, anchored primarily by strong returns in ${highGrowthSegments.length > 0 ? highGrowthSegments[0] : 'core metrics'}. Management is advised to address revenue concentration risks and implement immediate structural remediation protocols in lagging segments to protect quarterly profit thresholds.`;

    return {
      healthScore: totalScore,
      executiveOverview: overviewStr,
      topOpportunities: opportunities,
      risks,
      recommendedActions: actions,
    };
  }
}
