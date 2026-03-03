import { METRIC_REGISTRY, getMetric } from '../data/metric-registry';
import { CHART_TEMPLATES } from '../data/chart-templates';
import { getMetricData, getPrevMetricData } from '../data/game-data';
import type {
  ChartConfig,
  ChartStyle,
  Dashboard,
  ValidationResult,
  ToolCall,
  ChartType,
  TimeRange,
  Aggregation,
} from '../types';

// ── ID generators ─────────────────────────────────────────────
let chartCounter = 0;
let dashCounter = 0;
const uid = (prefix: string) => `${prefix}_${Date.now()}_${++chartCounter}`;
const dashUid = () => `dash_${Date.now()}_${++dashCounter}`;

// ── Tool call logger ──────────────────────────────────────────
type LogFn = (entry: ToolCall) => void;
let _log: LogFn = () => {};
export function setToolCallLogger(fn: LogFn) {
  _log = fn;
}

function logCall(
  tool: string,
  params: Record<string, unknown>,
  result: unknown,
  valid: boolean,
  errors?: string[],
  suggestions?: string[]
): unknown {
  _log({
    id: uid('tc'),
    tool,
    params,
    result,
    timestamp: new Date().toISOString(),
    valid,
    errors,
    suggestions,
  });
  return result;
}

// ══════════════════════════════════════════════════════════════
//  MCP TOOL IMPLEMENTATIONS
// ══════════════════════════════════════════════════════════════

export function list_metrics() {
  const result = METRIC_REGISTRY.map((m) => ({
    id: m.id,
    label: m.label,
    definition: m.definition,
    unit: m.unit,
    allowed_chart_types: m.allowed_chart_types,
    comparison_allowed: m.comparison_allowed,
  }));
  return logCall('list_metrics', {}, result, true);
}

export function list_templates() {
  const result = CHART_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    metric_id: t.metric_id,
    chart_type: t.chart_type,
  }));
  return logCall('list_templates', {}, result, true);
}

export function validate_chart_config(config: Partial<ChartConfig>): ValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (!config.metric_id) {
    errors.push('metric_id is required');
    suggestions.push(`Available metrics: ${METRIC_REGISTRY.map((m) => m.id).join(', ')}`);
    const r = { valid: false, errors, suggestions };
    logCall('validate_chart_config', config as Record<string, unknown>, r, false, errors, suggestions);
    return r;
  }

  const metric = getMetric(config.metric_id);
  if (!metric) {
    errors.push(`Unknown metric: "${config.metric_id}"`);
    suggestions.push(`Available metrics: ${METRIC_REGISTRY.map((m) => m.id).join(', ')}`);
    const r = { valid: false, errors, suggestions };
    logCall('validate_chart_config', config as Record<string, unknown>, r, false, errors, suggestions);
    return r;
  }

  if (config.chart_type && !metric.allowed_chart_types.includes(config.chart_type)) {
    errors.push(
      `Chart type "${config.chart_type}" is not allowed for ${metric.label}. ` +
      `This metric represents ${metric.unit === 'users' ? 'user counts' : 'monetary values'} over time.`
    );
    suggestions.push(`Allowed chart types for ${metric.label}: ${metric.allowed_chart_types.join(', ')}`);
  }

  if (config.chart_type === 'bar' && config.style?.fill) {
    suggestions.push('Fill option is ignored for bar charts');
  }

  if (config.comparison) {
    if (!metric.comparison_allowed) {
      errors.push(`Comparison is not available for ${metric.label}`);
      suggestions.push('Previous period data is not available for this metric. Try dau, nru, npu, ruser01, ruser07, rev, or rev_npu which have comparison data.');
    } else if (!metric.prev_available) {
      errors.push(`Previous period data does not exist for ${metric.label}`);
      suggestions.push('Choose a metric with previous period data: dau, nru, npu, ruser01, ruser07, rev, rev_npu');
    }
  }

  if (config.aggregation && !metric.allowed_aggregations.includes(config.aggregation)) {
    errors.push(`Aggregation "${config.aggregation}" not supported for ${metric.label}`);
    suggestions.push(`Allowed: ${metric.allowed_aggregations.join(', ')}`);
  }

  const r = { valid: errors.length === 0, errors, suggestions };
  logCall('validate_chart_config', config as Record<string, unknown>, r, r.valid, errors, suggestions);
  return r;
}

