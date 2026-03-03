export type ChartType = 'line' | 'area' | 'bar';
export type Aggregation = 'daily' | 'weekly';
export type TimeRange = 'last_7_days' | 'last_14_days' | 'last_30_days';
export type LineStyle = 'solid' | 'dashed';
export type MetricUnit = 'users' | 'usd';

export interface ChartStyle {
  line_style: LineStyle;
  show_points: boolean;
  fill: boolean;
  color?: string;
}

export interface MetricSeries {
  metric_id: string;
  chart_type: ChartType;
  axis?: 'left' | 'right';
  color?: string;
  comparison?: boolean;
  label?: string;
}

export interface ChartConfig {
  id: string;
  metric_id: string;
  chart_type: ChartType;
  time_range: TimeRange;
  aggregation: Aggregation;
  comparison: boolean;
  style: ChartStyle;
  title: string;
  metrics?: MetricSeries[];
  date_filter?: boolean;
  custom_start?: string;
  custom_end?: string;
}

export interface GridLayoutItem {
  i: string;  // chart id
  x: number;
  y: number;
  w: number;  // columns (out of 12)
  h: number;  // rows (each row ~150px)
}

export interface Dashboard {
  id: string;
  name: string;
  charts: ChartConfig[];
  layouts?: GridLayoutItem[];
  created_at: string;
  shared?: { mode: 'viewer' | 'editor'; url: string };
}

export interface ToolCall {
  id: string;
  tool: string;
  params: Record<string, unknown>;
  result: unknown;
  timestamp: string;
  valid: boolean;
  errors?: string[];
  suggestions?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

export interface MetricDefinition {
  id: string;
  label: string;
  definition: string;
  source: { variable: string; field: string };
  allowed_chart_types: ChartType[];
  allowed_aggregations: Aggregation[];
  unit: MetricUnit;
  default_time_range: TimeRange;
  comparison_allowed: boolean;
  prev_available: boolean;
}

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  metric_id: string;
  chart_type: ChartType;
  time_range: TimeRange;
  aggregation: Aggregation;
  comparison: boolean;
  style: ChartStyle;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  suggestions: string[];
}
