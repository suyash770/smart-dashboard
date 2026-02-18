import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, BrainCircuit, LogOut,
    ChevronLeft, ChevronRight, Activity, UserCircle, List, Code2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/add-data', label: 'Add Data', icon: PlusCircle },
        { path: '/manage-data', label: 'Manage Data', icon: List },
        { path: '/predictions', label: 'Predictions', icon: BrainCircuit },
        { path: '/profile', label: 'Profile', icon: UserCircle },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside
            className={`${collapsed ? 'w-[72px]' : 'w-[240px]'}
            h-screen sticky top-0 flex flex-col
            bg-dark-800 border-r border-dark-600/50
            transition-all duration-300 ease-in-out`}
        >
            {/* Logo + Toggle */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-600/50">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center p-1.5 rounded-lg
                    text-slate-500 hover:text-white hover:bg-dark-700
                    transition-all duration-200 cursor-pointer mr-1"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>

                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                {!collapsed && (
                    <div className="animate-fade-in">
                        <h1 className="text-sm font-bold text-white tracking-tight">SmartDash</h1>
                        <p className="text-[10px] text-slate-500 font-medium">AI Analytics</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                            transition-all duration-200 group relative
                            ${isActive
                                ? 'bg-accent/15 text-indigo-400'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-400 rounded-r-full" />
                                )}
                                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                                {!collapsed && <span className="animate-fade-in">{label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User + Bottom */}
            <div className="px-2 pb-3 flex flex-col gap-1 border-t border-dark-600/50 pt-3">

                {/* Developer Link */}
                <NavLink
                    to="/about-developer"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 group relative
                        ${isActive
                            ? 'bg-accent/15 text-indigo-400'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Code2 className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                            {!collapsed && <span className="animate-fade-in">Developer</span>}
                        </>
                    )}
                </NavLink>

                {/* User badge & Logout */}
                {!collapsed && user ? (
                    <div className="flex items-center justify-between px-3 py-2 mb-1 animate-fade-in bg-dark-700/30 rounded-lg">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-indigo-400">
                                    {user.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-300 truncate max-w-[80px]">{user.username}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    // Collapsed state or no user
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center p-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </aside>
    );
}
