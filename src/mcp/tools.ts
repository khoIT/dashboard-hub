import { METRIC_REGISTRY, getMetric } from '../data/metric-registry';
import { CHART_TEMPLATES } from '../data/chart-templates';
import { getMetricData, getPrevMetricData } from '../data/game-data';
import { resolveColor, getColorNames } from '../utils/colors';
import type {
  ChartConfig,
  ChartStyle,
  MetricSeries,
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
    date_filter?: boolean;
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
      color: config.style?.color,
    },
    title: config.title || metric.label,
    date_filter: config.date_filter,
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

export function create_combo_chart(
  config: {
    metrics: { metric_id: string; chart_type: ChartType; color?: string; comparison?: boolean; label?: string }[];
    time_range?: TimeRange;
    title?: string;
    date_filter?: boolean;
    comparison?: boolean;
  },
  dashboards: Dashboard[],
  activeDashboardId: string | null,
  setDashboards: (d: Dashboard[]) => void
): { chart_id: string; error?: string } {
  if (!config.metrics || config.metrics.length < 1) {
    const r = { chart_id: '', error: 'Combo chart requires at least 1 metric' };
    logCall('create_combo_chart', config as Record<string, unknown>, r, false, [r.error]);
    return r;
  }

  const errors: string[] = [];
  const metricSeries: MetricSeries[] = [];

  for (const ms of config.metrics) {
    const metric = getMetric(ms.metric_id);
    if (!metric) {
      errors.push(`Unknown metric: ${ms.metric_id}`);
      continue;
    }
    if (!metric.allowed_chart_types.includes(ms.chart_type)) {
      errors.push(`Chart type "${ms.chart_type}" not allowed for ${metric.label}. Allowed: ${metric.allowed_chart_types.join(', ')}`);
      continue;
    }
    metricSeries.push({
      metric_id: ms.metric_id,
      chart_type: ms.chart_type,
      axis: metric.unit === 'usd' ? 'right' : 'left',
      color: ms.color,
      comparison: ms.comparison ?? config.comparison ?? false,
      label: ms.label,
    });
  }

  if (errors.length > 0) {
    const r = { chart_id: '', error: errors.join('; ') };
    logCall('create_combo_chart', config as Record<string, unknown>, r, false, errors);
    return r;
  }

  const chartId = uid('chart');
  const chart: ChartConfig = {
    id: chartId,
    metric_id: metricSeries[0].metric_id,
    chart_type: metricSeries[0].chart_type,
    time_range: config.time_range || 'last_30_days',
    aggregation: 'daily',
    comparison: config.comparison ?? false,
    style: { line_style: 'solid', show_points: true, fill: false },
    title: config.title || metricSeries.map((s) => s.label || getMetric(s.metric_id)?.label).join(' + '),
    metrics: metricSeries,
    date_filter: config.date_filter,
  };

  if (activeDashboardId) {
    const updated = dashboards.map((d) =>
      d.id === activeDashboardId ? { ...d, charts: [...d.charts, chart] } : d
    );
    setDashboards(updated);
  }

  const r = { chart_id: chartId };
  logCall('create_combo_chart', config as Record<string, unknown>, r, true);
  return r;
}

