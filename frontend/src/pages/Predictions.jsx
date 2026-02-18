import { useState, useEffect } from 'react';
import { BrainCircuit, Loader2, TrendingUp, Zap, Target, Filter, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import {
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 shadow-xl">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }} className="text-sm font-semibold">
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
};

export default function Predictions() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [mode, setMode] = useState('category'); // 'category' or 'file'
    const [file, setFile] = useState(null);

    // What-If simulation state
    const [multiplier, setMultiplier] = useState(1.0);
    const [simResult, setSimResult] = useState(null);
    const [simLoading, setSimLoading] = useState(false);

    // Fetch available categories from user's data
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/data');
                const cats = [...new Set(res.data.map(d => d.category))];
                setCategories(cats);
                if (cats.length > 0) setSelectedCategory(cats[0]);
            } catch (err) {
                console.error('Failed to load categories');
            }
        };
        fetchCategories();
    }, []);

    const handlePredict = async () => {
        if (!selectedCategory) {
            setError('Please select a category first');
            return;
        }
        setError('');
        setResult(null);
        setSimResult(null);
        setMultiplier(1.0);
        setLoading(true);
        try {
            const res = await api.get(`/data/predict?category=${encodeURIComponent(selectedCategory)}`);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Prediction failed. Is the AI Engine running?');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }
        setError('');
        setResult(null);
        setSimResult(null);
        setMultiplier(1.0);
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/data/predict/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Adapt response to match existing result structure if needed
            // The AI engine returns { predictions: [], original_data: [], model: {} }
            // expected result structure: { category: 'File Upload', original: [], predictions: [], model: {} }
            setResult({
                category: 'File Upload',
                original: res.data.original_data,
                predictions: res.data.predictions,
                model: res.data.model
            });
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    // Run simulation whenever multiplier changes (debounced)
    const runSimulation = async (mult) => {
        if (!result || mult === 1.0) {
            setSimResult(null);
            return;
        }
        setSimLoading(true);
        try {
            const res = await api.get(
                `/data/simulate?category=${encodeURIComponent(selectedCategory)}&multiplier=${mult}`
            );
            setSimResult(res.data);
        } catch (err) {
            console.error('Simulation failed:', err);
        } finally {
            setSimLoading(false);
        }
    };

    // Debounce simulation calls
    useEffect(() => {
        if (!result) return;
        const timer = setTimeout(() => {
            runSimulation(multiplier);
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiplier]);

    // Build chart data with optional projected line
    const chartData = result ? (() => {
        const actualData = result.original.map((d, i) => ({
            label: d.label,
            'Actual': d.value,
            index: i
        }));
        const predData = result.predictions.map(p => ({
            label: p.label,
            'Prediction': p.value,
            index: p.index
        }));

        // If simulation is active, merge projected values
        if (simResult && multiplier !== 1.0) {
            const projectedData = simResult.projected.map(p => ({
                label: p.label,
                'Projected': p.value,
                index: p.index
            }));
            // Merge prediction + projected
            const mergedPred = predData.map((p, i) => ({
                ...p,
                'Projected': projectedData[i]?.['Projected']
            }));
            return [...actualData, ...mergedPred];
        }

        return [...actualData, ...predData];
    })() : [];

    const categoryColors = {
        Revenue: '#6366f1', Users: '#22c55e', Performance: '#f59e0b',
        Sales: '#ec4899', General: '#06b6d4',
    };
    const activeColor = categoryColors[selectedCategory] || '#8b5cf6';

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">AI Predictions</h1>
                <p className="text-slate-400 text-sm">Select a category and run the AI model to predict future trends.</p>
            </div>

            {/* Controls */}
            <div className="glass-card rounded-xl p-5 mb-6">
                {/* Mode Tabs */}
                <div className="flex gap-4 border-b border-dark-600/50 pb-4 mb-4">
                    <button
                        onClick={() => { setMode('category'); setResult(null); setError(''); }}
                        className={`text-sm font-semibold pb-1 transition-colors
                        ${mode === 'category' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Predict by Category
                    </button>
                    <button
                        onClick={() => { setMode('file'); setResult(null); setError(''); }}
                        className={`text-sm font-semibold pb-1 transition-colors
                        ${mode === 'file' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Upload Data File
                    </button>
                </div>

                {mode === 'category' ? (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-white">Select Category to Predict</h2>
                        </div>
                        {categories.length > 0 ? (
                            <>
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setResult(null); setSimResult(null); setError(''); setMultiplier(1.0); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                                            ${selectedCategory === cat
                                                    ? 'text-white shadow-lg'
                                                    : 'bg-dark-700/50 text-slate-400 hover:text-slate-200 hover:bg-dark-700'
                                                }`}
                                            style={selectedCategory === cat ? {
                                                backgroundColor: categoryColors[cat] || '#8b5cf6',
                                                boxShadow: `0 4px 15px ${categoryColors[cat] || '#8b5cf6'}33`
                                            } : {}}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handlePredict} disabled={loading || !selectedCategory}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold
                                    transition-all duration-200 cursor-pointer
                                    ${loading
                                            ? 'bg-dark-700 text-slate-400'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                                    {loading ? 'Running AI Model...' : `Predict ${selectedCategory}`}
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">No data yet. Add entries from the sidebar first.</p>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="bg-dark-800/50 border border-dashed border-dark-600 rounded-xl p-8 text-center
                            hover:border-indigo-500/50 transition-colors">
                            <input
                                type="file"
                                id="file-upload"
                                accept=".txt,.pdf"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="hidden"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3">
                                    <Zap className="w-6 h-6 text-indigo-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-200 mb-1">
                                    {file ? file.name : "Click to upload TXT or PDF"}
                                </span>
                                <span className="text-xs text-slate-500">
                                    Format: One number per line, or "Date: Value"
                                </span>
                            </label>
                        </div>
                        <button
                            onClick={handleFileUpload} disabled={loading || !file}
                            className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold
                            transition-all duration-200 cursor-pointer self-start
                            ${loading || !file
                                    ? 'bg-dark-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                                }`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                            {loading ? 'Processing File...' : 'Analyze & Predict'}
                        </button>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="flex flex-col gap-4">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Predictions for:</span>
                        <span className="px-3 py-1 rounded-lg text-sm font-semibold text-white"
                            style={{ backgroundColor: activeColor }}>
                            {result.category}
                        </span>
                    </div>

                    {/* Model Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs text-slate-500">Model Type</span>
                            </div>
                            <p className="text-base font-bold text-white">{result.model.type}</p>
                        </div>
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs text-slate-500">Accuracy (R²)</span>
                            </div>
                            <p className={`text-base font-bold ${result.model.accuracy > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {result.model.accuracy}%
                            </p>
                        </div>
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-xs text-slate-500">Trend Slope</span>
                            </div>
                            <p className="text-base font-bold text-white">{result.model.slope}</p>
                        </div>
                    </div>

                    {/* What-If Simulation */}
                    <div className="glass-card rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                                <h2 className="text-sm font-semibold text-white">What-If Analysis</h2>
                                {simLoading && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
                            </div>
                            <span className="text-xs text-slate-500">Growth Multiplier</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0.5"
                                max="3.0"
                                step="0.1"
                                value={multiplier}
                                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer
                                accent-indigo-500"
                                style={{
                                    background: `linear-gradient(to right, #6366f1 ${((multiplier - 0.5) / 2.5) * 100}%, #1e293b ${((multiplier - 0.5) / 2.5) * 100}%)`
                                }}
                            />
                            <div className={`text-lg font-bold min-w-[60px] text-center rounded-lg px-3 py-1
                                ${multiplier > 1 ? 'text-emerald-400 bg-emerald-500/10' :
                                    multiplier < 1 ? 'text-red-400 bg-red-500/10' :
                                        'text-slate-400 bg-dark-700'}`}>
                                {multiplier.toFixed(1)}x
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600">
                            <span>0.5x (Decline)</span>
                            <span>1.0x (Base)</span>
                            <span>3.0x (Growth)</span>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="glass-card rounded-xl p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-semibold text-white">
                                {result.category} — Actual vs Predicted
                                {multiplier !== 1.0 && <span className="text-amber-400 ml-2">({multiplier}x Projected)</span>}
                            </h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                                <ReferenceLine
                                    x={result.original[result.original.length - 1]?.label}
                                    stroke="#475569" strokeDasharray="5 5"
                                    label={{ value: 'Now', fill: '#64748b', fontSize: 11 }}
                                />
                                <Line type="monotone" dataKey="Actual" stroke={activeColor} strokeWidth={2.5}
                                    dot={{ r: 4, fill: activeColor }} connectNulls={false} />
                                <Line type="monotone" dataKey="Prediction" stroke="#22c55e" strokeWidth={2.5}
                                    strokeDasharray="6 3" dot={{ r: 4, fill: '#22c55e' }} connectNulls={false} />
                                {multiplier !== 1.0 && (
                                    <Line type="monotone" dataKey="Projected" stroke="#f59e0b" strokeWidth={2}
                                        strokeDasharray="4 4" dot={{ r: 3, fill: '#f59e0b', stroke: '#f59e0b' }} connectNulls={false} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Predicted Values */}
                    <div className="glass-card rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">
                            Predicted {result.category} Values
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {result.predictions.map((pred, i) => (
                                <div key={i} className="bg-dark-800 rounded-lg p-4 text-center border border-dark-600/50">
                                    <p className="text-xs text-slate-500 mb-1">{pred.label}</p>
                                    <p className="text-xl font-bold text-emerald-400">{pred.value}</p>
                                    {simResult && multiplier !== 1.0 && simResult.projected[i] && (
                                        <p className="text-sm font-semibold text-amber-400 mt-1">
                                            → {simResult.projected[i].value}
                                            <span className="text-[10px] text-slate-500 ml-1">at {multiplier}x</span>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!result && !error && !loading && (
                <div className="glass-card rounded-xl p-12 text-center">
                    <BrainCircuit className="w-14 h-14 mx-auto mb-4 text-indigo-500/40" />
                    <h2 className="text-lg font-semibold text-slate-300 mb-2">
                        {mode === 'category' ? 'Select & Predict' : 'Upload Data File'}
                    </h2>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        {mode === 'category'
                            ? 'Pick a category above, then hit the predict button.'
                            : 'Upload a PDF or TXT file with your data to analyze trends.'}
                    </p>
                </div>
            )}
        </div>
    );
}
