import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X } from 'lucide-react';

export default function NLSearch({ onSearch, categories = [] }) {
    const [query, setQuery] = useState('');
    const [parsedIntent, setParsedIntent] = useState(null);

    // Simple Regex Parser
    const parseQuery = React.useCallback((text) => {
        if (!text) return null;
        const lower = text.toLowerCase();
        let intent = { category: null, valueOp: null, value: null, dateRange: null };

        // 1. Detect Category
        // We match against the provided categories list
        const foundCat = categories.find(cat => lower.includes(cat.toLowerCase()));
        if (foundCat) intent.category = foundCat;

        // 2. Detect Value Operations
        // Matches: "above 500", "> 500", "greater than 500"
        const gtMatch = lower.match(/(?:above|greater than|over|>) ?\$? ?([\d,]+)/);
        if (gtMatch) {
            intent.valueOp = 'gt';
            intent.value = parseFloat(gtMatch[1].replace(/,/g, ''));
        }

        // Matches: "below 500", "< 500", "less than 500"
        const ltMatch = lower.match(/(?:below|less than|under|<) ?\$? ?([\d,]+)/);
        if (ltMatch) {
            intent.valueOp = 'lt';
            intent.value = parseFloat(ltMatch[1].replace(/,/g, ''));
        }

        // 3. Detect Date Range
        if (lower.includes('last week') || lower.includes('7 days')) intent.dateRange = '7d';
        if (lower.includes('last month') || lower.includes('30 days')) intent.dateRange = '30d';
        if (lower.includes('last year') || lower.includes('year')) intent.dateRange = '90d'; // Mapping to existing 90d or custom

        return intent;
    }, [categories]);

    useEffect(() => {
        const intent = parseQuery(query);
        setParsedIntent(intent);
    }, [query, parseQuery]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (parsedIntent) {
            onSearch(parsedIntent);
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={`w-5 h-5 transition-colors ${query ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask AI: 'Show Revenue above 5,000 last month'..."
                    className="block w-full pl-11 pr-12 py-3 bg-dark-800/80 border border-dark-600 rounded-xl
                    text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                    transition-all shadow-lg text-sm"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setParsedIntent(null); onSearch(null); }}
                        className="absolute inset-y-0 right-12 flex items-center pr-2 text-slate-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Sparkles className={`w-4 h-4 ${parsedIntent && (parsedIntent.category || intentHasValue(parsedIntent)) ? 'text-emerald-400' : 'text-slate-600'}`} />
                </div>
            </form>

            {/* Smart Suggestions / Parsed Intent Feedback */}
            {query && parsedIntent && (parsedIntent.category || intentHasValue(parsedIntent) || parsedIntent.dateRange) && (
                <div className="absolute top-full left-0 mt-2 bg-dark-800 border border-dark-600 rounded-lg p-2 shadow-xl flex items-center gap-2 z-20 animate-fade-in">
                    <span className="text-[10px] uppercase text-slate-500 font-bold ml-1">Interpreting:</span>
                    {parsedIntent.category && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                            Category: {parsedIntent.category}
                        </span>
                    )}
                    {intentHasValue(parsedIntent) && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                            Value {parsedIntent.valueOp === 'gt' ? '>' : '<'} {parsedIntent.value}
                        </span>
                    )}
                    {parsedIntent.dateRange && (
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                            Time: {parsedIntent.dateRange}
                        </span>
                    )}
                    <button
                        onClick={() => onSearch(parsedIntent)}
                        className="ml-auto text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded transition-colors"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}

function intentHasValue(intent) {
    return intent && intent.value !== null && intent.value !== undefined;
}