export function create_chart(
  config: {
    metric_id: string;
    chart_type?: ChartType;
    time_range?: TimeRange;
    aggregation?: Aggregation;
    comparison?: boolean;
    style?: Partial<ChartStyle>;
    title?: string;
  },
  dashboards: Dashboard[],
  activeDashboardId: string | null,
  setDashboards: (d: Dashboard[]) => void
): { chart_id: string; error?: string } {
  const metric = getMetric(config.metric_id);
  if (!metric) {
    const r = { chart_id: '', error: `Unknown metric: ${config.metric_id}` };
    logCall('create_chart', config as Record<string, unknown>, r, false, [r.error!]);
    return r;
  }

  const chartType = config.chart_type || metric.allowed_chart_types[0];
  const validation = validate_chart_config({
    ...config,
    chart_type: chartType,
    style: undefined, // skip style validation for partial
  } as Partial<ChartConfig>);
  if (!validation.valid) {
    const r = { chart_id: '', error: validation.errors.join('; ') };
    logCall('create_chart', config as Record<string, unknown>, r, false, validation.errors, validation.suggestions);
    return r;
  }

  const chartId = uid('chart');
  const chart: ChartConfig = {
    id: chartId,
    metric_id: config.metric_id,
    chart_type: chartType,
    time_range: config.time_range || metric.default_time_range,
    aggregation: config.aggregation || metric.allowed_aggregations[0],
    comparison: config.comparison ?? false,
    style: {
      line_style: config.style?.line_style || 'solid',
      show_points: config.style?.show_points ?? true,
      fill: config.style?.fill ?? (chartType === 'area'),
    },
    title: config.title || metric.label,
  };

  if (activeDashboardId) {
    const updated = dashboards.map((d) =>
      d.id === activeDashboardId ? { ...d, charts: [...d.charts, chart] } : d
    );
    setDashboards(updated);
  }

  const r = { chart_id: chartId };
  logCall('create_chart', config as Record<string, unknown>, r, true);
  return r;
}

export function update_chart(
  chartId: string,
  patch: Partial<ChartConfig>,
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { success: boolean; error?: string } {
  let found = false;
  let validationError: { success: false; error: string } | null = null;

  const updated = dashboards.map((d) => ({
    ...d,
    charts: d.charts.map((c) => {
      if (c.id === chartId) {
        found = true;
        const merged = { ...c, ...patch, style: { ...c.style, ...(patch.style || {}) } };
        // Re-validate
        const v = validate_chart_config(merged);
        if (!v.valid) {
          validationError = { success: false, error: v.errors.join('; ') };
          return c; // don't apply invalid changes
        }
        return merged;
      }
      return c;
    }),
  }));

  if (!found) {
    const r = { success: false, error: `Chart ${chartId} not found` };
    logCall('update_chart', { chartId, patch } as Record<string, unknown>, r, false, [r.error]);
    return r;
  }

  if (validationError) {
    logCall('update_chart', { chartId, patch } as Record<string, unknown>, validationError, false, [(validationError as any).error]);
    return validationError;
  }

  setDashboards(updated);
  const r = { success: true };
  logCall('update_chart', { chartId, patch } as Record<string, unknown>, r, true);
  return r;
}

export function delete_chart(
  chartId: string,
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { success: boolean } {
  const updated = dashboards.map((d) => ({
    ...d,
    charts: d.charts.filter((c) => c.id !== chartId),
  }));
  setDashboards(updated);
  const r = { success: true };
  logCall('delete_chart', { chartId }, r, true);
  return r;
}

export function create_dashboard(
  meta: { name: string },
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { dashboard_id: string } {
  const id = dashUid();
  const dashboard: Dashboard = {
    id,
    name: meta.name,
    charts: [],
    created_at: new Date().toISOString(),
  };
  setDashboards([...dashboards, dashboard]);
  const r = { dashboard_id: id };
  logCall('create_dashboard', meta, r, true);
  return r;
}

export function add_chart_to_dashboard(
  dashboardId: string,
  chartConfig: {
    metric_id: string;
    chart_type?: ChartType;
    time_range?: TimeRange;
    comparison?: boolean;
    style?: Partial<ChartStyle>;
    title?: string;
  },
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { chart_id: string; error?: string } {
  return create_chart(chartConfig, dashboards, dashboardId, setDashboards);
}

export function reorder_charts(
  dashboardId: string,
  order: string[],
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { success: boolean } {
  const updated = dashboards.map((d) => {
    if (d.id !== dashboardId) return d;
    const chartsMap = Object.fromEntries(d.charts.map((c) => [c.id, c]));
    const reordered = order.map((id) => chartsMap[id]).filter(Boolean);
    return { ...d, charts: reordered };
  });
  setDashboards(updated);
  const r = { success: true };
  logCall('reorder_charts', { dashboardId, order }, r, true);
  return r;
}

export function share_dashboard(
  dashboardId: string,
  mode: 'viewer' | 'editor',
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { share_url: string } {
  const shareUrl = `https://analytics.vnggames.net/dashboard/${dashboardId}?mode=${mode}`;
  const updated = dashboards.map((d) =>
    d.id === dashboardId ? { ...d, shared: { mode, url: shareUrl } } : d
  );
  setDashboards(updated);
  const r = { share_url: shareUrl };
  logCall('share_dashboard', { dashboardId, mode }, r, true);
  return r;
}

// ── Claude tool definitions (for API call) ────────────────────
export const CLAUDE_TOOLS = [
  {
    name: 'list_metrics',
    description: 'List all available metrics in the registry with their definitions and constraints',
    input_schema: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'list_templates',
    description: 'List all available chart templates',
    input_schema: { type: 'object' as const, properties: {}, required: [] as string[] },
  },
  {
    name: 'validate_chart_config',
    description: 'Validate a chart configuration against the metric registry guardrails. Returns errors and suggestions if invalid.',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric_id: { type: 'string', description: 'Metric ID from the registry' },
        chart_type: { type: 'string', enum: ['line', 'area', 'bar'], description: 'Chart visualization type' },
        time_range: { type: 'string', enum: ['last_7_days', 'last_14_days', 'last_30_days'] },
        comparison: { type: 'boolean', description: 'Compare with previous period' },
      },
      required: ['metric_id'],
    },
  },
  {
    name: 'create_chart',
    description: 'Create a new chart and add it to the active dashboard. Always validate first.',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric_id: { type: 'string', description: 'Metric ID (e.g. dau, nru, npu, ruser07, rev, rev_npu)' },
        chart_type: { type: 'string', enum: ['line', 'area', 'bar'] },
        time_range: { type: 'string', enum: ['last_7_days', 'last_14_days', 'last_30_days'], description: 'Default: last_30_days' },
        aggregation: { type: 'string', enum: ['daily', 'weekly'] },
        comparison: { type: 'boolean', description: 'Show previous period overlay' },
        title: { type: 'string', description: 'Chart title' },
        style: {
          type: 'object',
          properties: {
            line_style: { type: 'string', enum: ['solid', 'dashed'] },
            show_points: { type: 'boolean' },
            fill: { type: 'boolean' },
          },
        },
      },
      required: ['metric_id'],
    },
  },
  {
    name: 'update_chart',
    description: 'Update an existing chart configuration by chart_id. Use this to change style, chart type, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chart_id: { type: 'string', description: 'The ID of the chart to update' },
        chart_type: { type: 'string', enum: ['line', 'area', 'bar'] },
        time_range: { type: 'string', enum: ['last_7_days', 'last_14_days', 'last_30_days'] },
        comparison: { type: 'boolean' },
        title: { type: 'string' },
        style: {
          type: 'object',
          properties: {
            line_style: { type: 'string', enum: ['solid', 'dashed'] },
            show_points: { type: 'boolean' },
            fill: { type: 'boolean' },
          },
        },
      },
      required: ['chart_id'],
    },
  },
  {
    name: 'delete_chart',
    description: 'Delete a chart from the dashboard by chart_id',
    input_schema: {
      type: 'object' as const,
      properties: {
        chart_id: { type: 'string' },
      },
      required: ['chart_id'],
    },
  },
  {
    name: 'create_dashboard',
    description: 'Create a new empty dashboard with a name',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Dashboard name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'share_dashboard',
    description: 'Generate a share link for the current dashboard',
    input_schema: {
      type: 'object' as const,
      properties: {
        mode: { type: 'string', enum: ['viewer', 'editor'], description: 'Permission level' },
      },
      required: ['mode'],
    },
  },
];

