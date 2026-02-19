import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Database, FolderOpen, TrendingUp, Activity, Loader2,
    ArrowUpRight, ArrowDownRight, CalendarDays, ChevronDown
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import AIInsights from '../components/AIInsights';
import NLSearch from '../components/NLSearch';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 shadow-xl">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }} className="text-sm font-semibold">
                    {entry.value}
                </p>
            ))}
        </div>
    );
};

// Date range presets
const DATE_RANGES = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kpiChanges, setKpiChanges] = useState(null);

    // Filters & Drill-down State
    const [dateRange, setDateRange] = useState('all');
    const [filterCategory, setFilterCategory] = useState('All');
    const [valueFilter, setValueFilter] = useState(null); // { op: 'gt'|'lt', value: number }
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Drill-down: 'overview' (monthly/agg) vs 'detail' (daily)
    const [viewMode, setViewMode] = useState('overview');
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/data');
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fetch backend KPI comparison (last 7d vs previous 7d)
    useEffect(() => {
        api.get('/data/kpi-comparison')
            .then(res => setKpiChanges(res.data.changes))
            .catch(() => setKpiChanges(null));
    }, [data]);

    // All unique categories
    const allCategories = useMemo(() => ['All', ...new Set(data.map(d => d.category))], [data]);

    // 1. Base Filtered Data (Date Range & Category & Value)
    const filteredData = useMemo(() => {
        let filtered = data;

        // Date filter (Global)
        if (dateRange !== 'all') {
            const now = new Date();
            const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
            const cutoff = new Date(now.getTime() - daysMap[dateRange] * 86400000);
            filtered = filtered.filter(d => new Date(d.date) >= cutoff);
        }

        // Category filter (Dropdown)
        if (filterCategory !== 'All') {
            filtered = filtered.filter(d => d.category === filterCategory);
        }

        // Active aggregation category (Clicked from chart legend/cards)
        if (activeCategory) {
            filtered = filtered.filter(d => d.category === activeCategory);
        }

        // Value Filter (from NL Search)
        if (valueFilter) {
            if (valueFilter.op === 'gt') {
                filtered = filtered.filter(d => d.value > valueFilter.value);
            } else if (valueFilter.op === 'lt') {
                filtered = filtered.filter(d => d.value < valueFilter.value);
            }
        }

        return filtered;
    }, [data, dateRange, filterCategory, activeCategory, valueFilter]);

    // Handle Natural Language Search
    const handleNLSearch = (intent) => {
        if (!intent) {
            // Clear filters logic if needed, or just do nothing
            return;
        }
        if (intent.category) {
            setFilterCategory(intent.category);
            setActiveCategory(null); // Reset drill-down intent
        }
        if (intent.dateRange) {
            setDateRange(intent.dateRange);
        }
        if (intent.value !== null && intent.value !== undefined) {
            setValueFilter({ op: intent.valueOp, value: intent.value });
        } else {
            setValueFilter(null);
        }
    };

    // 2. Monthly Aggregation (For Overview)
    const monthlyData = useMemo(() => {
        const grouped = {};
        filteredData.forEach(d => {
            const date = new Date(d.date);
            const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // "Oct 2023"
            const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!grouped[monthKey]) {
                grouped[monthKey] = { name: monthKey, value: 0, count: 0, sortKey };
            }
            grouped[monthKey].value += d.value;
            grouped[monthKey].count += 1;
        });

        // Convert to array and sort chronologically
        let result = Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        // Calculate growth rate for tooltips
        result = result.map((item, index) => {
            const prev = result[index - 1];
            const growth = prev ? ((item.value - prev.value) / prev.value) * 100 : 0;
            return { ...item, growth: growth.toFixed(1) };
        });

        return result;
    }, [filteredData]);

    // 3. Daily Data (For Drill-down)
    const dailyData = useMemo(() => {
        if (!selectedMonth) return [];
        return filteredData.filter(d => {
            const date = new Date(d.date);
            const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            return monthKey === selectedMonth;
        }).sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(d => ({
                ...d,
                day: new Date(d.date).getDate(), // Just the day number
                fullDate: new Date(d.date).toLocaleDateString()
            }));
    }, [filteredData, selectedMonth]);

    // Handle Drill-Down Click
    const handleMonthClick = (data) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const month = data.activePayload[0].payload.name;
            setSelectedMonth(month);
            setViewMode('detail');
        }
    };

    const totalEntries = filteredData.length;
    const totalCategories = new Set(filteredData.map(d => d.category)).size;
    const totalValue = filteredData.reduce((s, d) => s + d.value, 0);
    const avgValue = totalEntries > 0 ? (totalValue / totalEntries).toFixed(1) : '—';

    // Helper for compact number formatting (e.g. 1.2M, 5k)
    const formatCompactNumber = (num) => {
        return Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(num);
    };

    const statCards = [
        {
            label: activeCategory ? `${activeCategory} Entries` : 'Total Entries',
            value: totalEntries,
            icon: Database,
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.1)',
            change: (!activeCategory && kpiChanges?.entries) ?? null
        },
        {
            label: 'Categories',
            value: totalCategories,
            icon: FolderOpen,
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.1)',
            change: null
        },
        {
            label: activeCategory ? `${activeCategory} Value` : 'Total Value',
            value: formatCompactNumber(totalValue),
            icon: TrendingUp,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.1)',
            change: (!activeCategory && kpiChanges?.totalValue) ?? null
        },
        {
            label: activeCategory ? `${activeCategory} Avg` : 'Average',
            value: formatCompactNumber(Number(avgValue) || 0),
            icon: Activity,
            color: '#ec4899',
            bg: 'rgba(236,72,153,0.1)',
            change: (!activeCategory && kpiChanges?.average) ?? null
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    // Chart Components need to be dynamically imported or defined here to use state
    // We already imported Recharts components at top

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-slate-400 text-sm">
                        Welcome back, <span className="text-indigo-400 font-medium">{user?.username}</span>
                    </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2">
                    {/* Reset Active Filter */}
                    {(activeCategory || viewMode === 'detail' || valueFilter) && (
                        <button
                            onClick={() => {
                                setActiveCategory(null);
                                setViewMode('overview');
                                setSelectedMonth(null);
                                setValueFilter(null);
                                setFilterCategory('All');
                            }}
                            className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                        >
                            Reset View ✕
                        </button>
                    )}

                    {/* Date Range Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-dark-700/50 text-xs font-medium
                            text-slate-300 hover:bg-dark-700 transition-all duration-200 cursor-pointer border border-dark-600/30"
                        >
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            {DATE_RANGES.find(r => r.value === dateRange)?.label}
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                        </button>
                        {showDateDropdown && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDateDropdown(false)} />
                                <div className="absolute right-0 top-full mt-1 z-20 bg-dark-800 border border-dark-600 rounded-lg py-1 shadow-xl min-w-[150px]">
                                    {DATE_RANGES.map(r => (
                                        <button key={r.value}
                                            onClick={() => { setDateRange(r.value); setShowDateDropdown(false); }}
                                            className={`w-full text-left px-3.5 py-2 text-xs cursor-pointer transition-colors
                                            ${dateRange === r.value ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-dark-700'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Category Dropdown */}
                    <select
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value);
                            setActiveCategory(null);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-dark-700/50 text-xs font-medium text-slate-300
                        border border-dark-600/30 hover:bg-dark-700 transition-all cursor-pointer outline-none
                        focus:border-indigo-500/50"
                    >
                        {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat === 'All' ? '📂 All Categories' : cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* NL Search Command Bar */}
            <NLSearch onSearch={handleNLSearch} categories={allCategories.filter(c => c !== 'All')} />

            {/* Active Value Filter Badge */}
            {valueFilter && (
                <div className="mb-4 flex justify-center">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs border border-emerald-500/20 flex items-center gap-2">
                        Filtered: Value {valueFilter.op === 'gt' ? '>' : '<'} {valueFilter.value}
                        <button onClick={() => setValueFilter(null)} className="hover:text-white transition-colors">✕</button>
                    </span>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map(({ label, value, icon: Icon, color, bg, change }) => (
                    <div key={label} className="glass-card rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg ${parseFloat(change) > 0 ? 'animate-pulse' : ''}`} style={{ backgroundColor: bg }}>
                                <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            {change !== null ? (
                                <div className={`flex items-center gap-0.5 text-[11px] font-bold
                                    ${parseFloat(change) > 0 ? 'text-emerald-400' : parseFloat(change) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {parseFloat(change) > 0 ? '+' : ''}{change}%
                                </div>
                            ) : (
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
                            )}
                        </div>
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Main Interactive Chart Section */}
            <div className="glass-card rounded-xl p-6 mb-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {viewMode === 'overview' ? 'Monthly Overview' : `Daily Breakdown: ${selectedMonth}`}
                            {viewMode === 'detail' && (
                                <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                    Drilled Down
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-slate-400">
                            {viewMode === 'overview'
                                ? 'Click on a bar to see daily details.'
                                : `Showing daily performance for ${selectedMonth}.`}
                        </p>
                    </div>
                    {viewMode === 'detail' && (
                        <button
                            onClick={() => { setViewMode('overview'); setSelectedMonth(null); }}
                            className="text-xs bg-dark-700 hover:bg-dark-600 text-white px-3 py-1.5 rounded-lg transition-colors border border-dark-500"
                        >
                            Back to Overview
                        </button>
                    )}
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {viewMode === 'overview' ? (
                            <BarChart data={monthlyData} onClick={handleMonthClick} className="cursor-pointer">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatCompactNumber} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
                                                <p className="text-slate-200 font-semibold text-sm mb-1">{label}</p>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-2xl font-bold text-white">{formatCompactNumber(data.value)}</span>
                                                    {data.growth !== 0 && (
                                                        <span className={`text-xs font-bold mb-1 ${Number(data.growth) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {Number(data.growth) > 0 ? '+' : ''}{data.growth}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{data.count} entries</p>
                                                <p className="text-[10px] text-indigo-400 mt-2">Click to drill down ↓</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {monthlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#6366f1' : '#334155'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" vertical={false} />
                                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Day', position: 'insideBottomRight', offset: -5 }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatCompactNumber} />
                                <Tooltip content={({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl">
                                            <p className="text-slate-400 text-xs mb-1">{d.fullDate}</p>
                                            <p className="text-lg font-bold text-white">{formatCompactNumber(d.value)}</p>
                                            <p className="text-xs text-slate-500">{d.label}</p>
                                            <p className="text-[10px] text-indigo-300 mt-1">{d.category}</p>
                                        </div>
                                    );
                                }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Insights Panel */}
            <div className="mb-6">
                <AIInsights />
            </div>
        </div>
    );
}
