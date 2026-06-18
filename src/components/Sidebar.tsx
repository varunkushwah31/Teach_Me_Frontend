import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Upload, LogOut, BookOpen, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <aside
      className={`flex flex-col bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 transition-all duration-300 ${
        collapsed ? 'w-17' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/60">
        <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/20">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="text-lg font-bold text-white tracking-tight">TeachMe</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink to="/chat" className={linkClass} title="Chat">
          <MessageSquare className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Chat</span>}
        </NavLink>
        <NavLink to="/upload" className={linkClass} title="Upload Documents">
          <Upload className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Upload Documents</span>}
        </NavLink>
        <NavLink to="/settings" className={linkClass} title="Settings">
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800/60 space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all w-full"
          title="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
