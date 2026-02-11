import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, Activity, LogOut } from 'lucide-react';
import Logo from '../assets/Logo.jpeg';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'Documents', path: '/documents' },
        { icon: CreditCard, label: 'Subscriptions', path: '/subscriptions' },
        { icon: Activity, label: 'Life Audit', path: '/life-audit' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="h-screen w-64 bg-dark-surface/80 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-center">
                <div className="relative group cursor-pointer">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center gap-3 bg-dark-bg p-2 rounded-lg ring-1 ring-white/10">
                        <img src={Logo} alt="DoxRadar Logo" className="h-10 w-auto rounded-md object-contain" />
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-dim-text">DoxRadar</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5'
                                    : 'text-dim-text hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="font-medium relative z-10">{item.label}</span>
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-dim-text hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
