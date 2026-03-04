#!/usr/bin/env node
/**
 * Generate 6 months of realistic daily game data for Play Together (PTG)
 * Period: Aug 1, 2025 – Jan 31, 2026
 * 
 * Based on real Jan 2026 data patterns from ptg-report-2026-01/data.js.
 * Generates consistent daily user + revenue data with:
 * - Realistic weekday/weekend patterns
 * - Monthly growth trend (game growing ~5% MoM)
 * - Event spikes (holidays, game updates)
 * - Correlated metrics (NRU drives NPU, NPU drives revenue)
 * - Retention windows (D1 > D7 > D14 > D21 > D30)
 * 
 * Usage: node scripts/generate-data.js > src/data/generated-data.ts
 */

// ── Seed RNG for reproducibility ──────────────────────────────
let seed = 42;
function rng() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}
function randBetween(lo, hi) { return lo + rng() * (hi - lo); }
function randInt(lo, hi) { return Math.floor(randBetween(lo, hi + 1)); }
function jitter(base, pct) { return base * (1 + (rng() - 0.5) * 2 * pct); }

// ── Date helpers ──────────────────────────────────────────────
function dateStr(d) { return d.toISOString().slice(0, 10); }
function dayOfWeek(d) { return d.getDay(); } // 0=Sun, 6=Sat
function daysInRange(start, end) {
  const result = [];
  const cur = new Date(start);
  while (cur <= end) {
    result.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// ── Config: baseline values derived from Jan 2026 actuals ─────
// Jan 2026 averages (from real data):
//   DAU ~1.31M, NRU ~37.7K, NPU ~2.04K
//   Rev ~$83.6K/day, Rev_NPU ~$4.16K, RPI_D1 ~$400
const BASE = {
  dau:      1_310_000,
  nru:      37_700,
  npu:      2_040,
  rev:      83_600,
  rev_npu:  4_160,
};

// Monthly growth factors (game was growing into Jan 2026)
// Aug=0.78, Sep=0.82, Oct=0.86, Nov=0.90, Dec=0.95, Jan=1.00
const MONTHLY_GROWTH = {
  '2025-08': 0.78,
  '2025-09': 0.82,
  '2025-10': 0.86,
  '2025-11': 0.90,
  '2025-12': 0.95,
  '2026-01': 1.00,
};

// Weekend dip factors (games tend to spike on weekends for DAU but dip in revenue)
function weekendFactor(dow, metric) {
  const isWeekend = dow === 0 || dow === 6;
  const isFriday = dow === 5;
  if (metric === 'dau') return isWeekend ? 0.88 : isFriday ? 1.05 : 1.0;
  if (metric === 'nru') return isWeekend ? 0.72 : isFriday ? 1.10 : 1.0;
  if (metric === 'npu') return isWeekend ? 0.85 : 1.0;
  if (metric === 'rev') return isWeekend ? 0.80 : isFriday ? 1.05 : 1.0;
  return 1.0;
}

// Special event days (higher activity)
const EVENT_DAYS = new Set([
  '2025-08-15', '2025-08-16', '2025-08-17',  // Summer event
  '2025-09-20', '2025-09-21',                  // Mid-autumn festival
  '2025-10-31',                                  // Halloween
  '2025-11-11', '2025-11-12',                  // 11.11 sale
  '2025-11-28', '2025-11-29', '2025-11-30',   // Black Friday / Thanksgiving
  '2025-12-13', '2025-12-14',                  // Game update spike (matches real data)
  '2025-12-20', '2025-12-21',                  // Holiday event start
  '2025-12-25', '2025-12-26',                  // Christmas
  '2025-12-31',                                  // New Year's Eve
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', // New Year event
  '2026-01-10', '2026-01-11',                  // Lunar New Year pre-event
  '2026-01-16', '2026-01-17', '2026-01-18',   // Lunar New Year main event
]);

function eventMultiplier(dateString) {
  return EVENT_DAYS.has(dateString) ? randBetween(1.15, 1.35) : 1.0;
}

// ── Generate daily users ──────────────────────────────────────
function generateDailyUsers(startDate, endDate) {
  const days = daysInRange(startDate, endDate);
  return days.map(d => {
    const ds = dateStr(d);
    const ym = ds.slice(0, 7);
    const dow = dayOfWeek(d);
    const growth = MONTHLY_GROWTH[ym] || 0.80;
    const event = eventMultiplier(ds);

    const dau = Math.round(jitter(BASE.dau * growth * weekendFactor(dow, 'dau') * event, 0.06));
    const nru = Math.round(jitter(BASE.nru * growth * weekendFactor(dow, 'nru') * event, 0.12));
    const npu = Math.round(jitter(BASE.npu * growth * weekendFactor(dow, 'npu') * event, 0.10));
    
    // Retention: D1 ≈ 25-35% of NRU, D7 ≈ 12-18% of NRU, D14 ≈ 7-12%, D21 ≈ 4-8%, D30 ≈ 2-5%
    const ruser01 = Math.round(nru * randBetween(0.25, 0.35));
    const ruser07 = Math.round(nru * randBetween(0.12, 0.18));
    const ruser14 = Math.round(nru * randBetween(0.07, 0.12));
    const ruser21 = Math.round(nru * randBetween(0.04, 0.08));
    
    // D30 retention: 0 for last 30 days of the dataset (not enough time to measure)
    const daysFromEnd = Math.floor((endDate - d) / (1000 * 60 * 60 * 24));
    const ruser30 = daysFromEnd >= 30 ? Math.round(nru * randBetween(0.02, 0.05)) : 0;

    return { date: ds, dau, nru, npu, ruser01, ruser07, ruser14, ruser21, ruser30 };
  });
}

// ── Generate daily revenue ────────────────────────────────────
function generateDailyRevenue(startDate, endDate) {
  const days = daysInRange(startDate, endDate);
  return days.map(d => {
    const ds = dateStr(d);
    const ym = ds.slice(0, 7);
    const dow = dayOfWeek(d);
    const growth = MONTHLY_GROWTH[ym] || 0.80;
    const event = eventMultiplier(ds);

    const rev = +(jitter(BASE.rev * growth * weekendFactor(dow, 'rev') * event, 0.15)).toFixed(2);
    const rev_npu = +(jitter(BASE.rev_npu * growth * event, 0.10)).toFixed(2);
    
    // RPI metrics: correlated with revenue but with own noise
    const rev_rpi01 = +(jitter(400 * growth * event, 0.20)).toFixed(2);
    const rev_rpi07 = +(jitter(1100 * growth * event, 0.15)).toFixed(2);
    const rev_rpi14 = +(jitter(1800 * growth * event, 0.12)).toFixed(2);
    const rev_rpi30 = +(jitter(3200 * growth * event, 0.10)).toFixed(2);

    return { date: ds, rev, rev_npu, rev_rpi01, rev_rpi07, rev_rpi14, rev_rpi30 };
  });
}

// ── Generate the output ───────────────────────────────────────
const START = new Date('2025-08-01');
const END = new Date('2026-01-31');

const dailyUsers = generateDailyUsers(START, END);
const dailyRevenue = generateDailyRevenue(START, END);

// Monthly summaries: aggregate from daily data
function monthlyAgg(data, yearMonth) {
  const filtered = data.filter(r => r.date.startsWith(yearMonth));
  if (filtered.length === 0) return null;
  
  // For users: unique users ≈ DAU * 3.5 (typical ratio for mobile games)
  const avgDau = filtered.reduce((s, r) => s + r.dau, 0) / filtered.length;
  const totalNru = filtered.reduce((s, r) => s + r.nru, 0);
  const totalNpu = filtered.reduce((s, r) => s + (r.npu || 0), 0);
  const mau = Math.round(avgDau * 3.5);
  
  return { year_month: yearMonth.replace('-', ''), mau, mpu: totalNpu, nru: totalNru };
}

const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'];
const monthlySummaries = months.map(ym => monthlyAgg(dailyUsers, ym)).filter(Boolean);

// ── Format as TypeScript ──────────────────────────────────────
function fmtUserRow(r) {
  return `  { date:"${r.date}",dau:${r.dau},nru:${r.nru},npu:${r.npu},ruser01:${r.ruser01},ruser07:${r.ruser07},ruser14:${r.ruser14},ruser21:${r.ruser21},ruser30:${r.ruser30} },`;
}

function fmtRevRow(r) {
  return `  { date:"${r.date}",rev:${r.rev},rev_npu:${r.rev_npu},rev_rpi01:${r.rev_rpi01},rev_rpi07:${r.rev_rpi07},rev_rpi14:${r.rev_rpi14},rev_rpi30:${r.rev_rpi30} },`;
}

const output = `/**
 * Generated game data for Play Together (PTG / 661)
 * Period: Aug 2025 – Jan 2026 (6 months, 184 days)
 * Generated by: scripts/generate-data.js
 * 
 * Data is realistic simulation based on actual Jan 2026 patterns.
 * Monthly growth: Aug(0.78) → Sep(0.82) → Oct(0.86) → Nov(0.90) → Dec(0.95) → Jan(1.00)
 * Includes: weekday/weekend patterns, holiday event spikes, correlated metrics.
 */

export const DATA_RANGE = {
  start: '2025-08-01',
  end: '2026-01-31',
  months: ${JSON.stringify(months)},
  totalDays: ${dailyUsers.length},
};

export interface DailyUserRecord {
  date: string;
  dau: number;
  nru: number;
  npu: number;
  ruser01: number;
  ruser07: number;
  ruser14: number;
  ruser21: number;
  ruser30: number;
}

export interface DailyRevenueRecord {
  date: string;
  rev: number;
  rev_npu: number;
  rev_rpi01: number;
  rev_rpi07: number;
  rev_rpi14: number;
  rev_rpi30: number;
}

export interface MonthlySummary {
  year_month: string;
  mau: number;
  mpu: number;
  nru: number;
}

export const DAILY_USERS: DailyUserRecord[] = [
${dailyUsers.map(fmtUserRow).join('\n')}
];

export const DAILY_REVENUE: DailyRevenueRecord[] = [
${dailyRevenue.map(fmtRevRow).join('\n')}
];

export const MONTHLY_SUMMARIES: MonthlySummary[] = ${JSON.stringify(monthlySummaries, null, 2)};
`;

process.stdout.write(output);
