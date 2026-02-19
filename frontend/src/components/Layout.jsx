import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);

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
