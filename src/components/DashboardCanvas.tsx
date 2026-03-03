import React from 'react';
import { LayoutDashboard, Share2, Plus } from 'lucide-react';
import ChartCard from './ChartCard';
import type { Dashboard } from '../types';

interface Props {
  dashboard: Dashboard | null;
  onDeleteChart: (chartId: string) => void;
  onShare: () => void;
  onQuickAdd: () => void;
}

const DashboardCanvas: React.FC<Props> = ({
  dashboard,
  onDeleteChart,
  onShare,
  onQuickAdd,
}) => {
  if (!dashboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <div className="text-center">
          <LayoutDashboard size={48} className="mx-auto text-border mb-4" />
          <h2 className="text-lg font-semibold text-muted mb-2">No Dashboard Selected</h2>
          <p className="text-sm text-muted/70 max-w-sm">
            Create a dashboard from the left panel or ask the AI chatbot:
            <br />
            <span className="text-accent font-mono text-xs">
              "Create dashboard called PTG Overview"
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-bg overflow-y-auto">
      {/* Dashboard header */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text">{dashboard.name}</h2>
          <p className="text-[11px] text-muted">
            {dashboard.charts.length} chart{dashboard.charts.length !== 1 ? 's' : ''} ·
            Created {new Date(dashboard.created_at).toLocaleDateString()}
            {dashboard.shared && (
              <span className="ml-2 text-accent">
                · Shared ({dashboard.shared.mode})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onQuickAdd}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
          >
            <Plus size={13} />
            Add Chart
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-bg3 text-muted rounded-lg hover:text-text transition-colors"
          >
            <Share2 size={13} />
            Share
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="p-6">
        {dashboard.charts.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
            <Plus size={32} className="mx-auto text-border mb-3" />
            <p className="text-sm text-muted mb-1">No charts yet</p>
            <p className="text-xs text-muted/70">
              Use the chatbot or Template Library to add charts
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {dashboard.charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} onDelete={onDeleteChart} />
            ))}
          </div>
        )}
      </div>

      {/* Share URL display */}
      {dashboard.shared && (
        <div className="mx-6 mb-6 bg-accent/5 border border-accent/20 rounded-lg px-4 py-3">
          <p className="text-[11px] text-muted mb-1">Share Link ({dashboard.shared.mode})</p>
          <code className="text-xs text-accent break-all">{dashboard.shared.url}</code>
        </div>
      )}
    </div>
  );
};

export default DashboardCanvas;
