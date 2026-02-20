import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
    Save, RefreshCw, AlertCircle, DollarSign, Shield, Clock, CreditCard,
    FileWarning, TrendingDown, AlertTriangle, ChevronRight, Calendar, FileText, Star
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const LifeAudit = () => {
    const [auditData, setAuditData] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('report'); // 'report' | 'self-assess'

    const [scores, setScores] = useState({
        health: 5, career: 5, finance: 5, relationships: 5,
        personalGrowth: 5, recreation: 5, environment: 5, spirituality: 5,
    });
    const [notes, setNotes] = useState('');

    const fetchAudit = async () => {
        try {
            const { data } = await api.get('/life-audit');
            if (data && data.length > 0) {
                setAuditData(data[0]);
                setScores(data[0].ratings || data[0].scores || {
                    health: 5, career: 5, finance: 5, relationships: 5,
                    personalGrowth: 5, recreation: 5, environment: 5, spirituality: 5
                });
                setNotes(data[0].notes || '');
            } else {
                setIsEditing(true);
            }
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load life audit');
            setLoading(false);
        }
    };

    const fetchReport = async () => {
        try {
            setReportLoading(true);
            const { data } = await api.get('/life-audit/report');
            setReport(data);
        } catch (error) {
            console.error('Failed to load report', error);
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        fetchAudit();
        fetchReport();
    }, []);

    const handleScoreChange = (category, value) => {
        setScores(prev => ({ ...prev, [category]: parseInt(value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Saving audit...');
        try {
            const { data } = await api.post('/life-audit', { scores, notes });
            setAuditData(data);
            setIsEditing(false);
            toast.success('Life Audit saved!', { id: toastId });
            fetchReport(); // Refresh report after saving new audit
        } catch (error) {
            toast.error('Failed to save', { id: toastId });
        }
    };

    const safeScores = scores || {
        health: 5, career: 5, finance: 5, relationships: 5,
        personalGrowth: 5, recreation: 5, environment: 5, spirituality: 5
    };

    const chartData = Object.keys(safeScores).map(key => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        A: safeScores[key],
        fullMark: 10,
    }));

    // Helper: score badge color
    const getScoreColor = (score) => {
        if (score >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getScoreLabel = (score) => {
        if (score >= 8) return 'Excellent';
        if (score >= 6) return 'Good';
        if (score >= 4) return 'Needs Work';
        return 'Critical';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main mb-1">Life Audit</h1>
                    <p className="text-text-muted text-sm">
                        {report ? `Report for ${report.month}` : 'Your monthly intelligence report'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'report'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                            }`}
                    >
                        Monthly Report
                    </button>
                    <button
                        onClick={() => setActiveTab('self-assess')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'self-assess'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                            }`}
                    >
                        Self Assessment
                    </button>
                </div>
            </div>

            {/* ========== MONTHLY REPORT TAB ========== */}
            {activeTab === 'report' && (
                <>
                    {reportLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : report ? (
                        <div className="space-y-6">
                            {/* Overall Score Banner */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card p-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-xl"
                            >
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold mb-1">
                                            {report.month} — Life Report
                                        </h2>
                                        <p className="text-white/80 text-sm">
                                            Auto-generated from your subscriptions, documents, and self-assessment
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-white/70">Overall Score</p>
                                            <p className="text-4xl font-black">{report.selfAssessment.overallScore || '—'}</p>
                                        </div>
                                        <div className="text-xs text-white/60">/10</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* KPI Row */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    {
                                        label: 'Monthly Spend',
                                        value: `$${report.moneySummary.totalMonthlyCost}`,
                                        icon: DollarSign,
                                        color: 'bg-blue-50 text-blue-600',
                                    },
                                    {
                                        label: 'Potential Savings',
                                        value: `$${report.moneySummary.potentialSavings}`,
                                        icon: TrendingDown,
                                        color: 'bg-emerald-50 text-emerald-600',
                                    },
                                    {
                                        label: 'Risks Found',
                                        value: report.risksSummary.totalRisks,
                                        icon: Shield,
                                        color: report.risksSummary.totalRisks > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500',
                                    },
                                    {
                                        label: 'Deadlines',
                                        value: report.deadlinesSummary.totalDeadlines,
                                        icon: Clock,
                                        color: report.deadlinesSummary.totalDeadlines > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500',
                                    },
                                    {
                                        label: 'Docs Attention',
                                        value: report.documentsAttention.totalNeedingAttention,
                                        icon: FileWarning,
                                        color: report.documentsAttention.totalNeedingAttention > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500',
                                    },
                                ].map((kpi, i) => (
                                    <motion.div
                                        key={kpi.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="card p-4"
                                    >
                                        <div className={`inline-flex p-2 rounded-lg mb-2 ${kpi.color}`}>
                                            <kpi.icon size={18} />
                                        </div>
                                        <p className="text-2xl font-bold text-text-main">{kpi.value}</p>
                                        <p className="text-xs text-text-muted">{kpi.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Report Sections Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* 1. Money Saved */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="card p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">Money Summary</h3>
                                            <p className="text-xs text-text-muted">{report.moneySummary.subscriptionCount} subscriptions tracked</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                            <span className="text-sm text-text-muted">Monthly subscription cost</span>
                                            <span className="font-bold text-text-main">${report.moneySummary.totalMonthlyCost}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <span className="text-sm text-emerald-700">Potential savings (flagged subs)</span>
                                            <span className="font-bold text-emerald-700">${report.moneySummary.potentialSavings}/mo</span>
                                        </div>
                                        {report.moneySummary.upcomingPayments.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-xs font-semibold text-text-muted mb-2">UPCOMING PAYMENTS</p>
                                                {report.moneySummary.upcomingPayments.map(p => (
                                                    <div key={p.id} className="flex justify-between items-center py-1.5 text-sm">
                                                        <span className="text-text-main">{p.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-muted">${p.price}</span>
                                                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                                                                {p.daysLeft}d
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* 2. Risks Detected */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="card p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2.5 rounded-xl ${report.risksSummary.totalRisks > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">Risks Detected</h3>
                                            <p className="text-xs text-text-muted">{report.risksSummary.totalRisks} risks from document analysis</p>
                                        </div>
                                    </div>

                                    {report.risksSummary.risks.length > 0 ? (
                                        <div className="space-y-2">
                                            {report.risksSummary.risks.map((r, i) => (
                                                <div key={i} className="flex items-start gap-2 p-3 bg-red-50/50 rounded-xl border border-red-100">
                                                    <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-red-800">{r.risk}</p>
                                                        <p className="text-[10px] text-red-500 mt-0.5">From: {r.documentName}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-text-muted">
                                            <Shield size={32} className="mx-auto mb-2 text-emerald-400" />
                                            <p className="text-sm">No risks detected — looking good!</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* 3. Deadlines Coming Up */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="card p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2.5 rounded-xl ${report.deadlinesSummary.totalDeadlines > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">Deadlines Coming Up</h3>
                                            <p className="text-xs text-text-muted">{report.deadlinesSummary.totalDeadlines} in the next 30 days</p>
                                        </div>
                                    </div>

                                    {report.deadlinesSummary.totalDeadlines > 0 ? (
                                        <div className="space-y-2">
                                            {report.deadlinesSummary.expiredDocuments.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} className="text-red-500" />
                                                        <span className="text-sm text-red-800">{doc.name}</span>
                                                    </div>
                                                    <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Expired</span>
                                                </div>
                                            ))}
                                            {report.deadlinesSummary.expiringDocuments.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} className="text-amber-600" />
                                                        <span className="text-sm text-amber-800">{doc.name}</span>
                                                    </div>
                                                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{doc.daysLeft}d left</span>
                                                </div>
                                            ))}
                                            {report.deadlinesSummary.upcomingPayments.map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard size={14} className="text-blue-500" />
                                                        <span className="text-sm text-blue-800">{p.name} — ${p.price}</span>
                                                    </div>
                                                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{p.daysLeft}d</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-text-muted">
                                            <Calendar size={32} className="mx-auto mb-2 text-emerald-400" />
                                            <p className="text-sm">No upcoming deadlines — you're all clear!</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* 4. Subscriptions Flagged */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="card p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2.5 rounded-xl ${report.subscriptionsFlagged.highCostCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">Subscriptions Flagged</h3>
                                            <p className="text-xs text-text-muted">{report.subscriptionsFlagged.highCostCount} high-cost subscriptions</p>
                                        </div>
                                    </div>

                                    {report.subscriptionsFlagged.flaggedSubscriptions.length > 0 ? (
                                        <div className="space-y-2">
                                            {report.subscriptionsFlagged.flaggedSubscriptions.map(sub => (
                                                <div key={sub.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                                                    <div>
                                                        <p className="text-sm font-semibold text-orange-800">{sub.name}</p>
                                                        <p className="text-[10px] text-orange-600">{sub.category} • {sub.period}</p>
                                                    </div>
                                                    <span className="font-bold text-orange-700">${sub.monthlyCost}/mo</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100 mt-3">
                                                <span className="text-sm text-emerald-700 font-medium">If cancelled, you'd save</span>
                                                <span className="font-bold text-emerald-700">${report.subscriptionsFlagged.potentialMonthlySavings}/mo</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-text-muted">
                                            <CreditCard size={32} className="mx-auto mb-2 text-emerald-400" />
                                            <p className="text-sm">No flagged subscriptions — spending looks healthy!</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* 5. Documents Needing Attention */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="card p-6 lg:col-span-2"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2.5 rounded-xl ${report.documentsAttention.totalNeedingAttention > 0 ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-400'}`}>
                                            <FileWarning size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">Documents Needing Attention</h3>
                                            <p className="text-xs text-text-muted">
                                                {report.documentsAttention.expiredCount} expired, {report.documentsAttention.expiringCount} expiring soon
                                            </p>
                                        </div>
                                    </div>

                                    {report.documentsAttention.documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {report.documentsAttention.documents.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    className={`flex items-center justify-between p-3 rounded-xl border ${doc.status === 'expired'
                                                        ? 'bg-red-50 border-red-100'
                                                        : 'bg-amber-50 border-amber-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} className={doc.status === 'expired' ? 'text-red-500' : 'text-amber-500'} />
                                                        <div>
                                                            <p className={`text-sm font-medium ${doc.status === 'expired' ? 'text-red-800' : 'text-amber-800'}`}>
                                                                {doc.name}
                                                            </p>
                                                            <p className={`text-[10px] ${doc.status === 'expired' ? 'text-red-500' : 'text-amber-600'}`}>
                                                                {doc.category} • Exp: {doc.expiryDate}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doc.status === 'expired'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {doc.status === 'expired' ? 'Expired' : `${doc.daysLeft}d left`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-text-muted">
                                            <FileText size={32} className="mx-auto mb-2 text-emerald-400" />
                                            <p className="text-sm">All documents are up to date!</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-text-muted bg-white rounded-2xl border border-dashed border-border-light">
                            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
                            <p>Unable to generate report. Add some data first!</p>
                        </div>
                    )}
                </>
            )}

            {/* ========== SELF ASSESSMENT TAB ========== */}
            {activeTab === 'self-assess' && (
                <>
                    <div className="flex justify-end">
                        {!isEditing && auditData && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn btn-secondary flex items-center gap-2"
                            >
                                <RefreshCw size={18} /> Update Audit
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Visual Chart */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="card p-6 flex flex-col items-center justify-center min-h-[400px]"
                            >
                                <h3 className="text-lg font-bold text-text-main mb-4">Your Balance Wheel</h3>
                                <div className="w-full h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                            <Radar
                                                name="Score"
                                                dataKey="A"
                                                stroke="#2563EB"
                                                strokeWidth={2}
                                                fill="#3B82F6"
                                                fillOpacity={0.5}
                                            />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Input Form */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="card p-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-text-main">
                                        {isEditing ? 'Update Your Scores' : 'Current Scores'}
                                    </h3>
                                    {isEditing && (
                                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                                            Scale: 1 (Low) - 10 (High)
                                        </span>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.keys(safeScores).map((category) => (
                                            <div key={category}>
                                                <label className="block text-sm font-medium text-text-main mb-1 capitalize">
                                                    {category.replace(/([A-Z])/g, ' $1')}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={scores[category]}
                                                    onChange={(e) => handleScoreChange(category, e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                                                />
                                                <div className="flex justify-between text-xs text-text-muted mt-1">
                                                    <span>1</span>
                                                    <span className="font-bold text-primary">{scores[category]}</span>
                                                    <span>10</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-border-light">
                                        <label className="block text-sm font-medium text-text-main mb-2">Reflections & Notes</label>
                                        <textarea
                                            className="input w-full h-24"
                                            placeholder="What's going well? What needs attention?"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            disabled={!isEditing}
                                        ></textarea>
                                    </div>

                                    {isEditing && (
                                        <div className="flex justify-end gap-3 pt-4">
                                            {auditData && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setScores(auditData.ratings || auditData.scores);
                                                    }}
                                                    className="btn btn-ghost"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button type="submit" className="btn btn-primary flex items-center gap-2">
                                                <Save size={18} /> Save Audit
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </motion.div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LifeAudit;
