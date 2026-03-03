/**
 * Game data copied from prototypes/ptg-report-2026-01/data.js
 * Game: Play Together (PTG / 661) | Period: Jan 2026 vs Dec 2025
 * This is the app's own data copy — the original is untouched.
 */

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

export interface DailyUserPrevRecord {
  date: string;
  dau: number;
  nru: number;
  npu: number;
  ruser01: number;
  ruser07: number;
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

export interface DailyRevenuePrevRecord {
  date: string;
  rev: number;
  rev_npu: number;
}

export const DAILY_USERS_CURRENT: DailyUserRecord[] = [
  { date:"2026-01-01",dau:1390699,nru:56130,npu:2391,ruser01:20079,ruser07:5210,ruser14:7387,ruser21:3713,ruser30:3875 },
  { date:"2026-01-02",dau:1364414,nru:56033,npu:2119,ruser01:19128,ruser07:7658,ruser14:6764,ruser21:3799,ruser30:3438 },
  { date:"2026-01-03",dau:1359878,nru:49840,npu:2217,ruser01:17495,ruser07:6427,ruser14:6822,ruser21:4105,ruser30:2380 },
  { date:"2026-01-04",dau:1373286,nru:44106,npu:2058,ruser01:13542,ruser07:7411,ruser14:5086,ruser21:3758,ruser30:2200 },
  { date:"2026-01-05",dau:1202329,nru:28328,npu:2203,ruser01:9224,ruser07:5279,ruser14:2722,ruser21:1998,ruser30:1553 },
  { date:"2026-01-06",dau:1179819,nru:30438,npu:1890,ruser01:10233,ruser07:3951,ruser14:2476,ruser21:1795,ruser30:1284 },
  { date:"2026-01-07",dau:1192069,nru:35813,npu:1923,ruser01:7195,ruser07:5282,ruser14:3088,ruser21:2333,ruser30:1780 },
  { date:"2026-01-08",dau:1156058,nru:30560,npu:2390,ruser01:11560,ruser07:6324,ruser14:4028,ruser21:3734,ruser30:2979 },
  { date:"2026-01-09",dau:1418466,nru:30790,npu:3241,ruser01:12168,ruser07:7722,ruser14:3761,ruser21:3110,ruser30:2498 },
  { date:"2026-01-10",dau:1426522,nru:40175,npu:3056,ruser01:14869,ruser07:8721,ruser14:4641,ruser21:3758,ruser30:2450 },
  { date:"2026-01-11",dau:1482575,nru:53636,npu:2687,ruser01:13808,ruser07:8789,ruser14:5675,ruser21:4643,ruser30:3110 },
  { date:"2026-01-12",dau:1364962,nru:38527,npu:2686,ruser01:10333,ruser07:4338,ruser14:2923,ruser21:2644,ruser30:1899 },
  { date:"2026-01-13",dau:1417119,nru:44307,npu:2155,ruser01:10561,ruser07:4587,ruser14:2692,ruser21:2313,ruser30:1888 },
  { date:"2026-01-14",dau:1438362,nru:43485,npu:1778,ruser01:9781,ruser07:4127,ruser14:2609,ruser21:2132,ruser30:2080 },
  { date:"2026-01-15",dau:1408385,nru:40165,npu:2857,ruser01:11515,ruser07:4014,ruser14:3490,ruser21:1789,ruser30:2009 },
  { date:"2026-01-16",dau:1522462,nru:52351,npu:2644,ruser01:23520,ruser07:6399,ruser14:5633,ruser21:3040,ruser30:2587 },
  { date:"2026-01-17",dau:1622491,nru:60024,npu:2535,ruser01:19346,ruser07:8572,ruser14:5552,ruser21:4288,ruser30:3173 },
  { date:"2026-01-18",dau:1499225,nru:59364,npu:2360,ruser01:11928,ruser07:8021,ruser14:5298,ruser21:3934,ruser30:3056 },
  { date:"2026-01-19",dau:1203553,nru:31559,npu:2282,ruser01:8694,ruser07:3753,ruser14:3048,ruser21:1966,ruser30:1898 },
  { date:"2026-01-20",dau:1241225,nru:28377,npu:1708,ruser01:8380,ruser07:3400,ruser14:2625,ruser21:1928,ruser30:1551 },
  { date:"2026-01-21",dau:1270740,nru:22347,npu:1660,ruser01:8148,ruser07:3287,ruser14:2176,ruser21:1804,ruser30:1342 },
  { date:"2026-01-22",dau:1220803,nru:28440,npu:2287,ruser01:7802,ruser07:3178,ruser14:1563,ruser21:1722,ruser30:1282 },
  { date:"2026-01-23",dau:1320826,nru:34436,npu:1904,ruser01:9567,ruser07:4461,ruser14:2254,ruser21:2076,ruser30:1578 },
  { date:"2026-01-24",dau:1393792,nru:44287,npu:1705,ruser01:13913,ruser07:6090,ruser14:3680,ruser21:3067,ruser30:1598 },
  { date:"2026-01-25",dau:1370701,nru:35209,npu:1500,ruser01:10487,ruser07:6060,ruser14:3822,ruser21:3204,ruser30:1613 },
  { date:"2026-01-26",dau:1190441,nru:24665,npu:1637,ruser01:6726,ruser07:4240,ruser14:1855,ruser21:1456,ruser30:872 },
  { date:"2026-01-27",dau:1159887,nru:24795,npu:2234,ruser01:6574,ruser07:2438,ruser14:1646,ruser21:1339,ruser30:0 },
  { date:"2026-01-28",dau:1114954,nru:30847,npu:1354,ruser01:8061,ruser07:2607,ruser14:1950,ruser21:1499,ruser30:0 },
  { date:"2026-01-29",dau:1274206,nru:35638,npu:1539,ruser01:15684,ruser07:2649,ruser14:2223,ruser21:1604,ruser30:0 },
  { date:"2026-01-30",dau:1271043,nru:23691,npu:1458,ruser01:9233,ruser07:2812,ruser14:2338,ruser21:1607,ruser30:0 },
  { date:"2026-01-31",dau:1322356,nru:35749,npu:1581,ruser01:13692,ruser07:5277,ruser14:3669,ruser21:2449,ruser30:0 },
];

export const DAILY_REVENUE_CURRENT: DailyRevenueRecord[] = [
  { date:"2026-01-01",rev:97993.05,rev_npu:5270.83,rev_rpi01:714.45,rev_rpi07:1395.57,rev_rpi14:2195.53,rev_rpi30:4099.07 },
  { date:"2026-01-02",rev:70333.63,rev_npu:4643.92,rev_rpi01:804.08,rev_rpi07:1437.71,rev_rpi14:2025.28,rev_rpi30:3366.29 },
  { date:"2026-01-03",rev:131088.89,rev_npu:5141.90,rev_rpi01:569.13,rev_rpi07:1344.82,rev_rpi14:2091.88,rev_rpi30:3538.60 },
  { date:"2026-01-04",rev:83184.78,rev_npu:4449.13,rev_rpi01:497.59,rev_rpi07:1268.89,rev_rpi14:2310.06,rev_rpi30:3840.62 },
  { date:"2026-01-05",rev:84717.51,rev_npu:4068.78,rev_rpi01:417.36,rev_rpi07:1084.85,rev_rpi14:1711.03,rev_rpi30:3032.82 },
  { date:"2026-01-06",rev:79663.50,rev_npu:3449.44,rev_rpi01:313.36,rev_rpi07:919.18,rev_rpi14:1350.45,rev_rpi30:2303.03 },
  { date:"2026-01-07",rev:77669.09,rev_npu:3612.23,rev_rpi01:292.16,rev_rpi07:1031.38,rev_rpi14:1518.80,rev_rpi30:2851.77 },
  { date:"2026-01-08",rev:136774.72,rev_npu:4320.50,rev_rpi01:540.78,rev_rpi07:1509.44,rev_rpi14:2451.03,rev_rpi30:4196.23 },
  { date:"2026-01-09",rev:140832.23,rev_npu:5328.70,rev_rpi01:331.15,rev_rpi07:1168.89,rev_rpi14:1940.43,rev_rpi30:3376.50 },
  { date:"2026-01-10",rev:98346.25,rev_npu:5208.85,rev_rpi01:569.86,rev_rpi07:1234.25,rev_rpi14:2043.03,rev_rpi30:3441.44 },
  { date:"2026-01-11",rev:116613.86,rev_npu:5111.81,rev_rpi01:334.76,rev_rpi07:1121.51,rev_rpi14:1844.82,rev_rpi30:4773.90 },
  { date:"2026-01-12",rev:84507.69,rev_npu:4619.38,rev_rpi01:378.83,rev_rpi07:1335.26,rev_rpi14:2084.08,rev_rpi30:3486.10 },
  { date:"2026-01-13",rev:67637.17,rev_npu:4220.08,rev_rpi01:294.45,rev_rpi07:1316.70,rev_rpi14:2182.91,rev_rpi30:3688.54 },
  { date:"2026-01-14",rev:79947.50,rev_npu:3423.46,rev_rpi01:255.03,rev_rpi07:832.66,rev_rpi14:1362.14,rev_rpi30:2608.89 },
  { date:"2026-01-15",rev:112059.50,rev_npu:4977.90,rev_rpi01:418.06,rev_rpi07:1243.30,rev_rpi14:2031.69,rev_rpi30:3753.71 },
  { date:"2026-01-16",rev:75665.79,rev_npu:4712.89,rev_rpi01:633.79,rev_rpi07:1311.26,rev_rpi14:1814.87,rev_rpi30:3299.03 },
  { date:"2026-01-17",rev:75488.62,rev_npu:4832.97,rev_rpi01:633.98,rev_rpi07:1436.00,rev_rpi14:2196.78,rev_rpi30:4765.24 },
  { date:"2026-01-18",rev:65687.07,rev_npu:4614.56,rev_rpi01:488.43,rev_rpi07:1088.50,rev_rpi14:1681.90,rev_rpi30:3234.80 },
  { date:"2026-01-19",rev:61267.92,rev_npu:4171.22,rev_rpi01:260.50,rev_rpi07:644.62,rev_rpi14:1070.10,rev_rpi30:2053.90 },
  { date:"2026-01-20",rev:76963.65,rev_npu:3400.74,rev_rpi01:247.11,rev_rpi07:527.92,rev_rpi14:958.10,rev_rpi30:2054.99 },
  { date:"2026-01-21",rev:78080.89,rev_npu:3426.64,rev_rpi01:406.10,rev_rpi07:942.52,rev_rpi14:1477.67,rev_rpi30:3155.61 },
  { date:"2026-01-22",rev:110930.76,rev_npu:3608.85,rev_rpi01:342.10,rev_rpi07:987.69,rev_rpi14:1560.82,rev_rpi30:3337.09 },
  { date:"2026-01-23",rev:62429.71,rev_npu:3411.96,rev_rpi01:296.62,rev_rpi07:772.54,rev_rpi14:1260.93,rev_rpi30:2756.43 },
  { date:"2026-01-24",rev:67617.83,rev_npu:3666.60,rev_rpi01:420.93,rev_rpi07:1002.25,rev_rpi14:1378.56,rev_rpi30:2791.57 },
  { date:"2026-01-25",rev:80566.72,rev_npu:4000.93,rev_rpi01:281.36,rev_rpi07:851.50,rev_rpi14:1407.11,rev_rpi30:3041.55 },
  { date:"2026-01-26",rev:59494.76,rev_npu:3364.54,rev_rpi01:273.01,rev_rpi07:703.50,rev_rpi14:1170.80,rev_rpi30:2018.76 },
  { date:"2026-01-27",rev:85019.42,rev_npu:4042.49,rev_rpi01:356.39,rev_rpi07:1050.45,rev_rpi14:1702.68,rev_rpi30:2662.17 },
  { date:"2026-01-28",rev:55540.43,rev_npu:3284.16,rev_rpi01:381.24,rev_rpi07:1073.63,rev_rpi14:1529.32,rev_rpi30:2499.69 },
  { date:"2026-01-29",rev:61700.78,rev_npu:3421.67,rev_rpi01:372.19,rev_rpi07:1538.64,rev_rpi14:2100.66,rev_rpi30:3358.56 },
  { date:"2026-01-30",rev:62081.05,rev_npu:3209.09,rev_rpi01:371.77,rev_rpi07:946.56,rev_rpi14:1602.83,rev_rpi30:3101.17 },
  { date:"2026-01-31",rev:74263.15,rev_npu:4105.86,rev_rpi01:426.52,rev_rpi07:873.63,rev_rpi14:1282.99,rev_rpi30:2155.22 },
];

export const DAILY_USERS_PREV: DailyUserPrevRecord[] = [
  { date:"2025-12-01",dau:1182425,nru:29239,npu:1909,ruser01:8270,ruser07:3286 },
  { date:"2025-12-02",dau:1192579,nru:27907,npu:1554,ruser01:8160,ruser07:3247 },
  { date:"2025-12-03",dau:1184142,nru:24936,npu:1473,ruser01:7726,ruser07:3144 },
  { date:"2025-12-04",dau:1193084,nru:36334,npu:1327,ruser01:12340,ruser07:2506 },
  { date:"2025-12-05",dau:1184361,nru:42077,npu:1361,ruser01:18816,ruser07:3865 },
  { date:"2025-12-06",dau:1269973,nru:46999,npu:1624,ruser01:16538,ruser07:5945 },
  { date:"2025-12-07",dau:1279962,nru:46674,npu:1772,ruser01:13141,ruser07:6162 },
  { date:"2025-12-08",dau:1083374,nru:23276,npu:1791,ruser01:7699,ruser07:2809 },
  { date:"2025-12-09",dau:1105002,nru:34490,npu:1396,ruser01:8526,ruser07:3092 },
  { date:"2025-12-10",dau:1124223,nru:33936,npu:1635,ruser01:9462,ruser07:2689 },
  { date:"2025-12-11",dau:873999,nru:27664,npu:2638,ruser01:10819,ruser07:4389 },
  { date:"2025-12-12",dau:917411,nru:36680,npu:2671,ruser01:13093,ruser07:5097 },
  { date:"2025-12-13",dau:1254764,nru:58347,npu:3949,ruser01:18391,ruser07:11232 },
  { date:"2025-12-14",dau:1266389,nru:55649,npu:3482,ruser01:13527,ruser07:13238 },
  { date:"2025-12-15",dau:1034371,nru:33512,npu:3206,ruser01:9058,ruser07:8293 },
  { date:"2025-12-16",dau:1144442,nru:32950,npu:3127,ruser01:8816,ruser07:6081 },
  { date:"2025-12-17",dau:1168378,nru:29488,npu:2060,ruser01:9589,ruser07:5938 },
  { date:"2025-12-18",dau:1182331,nru:31050,npu:1965,ruser01:10862,ruser07:5712 },
  { date:"2025-12-19",dau:1135843,nru:30640,npu:1725,ruser01:12106,ruser07:4398 },
  { date:"2025-12-20",dau:1318392,nru:49654,npu:1315,ruser01:20218,ruser07:8941 },
  { date:"2025-12-21",dau:1416130,nru:54448,npu:1115,ruser01:15554,ruser07:8427 },
  { date:"2025-12-22",dau:1309391,nru:35233,npu:2008,ruser01:9338,ruser07:4617 },
  { date:"2025-12-23",dau:1261803,nru:30957,npu:2451,ruser01:9093,ruser07:3357 },
  { date:"2025-12-24",dau:1206047,nru:31980,npu:1866,ruser01:10158,ruser07:3863 },
  { date:"2025-12-25",dau:1243404,nru:31872,npu:1901,ruser01:7809,ruser07:4590 },
  { date:"2025-12-26",dau:1039819,nru:29166,npu:3181,ruser01:12063,ruser07:4950 },
  { date:"2025-12-27",dau:1260722,nru:51951,npu:2828,ruser01:16692,ruser07:8123 },
  { date:"2025-12-28",dau:1308384,nru:45545,npu:2365,ruser01:12383,ruser07:6139 },
  { date:"2025-12-29",dau:1143403,nru:33036,npu:2325,ruser01:8453,ruser07:3906 },
  { date:"2025-12-30",dau:1150096,nru:35022,npu:2216,ruser01:8300,ruser07:3080 },
  { date:"2025-12-31",dau:1222254,nru:32311,npu:2114,ruser01:11088,ruser07:3508 },
];

export const DAILY_REVENUE_PREV: DailyRevenuePrevRecord[] = [
  { date:"2025-12-01",rev:108128.31,rev_npu:4931.86 },
  { date:"2025-12-02",rev:59222.46,rev_npu:3638.92 },
  { date:"2025-12-03",rev:54620.36,rev_npu:3329.91 },
  { date:"2025-12-04",rev:58149.71,rev_npu:3455.61 },
  { date:"2025-12-05",rev:69747.25,rev_npu:3167.96 },
  { date:"2025-12-06",rev:91151.01,rev_npu:4060.78 },
  { date:"2025-12-07",rev:113656.17,rev_npu:4431.95 },
  { date:"2025-12-08",rev:76925.03,rev_npu:3825.09 },
  { date:"2025-12-09",rev:97764.77,rev_npu:3422.86 },
  { date:"2025-12-10",rev:210851.90,rev_npu:4577.10 },
  { date:"2025-12-11",rev:126978.76,rev_npu:4562.68 },
  { date:"2025-12-12",rev:70489.24,rev_npu:4400.28 },
  { date:"2025-12-13",rev:132394.72,rev_npu:6833.49 },
  { date:"2025-12-14",rev:117081.41,rev_npu:5907.35 },
  { date:"2025-12-15",rev:91217.55,rev_npu:5349.70 },
  { date:"2025-12-16",rev:80523.49,rev_npu:5227.40 },
  { date:"2025-12-17",rev:60893.32,rev_npu:3729.95 },
  { date:"2025-12-18",rev:72417.57,rev_npu:3786.17 },
  { date:"2025-12-19",rev:63649.61,rev_npu:3324.96 },
  { date:"2025-12-20",rev:58375.58,rev_npu:3269.51 },
  { date:"2025-12-21",rev:60080.72,rev_npu:3378.72 },
  { date:"2025-12-22",rev:87054.45,rev_npu:4271.50 },
  { date:"2025-12-23",rev:69316.68,rev_npu:4258.04 },
  { date:"2025-12-24",rev:76541.93,rev_npu:3929.17 },
  { date:"2025-12-25",rev:71737.62,rev_npu:3717.91 },
  { date:"2025-12-26",rev:112402.81,rev_npu:5140.70 },
  { date:"2025-12-27",rev:62499.02,rev_npu:5195.04 },
  { date:"2025-12-28",rev:78600.95,rev_npu:4523.53 },
  { date:"2025-12-29",rev:67061.47,rev_npu:3991.60 },
  { date:"2025-12-30",rev:88960.50,rev_npu:4133.41 },
  { date:"2025-12-31",rev:74779.96,rev_npu:4043.22 },
];

export const MONTHLY_SUMMARY = {
  current: { year_month: '202601', mau: 4937202, mpu: 310062, nru: 1194112 },
  prev:    { year_month: '202512', mau: 4353221, mpu: 299258, nru: 1143023 },
};

export const PLATFORM_BREAKDOWN = [
  { platform: 'android', rev: 1487635.96, dau_avg: 1012535.00, nru: 866598, npu: 44092 },
  { platform: 'ios',     rev: 1126531.92, dau_avg: 315647.16,  nru: 327514, npu: 21947 },
];

// Helper: get data for a metric by field name, with optional time range slicing
export function getMetricData(
  field: string,
  source: string,
  timeRange: 'last_7_days' | 'last_14_days' | 'last_30_days' = 'last_30_days'
): { labels: string[]; values: number[] } {
  const isRevenue = source.includes('REVENUE');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = isRevenue
    ? DAILY_REVENUE_CURRENT
    : DAILY_USERS_CURRENT;

  const sliceN =
    timeRange === 'last_7_days' ? 7 : timeRange === 'last_14_days' ? 14 : 30;
  const sliced = data.slice(-sliceN);
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return (dt.getMonth() + 1) + '/' + dt.getDate();
  };

  return {
    labels: sliced.map((r) => fmtDate(r.date)),
    values: sliced.map((r) => +(r[field]) || 0),
  };
}

export function getPrevMetricData(
  field: string,
  source: string,
  timeRange: 'last_7_days' | 'last_14_days' | 'last_30_days' = 'last_30_days'
): { labels: string[]; values: number[] } | null {
  const isRevenue = source.includes('REVENUE');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = isRevenue
    ? DAILY_REVENUE_PREV
    : DAILY_USERS_PREV;

  // Check if field exists in prev data
  if (data.length === 0 || !(field in data[0])) return null;

  const sliceN =
    timeRange === 'last_7_days' ? 7 : timeRange === 'last_14_days' ? 14 : 30;
  const sliced = data.slice(-sliceN);
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return (dt.getMonth() + 1) + '/' + dt.getDate();
  };

  return {
    labels: sliced.map((r) => fmtDate(r.date as string)),
    values: sliced.map((r) => +(r[field] as number) || 0),
  };
}
