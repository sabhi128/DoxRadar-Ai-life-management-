import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, Activity, Search, Bell, Menu } from 'lucide-react';
import Logo from '../assets/Logo.jpeg';

const Navbar = () => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Documents', path: '/documents' },
        { name: 'Subscriptions', path: '/subscriptions' },
        { name: 'Life Audit', path: '/life-audit' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <nav className="bg-surface sticky top-0 z-50 border-b border-border-light px-6 py-4 flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <img src={Logo} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
                    <span className="text-xl font-bold text-text-main tracking-tight">DOXRADAR</span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center ml-10 gap-1">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                                        ? 'bg-text-main text-white'
                                        : 'text-text-muted hover:text-text-main hover:bg-gray-100'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Quick search here..."
                        className="pl-9 pr-4 py-2 bg-bg-gray rounded-full text-sm w-64 border-none focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
                    />
                </div>

                <button className="p-2 rounded-full bg-white border border-border-light text-text-muted hover:text-primary hover:border-primary transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-danger rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-border-light">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-text-main leading-none">{user.name || 'User'}</p>
                        <button onClick={handleLogout} className="text-xs text-text-muted hover:text-danger mt-1">Logout</button>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {user.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
