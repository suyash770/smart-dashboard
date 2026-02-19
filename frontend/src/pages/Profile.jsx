import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { UserCircle, Mail, Shield, Calendar, Camera, Loader2, Sun, Moon, Save } from 'lucide-react';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const fileInputRef = useRef();
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [notifications, setNotifications] = useState(user?.notifications || { email: true });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (user) {
            setAvatar(user.avatar || '');
            if (user.notifications) setNotifications(user.notifications);
        }
    }, [user]);

    // Password state
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');
        if (passwords.new !== passwords.confirm) {
            setPassError("New passwords don't match");
            return;
        }
        if (passwords.new.length < 7) {
            setPassError("Password must be at least 7 chars");
            return;
        }
        setPassLoading(true);
        try {
            await api.put('/auth/update-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            setPassSuccess('Password updated successfully');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            setPassError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPassLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500000) {
            alert('Image must be under 500KB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setAvatar(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await api.put('/auth/profile', { avatar, theme, notifications });
            updateUser({
                avatar: res.data.avatar,
                theme: res.data.theme,
                notifications: res.data.notifications
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Feb 2026';

    const infoItems = [
        { label: 'Username', value: user?.username, icon: UserCircle, color: '#6366f1' },
        { label: 'Email', value: user?.email, icon: Mail, color: '#22c55e' },
        { label: 'Role', value: 'User', icon: Shield, color: '#f59e0b' },
        { label: 'Member Since', value: memberSince, icon: Calendar, color: '#ec4899' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">Profile & Settings</h1>
                <p className="text-slate-400 text-sm">Manage your account, avatar, and theme preferences.</p>
            </div>

            {/* Avatar + Name */}
            <div className="glass-card rounded-xl p-8 mb-6 flex items-center gap-6">
                <div className="relative group">
                    {avatar ? (
                        <img src={avatar} alt="Avatar"
                            className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/30" />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <span className="text-3xl font-bold text-indigo-400">
                                {user?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <Camera className="w-5 h-5 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*"
                        className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">{user?.username}</h2>
                    <p className="text-sm text-slate-400">{user?.email}</p>
                    <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider
                        bg-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-md">
                        Active
                    </span>
                </div>
            </div>

            {/* Application Settings (Theme & Notifications) */}
            <div className="glass-card rounded-xl p-5 mb-6 space-y-6">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Appearance</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Switch between dark and light theme</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative flex items-center w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer
                        ${theme === 'dark' ? 'bg-indigo-600' : 'bg-amber-400'}`}
                    >
                        <span className={`absolute w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center
                            ${theme === 'dark' ? 'translate-x-1' : 'translate-x-8'}`}>
                            {theme === 'dark'
                                ? <Moon className="w-3 h-3 text-indigo-600" />
                                : <Sun className="w-3 h-3 text-amber-500" />}
                        </span>
                    </button>
                </div>

                {/* Notification Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Email Notifications</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Receive alerts for critical data changes</p>
                    </div>
                    <button
                        onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                        className={`relative flex items-center w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer
                        ${notifications.email ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                        <span className={`absolute w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200
                            ${notifications.email ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mb-6
                transition-all duration-200 cursor-pointer
                ${saved
                        ? 'bg-emerald-600 text-white'
                        : saving
                            ? 'bg-dark-700 text-slate-400'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    }`}
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
            </button>

            {/* Change Password */}
            <div className="glass-card rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                <form onSubmit={handlePasswordUpdate} className="grid gap-4">
                    <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Current Password</label>
                        <input
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full bg-dark-900/50 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">New Password</label>
                        <input
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full bg-dark-900/50 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full bg-dark-900/50 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={passLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 mt-2 w-fit cursor-pointer"
                    >
                        {passLoading ? 'Updating...' : 'Update Password'}
                    </button>
                    {passError && <p className="text-red-400 text-xs mt-1">{passError}</p>}
                    {passSuccess && <p className="text-emerald-400 text-xs mt-1">{passSuccess}</p>}
                </form>
            </div>


            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {infoItems.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="glass-card rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4" style={{ color }} />
                            <span className="text-xs text-slate-500">{label}</span>
                        </div>
                        <p className="text-base font-semibold text-white">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