export function update_chart(
  chartId: string,
  patch: Partial<ChartConfig> & { metric_id?: string },
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { success: boolean; error?: string } {
  let found = false;
  let validationError: { success: false; error: string } | null = null;

  // Extract routing hint metric_id (for targeting combo series) before merging
  const targetMetricId = patch.metric_id;
  const { metric_id: _routingHint, ...cleanPatch } = patch;

  const updated = dashboards.map((d) => ({
    ...d,
    charts: d.charts.map((c) => {
      if (c.id === chartId) {
        found = true;
        const merged = { ...c, ...cleanPatch, style: { ...c.style, ...(cleanPatch.style || {}) } };

        // Combo chart color routing: write color to metrics[] entries, not just style
        if (c.metrics && c.metrics.length > 0 && cleanPatch.style?.color) {
          merged.metrics = c.metrics.map((s) => {
            if (!targetMetricId || s.metric_id === targetMetricId) {
              return { ...s, color: cleanPatch.style!.color };
            }
            return s;
          });
        }

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

export function add_metric_to_chart(
  chartId: string,
  newMetric: { metric_id: string; chart_type: ChartType; color?: string; comparison?: boolean; label?: string },
  dashboards: Dashboard[],
  setDashboards: (d: Dashboard[]) => void
): { success: boolean; error?: string } {
  const metric = getMetric(newMetric.metric_id);
  if (!metric) {
    const r = { success: false, error: `Unknown metric: ${newMetric.metric_id}` };
    logCall('add_metric_to_chart', { chartId, newMetric } as Record<string, unknown>, r, false, [r.error]);
    return r;
  }
  if (!metric.allowed_chart_types.includes(newMetric.chart_type)) {
    const r = { success: false, error: `Chart type "${newMetric.chart_type}" not allowed for ${metric.label}. Allowed: ${metric.allowed_chart_types.join(', ')}` };
    logCall('add_metric_to_chart', { chartId, newMetric } as Record<string, unknown>, r, false, [r.error]);
    return r;
  }

  let found = false;
  const updated = dashboards.map((d) => ({
    ...d,
    charts: d.charts.map((c) => {
      if (c.id !== chartId) return c;
      found = true;

      const series: MetricSeries = {
        metric_id: newMetric.metric_id,
        chart_type: newMetric.chart_type,
        axis: metric.unit === 'usd' ? 'right' : 'left',
        color: newMetric.color,
        comparison: newMetric.comparison ?? false,
        label: newMetric.label,
      };

      // If chart has no metrics[] yet (single-metric chart), convert to combo
      const existingMetrics: MetricSeries[] = c.metrics && c.metrics.length > 0
        ? c.metrics
        : [{
            metric_id: c.metric_id,
            chart_type: c.chart_type,
            axis: (getMetric(c.metric_id)?.unit === 'usd' ? 'right' : 'left') as 'left' | 'right',
            color: c.style.color,
            comparison: c.comparison,
          }];

      const allMetrics = [...existingMetrics, series];
      const newTitle = allMetrics.map((s) => s.label || getMetric(s.metric_id)?.label || s.metric_id).join(' + ');

      return {
        ...c,
        metrics: allMetrics,
        title: newTitle,
      };
    }),
  }));

  if (!found) {
    const r = { success: false, error: `Chart ${chartId} not found` };
    logCall('add_metric_to_chart', { chartId, newMetric } as Record<string, unknown>, r, false, [r.error]);
    return r;
  }

  setDashboards(updated);
  const r = { success: true };
  logCall('add_metric_to_chart', { chartId, newMetric } as Record<string, unknown>, r, true);
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
    description: 'Create a new single-metric chart and add it to the active dashboard. Always validate first. Supports custom color and interactive date filter.',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric_id: { type: 'string', description: 'Metric ID (e.g. dau, nru, npu, ruser07, rev, rev_npu)' },
        chart_type: { type: 'string', enum: ['line', 'area', 'bar'] },
        time_range: { type: 'string', enum: ['last_7_days', 'last_14_days', 'last_30_days'], description: 'Default: last_30_days' },
        aggregation: { type: 'string', enum: ['daily', 'weekly'] },
        comparison: { type: 'boolean', description: 'Show previous period overlay' },
        title: { type: 'string', description: 'Chart title' },
        date_filter: { type: 'boolean', description: 'Enable interactive date range picker on the chart' },
        style: {
          type: 'object',
          properties: {
            line_style: { type: 'string', enum: ['solid', 'dashed'] },
            show_points: { type: 'boolean' },
            fill: { type: 'boolean' },
            color: { type: 'string', description: 'Color name (e.g. red, blue, green, orange, purple, pink, cyan, teal, amber, indigo) or hex code' },
          },
        },
      },
      required: ['metric_id'],
    },
  },
  {
    name: 'create_combo_chart',
    description: 'Create a combo/multi-series chart. Each metric can have its own chart type (line/bar) and optional comparison overlay. USD metrics auto-map to right y-axis. Use this for: overlaying metrics (NPU line + Revenue bar), or same-metric with comparison (NPU trend + NPU prev as two lines). Set comparison:true per series to add a dashed previous-period line.',
    input_schema: {
      type: 'object' as const,
      properties: {
        metrics: {
          type: 'array',
          description: 'Array of metric series (1 or more). Each can opt-in to comparison independently.',
          items: {
            type: 'object',
            properties: {
              metric_id: { type: 'string', description: 'Metric ID from registry' },
              chart_type: { type: 'string', enum: ['line', 'bar'], description: 'Chart type for this series' },
              color: { type: 'string', description: 'Optional color name or hex' },
              comparison: { type: 'boolean', description: 'If true, adds a dashed previous-period line for this metric (requires prev_available)' },
              label: { type: 'string', description: 'Optional custom label for the series legend' },
            },
            required: ['metric_id', 'chart_type'],
          },
        },
        time_range: { type: 'string', enum: ['last_7_days', 'last_14_days', 'last_30_days'] },
        title: { type: 'string', description: 'Chart title' },
        date_filter: { type: 'boolean', description: 'Enable interactive date range picker' },
        comparison: { type: 'boolean', description: 'Global comparison flag: if true, all series with prev data get a comparison line' },
      },
      required: ['metrics'],
    },
  },
  {
    name: 'update_chart',
    description: 'Update an existing chart configuration by chart_id. Use this to change style, chart type, color, enable date filter, etc. For combo charts, include metric_id to target a specific series for color changes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chart_id: { type: 'string', description: 'The ID of the chart to update' },
        metric_id: { type: 'string', description: 'Optional: for combo charts, specify which metric series to update (e.g. color change). If omitted on a combo chart, applies to all series.' },
        chart_type: { type: 'string', enum: ['line', 'area', 'bar'] },
        time_range: { type: 'string', enum: ['last_7_days', 'last_14_days', 'last_30_days'] },
        comparison: { type: 'boolean' },
        title: { type: 'string' },
        date_filter: { type: 'boolean', description: 'Enable/disable interactive date range picker' },
        style: {
          type: 'object',
          properties: {
            line_style: { type: 'string', enum: ['solid', 'dashed'] },
            show_points: { type: 'boolean' },
            fill: { type: 'boolean' },
            color: { type: 'string', description: 'Color name (red, blue, green, orange, purple, pink, cyan, teal, amber, indigo) or hex code' },
          },
        },
      },
      required: ['chart_id'],
    },
  },
  {
    name: 'add_metric_to_chart',
    description: 'Add a new metric series to an existing chart, turning it into a combo/multi-series chart if needed. Use this when the user wants to add a metric to a chart that already exists (especially the selected chart). Prefer this over create_combo_chart when modifying an existing chart.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chart_id: { type: 'string', description: 'The ID of the chart to add the metric to' },
        metric_id: { type: 'string', description: 'Metric ID from registry (e.g. nru, rev, dau)' },
        chart_type: { type: 'string', enum: ['line', 'bar'], description: 'Chart type for this new series' },
        color: { type: 'string', description: 'Optional color name or hex code' },
        comparison: { type: 'boolean', description: 'If true, adds a dashed previous-period line for this metric' },
        label: { type: 'string', description: 'Optional custom label for the series legend' },
      },
      required: ['chart_id', 'metric_id', 'chart_type'],
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
7. SELECTED CHART PRIORITY: When a chart is selected (you'll see SELECTED CHART in context), ALWAYS prefer modifying/updating that chart over creating a new one. Use add_metric_to_chart to add series, update_chart to change properties. Only create a new chart if the user explicitly says "create a new chart" or "add another chart".

METRIC REGISTRY:
${metricsInfo}

CHART TEMPLATES:
${templatesInfo}

CURRENT STATE:
${dashInfo}

COMBO CHARTS:
Use create_combo_chart for multi-series charts. Supports 1+ metrics, each with its own chart type and optional comparison.
- USD metrics (rev, rev_npu, rev_rpi*) auto-map to the RIGHT y-axis.
- User metrics (dau, nru, npu, ruser*) auto-map to the LEFT y-axis.
- Example: NPU as line + Revenue as bar → metrics: [{metric_id:"npu",chart_type:"line"},{metric_id:"rev",chart_type:"bar"}]
- Color per series: {metric_id:"npu",chart_type:"line",color:"blue"}
- COMPARISON: Set comparison:true per series (or globally) to add a dashed previous-period line for that metric.
  Example: "NPU trend with comparison as line" → metrics: [{metric_id:"npu",chart_type:"line",comparison:true}]
  This draws NPU Jan 2026 (solid) + NPU Dec 2025 (dashed) as two lines.
- When the user says "trend and comparison", the previous period is always the month before the latest (Dec 2025 vs Jan 2026).
- Available data range: Aug 1, 2025 – Jan 31, 2026 (6 months). Use date_filter:true for custom date ranges.
- A combo chart can have any number of series — do NOT hardcode to exactly 2.

COLOR SUPPORT:
Both create_chart and update_chart accept a color name in style.color.
Available color names: ${getColorNames().join(', ')}.
You can also pass hex codes like "#ff6600".
Example single-metric chart: update_chart with style: {color: "red"}
Example combo chart (target one series): update_chart with chart_id, metric_id: "rev", style: {color: "red"}
IMPORTANT: For combo charts, you MUST include metric_id to specify which series to recolor. If omitted, ALL series get the same color.

DATE FILTER:
Set date_filter: true on create_chart, create_combo_chart, or update_chart to add an interactive date range picker to the chart.
Users can then pick start/end dates directly on the chart to filter the data visually.
Available data range: Aug 1, 2025 – Jan 31, 2026 (6 months, 184 days).
The date filter is INTERACTIVE — users can change dates directly on the chart without talking to you again.
When users ask for date filtering or custom date ranges, ALWAYS enable date_filter: true.

GUARDRAIL EXAMPLES:
- "DAU pie chart" → BLOCKED: DAU only supports line/area. Suggest line or area instead.
- "Retention D14 comparison" → BLOCKED: No previous period data for D14. Suggest D1 or D7 which have comparison data.
- "Show me revenue stacked with DAU" → BLOCKED for stacking, but ALLOWED as combo chart with dual y-axis. Use create_combo_chart instead.

ADDING METRICS TO EXISTING CHARTS:
Use add_metric_to_chart to add a new metric series to an existing chart by chart_id. This converts single-metric charts to combo charts automatically.
- Example: user selects a NPU line chart and says "add Revenue as bar" → call add_metric_to_chart with the selected chart_id, metric_id:"rev", chart_type:"bar"
- Example: user says "add NRU as dashed orange line" → call add_metric_to_chart with metric_id:"nru", chart_type:"line", color:"orange", comparison:false
- ALWAYS prefer add_metric_to_chart over create_combo_chart when a chart is selected and the user wants to add a metric to it.

When creating multiple single-metric charts, call create_chart for each one separately.
When the user wants multiple metrics on the SAME chart, use create_combo_chart.`;
}
