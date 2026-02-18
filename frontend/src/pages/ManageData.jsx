import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Database, Trash2, Loader2, Pencil, Check, X, Download, FileText, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

export default function ManageData() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({ label: '', value: '', category: '' });
    const [saving, setSaving] = useState(false);
    const printRef = useRef();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Sorting state
    const [sortKey, setSortKey] = useState('date');
    const [sortDir, setSortDir] = useState('desc');

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

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await api.delete(`/data/${id}`);
            setData(prev => prev.filter(d => d._id !== id));
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const startEdit = (entry) => {
        setEditId(entry._id);
        setEditForm({ label: entry.label, value: entry.value, category: entry.category });
    };

    const cancelEdit = () => { setEditId(null); setEditForm({ label: '', value: '', category: '' }); };

    const saveEdit = async () => {
        setSaving(true);
        try {
            const res = await api.put(`/data/${editId}`, {
                label: editForm.label,
                value: Number(editForm.value),
                category: editForm.category,
            });
            setData(prev => prev.map(d => d._id === editId ? res.data : d));
            setEditId(null);
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // Click-to-edit: auto-save on blur
    const handleInlineClick = (entry, field) => {
        if (editId) return; // already editing
        setEditId(entry._id);
        setEditForm({ label: entry.label, value: entry.value, category: entry.category });
    };

    const handleBlurSave = async () => {
        await saveEdit();
    };

    // --- Sorting ---
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ column }) => {
        if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 text-indigo-400" />
            : <ArrowDown className="w-3 h-3 text-indigo-400" />;
    };

    // --- Export CSV ---
    const exportCSV = () => {
        const rows = [['Label', 'Value', 'Category', 'Date']];
        sorted.forEach(d => {
            rows.push([
                d.label,
                d.value,
                d.category,
                new Date(d.date).toLocaleDateString('en-US')
            ]);
        });
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartdash-data-${filter === 'All' ? 'all' : filter}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- Export PDF ---
    const exportPDF = () => {
        const printWindow = window.open('', '_blank');
        const tableRows = sorted.map(d => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${d.label}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600">${d.value}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${d.category}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            </tr>
        `).join('');

        const totalValue = sorted.reduce((s, d) => s + d.value, 0);
        const html = `<!DOCTYPE html><html><head><title>SmartDash Report</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; padding: 8px 12px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
            .summary { margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 14px; }
            .summary strong { color: #6366f1; }
        </style></head><body>
            <h1>📊 SmartDash Data Report</h1>
            <p class="meta">Category: ${filter} · Generated: ${new Date().toLocaleString()} · ${sorted.length} entries</p>
            <table>
                <thead><tr><th>Label</th><th>Value</th><th>Category</th><th>Date</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
            <div class="summary">
                <strong>Total Value:</strong> ${totalValue.toLocaleString()} · 
                <strong>Average:</strong> ${sorted.length > 0 ? (totalValue / sorted.length).toFixed(1) : '—'} · 
                <strong>Entries:</strong> ${sorted.length}
            </div>
            <script>window.onload = () => { window.print(); }</script>
        </body></html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const categoryOptions = ['Revenue', 'Users', 'Performance', 'Sales', 'General'];
    const categories = ['All', ...new Set(data.map(d => d.category))];
    const afterCategoryFilter = filter === 'All' ? data : data.filter(d => d.category === filter);
    const filtered = searchQuery.trim()
        ? afterCategoryFilter.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : afterCategoryFilter;

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'label') cmp = a.label.localeCompare(b.label);
        else if (sortKey === 'value') cmp = a.value - b.value;
        else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
        else if (sortKey === 'date') cmp = new Date(a.date) - new Date(b.date);
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const sortableHeaders = [
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
        { key: 'category', label: 'Category' },
        { key: 'date', label: 'Date' },
    ];

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
                    <h1 className="text-2xl font-bold text-white mb-1">Manage Data</h1>
                    <p className="text-slate-400 text-sm">View, edit, sort, filter, export, and manage your data entries.</p>
                </div>
                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportCSV}
                        disabled={sorted.length === 0}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold
                        bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 cursor-pointer
                        disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                    >
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button
                        onClick={exportPDF}
                        disabled={sorted.length === 0}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold
                        bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 cursor-pointer
                        disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                    >
                        <FileText className="w-3.5 h-3.5" /> PDF Report
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search entries by label..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-700/50 border border-dark-600/30
                    text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50
                    transition-all duration-200"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                        ${filter === cat
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'bg-dark-700/50 text-slate-400 hover:text-slate-200 hover:bg-dark-700'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-500">{sorted.length} entries</span>
            </div>

            {/* Table */}
            <div className="glass-card rounded-xl overflow-hidden" ref={printRef}>
                {sorted.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-dark-600/30">
                                    {sortableHeaders.map(({ key, label }) => (
                                        <th key={key}
                                            onClick={() => handleSort(key)}
                                            className="px-5 py-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider
                                            cursor-pointer hover:text-slate-300 transition-colors select-none"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {label}
                                                <SortIcon column={key} />
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-5 py-3 text-[11px] text-slate-500 font-semibold uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((entry) => (
                                    <tr key={entry._id} className="border-b border-dark-600/20 hover:bg-dark-700/30 transition-colors">
                                        {editId === entry._id ? (
                                            <>
                                                <td className="px-5 py-2">
                                                    <input value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                                        onBlur={handleBlurSave}
                                                        autoFocus
                                                        className="bg-dark-700 border border-dark-500 rounded-md px-2.5 py-1.5 text-sm text-white w-full focus:border-indigo-500 outline-none" />
                                                </td>
                                                <td className="px-5 py-2">
                                                    <input type="number" value={editForm.value} onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                                                        onBlur={handleBlurSave}
                                                        className="bg-dark-700 border border-dark-500 rounded-md px-2.5 py-1.5 text-sm text-white w-24 focus:border-indigo-500 outline-none" />
                                                </td>
                                                <td className="px-5 py-2">
                                                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                        className="bg-dark-700 border border-dark-500 rounded-md px-2.5 py-1.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer">
                                                        {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-5 py-2 text-slate-400 text-xs">
                                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={saveEdit} disabled={saving}
                                                            className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                                                            title="Save">
                                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button onClick={cancelEdit}
                                                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-dark-600 transition-all cursor-pointer"
                                                            title="Cancel">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-5 py-3 text-white font-medium cursor-pointer hover:text-indigo-400 transition-colors"
                                                    onClick={() => handleInlineClick(entry, 'label')}
                                                    title="Click to edit">
                                                    {entry.label}
                                                </td>
                                                <td className="px-5 py-3 text-indigo-400 font-semibold cursor-pointer hover:text-indigo-300 transition-colors"
                                                    onClick={() => handleInlineClick(entry, 'value')}
                                                    title="Click to edit">
                                                    {entry.value}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="text-[11px] font-medium bg-dark-600/50 text-slate-300 px-2 py-0.5 rounded-md">
                                                        {entry.category}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-400 text-xs">
                                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => startEdit(entry)}
                                                            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10
                                                            transition-all duration-200 cursor-pointer"
                                                            title="Edit entry"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry._id)}
                                                            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10
                                                            transition-all duration-200 cursor-pointer"
                                                            title="Delete entry"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-16 text-center">
                        <Database className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                        <p className="text-slate-400 text-sm">
                            {filter === 'All' ? 'No data yet — add entries from the sidebar' : `No entries in "${filter}"`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
