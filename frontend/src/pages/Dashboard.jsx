import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, MoreVertical, Plus, Activity, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// ... existing imports

// Utility for counting up numbers
const CountUp = ({ end, duration = 2, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / (duration * 1000), 1);

            // Ease out quart
            const easeOutQuart = 1 - Math.pow(1 - percentage, 4);

            setCount(easeOutQuart * end);

            if (progress < duration * 1000) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return (
        <span>{prefix}{typeof end === 'number' && Number.isInteger(end) ? Math.floor(count) : count.toFixed(2)}{suffix}</span>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalDocuments: 0,
        avgCheckIn: '--:--',
        onTimeCompletion: '0%',
        riskLevel: '0%',
        lifeAudit: null,
        spendChartData: []
    });
    const [refreshKey, setRefreshKey] = useState(0);
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openActionId, setOpenActionId] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openActionId && !event.target.closest('.action-menu-container')) {
                setOpenActionId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openActionId]);
    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await axios.get('/api/dashboard/stats', config);
                const activityRes = await axios.get('/api/dashboard/activity', config);

                setStats(statsRes.data);
                setActivityLog(activityRes.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [refreshKey]);

    // Prepare chart data
    const chartData = stats.lifeAudit ? [
        { subject: 'Health', A: stats.lifeAudit.health, fullMark: 10 },
        { subject: 'Career', A: stats.lifeAudit.career, fullMark: 10 },
        { subject: 'Finance', A: stats.lifeAudit.finance, fullMark: 10 },
        { subject: 'Relation', A: stats.lifeAudit.relationships, fullMark: 10 },
        { subject: 'Growth', A: stats.lifeAudit.personalGrowth, fullMark: 10 },
        { subject: 'Fun', A: stats.lifeAudit.recreation, fullMark: 10 },
        { subject: 'Env', A: stats.lifeAudit.environment, fullMark: 10 },
        { subject: 'Spirit', A: stats.lifeAudit.spirituality, fullMark: 10 },
    ] : [];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 50, damping: 15 }
        },
        hover: {
            y: -8,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            transition: { type: "spring", stiffness: 300 }
        }
    };

    return (
        <div className="space-y-8 p-2">
            {/* Top Row Widgets */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Widget 1: Life Balance Overview (Radar Chart) */}
                <motion.div
                    variants={itemVariants}
                    whileHover="hover"
                    className="card p-6 relative flex flex-col h-80 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
                        <Activity size={120} />
                    </div>

                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="p-3 bg-blue-50/80 text-blue-600 rounded-xl shadow-sm backdrop-blur-md">
                            <Activity size={24} />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 relative z-10">Life Balance</h3>
                    <p className="text-sm text-gray-500 mb-4 relative z-10">Overview of your latest audit scores.</p>

                    <div className="flex-1 w-full min-h-0 relative z-10">
                        {stats.lifeAudit ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar
                                        name="My Balance"
                                        dataKey="A"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        fill="#3b82f6"
                                        fillOpacity={0.4}
                                        isAnimationActive={true}
                                        animationDuration={1500}
                                        animationEasing="ease-out"
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                                <p>No audit data yet.</p>
                                <a href="/life-audit" className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium">Start Audit</a>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Widget 2: Monthly Spend (Donut Chart) */}
                <motion.div
                    variants={itemVariants}
                    whileHover="hover"
                    className="card p-6 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl cursor-pointer flex flex-col justify-between h-80 relative overflow-hidden group"
                    onClick={() => window.location.href = '/subscriptions'}
                >
                    <div className="absolute -bottom-10 -right-10 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <CreditCard size={180} />
                    </div>

                    <div className="absolute top-6 left-6 z-10 pointer-events-none">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-3 bg-purple-50/80 text-purple-600 rounded-xl shadow-sm backdrop-blur-md">
                                <CreditCard size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Monthly Spend</h3>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 relative z-10 mt-8">
                        {stats.spendChartData && stats.spendChartData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.spendChartData}
                                            cx="50%"
                                            cy="55%"
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="amount"
                                            cornerRadius={6}
                                            stroke="none"
                                        >
                                            {stats.spendChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => `$${value}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
                                    <span className="text-4xl font-extrabold text-gray-800 tracking-tight">
                                        <CountUp end={parseFloat(stats.totalMonthlyCost)} prefix="$" />
                                    </span>
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Total / Month</span>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <p className="text-2xl font-bold mb-2">$0.00</p>
                                    <p className="text-sm">No spending data</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Widget 3: Document Stats */}
                <motion.div
                    variants={itemVariants}
                    whileHover="hover"
                    className="card p-6 bg-gradient-to-br from-indigo-600 via-primary to-purple-700 text-white shadow-xl shadow-primary/20 relative overflow-hidden cursor-pointer group h-80 flex flex-col"
                    onClick={() => window.location.href = '/documents'}
                >
                    {/* Animated Background Mesh */}
                    <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                <Plus size={20} className="text-white" />
                            </div>
                            <span className="font-bold text-white/90 text-lg">Documents</span>
                        </div>

                        <div className="mb-2 mt-auto">
                            <span className="text-6xl font-black tracking-tighter">
                                <CountUp end={stats.totalDocuments} duration={2.5} />
                            </span>
                        </div>
                        <h3 className="text-xl font-medium mb-6 text-white/90">Files Stored</h3>

                        <p className="text-sm text-white/70 leading-relaxed mb-6 max-w-[80%]">
                            Securely managed in your personal cloud.
                        </p>

                        <div className="mt-auto">
                            <div className="flex justify-between text-xs text-white/60 mb-2">
                                <span>Storage Used</span>
                                <span>60%</span>
                            </div>
                            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '60%' }} // Just a visual indicator
                                    className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    transition={{ duration: 1.5, delay: 0.5, type: "spring" }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom Row: Table */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="card p-8 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100"
            >
                {/* ... (keep header) */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                            <p className="text-sm text-gray-500">Latest updates from your workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                            onClick={() => setRefreshKey(k => k + 1)}
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        {/* ... (keep thead) */}
                        <thead>
                            <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <th className="pb-5 pl-4">Name</th>
                                <th className="pb-5">Category</th>
                                <th className="pb-5">Date Added</th>
                                <th className="pb-5">Status</th>
                                <th className="pb-5 text-right pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {activityLog.length > 0 ? (
                                activityLog.map((item, index) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (index * 0.1) }}
                                        className="group hover:bg-gray-50/80 transition-all duration-200"
                                    >
                                        <td className="py-5 pl-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm ${['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-orange-100 text-orange-600'][index % 4]
                                                    }`}>
                                                    {item.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 group-hover:text-primary transition-colors">{item.name}</p>
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5">ID: {item.id.substring(item.id.length - 6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 text-sm font-medium text-gray-500">
                                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                                                {item.role}
                                            </span>
                                        </td>
                                        <td className="py-5 text-sm text-gray-600 font-medium">{item.timeIn}</td>
                                        <td className="py-5">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${item.statusColor}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-5 text-right pr-4 relative action-menu-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenActionId(openActionId === item.id ? null : item.id);
                                                }}
                                                className={`text-gray-400 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-all ${openActionId === item.id ? 'opacity-100 bg-gray-100' : 'opacity-0 group-hover:opacity-100'}`}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openActionId === item.id && (
                                                <div className="absolute right-8 top-8 z-50 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = '/documents';
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2 transition-colors font-medium"
                                                    >
                                                        <span>View Details</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-400">
                                        No recent activity found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
