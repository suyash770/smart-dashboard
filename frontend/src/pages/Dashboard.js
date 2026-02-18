import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Database, FolderOpen, TrendingUp, TrendingDown, Activity, Loader2,
    ArrowUpRight, ArrowDownRight, BrainCircuit, Minus, CalendarDays, ChevronDown, Link2
} from 'lucide-react';
import {
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import AIInsights from '../components/AIInsights';

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

    // Filters
    const [dateRange, setDateRange] = useState('all');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

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

    // Filtered data based on date range and category
    const filteredData = useMemo(() => {
        let filtered = data;

        // Date filter
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

        return filtered;
    }, [data, dateRange, filterCategory]);

    // Active Category (Clicked from Chart)
    const [activeCategory, setActiveCategory] = useState(null);

    // KPI calculations using filtered data OR active category
    const kpiData = useMemo(() => {
        if (activeCategory) {
            return filteredData.filter(d => d.category === activeCategory);
        }
        return filteredData;
    }, [filteredData, activeCategory]);

    const categories = [...new Set(filteredData.map(d => d.category))];
    const categoryColors = {
        Revenue: { stroke: '#6366f1', fill: 'rgba(99,102,241,0.15)' },
        Users: { stroke: '#22c55e', fill: 'rgba(34,197,94,0.15)' },
        Performance: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)' },
        Sales: { stroke: '#ec4899', fill: 'rgba(236,72,153,0.15)' },
        General: { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.15)' },
    };
    const defaultColor = { stroke: '#8b5cf6', fill: 'rgba(139,92,246,0.15)' };

    const getChartDataForCategory = (cat) => {
        return filteredData
            .filter(d => d.category === cat)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(item => ({ name: item.label, value: item.value }));
    };

    const totalEntries = kpiData.length;
    const totalCategories = new Set(kpiData.map(d => d.category)).size;
    const totalValue = kpiData.reduce((s, d) => s + d.value, 0);
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

    const trendIcon = (trend) => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
        return <Minus className="w-4 h-4 text-amber-400" />;
    };

    const trendBg = (trend) => {
        if (trend === 'up') return 'border-emerald-500/20 bg-emerald-500/5';
        if (trend === 'down') return 'border-red-500/20 bg-red-500/5';
        return 'border-amber-500/20 bg-amber-500/5';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-slate-400 text-sm">
                        Welcome back, <span className="text-indigo-400 font-medium">{user?.username}</span>
                    </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2">
                    {activeCategory && (
                        <button
                            onClick={() => setActiveCategory(null)}
                            className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                        >
                            Reset Filter: <b>{activeCategory}</b> ✕
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
                            setActiveCategory(null); // Reset active category on filter change
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

            {/* Stat Cards with Smart Comparison */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map(({ label, value, icon: Icon, color, bg, change }) => (
                    <div key={label} className="glass-card rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: bg }}>
                                <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            {change !== null ? (
                                <div className={`flex items-center gap-0.5 text-[11px] font-bold
                                    ${parseFloat(change) > 0 ? 'text-emerald-400' : parseFloat(change) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {parseFloat(change) > 0 ? (
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    ) : parseFloat(change) < 0 ? (
                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                    ) : null}
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

            {/* AI Insights & Category Correlations */}
            <AIInsights />

            {/* Per-Category Charts */}
            {categories.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categories.map((cat) => {
                        const catData = getChartDataForCategory(cat);
                        const colors = categoryColors[cat] || defaultColor;
                        const catTotal = catData.reduce((s, d) => s + d.value, 0);
                        const isActive = activeCategory === cat;

                        return (
                            <div
                                key={cat}
                                onClick={() => setActiveCategory(isActive ? null : cat)}
                                className={`glass-card rounded-xl p-5 transition-all duration-300 cursor-pointer
                                    ${isActive ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5' : 'hover:bg-dark-700/30'}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className={`text-sm font-semibold transition-colors ${isActive ? 'text-indigo-400' : 'text-white'}`}>{cat}</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">{catData.length} entries · Total: {formatCompactNumber(catTotal)}</p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full transition-all ${isActive ? 'ring-2 ring-white/20' : ''}`} style={{ backgroundColor: colors.stroke }} />
                                </div>
                                {catData.length >= 2 ? (
                                    <ResponsiveContainer width="100%" height={180}>
                                        <AreaChart data={catData}>
                                            <defs>
                                                <linearGradient id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={colors.stroke} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={colors.stroke} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis
                                                tick={{ fill: '#64748b', fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={35}
                                                tickFormatter={formatCompactNumber}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="value" stroke={colors.stroke} strokeWidth={2}
                                                fill={`url(#grad-${cat})`} dot={{ r: 3, fill: colors.stroke, strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[180px] flex items-center justify-center">
                                        <p className="text-xs text-slate-600">Add more entries to see a chart</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card rounded-xl p-12 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg font-medium text-slate-400">No data yet</p>
                    <p className="text-sm text-slate-600 mt-1">Go to "Add Data" in the sidebar to start</p>
                </div>
            )}
        </div>
    );
}
