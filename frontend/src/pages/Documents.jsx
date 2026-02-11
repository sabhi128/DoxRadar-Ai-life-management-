import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Search, Filter, MoreVertical, Download, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    // Auth token configuration
    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    const fetchDocuments = async () => {
        try {
            const res = await axios.get('/api/documents', config);
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

        // Auto-categorize based on simple logic or default
        const category = file.name.includes('invoice') ? 'Finance' :
            file.name.includes('contract') ? 'Legal' : 'Uncategorized';
        formData.append('category', category);

        const toastId = toast.loading('Uploading document...');

        try {
            await axios.post('/api/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`,
                },
            });
            toast.success('Document uploaded successfully!', { id: toastId });
            fetchDocuments(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed', { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        const toastId = toast.loading('Deleting...');
        try {
            await axios.delete(`/api/documents/${id}`, config);
            toast.success('Document deleted', { id: toastId });
            setDocuments(documents.filter(doc => doc._id !== id));
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
        // Replace backslashes with forward slashes for URL
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

            const response = await axios.get(url, {
                responseType: 'blob',
                ...config
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);

            toast.success('Download started', { id: toastId });
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file');
        }
    };

    const toggleMenu = (e, id) => {
        e.stopPropagation(); // Prevent triggering card click if any
        setActiveMenu(activeMenu === id ? null : id);
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        handleDelete(id);
        setActiveMenu(null);
    };

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

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : documents.length > 0 ? (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
                        <motion.div
                            key={doc._id}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="group card p-5 hover:shadow-lg transition-all duration-300 relative overflow-visible border border-border-light/50"
                        >
                            <div className="document-menu-container absolute top-4 right-4 z-20">
                                <button
                                    onClick={(e) => toggleMenu(e, doc._id)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-text-muted hover:text-text-main transition-colors"
                                >
                                    <MoreVertical size={16} />
                                </button>

                                {activeMenu === doc._id && (
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
                                            onClick={(e) => handleDeleteClick(e, doc._id)}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className={`p-4 rounded-xl ${doc.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                    <FileText size={32} />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                    <h3 className="font-semibold text-text-main truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleView(doc)}>{doc.name}</h3>
                                    <p className="text-xs text-text-muted mt-1">{doc.category} • {doc.size}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-light/50">
                                <span className="text-xs text-text-muted font-medium bg-gray-50 px-2 py-1 rounded-md">
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                </span>

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
                                        onClick={(e) => handleDeleteClick(e, doc._id)}
                                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted bg-white rounded-2xl border border-dashed border-border-light">
                    <FileText size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">No documents found.</p>
                    <div className="mt-4">
                        <button className="btn btn-secondary text-sm">Upload your first document</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
