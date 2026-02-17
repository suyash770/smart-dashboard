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
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/add-data', label: 'Add Data', icon: PlusCircle },
        { path: '/manage-data', label: 'Manage Data', icon: List },
        { path: '/predictions', label: 'Predictions', icon: BrainCircuit },
        { path: '/profile', label: 'Profile', icon: UserCircle },
        { path: '/about-developer', label: 'Developer', icon: Code2 },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside
            className={`${collapsed ? 'w-[72px]' : 'w-[240px]'}
            h-screen sticky top-0 flex flex-col
            bg-dark-800 border-r border-dark-600/50
            transition-all duration-300 ease-in-out`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-600/50">
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
                {/* User badge */}
                {!collapsed && user && (
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-1 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-400">
                                {user.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-300 truncate">{user.username}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    text-slate-400 hover:text-red-400 hover:bg-red-500/10
                    transition-all duration-200 w-full cursor-pointer"
                >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center p-2 rounded-lg
                    text-slate-500 hover:text-slate-300 hover:bg-dark-700/50
                    transition-all duration-200 cursor-pointer"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>
        </aside>
    );
}
