# Dashboard Hub — Analytics 2.0 Prototype

> **Governed Metrics + AI Chatbot + Chart Builder MCP**
> Proves that an LLM can act as an intent-to-structured-config translator,
> with chart creation/editing handled via MCP tool calls against a governed metrics registry.

## Quick Start

```bash
cd prototypes/dashboard-hub
npm install
npm run dev        # → http://localhost:5173
```

Build for deployment:
```bash
npm run build      # → dist/
npx serve dist     # static preview
```

## Architecture

```
┌──────────────┐  ┌─────────────────────────┐  ┌──────────────────┐
│  Dashboard   │  │    Dashboard Canvas      │  │   AI Chatbot     │
│  Navigator   │  │                          │  │                  │
│              │  │  ┌──────┐ ┌──────┐      │  │  Claude API      │
│  • CRUD      │  │  │Chart │ │Chart │      │  │  ↕ tool_use      │
│  • Select    │  │  │Card  │ │Card  │      │  │  ↕ tool_result   │
│              │  │  └──────┘ └──────┘      │  │                  │
│  ──────────  │  │  ┌──────┐ ┌──────┐      │  │  Tool Call Log   │
│  Metric      │  │  │Chart │ │Chart │      │  │  (expandable)    │
│  Explorer    │  │  │Card  │ │Card  │      │  │                  │
│  Template    │  │  └──────┘ └──────┘      │  │  API Key Input   │
│  Library     │  │                          │  │                  │
└──────────────┘  └─────────────────────────┘  └──────────────────┘
       240px              flex-1                      380px
```

## Key Features

### 1. Governed Metrics Layer (`metric_registry.ts`)
- 14 metrics defined with constraints: allowed chart types, aggregation, units, comparison availability
- Guardrails block invalid chart configs with explanations + suggestions
- Visible in **Metric Explorer** panel

### 2. Reusable Chart Templates (`chart_templates.ts`)
- 7 certified chart configurations with pre-set metrics, styles, and comparison modes
- One-click add to active dashboard via **Template Library** panel

### 3. MCP Tool Layer (`mcp/tools.ts`)
- `list_metrics` / `list_templates` — discovery
- `validate_chart_config` — guardrail enforcement
- `create_chart` / `update_chart` / `delete_chart` — chart lifecycle
- `create_dashboard` / `share_dashboard` — dashboard lifecycle
- All calls logged to **Tool Call Log** with timestamps, params, results

### 4. AI Chatbot (Claude API)
- Enter your Anthropic API key (stored in localStorage only)
- System prompt includes full metric registry + active dashboard state
- Claude uses `tool_use` to call MCP tools
- Multi-turn tool execution loop (up to 5 rounds)
- Tool call transcript visible inline + in dedicated log panel

### 5. Persistence
- All dashboards + charts saved to `localStorage`
- Survives page refreshes

## Data Scope

Strictly uses data from `prototypes/ptg-report-2026-01/data.js`:
- **Play Together (PTG)** — Jan 2026 vs Dec 2025
- Daily users: DAU, NRU, NPU, Retention D1/D7/D14/D21/D30
- Daily revenue: Rev, Rev NPU, RPI D1/D7/D14/D30
- Monthly summary: MAU, MPU
- Platform breakdown: Android / iOS

## Demo Script

> **Tip:** Use the ↻ button in the AI Assistant header to clear chat between scenarios.
> Click suggested prompts in the empty chat to auto-fill them.

### Scenario 1: Create Dashboard + Add Multiple Charts
1. Type: `Create dashboard called "PTG Overview"`
2. Type: `Add DAU trend and Revenue trend charts with comparison`
3. **Observe:** Dashboard created → two `create_chart` tool calls → both DAU and Revenue charts appear with Jan vs Dec overlay
4. **Demonstrates:** Multi-tool-call execution in a single LLM response, automatic metric resolution

### Scenario 2: Add from Template Library (No AI Needed)
1. Click **Template Library** in left panel
2. Click **Add** on "Retention D7 Trend"
3. **Observe:** Chart appears on canvas, tool call logged
4. **Demonstrates:** Certified chart configs bypass the LLM — governance layer enforced at template level

### Scenario 3: Style Change via Natural Language
1. Type: `Change the DAU chart to area with dashed lines`
2. **Observe:** Chart updates in-place, tool call log shows `update_chart` with style patch
3. **Demonstrates:** LLM translates vague style intent ("dashed lines") into structured `ChartStyle` config

### Scenario 4: Guardrail — Unsupported Chart Type
1. Type: `Show me a DAU pie chart`
2. **Observe:** AI explains DAU only supports line/area, suggests alternatives. No chart created.
3. **Demonstrates:** The metric registry **blocks** invalid chart types with a clear explanation, not just an error

