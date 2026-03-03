import React from 'react';
import { ArrowLeft, Layers, Plus } from 'lucide-react';
import { CHART_TEMPLATES } from '../data/chart-templates';
import { getMetric } from '../data/metric-registry';

interface Props {
  onClose: () => void;
  onAddFromTemplate: (templateId: string) => void;
  hasActiveDashboard: boolean;
}

const TemplateLibrary: React.FC<Props> = ({ onClose, onAddFromTemplate, hasActiveDashboard }) => {
  return (
    <div className="w-[380px] bg-bg2 border-l border-border flex flex-col shrink-0 h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <button onClick={onClose} className="text-muted hover:text-text transition-colors">
          <ArrowLeft size={16} />
        </button>
        <Layers size={16} className="text-accent" />
        <span className="text-sm font-semibold">Chart Templates</span>
        <span className="text-[10px] text-muted ml-auto">{CHART_TEMPLATES.length} templates</span>
      </div>

      <div className="px-4 py-3 border-b border-border bg-bg3/30">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong className="text-accent">Certified chart configurations</strong> with pre-set
          metrics, chart types, and styles. Click to add directly to the active dashboard.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {CHART_TEMPLATES.map((t) => {
          const metric = getMetric(t.metric_id);
          return (
            <div
              key={t.id}
              className="bg-bg3/50 border border-border rounded-xl p-3 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text">{t.name}</span>
                {hasActiveDashboard && (
                  <button
                    onClick={() => onAddFromTemplate(t.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                )}
              </div>

              <p className="text-[10px] text-muted mb-2">{t.description}</p>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-mono bg-bg rounded px-1.5 py-0.5 text-text">
                  {t.metric_id}
                </span>
                <span className="text-[9px] bg-accent/10 text-accent rounded px-1.5 py-0.5">
                  {t.chart_type}
                </span>
                <span className="text-[9px] bg-bg rounded px-1.5 py-0.5 text-muted">
                  {t.time_range.replace('last_', '').replace('_', ' ')}
                </span>
                <span className="text-[9px] bg-bg rounded px-1.5 py-0.5 text-muted">
                  {t.aggregation}
                </span>
                {t.comparison && (
                  <span className="text-[9px] bg-cyan/10 text-cyan rounded px-1.5 py-0.5">
                    comparison
                  </span>
                )}
                <span className="text-[9px] bg-bg rounded px-1.5 py-0.5 text-muted">
                  {t.style.line_style}
                </span>
              </div>

              {metric && (
                <div className="mt-2 text-[9px] text-muted">
                  {metric.label} ({metric.unit}) — {metric.allowed_chart_types.join('/')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasActiveDashboard && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-yellow-400 text-center">
            Create a dashboard first to add charts from templates
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
