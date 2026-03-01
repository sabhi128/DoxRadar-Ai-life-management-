import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, Activity, Search, Bell, Menu, ChevronDown, User, Settings, LogOut, HelpCircle, X, Clock, FileWarning, AlertTriangle, Shield, Zap, MessageSquare, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Logo from '../assets/Logo.jpeg';

// Static navigation links to ensure stable rendering
const NAV_LINKS = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
    { name: 'Life Audit', path: '/life-audit', icon: Activity },
];

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: authUser, signOut, activeModal, setGlobalModal } = useAuth();
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = localUser.name || authUser?.user_metadata?.name || 'User';
    const userEmail = authUser?.email || localUser.email || 'user@example.com';

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const prevNotifIds = useRef(new Set());

    // Global toggle for all mobile menus
    const closeAllMenus = () => {
        setIsMobileMenuOpen(false);
        setIsNotifOpen(false);
        setIsProfileOpen(false);
    };

    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const [nameInput, setNameInput] = useState(userName);
    const [prefLoading, setPrefLoading] = useState(false);
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        aiDocumentAnalysis: true,
        highCostThreshold: 50.0
    });


    // Fetch notifications from dashboard stats
    const fetchNotifications = async () => {
        try {
            setNotifLoading(true);
            const { data } = await api.get('/dashboard/stats');
            const notifs = [];

            // Expired documents
            if (data.expiredDocuments?.length > 0) {
                data.expiredDocuments.forEach(doc => {
                    notifs.push({
                        id: `exp-${doc.id}`,
                        type: 'danger',
                        icon: FileWarning,
                        title: `${doc.name} has expired`,
                        subtitle: doc.category,
                        time: doc.expiryDate,
                        action: () => navigate('/documents'),
                    });
                });
            }

            // Expiring documents
            if (data.expiringDocuments?.length > 0) {
                data.expiringDocuments.forEach(doc => {
                    notifs.push({
                        id: `expiring-${doc.id}`,
                        type: 'warning',
                        icon: Clock,
                        title: `${doc.name} expires in ${doc.daysLeft}d`,
                        subtitle: doc.category,
                        time: doc.expiryDate,
                        action: () => navigate('/documents'),
                    });
                });
            }

            // Upcoming payments
            if (data.upcomingPayments?.length > 0) {
                data.upcomingPayments.forEach(sub => {
                    notifs.push({
                        id: `pay-${sub.id}`,
                        type: sub.daysLeft <= 1 ? 'danger' : 'info',
                        icon: CreditCard,
                        title: `${sub.name} — $${sub.price} due ${sub.daysLeft === 0 ? 'today' : sub.daysLeft === 1 ? 'tomorrow' : `in ${sub.daysLeft}d`}`,
                        subtitle: sub.category,
                        action: () => navigate('/subscriptions'),
                    });
                });
            }

            // High-cost subscriptions
            if (data.highCostSubscriptions?.length > 0) {
                notifs.push({
                    id: 'high-cost',
                    type: 'warning',
                    icon: AlertTriangle,
                    title: `${data.highCostSubscriptions.length} high-cost subscription${data.highCostSubscriptions.length > 1 ? 's' : ''} flagged`,
                    subtitle: 'Review in Subscriptions',
                    action: () => navigate('/subscriptions'),
                });
            }

            // Persistent Autonomous Notifications (Stage 5/6)
            if (data.notifications?.length > 0) {
                data.notifications.forEach(notif => {
                    let Icon = Info;
                    if (notif.type === 'danger') Icon = Shield;
                    if (notif.type === 'warning') Icon = Zap;
                    if (notif.type === 'success') Icon = MessageSquare;

                    notifs.push({
                        id: notif.id,
                        type: notif.type,
                        icon: Icon,
                        title: notif.title,
                        subtitle: notif.message,
                        isPersistent: true,
                        action: async () => {
                            try {
                                await api.put(`/dashboard/notifications/${notif.id}/read`);
                                fetchNotifications(); // Refresh
                            } catch (err) {
                                console.error("Failed to mark notification as read");
                            }
                        }
                    });
                });
            }

            // Trigger toast for new notifications if not initial load
            if (prevNotifIds.current.size > 0) {
                notifs.forEach(notif => {
                    if (!prevNotifIds.current.has(notif.id)) {
                        if (notif.title && notif.title.includes('Scan Started')) {
                            toast.success(notif.title, { icon: '🔄', duration: 6000 });
                        } else if (notif.title && notif.title.includes('Scan Complete')) {
                            toast.success(notif.title, { icon: '✅', duration: 6000 });
                        } else if (notif.title && notif.title.includes('New Document Saved')) {
                            toast.success(notif.title, { icon: '📄', duration: 6000 });
                        } else if (notif.title && notif.title.includes('New Subscription Found')) {
                            toast.success(notif.title, { icon: '💳', duration: 6000 });
                        } else if (notif.type === 'danger') {
                            toast.error(notif.title, { duration: 6000 });
                        } else if (notif.type === 'warning') {
                            toast(notif.title, { icon: '⚠️', duration: 6000 });
                        } else {
                            toast.success(notif.title, { icon: '🔔', duration: 6000 });
                        }
                    }
                });
            }

            // Update seen IDs
            const currentIds = new Set(notifs.map(n => n.id));
            prevNotifIds.current = currentIds;

            setNotifications(notifs);
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            setNotifLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.removeItem('user');
            navigate('/login');
        } catch {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    // Expose global billing modal trigger + Event Listener fallback
    useEffect(() => {
        const handleOpenBilling = () => setGlobalModal('billing');
        window.openBillingModal = handleOpenBilling;
        window.addEventListener('open-billing-modal', handleOpenBilling);

        return () => {
            delete window.openBillingModal;
            window.removeEventListener('open-billing-modal', handleOpenBilling);
        };
    }, []);

    // Fetch notifications periodically (every 30 seconds) for real-time updates
    useEffect(() => {
        fetchNotifications(); // initial fetch
        const intervalId = setInterval(() => {
            fetchNotifications();
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu on Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsMobileMenuOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Close all menus when location changes (User navigated)
    useEffect(() => {
        closeAllMenus();
    }, [location.pathname]);

    // Lock scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    // Fetch user preferences
    const fetchPreferences = async () => {
        try {
            setPrefLoading(true);
            const { data } = await api.get('/users/preferences');
            setPreferences({
                emailNotifications: data.emailNotifications,
                aiDocumentAnalysis: data.aiDocumentAnalysis,
                highCostThreshold: data.highCostThreshold
            });
        } catch (err) {
            console.error('Failed to load preferences', err);
        } finally {
            setPrefLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        const tid = toast.loading('Saving preferences...');
        try {
            await api.put('/users/preferences', preferences);
            toast.success('Preferences saved!', { id: tid });
            setGlobalModal(null);
        } catch (err) {
            toast.error('Failed to save preferences', { id: tid });
        }
    };

    // Load everything on mount
    useEffect(() => {
        fetchPreferences();
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Also refresh when bell panel opens
    useEffect(() => {
        if (isNotifOpen) {
            fetchNotifications();
        }
    }, [isNotifOpen]);

    // Refresh preferences when modal opens
    useEffect(() => {
        if (activeModal === 'preferences') {
            fetchPreferences();
        }
        if (activeModal === 'settings') {
            setNameInput(userName);
        }
    }, [activeModal, userName]);

    const handleUpdateProfile = async () => {
        const tid = toast.loading('Updating profile...');
        try {
            const { data } = await api.put('/auth/profile', { name: nameInput });

            // Update local storage
            const updatedUser = { ...localUser, name: data.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success('Profile updated!', { id: tid });
            setGlobalModal(null);

            // Force a small delay then reload or just let the local storage update reflect
            // Re-loading is safer to ensure all components see the change
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed', { id: tid });
        }
    };

    const notifColors = {
        danger: 'bg-red-50 border-red-100 text-red-700',
        warning: 'bg-amber-50 border-amber-100 text-amber-700',
        info: 'bg-blue-50 border-blue-100 text-blue-700',
    };

    const notifIconColors = {
        danger: 'text-red-500',
        warning: 'text-amber-500',
        info: 'text-blue-500',
    };

    return (
        <>
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
                            {NAV_LINKS.map((link) => {
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
                    <div className="flex items-center gap-2 sm:gap-4">
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

                        {/* Notifications Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => {
                                    const newState = !isNotifOpen;
                                    setIsNotifOpen(newState);
                                    setIsProfileOpen(false);
                                    setIsMobileMenuOpen(false);
                                    if (newState) fetchNotifications();
                                }}
                                className="relative p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold h-5 w-5 min-w-[20px] min-h-[20px] rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform hover:scale-110">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Panel */}
                            <AnimatePresence>
                                {isNotifOpen && (
                                    <motion.div
                                        key="notif-panel"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-full mt-2 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black/5 z-[100]"
                                    >
                                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                                            <h3 className="font-bold text-gray-800">Notifications</h3>
                                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                                {notifications.length}
                                            </span>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto bg-white">
                                            {notifLoading ? (
                                                <div className="flex justify-center py-8">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                <div className="p-2 space-y-1">
                                                    {notifications.map(notif => (
                                                        <button
                                                            key={notif.id}
                                                            onClick={() => { notif.action?.(); setIsNotifOpen(false); }}
                                                            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors hover:opacity-80 ${notifColors[notif.type]}`}
                                                        >
                                                            <notif.icon size={16} className={`mt-0.5 flex-shrink-0 ${notifIconColors[notif.type]}`} />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium leading-tight">{notif.title}</p>
                                                                {notif.subtitle && <p className="text-[10px] mt-0.5 opacity-70">{notif.subtitle}</p>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <Bell size={24} className="mx-auto mb-2" />
                                                    <p className="text-sm">All caught up!</p>
                                                </div>
                                            )}
                                        </div>

                                        {notifications.length > 0 && (
                                            <div className="p-3 border-t border-gray-100 bg-white">
                                                <button
                                                    onClick={() => { navigate('/life-audit'); setIsNotifOpen(false); }}
                                                    className="w-full text-center text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                                                >
                                                    View Full Report →
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(!isProfileOpen);
                                    setIsNotifOpen(false);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                            >
                                <div className="text-right hidden sm:block mr-1">
                                    <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-blue-700 transition-colors">
                                        {userName}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-medium">{localUser.plan === 'Pro' ? 'Pro Plan' : 'Free Plan'}</p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[2px] shadow-md group-hover:shadow-lg transition-all">
                                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                                        <span className="font-bold text-sm bg-gradient-to-tr from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            {userName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        key="profile-dropdown"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-full mt-2 sm:w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black/5 z-[100]"
                                    >
                                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                    {userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-gray-900 truncate">{userName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2 space-y-1 bg-white">
                                            <button
                                                onClick={() => { setIsProfileOpen(false); setGlobalModal('settings'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <User size={18} className="text-gray-400" />
                                                Account Settings
                                            </button>
                                            <button
                                                onClick={() => { setIsProfileOpen(false); setGlobalModal('preferences'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <Settings size={18} className="text-gray-400" />
                                                Preferences
                                            </button>
                                            <button
                                                onClick={() => { setIsProfileOpen(false); setGlobalModal('billing'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <CreditCard size={18} className="text-gray-400" />
                                                Billing
                                                <span className="ml-auto text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">New</span>
                                            </button>
                                        </div>

                                        <div className="p-2 border-t border-gray-100 bg-white">
                                            <button
                                                onClick={() => { setIsProfileOpen(false); setGlobalModal('help'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
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

                        <button
                            onClick={() => {
                                if (isMobileMenuOpen) {
                                    closeAllMenus();
                                } else {
                                    setIsMobileMenuOpen(true);
                                    setIsNotifOpen(false);
                                    setIsProfileOpen(false);
                                }
                            }}
                            className={`md:hidden p-2 rounded-xl transition-all duration-200 ${isMobileMenuOpen ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'} z-[100]`}
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Drawer - High-level isolation for priority */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        key="mobile-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllMenus}
                        className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[9000] md:hidden"
                    />
                )}
                {isMobileMenuOpen && (
                    <motion.div
                        key="mobile-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[300px] bg-white z-[9001] md:hidden shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                            <div className="flex items-center gap-3 font-bold text-lg text-blue-600">
                                <img src={Logo} alt="Logo" className="h-8 w-8 rounded-lg" />
                                <span>DOXRADAR</span>
                            </div>
                            <button
                                onClick={closeAllMenus}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 active:scale-95 transition-all"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto bg-white overscroll-contain">
                            <div className="p-4 pt-6">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Main Navigation</p>
                                <div className="space-y-1">
                                    {(NAV_LINKS || []).map((link) => {
                                        const isActive = link.path === location.pathname;
                                        const LinkIcon = link.icon;
                                        return (
                                            <Link
                                                key={`mob-link-nav-${link.path}`}
                                                to={link.path}
                                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all border outline-none ${isActive
                                                    ? 'bg-blue-50 border-blue-100 text-blue-600 font-bold shadow-sm'
                                                    : 'border-transparent text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                                                    }`}
                                            >
                                                {LinkIcon && <LinkIcon size={22} className={isActive ? 'text-blue-600' : 'text-gray-400'} />}
                                                <span className="text-base">{link.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="px-4 py-8 border-t border-gray-100 mt-4 bg-white">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Your Account</p>
                                <div className="mx-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                            {String(userName || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate text-sm">{userName || 'User'}</p>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">{localUser?.plan || 'Free'} Plan</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { closeAllMenus(); setGlobalModal('billing'); }}
                                        className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <CreditCard size={16} />
                                        Manage Plan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                            <button
                                onClick={() => { closeAllMenus(); handleLogout(); }}
                                className="w-full flex items-center justify-center gap-3 py-4 text-red-600 bg-white border border-red-200 rounded-2xl font-bold hover:bg-red-50 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <LogOut size={20} />
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ========== MODALS ========== */}
            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            {/* Account Settings */}
                            {activeModal === 'settings' && (
                                <>
                                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
                                        <button onClick={() => setGlobalModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={nameInput}
                                                onChange={(e) => setNameInput(e.target.value)}
                                                className="input w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input type="email" defaultValue={userEmail} className="input w-full bg-gray-50 cursor-not-allowed" disabled />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">{localUser.plan || 'Free'} Plan</span>
                                                <button
                                                    onClick={() => { setGlobalModal('billing'); }}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    Upgrade
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <button
                                                onClick={handleUpdateProfile}
                                                className="btn btn-primary w-full"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Preferences */}
                            {activeModal === 'preferences' && (
                                <>
                                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
                                        <button onClick={() => setGlobalModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Email Notifications</p>
                                                <p className="text-xs text-gray-500">Receive alerts for deadlines and renewals</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.emailNotifications}
                                                    onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">AI Document Analysis</p>
                                                <p className="text-xs text-gray-500">Automatically analyze uploaded documents</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.aiDocumentAnalysis}
                                                    onChange={(e) => setPreferences({ ...preferences, aiDocumentAnalysis: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">High-Cost Threshold</p>
                                                <p className="text-xs text-gray-500">Flag subscriptions above this amount</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    value={preferences.highCostThreshold}
                                                    onChange={(e) => setPreferences({ ...preferences, highCostThreshold: e.target.value })}
                                                    className="input w-20 text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <button
                                                onClick={handleSavePreferences}
                                                disabled={prefLoading}
                                                className="btn btn-primary w-full"
                                            >
                                                {prefLoading ? 'Saving...' : 'Save Preferences'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Billing */}
                            {activeModal === 'billing' && (
                                <>
                                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-900">Billing</h2>
                                        <button onClick={() => setGlobalModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                                            <p className="text-xs text-white/70">Current Plan</p>
                                            <p className="text-2xl font-bold">{localUser.plan === 'Pro' ? 'Pro' : 'Free'}</p>
                                            <p className="text-sm text-white/80 mt-1">{localUser.plan === 'Pro' ? 'All features unlocked' : 'Basic features included'}</p>
                                        </div>
                                        <div className="p-4 border border-gray-200 rounded-xl">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="font-bold text-gray-900">Pro Plan</p>
                                                    <p className="text-xs text-gray-500">Unlock all features</p>
                                                </div>
                                                <p className="text-lg font-bold text-primary">$9.99<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                                            </div>
                                            <ul className="text-sm text-gray-600 space-y-1.5 mb-4">
                                                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Unlimited AI analyses</li>
                                                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Advanced financial insights</li>
                                                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Priority support</li>
                                                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Export reports</li>
                                            </ul>
                                            <button
                                                onClick={async () => {
                                                    const isPro = localUser.plan === 'Pro';
                                                    const tid = toast.loading(isPro ? 'Downgrading...' : 'Upgrading...');
                                                    try {
                                                        const endpoint = isPro ? '/auth/downgrade-test' : '/auth/upgrade-test';
                                                        const targetPlan = isPro ? 'Free' : 'Pro';

                                                        await api.post(endpoint);

                                                        const newUser = { ...localUser, plan: targetPlan };
                                                        localStorage.setItem('user', JSON.stringify(newUser));

                                                        toast.success(`${isPro ? 'Downgraded' : 'Upgraded'} successfully! Refreshing...`, { id: tid });
                                                        setTimeout(() => window.location.reload(), 1500);
                                                    } catch (err) {
                                                        toast.error('Action failed', { id: tid });
                                                    }
                                                }}
                                                className={`btn w-full ${localUser.plan === 'Pro' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'btn-primary'}`}
                                            >
                                                {localUser.plan === 'Pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Help & Support */}
                            {activeModal === 'help' && (
                                <>
                                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-900">Help & Support</h2>
                                        <button onClick={() => setGlobalModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                                    </div>
                                    <div className="p-6 space-y-3">
                                        {[
                                            { q: 'How do I upload documents?', a: 'Go to Documents → click "Upload Document" → select a PDF or image file. AI analysis runs automatically.' },
                                            { q: 'How does subscription tracking work?', a: 'Go to Subscriptions → Add your recurring payments. The system flags high-cost items and warns you before renewals.' },
                                            { q: 'What is the Life Audit?', a: 'A monthly intelligence report that aggregates your finances, risks, deadlines, and documents into one actionable overview.' },
                                            { q: 'How do I contact support?', a: 'Email us at support@doxradar.app — we typically respond within 24 hours.' },
                                        ].map((item, i) => (
                                            <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                                                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                                                    {item.q}
                                                    <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform" />
                                                </summary>
                                                <div className="px-4 pb-4 text-sm text-gray-600">
                                                    {item.a}
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
