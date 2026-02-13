import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, Activity, Search, Bell, Menu, ChevronDown, User, Settings, LogOut, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../assets/Logo.jpeg';

const Navbar = () => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Documents', path: '/documents', icon: FileText },
        { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
        { name: 'Life Audit', path: '/life-audit', icon: Activity },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Logo & Brand */}
                <div className="flex items-center gap-8">
                    <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src={Logo} alt="Logo" className="h-9 w-9 rounded-xl shadow-sm object-cover" />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                            DOXRADAR
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-gray-100">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isActive
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                >
                                    {isActive && <link.icon size={16} className="text-blue-600" />}
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Search Bar - Desktop */}
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none placeholder-gray-400"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">⌘K</span>
                        </div>
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                        >
                            <div className="text-right hidden sm:block mr-1">
                                <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-blue-700 transition-colors">
                                    {user.name || 'User'}
                                </p>
                                <p className="text-[11px] text-gray-400 font-medium">Free Plan</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[2px] shadow-md group-hover:shadow-lg transition-all">
                                <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                                    <span className="font-bold text-sm bg-gradient-to-tr from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black/5"
                                >
                                    <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-gray-900 truncate">{user.name || 'User'}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email || 'user@example.com'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2 space-y-1">
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                                            <User size={18} className="text-gray-400" />
                                            Account Settings
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                                            <Settings size={18} className="text-gray-400" />
                                            Preferences
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                                            <CreditCard size={18} className="text-gray-400" />
                                            Billing
                                            <span className="ml-auto text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">New</span>
                                        </button>
                                    </div>

                                    <div className="p-2 border-t border-gray-100">
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                                            <HelpCircle size={18} className="text-gray-400" />
                                            Help & Support
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                                        >
                                            <LogOut size={18} />
                                            Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
