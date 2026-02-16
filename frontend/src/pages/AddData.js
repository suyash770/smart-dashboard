import { useState } from 'react';
import api from '../services/api';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddData() {
    const [label, setLabel] = useState('');
    const [value, setValue] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const categories = ['General', 'Revenue', 'Users', 'Performance', 'Sales'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await api.post('/data/add', { label, value: Number(value), category });
            setMessage({ type: 'success', text: 'Data entry added successfully!' });
            setLabel('');
            setValue('');
            setCategory('General');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add data' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">Add Data</h1>
                <p className="text-slate-400 text-sm">Add new data entries to your dashboard.</p>
            </div>

            <div className="max-w-lg">
                <div className="glass-card rounded-xl p-6">
                    {message.text && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-5 ${message.type === 'success'
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}>
                            {message.type === 'success'
                                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Label</label>
                            <input
                                type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Monthly Revenue" required
                                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                                text-sm text-white placeholder-slate-600
                                focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                                transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Value</label>
                            <input
                                type="number" value={value} onChange={(e) => setValue(e.target.value)}
                                placeholder="e.g. 500" required
                                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                                text-sm text-white placeholder-slate-600
                                focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                                transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Category</label>
                            <select
                                value={category} onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                                text-sm text-white
                                focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                                transition-all duration-200 cursor-pointer"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="flex items-center justify-center gap-2 w-full py-2.5 mt-2
                            bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg
                            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                            shadow-lg shadow-indigo-600/20 cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {loading ? 'Adding...' : 'Add Entry'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
