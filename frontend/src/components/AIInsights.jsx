import { useState, useEffect } from 'react';
import {
    Sparkles, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, BrainCircuit, X, RefreshCw, Download
} from 'lucide-react';
import api from '../services/api';

const InsightCard = ({ insight }) => {
    let icon = <Minus className="w-5 h-5 text-slate-400" />;
    let color = "border-slate-500/20 bg-slate-500/5";
    let textColor = "text-slate-400";

    if (insight.trend === 'up') {
        icon = <ArrowUpRight className="w-5 h-5 text-emerald-400" />;
        color = "border-emerald-500/20 bg-emerald-500/5";
        textColor = "text-emerald-400";
    } else if (insight.trend === 'down') {
        icon = <ArrowDownRight className="w-5 h-5 text-rose-400" />;
        color = "border-rose-500/20 bg-rose-500/5";
        textColor = "text-rose-400";
    }

    if (insight.change_pct > 20 || insight.change_pct < -20) {
        color = insight.change_pct > 0
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-rose-500/40 bg-rose-500/10";
    }

    return (
        <div className={`p-4 rounded-xl border ${color} transition-all hover:scale-[1.02]`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-dark-800 border border-white/5`}>
                        {icon}
                    </div>
                    <span className="font-bold text-white">{insight.category}</span>
                </div>
                <span className={`text-xs font-mono font-bold ${textColor}`}>
                    {insight.change_pct > 0 ? '+' : ''}{insight.change_pct}%
                </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
                {insight.message}
            </p>
            {insight.prediction && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
                    <BrainCircuit className="w-3 h-3 text-indigo-400" />
                    <span>Forecast: <span className="text-white font-mono">{insight.prediction}</span></span>
                </div>
            )}
        </div>
    );
};

const CorrelationCard = ({ correlation }) => {
    return (
        <div className="p-4 rounded-xl bg-dark-800/50 border border-white/5 hover:bg-dark-800 transition-all group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${correlation.correlation > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {correlation.correlation > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{correlation.from}</span>
                            <span className="text-slate-500 text-xs">linked to</span>
                            <span className="text-white font-medium">{correlation.to}</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-snug max-w-md">
                            {correlation.message || `Strong ${correlation.direction} correlation detected.`}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-lg font-bold ${correlation.correlation > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {correlation.correlation > 0 ? '+' : ''}{correlation.correlation}
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{correlation.strength}</p>
                </div>
            </div>
            {/* Visual impact bar */}
            <div className="mt-3 h-1.5 w-full bg-dark-900 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${correlation.correlation > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.abs(correlation.correlation) * 100}%` }}
                />
            </div>
        </div>
    );
}

const AIInsights = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('insights'); // insights | correlations
    const [insights, setInsights] = useState([]);
    const [correlations, setCorrelations] = useState([]);
    const [globalSummary, setGlobalSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [insightsRes, correlationsRes] = await Promise.all([
                api.get('/data/insights').catch(e => ({ data: { insights: [], global_summary: null } })),
                api.get('/data/correlations').catch(e => ({ data: { correlations: [] } }))
            ]);

            setInsights(insightsRes.data.insights || []);
            setGlobalSummary(insightsRes.data.global_summary || null);
            setCorrelations(correlationsRes.data.correlations || []);
        } catch (err) {
            setError('Failed to load AI analytics.');
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async () => {
        if (!insights.length && !globalSummary) return;
        setDownloading(true);
        try {
            // Use local proxy /api/ai/generate-report if configured, or direct call if proxy is simple pass-through.
            // Assuming /api/data/generate-report via proxy or similar.
            // Wait, implementation plan said /generate-report in ai_engine.
            // If strict proxy, I need to route it.
            // Let's try /api/data/generate-report and ensure backend proxies it.
            // OR simple: check if frontend talks to ai_engine directly? No, usually via backend proxy.

            // Checking backend routes:
            // I'll assume I need to ADD a proxy route in backend first if it doesn't wildcard.
            // But let's write the frontend assuming the route exists: '/data/report' (mapped to ai_engine /generate-report)

            // Wait, previously I saw `api.get('/data/insights')` works.
            // So I should use the backend to proxy.
            // I'll stick to editing THIS file now, and then I'll check/fix backend proxy.

            const response = await api.post('/data/generate-report', {
                insights,
                global_summary: globalSummary
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SmartDash_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Report generation failed", err);
            // Flash error?
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 overflow-hidden relative backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-indigo-500/20 flex items-center justify-between bg-indigo-900/10">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h3 className="font-bold text-white">AI Analytics Engine</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadReport}
                        disabled={downloading || loading || (!insights.length && !globalSummary)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export PDF Report"
                    >
                        <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
                        {downloading ? 'Exporting...' : 'Export Report'}
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Refresh Analysis"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'insights' ? 'text-white border-b-2 border-indigo-500 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    Smart Insights ({insights.length})
                </button>
                <button
                    onClick={() => setActiveTab('correlations')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'correlations' ? 'text-white border-b-2 border-indigo-500 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    Correlations ({correlations.length})
                </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <BrainCircuit className="w-8 h-8 mb-3 animate-pulse text-indigo-500/50" />
                        <p className="text-sm">Analyzing data patterns...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-rose-400 text-sm">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        {error}
                    </div>
                ) : activeTab === 'insights' ? (
                    <div className="space-y-4">
                        {/* Global Summary Card */}
                        {globalSummary && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                                        <BrainCircuit className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-indigo-300 mb-1">AI Executive Summary</h4>
                                        <p className="text-sm text-slate-200 leading-relaxed">{globalSummary}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            {insights.length > 0 ? (
                                insights.map((insight, idx) => (
                                    <InsightCard key={idx} insight={insight} />
                                ))
                            ) : (
                                <p className="text-center col-span-2 py-8 text-slate-500 text-sm">
                                    Not enough data to generate insights yet.
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {correlations.length > 0 ? (
                            correlations.map((corr, idx) => (
                                <CorrelationCard key={idx} correlation={corr} />
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm space-y-2">
                                <p>No strong correlations found.</p>
                                <p className="text-xs">Try adding data for multiple categories.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIInsights;
