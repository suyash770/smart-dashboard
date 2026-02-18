import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Trash2, Settings, Plus, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAlertsModal, setShowAlertsModal] = useState(false);
    const dropdownRef = useRef(null);

    // Alerts State
    const [alerts, setAlerts] = useState([]);
    const [newAlert, setNewAlert] = useState({ category: 'Revenue', condition: 'lt', threshold: '' });
    const [categories, setCategories] = useState([]);

    // Fetch Notifications
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/alerts/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    // Fetch Alerts & Categories
    const fetchAlertsData = async () => {
        try {
            const [alertsRes, catsRes] = await Promise.all([
                api.get('/alerts'),
                api.get('/data/categories')
            ]);
            setAlerts(alertsRes.data);
            setCategories(catsRes.data);
            if (catsRes.data.length > 0 && !newAlert.category) {
                setNewAlert(prev => ({ ...prev, category: catsRes.data[0] }));
            }
        } catch (err) {
            console.error('Failed to fetch alerts data', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for notifications every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/alerts/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const deleteAlert = async (id) => {
        try {
            await api.delete(`/alerts/${id}`);
            setAlerts(prev => prev.filter(a => a._id !== id));
        } catch (err) {
            console.error('Failed to delete alert', err);
        }
    };

    const createAlert = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/alerts', newAlert);
            setAlerts([...alerts, res.data]);
            setNewAlert({ ...newAlert, threshold: '' });
        } catch (err) {
            alert('Failed to create alert');
        }
    };

    return (
        <div className="h-16 px-8 flex items-center justify-between bg-dark-900 border-b border-white/5 sticky top-0 z-40 backdrop-blur-md bg-dark-900/80">
            {/* Left side (Breadcrumbs or Page Title - Optional) */}
            <div></div>

            {/* Right side icons */}
            <div className="flex items-center gap-4">
                {/* Manage Alerts Button */}
                <button
                    onClick={() => { setShowAlertsModal(true); fetchAlertsData(); }}
                    className="p-2 text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    <span>Manage Alerts</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-2 text-slate-400 hover:text-white transition-colors relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-dark-900" />
                        )}
                    </button>

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden animate-fade-in origin-top-right">
                            <div className="p-3 border-b border-dark-600 flex justify-between items-center bg-dark-700/50">
                                <h3 className="text-sm font-bold text-white">Notifications</h3>
                                <span className="text-xs text-slate-500">{unreadCount} unread</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div key={n._id} className={`p-3 border-b border-dark-700/50 hover:bg-white/5 transition-colors ${n.read ? 'opacity-60' : 'bg-indigo-500/5'}`}>
                                            <div className="flex gap-3">
                                                <div className="mt-1">
                                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-slate-200">{n.message}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">{new Date(n.date).toLocaleString()}</p>
                                                </div>
                                                {!n.read && (
                                                    <button onClick={() => markAsRead(n._id)} className="self-start text-indigo-400 hover:text-white" title="Mark as read">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        No notifications yet.
                                    </div>
                                )}
                            </div>
                            <div className="p-2 border-t border-dark-600 bg-dark-700/30 text-center">
                                <button onClick={fetchNotifications} className="text-xs text-indigo-400 hover:text-indigo-300">Refresh</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Alerts Modal */}
            {showAlertsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowAlertsModal(false)}
                >
                    <div
                        className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-dark-600 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-400" />
                                Smart Alerts
                            </h2>
                            <button
                                onClick={() => setShowAlertsModal(false)}
                                className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <X className="w-4 h-4" />
                                <span>Close</span>
                            </button>
                        </div>

                        {/* Create Alert Form */}
                        <div className="p-5 bg-dark-700/30 border-b border-dark-600">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3">Create New Alert</h3>
                            <form onSubmit={createAlert} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500 block mb-1">Category</label>
                                    <select
                                        value={newAlert.category}
                                        onChange={e => setNewAlert({ ...newAlert, category: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-slate-500 block mb-1">Condition</label>
                                    <select
                                        value={newAlert.condition}
                                        onChange={e => setNewAlert({ ...newAlert, condition: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                    >
                                        <option value="lt">Below (&lt;)</option>
                                        <option value="gt">Above (&gt;)</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-slate-500 block mb-1">Value</label>
                                    <input
                                        type="number"
                                        value={newAlert.threshold}
                                        onChange={e => setNewAlert({ ...newAlert, threshold: e.target.value })}
                                        className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </form>
                        </div>

                        {/* Alerts List */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-slate-300">Active Alerts</h3>
                            {alerts.length > 0 ? (
                                alerts.map(alert => (
                                    <div key={alert._id} className="flex items-center justify-between p-3 rounded-lg bg-dark-700/20 border border-dark-600/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {alert.category} {alert.condition === 'gt' ? '>' : '<'} {alert.threshold}
                                                </p>
                                                <p className="text-xs text-slate-500">Active</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteAlert(alert._id)}
                                            className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 text-sm py-8 border border-dashed border-dark-600 rounded-xl">No active alerts</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
