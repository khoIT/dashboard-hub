import React from 'react';
import { ArrowLeft, Shield, BarChart3, GitCompare } from 'lucide-react';
import { METRIC_REGISTRY } from '../data/metric-registry';

interface Props {
  onClose: () => void;
}

const MetricExplorer: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="w-[380px] bg-bg2 border-l border-border flex flex-col shrink-0 h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onClose} className="text-muted hover:text-text transition-colors">
          <ArrowLeft size={16} />
        </button>
        <Shield size={16} className="text-accent" />
        <span className="text-sm font-semibold">Metric Registry</span>
        <span className="text-[10px] text-muted ml-auto">{METRIC_REGISTRY.length} metrics</span>
      </div>

      <div className="px-4 py-3 border-b border-border bg-bg3/30">
        <p className="text-[11px] text-muted leading-relaxed">
          This is the <strong className="text-accent">governance layer</strong>. Every metric
          has defined constraints. The chatbot and chart builder can only use metrics from this
          registry. Invalid requests are blocked with explanations.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {METRIC_REGISTRY.map((m) => (
          <div
            key={m.id}
            className="bg-bg3/50 border border-border rounded-xl p-3 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-text">{m.label}</span>
              <span className="text-[9px] font-mono text-muted bg-bg rounded px-1.5 py-0.5">
                {m.id}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded ${
                  m.unit === 'usd'
                    ? 'bg-green-400/10 text-green-400'
                    : 'bg-accent/10 text-accent'
                }`}
              >
                {m.unit}
              </span>
            </div>

            <p className="text-[10px] text-muted mb-2">{m.definition}</p>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <BarChart3 size={10} className="text-muted" />
                <span className="text-muted">Charts:</span>
                <div className="flex gap-1">
                  {m.allowed_chart_types.map((t) => (
                    <span key={t} className="bg-bg rounded px-1.5 py-0.5 text-text font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <GitCompare size={10} className="text-muted" />
                <span className="text-muted">Comparison:</span>
                {m.comparison_allowed && m.prev_available ? (
                  <span className="text-green-400">Available</span>
                ) : m.comparison_allowed ? (
                  <span className="text-yellow-400">No prev data</span>
                ) : (
                  <span className="text-red-400">Not available</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-muted ml-[14px]">Source:</span>
                <span className="font-mono text-muted">
                  {m.source.variable}.{m.source.field}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricExplorer;