// ── System prompt for Claude ──────────────────────────────────
export function getSystemPrompt(activeDashboard: Dashboard | null): string {
  const metricsInfo = METRIC_REGISTRY.map(
    (m) =>
      `- ${m.id}: ${m.label} (${m.unit}) — chart types: ${m.allowed_chart_types.join('/')}, comparison: ${m.comparison_allowed ? 'yes' : 'no'}`
  ).join('\n');

  const templatesInfo = CHART_TEMPLATES.map(
    (t) => `- ${t.id}: ${t.name} — metric: ${t.metric_id}, type: ${t.chart_type}, comparison: ${t.comparison}`
  ).join('\n');

  const dashInfo = activeDashboard
    ? `Active dashboard: "${activeDashboard.name}" (${activeDashboard.charts.length} charts)\nExisting charts:\n${activeDashboard.charts.map((c) => `  - ${c.id}: ${c.title} (${c.metric_id}, ${c.chart_type}, comparison: ${c.comparison}, style: ${c.style.line_style})`).join('\n') || '  (none)'}`
    : 'No dashboard selected. Create one first with create_dashboard.';

  return `You are the Dashboard Hub AI assistant. You help users create and manage analytics dashboards.

IMPORTANT RULES:
1. You can ONLY use metrics from the registry. Never invent new metrics.
2. Always respect metric constraints (allowed chart types, comparison availability).
3. If a user request violates a guardrail, explain WHY it's blocked and suggest alternatives.
4. When creating charts, prefer using templates when a matching one exists.
5. If the user's request is ambiguous, ask clarifying questions about: chart type, time range, comparison, retention window.
6. Always call create_dashboard before adding charts if no dashboard is active.

METRIC REGISTRY:
${metricsInfo}

CHART TEMPLATES:
${templatesInfo}

CURRENT STATE:
${dashInfo}

GUARDRAIL EXAMPLES:
- "DAU pie chart" → BLOCKED: DAU only supports line/area. Suggest line or area instead.
- "Retention D14 comparison" → BLOCKED: No previous period data for D14. Suggest D1 or D7 which have comparison data.
- "Show me revenue stacked with DAU" → BLOCKED: Cannot stack different units (usd + users). Create separate charts.

When creating multiple charts, call create_chart for each one separately.`;
}
