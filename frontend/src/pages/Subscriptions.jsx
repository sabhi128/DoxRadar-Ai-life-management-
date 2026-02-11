import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Calendar, Trash2, X, Check, Pencil, Eye, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [previewSubscription, setPreviewSubscription] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        billingCycle: 'Monthly',
        nextBillingDate: '',
        category: 'General',
        paymentMethod: 'Credit Card'
    });

    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    const fetchSubscriptions = async () => {
        try {
            const { data } = await axios.get('/api/subscriptions', config);
            setSubscriptions(data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load subscriptions');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            billingCycle: 'Monthly',
            nextBillingDate: '',
            category: 'General',
            paymentMethod: 'Credit Card'
        });
        setIsEditMode(false);
        setCurrentId(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading(isEditMode ? 'Updating subscription...' : 'Adding subscription...');
        try {
            if (isEditMode) {
                await axios.put(`/api/subscriptions/${currentId}`, formData, config);
                toast.success('Subscription updated!', { id: toastId });
            } else {
                await axios.post('/api/subscriptions', formData, config);
                toast.success('Subscription added!', { id: toastId });
            }
            fetchSubscriptions();
            resetForm();
        } catch (error) {
            toast.error(isEditMode ? 'Failed to update' : 'Failed to add', { id: toastId });
        }
    };

    const handleEdit = (sub) => {
        setFormData({
            name: sub.name,
            price: sub.price,
            billingCycle: sub.billingCycle,
            nextBillingDate: sub.nextBillingDate.split('T')[0], // Format date for input
            category: sub.category,
            paymentMethod: sub.paymentMethod || 'Credit Card'
        });
        setCurrentId(sub._id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handlePreview = (sub) => {
        setPreviewSubscription(sub);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this subscription?')) return;
        const toastId = toast.loading('Deleting...');
        try {
            await axios.delete(`/api/subscriptions/${id}`, config);
            toast.success('Subscription deleted', { id: toastId });
            setSubscriptions(subscriptions.filter(sub => sub._id !== id));
        } catch (error) {
            toast.error('Failed to delete', { id: toastId });
        }
    };

    const totalMonthlyCost = subscriptions.reduce((acc, sub) => {
        const price = parseFloat(sub.price);
        return sub.billingCycle === 'Monthly' ? acc + price : acc + (price / 12);
    }, 0);

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main mb-1">Subscriptions</h1>
                    <p className="text-text-muted text-sm">Track recurring expenses and renewal dates.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={18} /> Add Subscription
                    </button>
                </div>
            </div>

            {/* Stats Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <CreditCard size={20} className="text-white" />
                    </div>
                    <span className="font-medium text-white/90">Total Monthly Cost</span>
                </div>
                <div className="text-4xl font-bold">${totalMonthlyCost.toFixed(2)}</div>
                <p className="text-sm text-white/70 mt-1">Based on {subscriptions.length} active subscriptions</p>
            </motion.div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : filteredSubscriptions.length > 0 ? (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredSubscriptions.map((sub) => (
                        <motion.div
                            key={sub._id}
                            variants={itemVariants}
                            className="card p-5 hover:shadow-md transition-shadow relative group"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handlePreview(sub)}
                                    className="text-text-muted hover:text-primary p-1 bg-white rounded-full shadow-sm"
                                    title="Preview"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={() => handleEdit(sub)}
                                    className="text-text-muted hover:text-primary p-1 bg-white rounded-full shadow-sm"
                                    title="Edit"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(sub._id)}
                                    className="text-text-muted hover:text-red-500 p-1 bg-white rounded-full shadow-sm"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-primary text-xl font-bold">
                                    {sub.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main">{sub.name}</h3>
                                    <p className="text-sm text-text-muted">{sub.category}</p>
                                    <div className="mt-3 flex items-center gap-4">
                                        <span className="text-lg font-bold text-text-main">${sub.price}</span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-text-muted font-medium">{sub.billingCycle}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border-light flex items-center gap-2 text-xs text-text-muted">
                                <Calendar size={14} />
                                <span>Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-20 text-text-muted bg-white rounded-2xl border border-dashed border-border-light">
                    <p>No subscriptions found. Add one to get started!</p>
                </div>
            )}

            {/* Add Subscription Modal */}
            {/* Add Subscription Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-text-main">{isEditMode ? 'Edit Subscription' : 'Add Subscription'}</h2>
                            <button onClick={resetForm} className="text-text-muted hover:text-text-main">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="input w-full"
                                    placeholder="Netflix, Spotify..."
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        className="input w-full"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Cycle</label>
                                    <select
                                        name="billingCycle"
                                        className="input w-full"
                                        value={formData.billingCycle}
                                        onChange={handleChange}
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        className="input w-full"
                                        placeholder="Entertainment"
                                        value={formData.category}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Payment Method</label>
                                    <input
                                        type="text"
                                        name="paymentMethod"
                                        className="input w-full"
                                        placeholder="Credit Card, PayPal..."
                                        value={formData.paymentMethod}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">Next Billing</label>
                                <input
                                    type="date"
                                    name="nextBillingDate"
                                    required
                                    className="input w-full"
                                    value={formData.nextBillingDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full mt-2">
                                {isEditMode ? 'Update Subscription' : 'Save Subscription'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Preview Modal */}
            {previewSubscription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-0 overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white relative">
                            <button
                                onClick={() => setPreviewSubscription(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-3xl font-bold backdrop-blur-sm">
                                    {previewSubscription.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{previewSubscription.name}</h2>
                                    <p className="text-blue-100">{previewSubscription.category}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-text-muted">Cost</p>
                                    <p className="text-xl font-bold text-text-main">${previewSubscription.price}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-text-muted">Billing Cycle</p>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                                        {previewSubscription.billingCycle}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-text-main">
                                    <div className="p-2 bg-gray-100 rounded-lg text-text-muted">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted">Next Billing Date</p>
                                        <p className="font-medium">
                                            {new Date(previewSubscription.nextBillingDate).toLocaleDateString(undefined, {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-text-main">
                                    <div className="p-2 bg-gray-100 rounded-lg text-text-muted">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted">Payment Method</p>
                                        <p className="font-medium">{previewSubscription.paymentMethod || 'Credit Card'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-text-main">
                                    <div className="p-2 bg-gray-100 rounded-lg text-text-muted">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted">Added On</p>
                                        <p className="font-medium">
                                            {new Date(previewSubscription.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 mt-2">
                                <button
                                    onClick={() => setPreviewSubscription(null)}
                                    className="btn btn-secondary w-full"
                                >
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
