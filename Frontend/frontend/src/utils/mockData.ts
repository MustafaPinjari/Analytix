import { User, Dataset, Dashboard, Notification, Report, DataPoint, FilterCondition } from '../types';

export const MOCK_USER: User = {
  id: 'usr-001',
  name: 'Sarah Connor',
  email: 'sarah.connor@cyberdyne.com',
  role: 'owner',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  organizationId: 'org-101',
};

export const MOCK_DATASETS: Dataset[] = [
  {
    id: 'ds-sales',
    name: 'Sales Performance 2026',
    description: 'Global sales transactions, revenue, profit margins, and sales rep performance indicators.',
    connectionType: 'postgresql',
    rowCount: 14520,
    columns: [
      { name: 'date', type: 'date' },
      { name: 'region', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'sales_rep', type: 'string' },
      { name: 'revenue', type: 'number' },
      { name: 'units_sold', type: 'number' },
      { name: 'margin', type: 'number' },
    ],
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-06-20T14:30:00Z',
  },
  {
    id: 'ds-support',
    name: 'Customer Success Tickets',
    description: 'Zendesk ticket histories, resolution times, agent ratings, and customer satisfaction rates.',
    connectionType: 'mysql',
    rowCount: 3200,
    columns: [
      { name: 'ticket_id', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'priority', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'assignee', type: 'string' },
      { name: 'csat_score', type: 'number' },
      { name: 'resolution_time_hrs', type: 'number' },
      { name: 'created_date', type: 'date' },
    ],
    createdAt: '2026-02-15T09:15:00Z',
    updatedAt: '2026-06-22T08:00:00Z',
  },
  {
    id: 'ds-web',
    name: 'Website Traffic & Conversions',
    description: 'Google Analytics data showing page views, sessions, bounce rates, and organic conversions.',
    connectionType: 'snowflake',
    rowCount: 87400,
    columns: [
      { name: 'timestamp', type: 'date' },
      { name: 'source', type: 'string' },
      { name: 'device', type: 'string' },
      { name: 'page_views', type: 'number' },
      { name: 'sessions', type: 'number' },
      { name: 'conversions', type: 'number' },
      { name: 'bounce_rate', type: 'number' },
    ],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-06-21T18:45:00Z',
  },
];

