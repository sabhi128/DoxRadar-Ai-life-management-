import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Search, Filter, MoreVertical, Download, Trash2, Eye, X, AlertCircle, Calendar, Tag, ShieldAlert, Sparkles, Clock, BookOpen } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Contract', 'Insurance', 'ID', 'Bill', 'Legal', 'Medical', 'Financial', 'Personal', 'Certificate', 'Other', 'Uncategorized'];

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/documents');
            setDocuments(res.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load documents');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);
        formData.append('category', 'Uncategorized'); // AI will auto-categorize

        const toastId = toast.loading('Uploading & analyzing document...');

        try {
            await api.post('/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Document uploaded & analyzed!', { id: toastId });
            fetchDocuments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed', { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        const toastId = toast.loading('Deleting...');
        try {
            await api.delete(`/documents/${id}`);
            toast.success('Document deleted', { id: toastId });
            setDocuments(documents.filter(doc => doc.id !== id));
        } catch (error) {
            toast.error('Delete failed', { id: toastId });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const [activeMenu, setActiveMenu] = useState(null);
    const [insightsDoc, setInsightsDoc] = useState(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMenu && !event.target.closest('.document-menu-container')) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu]);

    const getFileUrl = (filePath) => {
        if (!filePath) return '';
        if (filePath.startsWith('http')) return filePath;
        const normalizedPath = filePath.replace(/\\/g, '/');
        return `/${normalizedPath}`;
    };

    const handleView = (doc) => {
        const url = getFileUrl(doc.path);
        window.open(url, '_blank');
    };

    const handleDownload = async (doc) => {
        try {
            const toastId = toast.loading('Starting download...');
            const url = getFileUrl(doc.path);

            let response;
            if (url.startsWith('http')) {
                response = await fetch(url);
                if (!response.ok) throw new Error('Download failed');
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = doc.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(link.href);
            } else {
                response = await api.get(url, { responseType: 'blob' });
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = doc.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(link.href);
            }

            toast.success('Download started', { id: toastId });
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file');
        }
    };

    const toggleMenu = (e, id) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        handleDelete(id);
        setActiveMenu(null);
    };

    // --- Expiry helpers ---
    const getExpiryStatus = (doc) => {
        const expiryStr = doc.analysis?.expiryDate;
        if (!expiryStr) return null;
        const expiry = new Date(expiryStr);
        if (isNaN(expiry.getTime())) return null;
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', daysLeft };
        if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'bg-amber-100 text-amber-700 border-amber-200', daysLeft };
        return { label: `${daysLeft}d`, color: 'bg-green-100 text-green-700 border-green-200', daysLeft };
    };

    // --- Filtering ---
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main mb-1">Documents</h1>
                    <p className="text-text-muted text-sm">Manage and organize your critical life documents.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="input pl-10 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Category Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="input pl-9 pr-8 bg-white appearance-none cursor-pointer text-sm min-w-[130px]"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="btn btn-primary flex items-center gap-2 shadow-sm"
                    >
                        <Upload size={18} />
                        <span className="hidden sm:inline">Upload</span>
                    </button>
                </div>
            </div>

            {/* AI Insights Modal */}
            {insightsDoc && insightsDoc.analysis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FileText size={20} />
                                    Document Intelligence
                                </h2>
                                <p className="text-blue-100 text-sm">{insightsDoc.name}</p>
                            </div>
                            <button
                                onClick={() => setInsightsDoc(null)}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary Section */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    Executive Summary
                                </h3>
                                <p className="text-blue-900/80 text-sm leading-relaxed">
                                    {insightsDoc.analysis.summary || "Analysis pending..."}
                                </p>
                            </div>

                            {/* Plain Language Explanation */}
                            {insightsDoc.analysis.plainLanguageExplanation && (
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                        <BookOpen size={18} />
                                        What This Means (Plain Language)
                                    </h3>
                                    <p className="text-emerald-900/80 text-sm leading-relaxed">
                                        {insightsDoc.analysis.plainLanguageExplanation}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Key Dates */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-text-main flex items-center gap-2">
                                        <Calendar size={18} className="text-primary" />
                                        Key Dates
                                    </h3>
                                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Expiry Date</span>
                                        <span className={`font-medium ${insightsDoc.analysis.expiryDate ? 'text-text-main' : 'text-text-muted'}`}>
                                            {insightsDoc.analysis.expiryDate
                                                ? new Date(insightsDoc.analysis.expiryDate).toLocaleDateString()
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Renewal Date</span>
                                        <span className={`font-medium ${insightsDoc.analysis.renewalDate ? 'text-text-main' : 'text-text-muted'}`}>
                                            {insightsDoc.analysis.renewalDate
                                                ? new Date(insightsDoc.analysis.renewalDate).toLocaleDateString()
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Smart Tags */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-text-main flex items-center gap-2">
                                        <Tag size={18} className="text-primary" />
                                        Smart Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {insightsDoc.analysis.tags?.length > 0
                                            ? insightsDoc.analysis.tags.map((tag, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-100 text-text-muted rounded-full text-xs font-medium border border-gray-200">
                                                    {tag}
                                                </span>
                                            ))
                                            : <span className="text-text-muted text-sm italic">No tags detected</span>
                                        }
                                    </div>
                                    {/* Category */}
                                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Category</span>
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                            {insightsDoc.category}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Risks Section */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-text-main flex items-center gap-2 text-red-600">
                                    <ShieldAlert size={18} />
                                    Risks & Obligations
                                </h3>
                                <ul className="space-y-2">
                                    {insightsDoc.analysis.risks?.length > 0
                                        ? insightsDoc.analysis.risks.map((risk, i) => (
                                            <li key={i} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100/50">
                                                <div className="mt-0.5 min-w-[6px] h-[6px] rounded-full bg-red-500"></div>
                                                <span className="text-sm text-red-800">{risk}</span>
                                            </li>
                                        ))
                                        : <li className="text-text-muted text-sm italic">No risks detected</li>
                                    }
                                </ul>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setInsightsDoc(null)}
                                className="btn btn-primary"
                            >
                                Close Insights
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : filteredDocuments.length > 0 ? (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredDocuments.map((doc) => {
                        const expiryStatus = getExpiryStatus(doc);
                        return (
                            <motion.div
                                key={doc.id}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                className="group card p-5 hover:shadow-lg transition-all duration-300 relative overflow-visible border border-border-light/50"
                            >
                                {/* Badges Row */}
                                <div className="absolute top-4 left-4 z-10 flex gap-1.5">
                                    {doc.analysis && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-200">
                                            <Sparkles size={10} /> AI
                                        </span>
                                    )}
                                    {expiryStatus && (
                                        <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${expiryStatus.color}`}>
                                            <Clock size={10} /> {expiryStatus.label}
                                        </span>
                                    )}
                                </div>

                                <div className="document-menu-container absolute top-4 right-4 z-20">
                                    <button
                                        onClick={(e) => toggleMenu(e, doc.id)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-text-muted hover:text-text-main transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {activeMenu === doc.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-30">
                                            <button
                                                onClick={() => handleView(doc)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                            <div className="h-px bg-gray-100 my-1"></div>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, doc.id)}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-4 mb-4 mt-6">
                                    <div className={`p-4 rounded-xl ${doc.type === 'PDF' ? 'bg-red-50 text-red-500' : doc.type === 'JPEG' || doc.type === 'PNG' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                        <FileText size={32} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <h3 className="font-semibold text-text-main truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleView(doc)}>{doc.name}</h3>
                                        <p className="text-xs text-text-muted mt-1">
                                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold mr-1">{doc.category}</span>
                                            {doc.size}
                                        </p>
                                    </div>
                                </div>

                                {/* AI Summary Preview */}
                                {doc.analysis?.summary && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                                            <span className="font-semibold text-primary">AI Summary:</span> {doc.analysis.summary}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-light/50">
                                    {doc.analysis ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setInsightsDoc(doc); }}
                                            className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                                        >
                                            <Sparkles size={14} /> View Insights
                                        </button>
                                    ) : (
                                        <span className="text-xs text-text-muted font-medium bg-gray-50 px-2 py-1 rounded-md">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleView(doc)}
                                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                            title="View"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="p-1.5 text-text-muted hover:text-success hover:bg-success/10 rounded transition-colors"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, doc.id)}
                                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted bg-white rounded-2xl border border-dashed border-border-light">
                    <FileText size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                        {documents.length > 0 ? 'No documents match your filters.' : 'No documents found.'}
                    </p>
                    <div className="mt-4">
                        {documents.length > 0 ? (
                            <button onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }} className="btn btn-secondary text-sm">
                                Clear Filters
                            </button>
                        ) : (
                            <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary text-sm">
                                Upload your first document
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
