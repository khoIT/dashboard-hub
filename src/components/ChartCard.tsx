import React, { useRef, useEffect } from 'react';
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
import { Line, Bar } from 'react-chartjs-2';
import { X, GripVertical } from 'lucide-react';
import { getMetricData, getPrevMetricData } from '../data/game-data';
import { getMetric } from '../data/metric-registry';
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
}

const ACCENT = '#6366f1';
const CYAN = '#22d3ee';

const ChartCard: React.FC<Props> = ({ chart, onDelete }) => {
  const metric = getMetric(chart.metric_id);
  if (!metric) return null;

  const current = getMetricData(metric.source.field, metric.source.variable, chart.time_range);
  const prev =
    chart.comparison && metric.prev_available
      ? getPrevMetricData(metric.source.field, metric.source.variable, chart.time_range)
      : null;

  const isDashed = chart.style.line_style === 'dashed';
  const isFill = chart.style.fill || chart.chart_type === 'area';
  const showPoints = chart.style.show_points;

  const formatValue = (v: number) => {
    if (metric.unit === 'usd') {
      return v >= 1e6
        ? '$' + (v / 1e6).toFixed(1) + 'M'
        : v >= 1e3
        ? '$' + (v / 1e3).toFixed(1) + 'K'
        : '$' + v.toFixed(0);
    }
    return v >= 1e6
      ? (v / 1e6).toFixed(2) + 'M'
      : v >= 1e3
      ? (v / 1e3).toFixed(1) + 'K'
      : v.toFixed(0);
  };

  const datasets: any[] = [
    {
      label: 'Jan 2026',
      data: current.values,
      borderColor: ACCENT,
      backgroundColor:
        chart.chart_type === 'bar'
          ? 'rgba(99,102,241,0.7)'
          : isFill
          ? 'rgba(99,102,241,0.08)'
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
            {chart.chart_type} · {chart.time_range.replace('last_', '').replace('_', ' ')}
          </span>
          {chart.comparison && (
            <span className="text-[10px] text-cyan px-2 py-0.5 bg-bg3 rounded">vs prev</span>
          )}
          {isDashed && (
            <span className="text-[10px] text-accent px-2 py-0.5 bg-bg3 rounded">dashed</span>
          )}
          <button
            onClick={() => onDelete(chart.id)}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="h-[200px]">
        <ChartComponent data={chartData} options={options} />
      </div>
      <div className="mt-2 text-[10px] text-muted">
        ID: {chart.id}
      </div>
    </div>
  );
};

export default ChartCard;
