import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart, Line, Bar } from 'react-chartjs-2';
import { X, GripVertical, Calendar } from 'lucide-react';
import { getMetricData, getPrevMetricData, getMetricDataByDateRange } from '../data/game-data';
import { getMetric } from '../data/metric-registry';
import { resolveColor } from '../utils/colors';
import type { ChartConfig } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

interface Props {
  chart: ChartConfig;
  onDelete: (id: string) => void;
  isSelected?: boolean;
}

const ACCENT = '#6366f1';
const CYAN = '#22d3ee';
const COMBO_PALETTE = ['#6366f1', '#22d3ee', '#22c55e', '#f97316', '#a855f7', '#ef4444'];

const formatUsers = (v: number) =>
  v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(0);

const formatUsd = (v: number) =>
  v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : '$' + v.toFixed(0);

const ChartCard: React.FC<Props> = ({ chart, onDelete, isSelected }) => {
  const isCombo = chart.metrics && chart.metrics.length > 0;

  // Date filter local state
  const [dateStart, setDateStart] = useState(chart.custom_start || '2026-01-01');
  const [dateEnd, setDateEnd] = useState(chart.custom_end || '2026-01-31');
  const [filterActive, setFilterActive] = useState(!!chart.custom_start);

  // ── COMBO CHART ────────────────────────────────────────────
  if (isCombo) {
    return renderComboChart(chart, onDelete, dateStart, dateEnd, filterActive, setDateStart, setDateEnd, setFilterActive);
  }

  // ── SINGLE-METRIC CHART (original logic preserved) ─────────
  const metric = getMetric(chart.metric_id);
  if (!metric) return null;

  const current = (chart.date_filter && filterActive)
    ? getMetricDataByDateRange(metric.source.field, metric.source.variable, dateStart, dateEnd)
    : getMetricData(metric.source.field, metric.source.variable, chart.time_range);
  const prev =
    chart.comparison && metric.prev_available && !(chart.date_filter && filterActive)
      ? getPrevMetricData(metric.source.field, metric.source.variable, chart.time_range)
      : null;

  const isDashed = chart.style.line_style === 'dashed';
  const isFill = chart.style.fill || chart.chart_type === 'area';
  const showPoints = chart.style.show_points;
  const mainColor = chart.style.color ? resolveColor(chart.style.color) : ACCENT;

  const formatValue = metric.unit === 'usd' ? formatUsd : formatUsers;

  const datasets: any[] = [
    {
      label: 'Jan 2026',
      data: current.values,
      borderColor: mainColor,
      backgroundColor:
        chart.chart_type === 'bar'
          ? mainColor + 'b3'
          : isFill
          ? mainColor + '14'
          : 'transparent',
      tension: 0.3,
      fill: isFill && chart.chart_type !== 'bar',
      pointRadius: showPoints ? 2 : 0,
      borderDash: isDashed ? [5, 5] : [],
      borderWidth: 2,
      borderRadius: chart.chart_type === 'bar' ? 4 : 0,
    },
  ];

  if (prev) {
    datasets.push({
      label: 'Dec 2025',
      data: prev.values,
      borderColor: CYAN,
      backgroundColor:
        chart.chart_type === 'bar'
          ? 'rgba(34,211,238,0.5)'
          : 'rgba(34,211,238,0.04)',
      tension: 0.3,
      fill: false,
      pointRadius: 0,
      borderDash: [4, 4],
      borderWidth: 1.5,
      borderRadius: chart.chart_type === 'bar' ? 4 : 0,
    });
  }

  const chartData = { labels: current.labels, datasets };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: prev !== null,
        labels: { color: '#8892a4', font: { size: 10 }, boxWidth: 10 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatValue(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#8892a4', font: { size: 10 }, maxTicksLimit: 8 },
        grid: { color: 'rgba(46,51,71,0.8)' },
      },
      y: {
        ticks: {
          color: '#8892a4',
          font: { size: 10 },
          callback: (v: number) => formatValue(v),
        },
        grid: { color: 'rgba(46,51,71,0.8)' },
      },
    },
  };

  const ChartComponent = chart.chart_type === 'bar' ? Bar : Line;

  return (
    <div className={`bg-bg2 border rounded-xl p-4 group relative h-full flex flex-col ${isSelected ? 'border-accent' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="drag-handle text-muted opacity-0 group-hover:opacity-100 cursor-grab" />
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
            {chart.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted px-2 py-0.5 bg-bg3 rounded">
            {chart.chart_type} · {chart.time_range.replace('last_', '').replace('_', ' ')}
          </span>
          {chart.comparison && (
            <span className="text-[10px] text-cyan px-2 py-0.5 bg-bg3 rounded">vs prev</span>
          )}
          {isDashed && (
            <span className="text-[10px] text-accent px-2 py-0.5 bg-bg3 rounded">dashed</span>
          )}
          {chart.style.color && (
            <span className="text-[10px] px-2 py-0.5 bg-bg3 rounded" style={{ color: mainColor }}>
              {chart.style.color}
            </span>
          )}
          <button
            onClick={() => onDelete(chart.id)}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {chart.date_filter && (
        <DateFilterBar
          dateStart={dateStart}
          dateEnd={dateEnd}
          filterActive={filterActive}
          setDateStart={setDateStart}
          setDateEnd={setDateEnd}
          setFilterActive={setFilterActive}
        />
      )}
      <div className="flex-1 min-h-0">
        <ChartComponent data={chartData} options={options} />
      </div>
      <div className="mt-2 text-[10px] text-muted">
        ID: {chart.id}
      </div>
    </div>
  );
};

// ── Date Filter Bar ────────────────────────────────────────────
function DateFilterBar({
  dateStart, dateEnd, filterActive, setDateStart, setDateEnd, setFilterActive,
}: {
  dateStart: string; dateEnd: string; filterActive: boolean;
  setDateStart: (v: string) => void; setDateEnd: (v: string) => void; setFilterActive: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 bg-bg3/50 rounded-lg px-3 py-1.5">
      <Calendar size={12} className="text-accent shrink-0" />
      <input
        type="date"
        value={dateStart}
        min="2026-01-01"
        max="2026-01-31"
        onChange={(e) => { setDateStart(e.target.value); setFilterActive(true); }}
        className="bg-bg border border-border rounded px-2 py-0.5 text-[10px] text-text outline-none focus:border-accent"
      />
      <span className="text-[10px] text-muted">to</span>
      <input
        type="date"
        value={dateEnd}
        min="2026-01-01"
        max="2026-01-31"
        onChange={(e) => { setDateEnd(e.target.value); setFilterActive(true); }}
        className="bg-bg border border-border rounded px-2 py-0.5 text-[10px] text-text outline-none focus:border-accent"
      />
      {filterActive && (
        <button
          onClick={() => setFilterActive(false)}
          className="text-[10px] text-accent hover:text-accent/80 ml-1"
        >
          Reset
        </button>
      )}
    </div>
  );
}

// ── Combo Chart Renderer ───────────────────────────────────────
function renderComboChart(
  chart: ChartConfig,
  onDelete: (id: string) => void,
  dateStart: string,
  dateEnd: string,
  filterActive: boolean,
  setDateStart: (v: string) => void,
  setDateEnd: (v: string) => void,
  setFilterActive: (v: boolean) => void,
) {
  const seriesList = chart.metrics!;
  const datasets: any[] = [];
  let labels: string[] = [];
  let hasRight = false;

  let colorIdx = 0;
  seriesList.forEach((s) => {
    const m = getMetric(s.metric_id);
    if (!m) return;

    const data = (chart.date_filter && filterActive)
      ? getMetricDataByDateRange(m.source.field, m.source.variable, dateStart, dateEnd)
      : getMetricData(m.source.field, m.source.variable, chart.time_range);

    if (labels.length === 0) labels = data.labels;

    const axis = s.axis || (m.unit === 'usd' ? 'right' : 'left');
    if (axis === 'right') hasRight = true;

    const color = s.color ? resolveColor(s.color) : COMBO_PALETTE[colorIdx % COMBO_PALETTE.length];
    colorIdx++;
    const isBar = s.chart_type === 'bar';

    datasets.push({
      type: isBar ? 'bar' as const : 'line' as const,
      label: s.label || m.label,
      data: data.values,
      borderColor: color,
      backgroundColor: isBar ? color + 'b3' : color + '14',
      tension: 0.3,
      fill: !isBar,
      pointRadius: isBar ? 0 : 2,
      borderWidth: 2,
      borderRadius: isBar ? 4 : 0,
      yAxisID: axis === 'right' ? 'y1' : 'y',
      order: isBar ? 1 : 0,
    });

    // Comparison: add previous-period dataset if enabled for this series or globally
    const wantsComparison = s.comparison ?? chart.comparison;
    if (wantsComparison && m.prev_available && !(chart.date_filter && filterActive)) {
      const prev = getPrevMetricData(m.source.field, m.source.variable, chart.time_range);
      if (prev) {
        const prevColor = COMBO_PALETTE[colorIdx % COMBO_PALETTE.length];
        colorIdx++;
        datasets.push({
          type: 'line' as const,
          label: (s.label || m.label) + ' (prev)',
          data: prev.values,
          borderColor: prevColor,
          backgroundColor: prevColor + '08',
          tension: 0.3,
          fill: false,
          pointRadius: 0,
          borderDash: [4, 4],
          borderWidth: 1.5,
          borderRadius: 0,
          yAxisID: axis === 'right' ? 'y1' : 'y',
          order: 0,
        });
      }
    }
  });

  const chartData = { labels, datasets };

  const leftUnit = (() => {
    const first = seriesList.find((s) => (s.axis || (getMetric(s.metric_id)?.unit === 'usd' ? 'right' : 'left')) === 'left');
    return first ? getMetric(first.metric_id)?.unit : 'users';
  })();
  const rightUnit = 'usd';
  const fmtLeft = leftUnit === 'usd' ? formatUsd : formatUsers;
  const fmtRight = formatUsd;

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#8892a4', font: { size: 10 }, boxWidth: 10 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const fmt = ctx.dataset.yAxisID === 'y1' ? fmtRight : fmtLeft;
            return `${ctx.dataset.label}: ${fmt(ctx.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#8892a4', font: { size: 10 }, maxTicksLimit: 8 },
        grid: { color: 'rgba(46,51,71,0.8)' },
      },
      y: {
        position: 'left' as const,
        ticks: { color: '#8892a4', font: { size: 10 }, callback: (v: number) => fmtLeft(v) },
        grid: { color: 'rgba(46,51,71,0.8)' },
      },
      ...(hasRight
        ? {
            y1: {
              position: 'right' as const,
              ticks: { color: '#8892a4', font: { size: 10 }, callback: (v: number) => fmtRight(v) },
              grid: { drawOnChartArea: false },
            },
          }
        : {}),
    },
  };

  return (
    <div className="bg-bg2 border border-border rounded-xl p-4 group relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-muted opacity-0 group-hover:opacity-100 cursor-grab" />
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
            {chart.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted px-2 py-0.5 bg-bg3 rounded">
            combo · {chart.time_range.replace('last_', '').replace('_', ' ')}
          </span>
          {seriesList.map((s, i) => {
            const m = getMetric(s.metric_id);
            const color = s.color ? resolveColor(s.color) : COMBO_PALETTE[i % COMBO_PALETTE.length];
            return (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-bg3 rounded" style={{ color }}>
                {s.label || m?.label || s.metric_id} ({s.chart_type}{s.comparison ? ' +prev' : ''})
              </span>
            );
          })}
          <button
            onClick={() => onDelete(chart.id)}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {chart.date_filter && (
        <DateFilterBar
          dateStart={dateStart}
          dateEnd={dateEnd}
          filterActive={filterActive}
          setDateStart={setDateStart}
          setDateEnd={setDateEnd}
          setFilterActive={setFilterActive}
        />
      )}
      <div className="h-[200px]">
        <Chart type="bar" data={chartData} options={options} />
      </div>
      <div className="mt-2 text-[10px] text-muted">
        ID: {chart.id}
      </div>
    </div>
  );
}

export default ChartCard;