// Generate fake dataset rows dynamically for chart plotting
export const getDatasetData = (datasetId: string): DataPoint[] => {
  if (datasetId === 'ds-sales') {
    const reps = ['Alice Vance', 'Bob Dylan', 'Charlie Cox', 'Diana Prince', 'Evan Wright'];
    const regions = ['North America', 'Europe', 'Asia-Pacific', 'Latin America'];
    const categories = ['Enterprise SaaS', 'Professional Services', 'Training & Support', 'Consulting'];
    
    return Array.from({ length: 50 }).map((_, i) => {
      const date = new Date(2026, 0, 1 + i * 3);
      const revenue = Math.floor(Math.random() * 45000) + 5000;
      return {
        date: date.toISOString().split('T')[0],
        region: regions[i % regions.length],
        category: categories[i % categories.length],
        sales_rep: reps[i % reps.length],
        revenue,
        units_sold: Math.floor(revenue / (Math.random() * 150 + 50)) + 5,
        margin: parseFloat((Math.random() * 0.4 + 0.35).toFixed(2)),
      };
    });
  }
  
  if (datasetId === 'ds-support') {
    const statuses = ['Closed', 'Solved', 'Open', 'Pending'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const cats = ['Billing', 'Bug Report', 'Feature Request', 'Account Access'];
    const assignees = ['John Connor', 'Marcus Wright', 'Kyle Reese', 'Kate Brewster'];
    
    return Array.from({ length: 50 }).map((_, i) => {
      const date = new Date(2026, 4, 1 + i);
      return {
        ticket_id: `TKT-${1000 + i}`,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        category: cats[i % cats.length],
        assignee: assignees[i % assignees.length],
        csat_score: Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 3 : 5, // skewed high
        resolution_time_hrs: parseFloat((Math.random() * 72 + 2).toFixed(1)),
        created_date: date.toISOString().split('T')[0],
      };
    });
  }

  if (datasetId === 'ds-web') {
    const sources = ['Google SEO', 'Direct Traffic', 'Twitter Ads', 'LinkedIn Promo', 'GitHub Repo'];
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    
    return Array.from({ length: 50 }).map((_, i) => {
      const date = new Date(2026, 5, 1 + Math.floor(i / 2));
      const sessions = Math.floor(Math.random() * 1200) + 150;
      const page_views = sessions * (Math.floor(Math.random() * 3) + 2);
      const conversions = Math.floor(sessions * (Math.random() * 0.05 + 0.02));
      return {
        timestamp: date.toISOString().split('T')[0],
        source: sources[i % sources.length],
        device: devices[i % devices.length],
        sessions,
        page_views,
        conversions,
        bounce_rate: parseFloat((Math.random() * 0.3 + 0.35).toFixed(2)),
      };
    });
  }

  return [];
};

export const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: 'dash-sales-summary',
    name: 'Executive Sales Performance',
    description: 'Consolidated overview of financial quarters, revenue totals, regional breakdowns, and leading sales channels.',
    isShared: true,
    sharedWith: [
      { email: 'john.connor@cyberdyne.com', role: 'viewer' },
      { email: 'marcus.wright@cyberdyne.com', role: 'editor' },
    ],
    ownerId: 'usr-001',
    ownerName: 'Sarah Connor',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
    widgets: [
      {
        id: 'w-kpi-rev',
        type: 'kpi',
        title: 'Total Revenue 2026',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: [],
          metrics: [{ column: 'revenue', aggregation: 'sum', alias: 'Total' }],
          filters: [],
        },
        visualizationSettings: {
          kpiLabel: 'vs $1.2M Target',
          kpiFormat: 'currency',
          colorPalette: ['#8b5cf6'],
        },
        layout: { i: 'w-kpi-rev', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      },
      {
        id: 'w-kpi-units',
        type: 'kpi',
        title: 'Units Transacted',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: [],
          metrics: [{ column: 'units_sold', aggregation: 'sum', alias: 'Units' }],
          filters: [],
        },
        visualizationSettings: {
          kpiLabel: '+14% Month-on-Month',
          kpiFormat: 'number',
          colorPalette: ['#10b981'],
        },
        layout: { i: 'w-kpi-units', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      },
      {
        id: 'w-kpi-margin',
        type: 'kpi',
        title: 'Average Profit Margin',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: [],
          metrics: [{ column: 'margin', aggregation: 'avg', alias: 'Margin' }],
          filters: [],
        },
        visualizationSettings: {
          kpiLabel: 'Stable range (+0.8%)',
          kpiFormat: 'percent',
          colorPalette: ['#3b82f6'],
        },
        layout: { i: 'w-kpi-margin', x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      },
      {
        id: 'w-sales-trend',
        type: 'area',
        title: 'Revenue Expansion Over Time',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: ['date'],
          metrics: [{ column: 'revenue', aggregation: 'sum', alias: 'Revenue' }],
          filters: [],
        },
        visualizationSettings: {
          showLegend: true,
          colorPalette: ['#8b5cf6'],
          yAxisFormatter: 'currency',
        },
        layout: { i: 'w-sales-trend', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'w-region-mix',
        type: 'pie',
        title: 'Sales Volume by Region',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: ['region'],
          metrics: [{ column: 'revenue', aggregation: 'sum', alias: 'Revenue' }],
          filters: [],
        },
        visualizationSettings: {
          showLegend: true,
          colorPalette: ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b'],
        },
        layout: { i: 'w-region-mix', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      },
      {
        id: 'w-rep-rank',
        type: 'bar',
        title: 'Sales Rep Revenue Performance',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: ['sales_rep'],
          metrics: [{ column: 'revenue', aggregation: 'sum', alias: 'Revenue' }],
          filters: [],
        },
        visualizationSettings: {
          showLegend: false,
          colorPalette: ['#3b82f6'],
          yAxisFormatter: 'currency',
        },
        layout: { i: 'w-rep-rank', x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'w-category-bar',
        type: 'bar',
        title: 'Segment Contributions (Stacked)',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: ['category'],
          metrics: [
            { column: 'revenue', aggregation: 'sum', alias: 'Sales' },
            { column: 'units_sold', aggregation: 'sum', alias: 'Units' },
          ],
          filters: [],
        },
        visualizationSettings: {
          showLegend: true,
          stacked: true,
          colorPalette: ['#8b5cf6', '#10b981'],
        },
        layout: { i: 'w-category-bar', x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'w-sales-data-table',
        type: 'table',
        title: 'Detailed Sales Record Ledger',
        queryConfig: {
          datasetId: 'ds-sales',
          dimensions: ['date', 'region', 'category', 'sales_rep'],
          metrics: [
            { column: 'revenue', aggregation: 'sum', alias: 'Revenue' },
            { column: 'units_sold', aggregation: 'sum', alias: 'Units' },
          ],
          filters: [],
        },
        visualizationSettings: {
          colorPalette: [],
        },
        layout: { i: 'w-sales-data-table', x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 },
      },
    ],
  },
  {
    id: 'dash-support-analytics',
    name: 'Customer Success Insights',
    description: 'Ticket status distribution, priorities, resolution speed trends, and representative agent ratings.',
    isShared: false,
    sharedWith: [],
    ownerId: 'usr-001',
    ownerName: 'Sarah Connor',
    createdAt: '2026-03-12T11:00:00Z',
    updatedAt: '2026-06-18T16:20:00Z',
    widgets: [
      {
        id: 'w-kpi-csat',
        type: 'kpi',
        title: 'Average CSAT Rating',
        queryConfig: {
          datasetId: 'ds-support',
          dimensions: [],
          metrics: [{ column: 'csat_score', aggregation: 'avg', alias: 'CSAT' }],
          filters: [],
        },
        visualizationSettings: {
          kpiLabel: 'Out of 5.0 (Goal: 4.5)',
          kpiFormat: 'number',
          colorPalette: ['#10b981'],
        },
        layout: { i: 'w-kpi-csat', x: 0, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
      },
      {
        id: 'w-kpi-restime',
        type: 'kpi',
        title: 'Mean Resolution Speed',
        queryConfig: {
          datasetId: 'ds-support',
          dimensions: [],
          metrics: [{ column: 'resolution_time_hrs', aggregation: 'avg', alias: 'ResolutionTime' }],
          filters: [],
        },
        visualizationSettings: {
          kpiLabel: 'Hours per incident',
          kpiFormat: 'number',
          colorPalette: ['#f59e0b'],
        },
        layout: { i: 'w-kpi-restime', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
      },
      {
        id: 'w-ticket-speed-trend',
        type: 'line',
        title: 'Incidents Trend Over Time',
        queryConfig: {
          datasetId: 'ds-support',
          dimensions: ['created_date'],
          metrics: [{ column: 'ticket_id', aggregation: 'count', alias: 'IncidentsCount' }],
          filters: [],
        },
        visualizationSettings: {
          showLegend: false,
          colorPalette: ['#ef4444'],
        },
        layout: { i: 'w-ticket-speed-trend', x: 0, y: 2, w: 12, h: 4, minW: 6, minH: 3 },
      },
    ],
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-001',
    title: 'Dashboard Shared',
    message: 'Kyle Reese shared the "Q2 Finance Audit" dashboard with you.',
    type: 'info',
    read: false,
    createdAt: '2026-06-22T12:00:00Z',
  },
  {
    id: 'n-002',
    title: 'Report Generation Succeeded',
    message: 'The scheduled PDF report for "Executive Sales Performance" has been sent to stakeholders.',
    type: 'success',
    read: false,
    createdAt: '2026-06-22T08:00:00Z',
  },
  {
    id: 'n-003',
    title: 'Dataset Ingestion Lagging',
    message: 'The website traffic tracker synchronization experienced latency. Delay is currently 14 minutes.',
    type: 'warning',
    read: true,
    createdAt: '2026-06-21T18:00:00Z',
  },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-001',
    name: 'Weekly Financial Digest',
    dashboardId: 'dash-sales-summary',
    dashboardName: 'Executive Sales Performance',
    format: 'pdf',
    frequency: 'weekly',
    recipientEmails: ['board@cyberdyne.com', 'finance-team@cyberdyne.com'],
    lastRunAt: '2026-06-15T08:00:00Z',
    lastRunStatus: 'success',
    nextRunAt: '2026-06-22T08:00:00Z',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'rep-002',
    name: 'Support SLA Compliance Report',
    dashboardId: 'dash-support-analytics',
    dashboardName: 'Customer Success Insights',
    format: 'csv',
    frequency: 'daily',
    recipientEmails: ['cs-managers@cyberdyne.com'],
    lastRunAt: '2026-06-22T06:00:00Z',
    lastRunStatus: 'success',
    nextRunAt: '2026-06-23T06:00:00Z',
    createdAt: '2026-03-15T12:00:00Z',
  },
];

