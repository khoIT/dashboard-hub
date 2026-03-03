import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Key, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Bot, User, RotateCcw, Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { ChatMessage, ToolCall, Dashboard } from '../types';
import {
  list_metrics,
  list_templates,
  validate_chart_config,
  create_chart,
  create_combo_chart,
  update_chart,
  add_metric_to_chart,
  delete_chart,
  create_dashboard,
  share_dashboard,
  CLAUDE_TOOLS,
  getSystemPrompt,
} from '../mcp/tools';

// ── Chat History Types & Helpers ──────────────────────────────
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

const HISTORY_KEY = 'dashboard-hub-chat-history';
const ACTIVE_CONV_KEY = 'dashboard-hub-active-conv';

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(convs));
}

function newConversation(): Conversation {
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: 'New Chat',
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ── Component ──────────────────────────────────────────────────

interface Props {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  setDashboards: (d: Dashboard[]) => void;
  setActiveDashboardId: (id: string) => void;
  toolCallLog: ToolCall[];
  selectedChartId: string | null;
}

const ChatPanel: React.FC<Props> = ({
  dashboards,
  activeDashboardId,
  setDashboards,
  setActiveDashboardId,
  toolCallLog,
  selectedChartId,
}) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('claude-api-key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [conversations, setConversationsRaw] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string>(
    () => localStorage.getItem(ACTIVE_CONV_KEY) || ''
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure there's always an active conversation
  useEffect(() => {
    if (conversations.length === 0) {
      const c = newConversation();
      setConversationsRaw([c]);
      saveConversations([c]);
      setActiveConvId(c.id);
      localStorage.setItem(ACTIVE_CONV_KEY, c.id);
    } else if (!activeConvId || !conversations.find((c) => c.id === activeConvId)) {
      setActiveConvId(conversations[0].id);
      localStorage.setItem(ACTIVE_CONV_KEY, conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  const setConversations = useCallback((convs: Conversation[]) => {
    setConversationsRaw(convs);
    saveConversations(convs);
  }, []);

  const updateActiveMessages = useCallback((msgs: ChatMessage[]) => {
    setConversationsRaw((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== activeConvId) return c;
        const title = c.messages.length === 0 && msgs.length > 0
          ? msgs[0].content.slice(0, 40) + (msgs[0].content.length > 40 ? '...' : '')
          : c.title;
        return { ...c, messages: msgs, title, updated_at: new Date().toISOString() };
      });
      saveConversations(updated);
      return updated;
    });
  }, [activeConvId]);

  const handleNewConversation = () => {
    const c = newConversation();
    const updated = [c, ...conversations];
    setConversations(updated);
    setActiveConvId(c.id);
    localStorage.setItem(ACTIVE_CONV_KEY, c.id);
    setShowHistory(false);
  };

  const handleDeleteConversation = (convId: string) => {
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);
    if (convId === activeConvId) {
      if (updated.length > 0) {
        setActiveConvId(updated[0].id);
        localStorage.setItem(ACTIVE_CONV_KEY, updated[0].id);
      }
    }
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    localStorage.setItem(ACTIVE_CONV_KEY, convId);
    setShowHistory(false);
  };

  // Mutable refs so sequential tool calls within one Claude response
  // always see the latest state (fixes the stale-closure bug).
  const dashboardsRef = useRef(dashboards);
  const activeIdRef = useRef(activeDashboardId);
  useEffect(() => { dashboardsRef.current = dashboards; }, [dashboards]);
  useEffect(() => { activeIdRef.current = activeDashboardId; }, [activeDashboardId]);

  // Wrapper that updates both the React state AND the mutable ref synchronously
  const setDashboardsSync = useCallback((d: Dashboard[]) => {
    dashboardsRef.current = d;
    setDashboards(d);
  }, [setDashboards]);

  const setActiveIdSync = useCallback((id: string) => {
    activeIdRef.current = id;
    setActiveDashboardId(id);
  }, [setActiveDashboardId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, toolCallLog]);

  const saveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('claude-api-key', key);
    setShowKeyInput(false);
  };

  // Execute an MCP tool call locally — reads from mutable refs
  // so sequential calls within one Claude response see each other's results.
  const executeTool = useCallback(
    (name: string, input: Record<string, unknown>): unknown => {
      const db = dashboardsRef.current;
      const aid = activeIdRef.current;
      switch (name) {
        case 'list_metrics':
          return list_metrics();
        case 'list_templates':
          return list_templates();
        case 'validate_chart_config':
          return validate_chart_config(input as any);
        case 'create_chart': {
          const result = create_chart(input as any, db, aid, setDashboardsSync);
          return result;
        }
        case 'create_combo_chart': {
          const result = create_combo_chart(input as any, db, aid, setDashboardsSync);
          return result;
        }
        case 'update_chart': {
          const { chart_id, ...patch } = input as any;
          return update_chart(chart_id, patch, db, setDashboardsSync);
        }
        case 'add_metric_to_chart': {
          const { chart_id: amid, ...metric } = input as any;
          return add_metric_to_chart(amid, metric, db, setDashboardsSync);
        }
        case 'delete_chart':
          return delete_chart(input.chart_id as string, db, setDashboardsSync);
        case 'create_dashboard': {
          const result = create_dashboard(input as any, db, setDashboardsSync);
          setActiveIdSync(result.dashboard_id);
          return result;
        }
        case 'share_dashboard':
          return share_dashboard(
            aid || '',
            (input.mode as 'viewer' | 'editor') || 'viewer',
            db,
            setDashboardsSync
          );
        default:
          return { error: `Unknown tool: ${name}` };
      }
    },
    [setDashboardsSync, setActiveIdSync]
  );

  // Build system prompt with optional selected chart context
  const buildSystemPrompt = useCallback(() => {
    const activeDash = dashboardsRef.current.find((d) => d.id === activeIdRef.current) || null;
    let prompt = getSystemPrompt(activeDash);
    if (selectedChartId && activeDash) {
      const chart = activeDash.charts.find((c) => c.id === selectedChartId);
      if (chart) {
        const metricsDesc = chart.metrics && chart.metrics.length > 0
          ? chart.metrics.map((s) => `${s.metric_id} (${s.chart_type})`).join(', ')
          : `${chart.metric_id} (${chart.chart_type})`;
        prompt += `\n\nSELECTED CHART (user is focused on this chart — ALWAYS modify it, never create a new chart unless explicitly asked):\n- chart_id: "${chart.id}"\n- title: "${chart.title}"\n- metrics: ${metricsDesc}\n- type: ${chart.chart_type}\nACTION PRIORITY when a chart is selected:\n1. To ADD a metric → use add_metric_to_chart with chart_id "${chart.id}"\n2. To CHANGE style/color/type → use update_chart with chart_id "${chart.id}"\n3. To DELETE → use delete_chart with chart_id "${chart.id}"\n4. ONLY create a new chart if the user explicitly says "new chart" or "another chart"`;
      }
    }
    return prompt;
  }, [selectedChartId]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };
    const newMessages = [...messages, userMsg];
    updateActiveMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Build Claude API messages
      const apiMessages = newMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let finalText = '';
      let allToolCalls: ToolCall[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentMessages: any[] = apiMessages;

      // Loop for tool use (Claude may call tools multiple times)
      for (let attempt = 0; attempt < 5; attempt++) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: buildSystemPrompt(),
            tools: CLAUDE_TOOLS,
            messages: currentMessages,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`API error ${response.status}: ${err}`);
        }

        const data = await response.json();

        // Check if there are tool_use blocks
        const toolUseBlocks = data.content.filter((b: any) => b.type === 'tool_use');
        const textBlocks = data.content.filter((b: any) => b.type === 'text');

        if (textBlocks.length > 0) {
          finalText += textBlocks.map((b: any) => b.text).join('\n');
        }

        if (toolUseBlocks.length === 0 || data.stop_reason !== 'tool_use') {
          break; // No more tool calls
        }

        // Execute each tool call
        const toolResults: any[] = [];
        for (const block of toolUseBlocks) {
          const result = executeTool(block.name, block.input);
          allToolCalls.push({
            id: block.id,
            tool: block.name,
            params: block.input,
            result,
            timestamp: new Date().toISOString(),
            valid: !(result as any)?.error,
            errors: (result as any)?.error ? [(result as any).error] : undefined,
          });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }

        // Add assistant response + tool results to conversation
        currentMessages = [
          ...currentMessages,
          { role: 'assistant' as const, content: data.content },
          { role: 'user' as const, content: toolResults },
        ];
      }

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: finalText || 'Done! I executed the requested actions.',
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
      };
      updateActiveMessages([...newMessages, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `Error: ${err.message}. Please check your API key and try again.`,
      };
      updateActiveMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedCalls((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="w-[380px] bg-bg2 border-l border-border flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-accent" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-md text-muted hover:text-text hover:bg-bg3 transition-colors"
            title="New conversation"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-md transition-colors ${showHistory ? 'text-accent bg-bg3' : 'text-muted hover:text-text hover:bg-bg3'}`}
            title="Chat history"
          >
            <MessageSquare size={13} />
          </button>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`p-1.5 rounded-md transition-colors ${
              apiKey ? 'text-green-400 hover:bg-bg3' : 'text-yellow-400 hover:bg-bg3'
            }`}
            title={apiKey ? 'API key set' : 'Set API key'}
          >
            <Key size={14} />
          </button>
        </div>
      </div>

      {/* Selected chart indicator */}
      {selectedChartId && (
        <div className="px-4 py-2 border-b border-border bg-accent/5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] text-accent">Selected: <span className="font-mono">{selectedChartId}</span></span>
        </div>
      )}

      {/* API Key input */}
      {showKeyInput && (
        <div className="px-4 py-3 border-b border-border bg-bg3/50">
          <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">
            Claude API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
            />
            <button
              onClick={() => saveKey(apiKey)}
              className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent/80"
            >
              Save
            </button>
          </div>
          <p className="text-[10px] text-muted mt-1">Stored locally only. Never sent to any server except Anthropic.</p>
        </div>
      )}

      {/* Chat History Panel */}
      {showHistory && (
        <div className="border-b border-border max-h-[300px] overflow-y-auto">
          <div className="px-4 py-2 text-[10px] text-muted uppercase tracking-wider font-semibold bg-bg3/30">
            Conversations ({conversations.length})
          </div>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${
                conv.id === activeConvId ? 'bg-accent/10 text-accent' : 'hover:bg-bg3/50 text-text'
              }`}
              onClick={() => handleSelectConversation(conv.id)}
            >
              <MessageSquare size={12} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{conv.title}</p>
                <p className="text-[9px] text-muted">{conv.messages.length} msgs · {new Date(conv.updated_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                className="shrink-0 p-1 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={32} className="mx-auto text-border mb-3" />
            <p className="text-xs text-muted mb-3">Try these prompts:</p>
            <div className="space-y-1.5">
              {[
                "Create dashboard called 'PTG Overview'",
                'Add a combo chart with NPU as line and Revenue as bar',
                'Change the chart color to orange',
                'Add a DAU chart with date filter',
                'Show me a DAU pie chart',
                'Add retention D7 trend with comparison to previous month',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="block w-full text-left text-[11px] text-accent/80 hover:text-accent bg-bg3/50 hover:bg-bg3 rounded-lg px-3 py-2 transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <Bot size={16} className="text-accent shrink-0 mt-1" />
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-bg3 text-text'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
                  {msg.toolCalls.map((tc) => (
                    <div key={tc.id} className="text-[10px]">
                      <div
                        className="flex items-center gap-1 cursor-pointer hover:text-accent"
                        onClick={() => toggleExpanded(tc.id)}
                      >
                        {expandedCalls.has(tc.id) ? (
                          <ChevronDown size={10} />
                        ) : (
                          <ChevronRight size={10} />
                        )}
                        {tc.valid ? (
                          <CheckCircle size={10} className="text-green-400" />
                        ) : (
                          <AlertTriangle size={10} className="text-red-400" />
                        )}
                        <span className="font-mono">{tc.tool}()</span>
                      </div>
                      {expandedCalls.has(tc.id) && (
                        <pre className="mt-1 p-2 bg-bg rounded text-[9px] overflow-x-auto text-muted">
                          {JSON.stringify({ params: tc.params, result: tc.result }, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <User size={16} className="text-muted shrink-0 mt-1" />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <Bot size={16} className="text-accent shrink-0 mt-1" />
            <div className="bg-bg3 rounded-xl px-3 py-2 text-xs text-muted">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Tool Call Log toggle */}
      {toolCallLog.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowLog(!showLog)}
            className="w-full flex items-center justify-between px-4 py-2 text-[10px] text-muted hover:text-text transition-colors"
          >
            <span className="font-semibold uppercase tracking-wider">
              Tool Call Log ({toolCallLog.length})
            </span>
            {showLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showLog && (
            <div className="max-h-[200px] overflow-y-auto px-4 pb-2 space-y-1">
              {[...toolCallLog].reverse().map((tc) => (
                <div
                  key={tc.id}
                  className={`text-[10px] p-2 rounded-lg ${
                    tc.valid ? 'bg-green-400/5 border border-green-400/10' : 'bg-red-400/5 border border-red-400/10'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {tc.valid ? (
                      <CheckCircle size={10} className="text-green-400" />
                    ) : (
                      <AlertTriangle size={10} className="text-red-400" />
                    )}
                    <span className="font-mono font-semibold">{tc.tool}</span>
                    <span className="text-muted ml-auto">
                      {new Date(tc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {tc.errors && (
                    <p className="text-red-400 text-[9px]">{tc.errors.join('; ')}</p>
                  )}
                  {tc.suggestions && tc.suggestions.length > 0 && (
                    <p className="text-yellow-400 text-[9px]">{tc.suggestions.join('; ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={apiKey ? 'Ask about dashboards, charts, metrics...' : 'Set API key first...'}
            disabled={loading}
            className="flex-1 bg-bg3 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
