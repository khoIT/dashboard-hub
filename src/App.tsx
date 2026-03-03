import React, { useState, useEffect, useCallback } from 'react';
import DashboardNav from './components/DashboardNav';
import DashboardCanvas from './components/DashboardCanvas';
import ChatPanel from './components/ChatPanel';
import MetricExplorer from './components/MetricExplorer';
import TemplateLibrary from './components/TemplateLibrary';
import { CHART_TEMPLATES } from './data/chart-templates';
import { getMetric } from './data/metric-registry';
import { setToolCallLogger, create_chart, create_dashboard, share_dashboard } from './mcp/tools';
import type { Dashboard, ToolCall, GridLayoutItem } from './types';

const STORAGE_KEY = 'dashboard-hub-dashboards';

function loadDashboards(): Dashboard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDashboards(dashboards: Dashboard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
}

const App: React.FC = () => {
  const [dashboards, setDashboardsRaw] = useState<Dashboard[]>(loadDashboards);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(
    () => loadDashboards()[0]?.id ?? null
  );
  const [activePanel, setActivePanel] = useState<'chat' | 'metrics' | 'templates'>('chat');
  const [toolCallLog, setToolCallLog] = useState<ToolCall[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

  // Wrap setDashboards to auto-save
  const setDashboards = useCallback((d: Dashboard[]) => {
    setDashboardsRaw(d);
    saveDashboards(d);
  }, []);

  // Register tool call logger
  useEffect(() => {
    setToolCallLogger((entry: ToolCall) => {
      setToolCallLog((prev) => [...prev, entry]);
    });
  }, []);

  // Dashboard CRUD
  const handleCreateDashboard = (name: string) => {
    const result = create_dashboard({ name }, dashboards, setDashboards);
    setActiveDashboardId(result.dashboard_id);
  };

  const handleRenameDashboard = (id: string, name: string) => {
    const updated = dashboards.map((d) => (d.id === id ? { ...d, name } : d));
    setDashboards(updated);
  };

  const handleDeleteDashboard = (id: string) => {
    const updated = dashboards.filter((d) => d.id !== id);
    setDashboards(updated);
    if (activeDashboardId === id) {
      setActiveDashboardId(updated[0]?.id ?? null);
    }
  };

  // Chart operations
  const handleDeleteChart = (chartId: string) => {
    const updated = dashboards.map((d) => ({
      ...d,
      charts: d.charts.filter((c) => c.id !== chartId),
    }));
    setDashboards(updated);
  };

  const handleShare = () => {
    if (!activeDashboardId) return;
    share_dashboard(activeDashboardId, 'viewer', dashboards, setDashboards);
  };

  const handleQuickAdd = () => {
    setActivePanel('templates');
  };

  const handleAddFromTemplate = (templateId: string) => {
    if (!activeDashboardId) return;
    const template = CHART_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const metric = getMetric(template.metric_id);
    if (!metric) return;

    create_chart(
      {
        metric_id: template.metric_id,
        chart_type: template.chart_type,
        time_range: template.time_range,
        aggregation: template.aggregation,
        comparison: template.comparison,
        style: template.style,
        title: template.name,
      },
      dashboards,
      activeDashboardId,
      setDashboards
    );
  };

  const handleLayoutChange = useCallback((layouts: GridLayoutItem[]) => {
    if (!activeDashboardId) return;
    const updated = dashboards.map((d) =>
      d.id === activeDashboardId ? { ...d, layouts } : d
    );
    setDashboards(updated);
  }, [activeDashboardId, dashboards, setDashboards]);

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) || null;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left: Dashboard Navigator */}
      <DashboardNav
        dashboards={dashboards}
        activeId={activeDashboardId}
        onSelect={setActiveDashboardId}
        onCreate={handleCreateDashboard}
        onRename={handleRenameDashboard}
        onDelete={handleDeleteDashboard}
        activePanel={activePanel}
        onSetPanel={setActivePanel}
      />

      {/* Center: Dashboard Canvas */}
      <DashboardCanvas
        dashboard={activeDashboard}
        onDeleteChart={handleDeleteChart}
        onShare={handleShare}
        onQuickAdd={handleQuickAdd}
        onLayoutChange={handleLayoutChange}
        selectedChartId={selectedChartId}
        onSelectChart={setSelectedChartId}
      />

      {/* Right: Panel (Chat / Metrics / Templates) */}
      {activePanel === 'chat' && (
        <ChatPanel
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          setDashboards={setDashboards}
          setActiveDashboardId={setActiveDashboardId}
          toolCallLog={toolCallLog}
          selectedChartId={selectedChartId}
        />
      )}
      {activePanel === 'metrics' && (
        <MetricExplorer onClose={() => setActivePanel('chat')} />
      )}
      {activePanel === 'templates' && (
        <TemplateLibrary
          onClose={() => setActivePanel('chat')}
          onAddFromTemplate={handleAddFromTemplate}
          hasActiveDashboard={!!activeDashboardId}
        />
      )}
    </div>
  );
};

export default App;