// Helper to simulate querying data with filters, aggregates and group bys
export const queryMockData = (
  datasetId: string,
  dimensions: string[],
  metrics: { column: string; aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'; alias?: string }[],
  filters: FilterCondition[] = []
): DataPoint[] => {
  let data = getDatasetData(datasetId);

  // Apply filters
  if (filters.length > 0) {
    data = data.filter((row) => {
      return filters.every((filt) => {
        const rowVal = row[filt.column];
        if (rowVal === undefined) return true;
        
        switch (filt.operator) {
          case 'equals':
            return String(rowVal).toLowerCase() === String(filt.value).toLowerCase();
          case 'contains':
            return String(rowVal).toLowerCase().includes(String(filt.value).toLowerCase());
          case 'greater_than':
            return Number(rowVal) > Number(filt.value);
          case 'less_than':
            return Number(rowVal) < Number(filt.value);
          default:
            return true;
        }
      });
    });
  }

  // If no dimensions, aggregate everything into a single record (e.g. for KPI Cards)
  if (dimensions.length === 0) {
    const result: DataPoint = {};
    metrics.forEach((met) => {
      const alias = met.alias || `${met.aggregation}_${met.column}`;
      const vals = data.map((d) => Number(d[met.column] || 0));
      
      if (met.aggregation === 'sum') {
        result[alias] = vals.reduce((a, b) => a + b, 0);
      } else if (met.aggregation === 'avg') {
        result[alias] = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
      } else if (met.aggregation === 'count') {
        result[alias] = data.length;
      } else if (met.aggregation === 'min') {
        result[alias] = vals.length ? Math.min(...vals) : 0;
      } else if (met.aggregation === 'max') {
        result[alias] = vals.length ? Math.max(...vals) : 0;
      }
    });
    return [result];
  }

  // Group by dimensions
  const groups: { [key: string]: DataPoint[] } = {};
  data.forEach((row) => {
    const key = dimensions.map((d) => String(row[d] || '')).join(' | ');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });

  return Object.entries(groups).map(([key, rows]) => {
    const item: DataPoint = {};
    const keyParts = key.split(' | ');
    dimensions.forEach((dim, idx) => {
      item[dim] = keyParts[idx];
    });

    metrics.forEach((met) => {
      const alias = met.alias || `${met.aggregation}_${met.column}`;
      const vals = rows.map((r) => Number(r[met.column] || 0));

      if (met.aggregation === 'sum') {
        item[alias] = vals.reduce((a, b) => a + b, 0);
      } else if (met.aggregation === 'avg') {
        item[alias] = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
      } else if (met.aggregation === 'count') {
        item[alias] = rows.length;
      } else if (met.aggregation === 'min') {
        item[alias] = vals.length ? Math.min(...vals) : 0;
      } else if (met.aggregation === 'max') {
        item[alias] = vals.length ? Math.max(...vals) : 0;
      }
    });

    return item;
  });
};
