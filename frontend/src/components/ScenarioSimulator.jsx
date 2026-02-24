import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Sliders, Target, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ScenarioSimulator() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [multiplier, setMultiplier] = useState(1.0); // 1.0 = 0% change, 1.2 = +20%
    const [targetGoal, setTargetGoal] = useState('');
    const [loading, setLoading] = useState(false);
    const [simulationData, setSimulationData] = useState(null);
    const [error, setError] = useState(null);
    const [hasCelebrated, setHasCelebrated] = useState(false);

    // Initial load: get categories
    useEffect(() => {
        api.get('/data/categories').then(res => {
            setCategories(res.data);
            if (res.data.length > 0) setSelectedCategory(res.data[0]);
        });
    }, []);

    // Run Simulation
    useEffect(() => {
        if (!selectedCategory) return;

        const runSimulation = async () => {
            setLoading(true);
            try {
                // Fetch simulation from backend
                const res = await api.get(`/data/simulate?category=${selectedCategory}&multiplier=${multiplier}`);
                setSimulationData(res.data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to run simulation. Ensure you have enough data.');
                setSimulationData(null);
            } finally {
                setLoading(false);
            }
        };

        // Debounce slider input
        const timer = setTimeout(runSimulation, 500);
        return () => clearTimeout(timer);
    }, [selectedCategory, multiplier]);

    // Reset celebration when goal or category changes
    useEffect(() => {
        setHasCelebrated(false);
    }, [targetGoal, selectedCategory]);

    // Track previous loading state to detect when a simulation finishes
    const [prevLoading, setPrevLoading] = useState(false);

    // Trigger Confetti when goal is reached via simulation
    useEffect(() => {
        if (loading) {
            setPrevLoading(true);
            return;
        }

        // Only check for celebration if we just finished loading
        if (prevLoading && !loading && simulationData && targetGoal) {
            const projectedValue = simulationData.projected && simulationData.projected[0] ? simulationData.projected[0].value : 0;
            const goal = parseFloat(targetGoal);

            // If goal met and haven't celebrated yet
            if (projectedValue >= goal && !hasCelebrated && goal > 0) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#22c55e', '#f59e0b', '#ffffff']
                });
                setHasCelebrated(true);
            }
            setPrevLoading(false);
        }
    }, [loading, simulationData, targetGoal, hasCelebrated, prevLoading]);

    // calculate goal
    const calculateGoalRequirement = () => {
        if (!targetGoal || !simulationData || !simulationData.predictions || simulationData.predictions.length === 0) return null;

        // Simple heuristic: If we need X to reach Goal, and current prediction is Y...
        // We assume linear relationship: Goal = Prediction * RequiredMultiplier
        // RequiredMultiplier = Goal / Prediction
        // Only valid if prediction > 0
        const basePrediction = simulationData.predictions[0].value; // First future point
        if (basePrediction <= 0) return null;

        const reqMultiplier = parseFloat(targetGoal) / basePrediction;
        const reqGrowth = ((reqMultiplier - 1) * 100).toFixed(1);

        return { reqMultiplier, reqGrowth };
    };

    const goalResult = calculateGoalRequirement();

    if (categories.length === 0) return null;

    return (
        <div className="glass-card rounded-xl p-6 mb-6 border border-indigo-500/20 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                {/* Left: Controls */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            AI Simulator
                        </h2>
                        <p className="text-sm text-slate-400">Simulate future scenarios using AI.</p>
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full mt-2 bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Sliders */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-300 font-medium flex items-center gap-1">
                                <Sliders className="w-3.5 h-3.5" /> Growth Factor
                            </span>
                            <span className={`font-bold ${multiplier >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {multiplier >= 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={multiplier}
                            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                            className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>-50%</span>
                            <span>0%</span>
                            <span>+100%</span>
                        </div>
                    </div>

                    {/* Goal Seeking */}
                    <div className="p-4 bg-dark-700/30 rounded-lg border border-white/5">
                        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 mb-2">
                            <Target className="w-3.5 h-3.5" /> Goal Seeking
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">$</span>
                            <input
                                type="number"
                                placeholder="Target value..."
                                value={targetGoal}
                                onChange={(e) => setTargetGoal(e.target.value)}
                                className="w-full bg-dark-800 border border-dark-600 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {goalResult && (
                            <div className="mt-3 text-xs">
                                <p className="text-slate-300">To reach <span className="text-white font-bold">{targetGoal}</span>:</p>
                                <p className="mt-1 text-indigo-300">
                                    You need <span className="font-bold text-indigo-400">{goalResult.reqGrowth > 0 ? '+' : ''}{goalResult.reqGrowth}%</span> growth.
                                </p>
                                <button
                                    onClick={() => setMultiplier(goalResult.reqMultiplier)}
                                    className="mt-2 text-[10px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-2 py-1 rounded transition-colors"
                                >
                                    Apply this growth
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="w-full lg:w-2/3 min-h-[300px] flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                            {error}
                        </div>
                    ) : simulationData ? (
                        <>
                            {/* Comparison Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-dark-700/30 border border-white/5">
                                    <p className="text-xs text-slate-500">Baseline Prediction (Next Period)</p>
                                    <p className="text-lg font-bold text-slate-300">
                                        {simulationData.predictions && simulationData.predictions[0] ? simulationData.predictions[0].value : '—'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                    <p className="text-xs text-indigo-300">Simulated Result</p>
                                    <p className="text-lg font-bold text-indigo-400">
                                        {simulationData.projected && simulationData.projected[0] ? simulationData.projected[0].value : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="flex-1 w-full h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                        ...simulationData.original.map(d => ({ name: d.label, original: d.value, projected: d.value })), // Historical context (mocked for now, strictly we should pass history)
                                        // Actually the backend response only gives predictions. We should probably mix in some history if we want a nice chart.
                                        // But for MVP, let's just show the future comparison.
                                        ...simulationData.predictions.map((p, i) => ({
                                            name: p.label,
                                            original: p.value,
                                            projected: simulationData.projected[i].value
                                        }))
                                    ]}>
                                        <defs>
                                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="projColor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.2)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                                            itemStyle={{ fontSize: 12 }}
                                        />
                                        <Area type="monotone" dataKey="original" stroke="#6366f1" strokeWidth={2} name="Baseline" fill="url(#splitColor)" />
                                        <Area type="monotone" dataKey="projected" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" name="Simulated" fill="url(#projColor)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            Select a category to start simulation
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
