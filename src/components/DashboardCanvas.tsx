import React, { useRef, useMemo, useCallback } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { LayoutDashboard, Share2, Plus } from 'lucide-react';
import ChartCard from './ChartCard';
import type { Dashboard, GridLayoutItem } from '../types';

const COLS = 12;
const ROW_HEIGHT = 150;
const DEFAULT_W = 6;
const DEFAULT_H = 2;

interface Props {
  dashboard: Dashboard | null;
  onDeleteChart: (chartId: string) => void;
  onShare: () => void;
  onQuickAdd: () => void;
  onLayoutChange: (layouts: GridLayoutItem[]) => void;
  selectedChartId: string | null;
  onSelectChart: (chartId: string | null) => void;
}

function buildLayout(dashboard: Dashboard) {
  const saved = dashboard.layouts || [];
  const savedMap = new Map(saved.map((l) => [l.i, l]));
  return dashboard.charts.map((chart, idx) => {
    const s = savedMap.get(chart.id);
    if (s) return { i: s.i, x: s.x, y: s.y, w: s.w, h: s.h, minW: 3, minH: 2 };
    const col = (idx * DEFAULT_W) % COLS;
    const row = Math.floor((idx * DEFAULT_W) / COLS) * DEFAULT_H;
    return { i: chart.id, x: col, y: row, w: DEFAULT_W, h: DEFAULT_H, minW: 3, minH: 2 };
  });
}

const DashboardCanvas: React.FC<Props> = ({
  dashboard,
  onDeleteChart,
  onShare,
  onQuickAdd,
  onLayoutChange,
  selectedChartId,
  onSelectChart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);

  const layout = useMemo(() => (dashboard ? buildLayout(dashboard) : []), [dashboard]);

  const handleLayoutChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newLayout: any[]) => {
      if (!dashboard) return;
      const items: GridLayoutItem[] = newLayout.map((l: any) => ({
        i: l.i, x: l.x, y: l.y, w: l.w, h: l.h,
      }));
      onLayoutChange(items);
    },
    [dashboard, onLayoutChange]
  );

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
    <div
      className="flex-1 bg-bg overflow-y-auto"
      ref={containerRef}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target === e.currentTarget || target.classList.contains('react-grid-layout')) {
          onSelectChart(null);
        }
      }}
    >
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
      <div className="px-4 pt-4 pb-8">
        {dashboard.charts.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
            <Plus size={32} className="mx-auto text-border mb-3" />
            <p className="text-sm text-muted mb-1">No charts yet</p>
            <p className="text-xs text-muted/70">
              Use the chatbot or Template Library to add charts
            </p>
          </div>
        ) : width > 0 ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 0 }}
            cols={{ lg: COLS }}
            rowHeight={ROW_HEIGHT}
            width={width - 32}
            isDraggable
            isResizable
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
            compactType="vertical"
            margin={[12, 12]}
          >
            {dashboard.charts.map((chart) => (
              <div
                key={chart.id}
                className={`cursor-pointer transition-shadow ${
                  selectedChartId === chart.id
                    ? 'ring-2 ring-accent rounded-xl shadow-lg shadow-accent/10'
                    : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChart(selectedChartId === chart.id ? null : chart.id);
                }}
              >
                <ChartCard chart={chart} onDelete={onDeleteChart} isSelected={selectedChartId === chart.id} />
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : null}
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
