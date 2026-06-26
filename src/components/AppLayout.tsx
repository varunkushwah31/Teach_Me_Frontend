    import React, { useState } from 'react';
    import { Outlet, Navigate } from 'react-router-dom';
    import Sidebar from './Sidebar';
    import { useAuth } from '../context/AuthContext';
    
    const AppLayout: React.FC = () => {
        const { isAuthenticated } = useAuth();
        const [collapsed, setCollapsed] = useState(false);
    
        if (!isAuthenticated) return <Navigate to="/login" replace />;
    
        return (
            <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
                <main className="flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        );
    };
    
    export default AppLayout;