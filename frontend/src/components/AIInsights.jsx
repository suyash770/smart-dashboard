import { useState, useEffect } from 'react';
import {
    Sparkles, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, BrainCircuit, X, RefreshCw
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
        <div className="p-3 rounded-lg bg-dark-800/50 border border-white/5 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <span className="text-slate-300">{correlation.from}</span>
                <span className="text-slate-500">→</span>
                <span className="text-slate-300">{correlation.to}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className={`font-bold ${correlation.correlation > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {correlation.correlation > 0 ? '+' : ''}{correlation.correlation}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{correlation.strength}</span>
            </div>
        </div>
    );
}

const AIInsights = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('insights'); // insights | correlations
    const [insights, setInsights] = useState([]);
    const [correlations, setCorrelations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [insightsRes, correlationsRes] = await Promise.all([
                api.get('/data/insights').catch(e => ({ data: { insights: [] } })),
                api.get('/data/correlations').catch(e => ({ data: { correlations: [] } }))
            ]);

            setInsights(insightsRes.data.insights || []);
            setCorrelations(correlationsRes.data.correlations || []);
        } catch (err) {
            setError('Failed to load AI analytics.');
        } finally {
            setLoading(false);
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