### Scenario 5: Guardrail — Missing Comparison Data
1. Type: `Add retention D14 chart with comparison to previous month`
2. **Observe:** AI explains D14 has no previous period data, suggests D1 or D7 which do
3. **Demonstrates:** Guardrail checks data availability, not just metric existence

### Scenario 6: Guardrail — Cross-Unit Stacking
1. Type: `Create a chart that stacks Revenue and DAU together`
2. **Observe:** AI explains you can't combine USD and user-count metrics in one chart, creates them separately
3. **Demonstrates:** Semantic guardrail — the registry enforces unit coherence

### Scenario 7: Metric Discovery via LLM
1. Type: `What metrics are available?`
2. **Observe:** AI calls `list_metrics` tool, returns structured list with constraints
3. **Demonstrates:** LLM uses MCP discovery tools to answer questions about the data layer

### Scenario 8: Template Discovery
1. Type: `What chart templates do you have?`
2. **Observe:** AI calls `list_templates` tool, shows available pre-built configs
3. **Demonstrates:** LLM-mediated discovery of certified configurations

### Scenario 9: Clarifying Questions
1. Type: `Add a retention chart`
2. **Observe:** AI asks which retention window (D1, D7, D14, D21, D30) and whether to include comparison
3. **Demonstrates:** LLM asks clarifying questions instead of guessing when the request is ambiguous

### Scenario 10: Delete Chart
1. Type: `Delete the revenue chart`
2. **Observe:** AI identifies the chart by metric type, calls `delete_chart`, chart removed from canvas
3. **Demonstrates:** LLM resolves natural language references to chart IDs

### Scenario 11: Share Dashboard
1. Type: `Share this dashboard as viewer`
2. **Observe:** Share URL generated, displayed on canvas header
3. **Demonstrates:** Dashboard lifecycle management via MCP tools

### Scenario 12: Metric Explorer (UI-only)
1. Click **Metric Explorer** in left panel
2. Browse all 14 metrics with their constraints, sources, allowed chart types, and comparison availability
3. **Demonstrates:** The governance layer is **visible and inspectable** — not hidden inside the LLM

### Scenario 13: Full Dashboard Build (End-to-End)
1. Type: `Create a dashboard called "PTG Monthly Review" with: DAU line chart last 30 days with comparison, Revenue area chart, NRU bar chart, and Retention D7 trend with comparison`
2. **Observe:** Dashboard created → 4 charts added sequentially → all rendered correctly
3. **Demonstrates:** Complex multi-step intent translated into multiple validated MCP tool calls

## Deployment

### Netlify (recommended)

**Option A — CLI deploy:**
```bash
cd prototypes/dashboard-hub
./deploy.sh          # preview deploy
./deploy.sh --prod   # production deploy
```

**Option B — Git-connected:**
1. Push the repo to GitHub
2. Connect to Netlify → set build settings:
   - **Base directory:** `prototypes/dashboard-hub`
   - **Build command:** `npm run build`
   - **Publish directory:** `prototypes/dashboard-hub/dist`
3. Deploy

**Option C — Manual drag-and-drop:**
```bash
cd prototypes/dashboard-hub
npm run build
# Drag the dist/ folder into Netlify's deploy page
```

The `netlify.toml` file is pre-configured with SPA redirects.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | TailwindCSS 3 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Icons | Lucide React |
| AI | Claude API (direct browser access) |
| Persistence | localStorage |

## File Structure

```
src/
├── App.tsx                    # Main app, state management, CRUD handlers
├── main.tsx                   # Entry point
├── index.css                  # Tailwind imports + global styles
├── types.ts                   # Shared TypeScript types
├── data/
│   ├── game-data.ts           # PTG data (copied from data.js)
│   ├── metric-registry.ts     # Governance layer (14 metrics)
│   └── chart-templates.ts     # Certified configs (7 templates)
├── mcp/
│   └── tools.ts               # MCP tool implementations + Claude tool defs
└── components/
    ├── DashboardNav.tsx        # Left panel: dashboard list + nav
    ├── DashboardCanvas.tsx     # Center panel: chart grid + header
    ├── ChartCard.tsx           # Individual chart with Chart.js
    ├── ChatPanel.tsx           # Right panel: chatbot + tool log
    ├── MetricExplorer.tsx      # Metric registry browser
    └── TemplateLibrary.tsx     # Chart template browser
```

## Notes

- **No backend required** — all MCP tools are mocked locally
- **Claude API key** is required for chatbot functionality; stored in `localStorage` only
- The `anthropic-dangerous-direct-browser-access` header enables direct browser→API calls
- Chart templates and metric registry are the governance layer; the LLM cannot bypass them
