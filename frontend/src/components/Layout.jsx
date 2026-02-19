import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);

    // Sync theme from user profile on load
    useEffect(() => {
        if (user?.theme && user.theme !== theme) {
            setTheme(user.theme);
        }
    }, [user, theme, setTheme]);

    return (
        <div className="flex min-h-screen bg-dark-900">
            <Sidebar collapsed={collapsed} />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar onToggleSidebar={() => setCollapsed(!collapsed)} collapsed={collapsed} />
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
