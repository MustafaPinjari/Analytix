export interface DataPoint {
  [key: string]: string | number | boolean;
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  billingStatus: 'active' | 'past_due' | 'unpaid';
  createdAt: string;
}

export interface DatasetColumn {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  columns: DatasetColumn[];
  rowCount: number;
  connectionType: 'postgresql' | 'mysql' | 'snowflake' | 'csv' | 'bigquery';
  createdAt: string;
  updatedAt: string;
}

export type WidgetType = 'kpi' | 'bar' | 'line' | 'pie' | 'area' | 'table';

export interface FilterCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | number | boolean | (string | number)[];
}

export interface WidgetQueryConfig {
  datasetId: string;
  dimensions: string[]; // X-axis or Group By
  metrics: {
    column: string;
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    alias?: string;
  }[];
  filters: FilterCondition[];
}

export interface WidgetVisualizationSettings {
  colorPalette?: string[];
  showLegend?: boolean;
  stacked?: boolean;
  yAxisFormatter?: 'number' | 'currency' | 'percent' | 'short';
  kpiLabel?: string;
  kpiFormat?: 'number' | 'currency' | 'percent';
}

export interface WidgetLayout {
  i: string; // widgetId
  x: number; // grid x coordinate
  y: number; // grid y coordinate
  w: number; // width (columns out of 12)
  h: number; // height (units)
  minW?: number;
  minH?: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  queryConfig: WidgetQueryConfig;
  visualizationSettings: WidgetVisualizationSettings;
  layout: WidgetLayout;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  isShared: boolean;
  sharedWith: { email: string; role: 'editor' | 'viewer' }[];
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  name: string;
  dashboardId: string;
  dashboardName: string;
  format: 'pdf' | 'csv';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipientEmails: string[];
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed';
  nextRunAt: string;
  createdAt: string;
}
