import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LifeAudit = () => {
    const [auditData, setAuditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    const [scores, setScores] = useState({
        health: 5,
        career: 5,
        finance: 5,
        relationships: 5,
        personalGrowth: 5,
        recreation: 5,
        environment: 5,
        spirituality: 5,
    });
    const [notes, setNotes] = useState('');

    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    const fetchAudit = async () => {
        try {
            const { data } = await axios.get('/api/life-audit', config);
            if (data && data.length > 0) {
                // Use the most recent audit
                setAuditData(data[0]);
                setScores(data[0].scores);
                setNotes(data[0].notes || '');
            } else {
                // No audit found, start fresh
                setIsEditing(true);
            }
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load life audit');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudit();
    }, []);

    const handleScoreChange = (category, value) => {
        setScores({ ...scores, [category]: parseInt(value) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Saving audit...');
        try {
            const { data } = await axios.post('/api/life-audit', { scores, notes }, config);
            setAuditData(data);
            setIsEditing(false);
            toast.success('Life Audit saved!', { id: toastId });
        } catch (error) {
            toast.error('Failed to save', { id: toastId });
        }
    };

    const chartData = Object.keys(scores).map(key => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        A: scores[key],
        fullMark: 10,
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main mb-1">Life Audit</h1>
                    <p className="text-text-muted text-sm">Assess your balance across key life areas.</p>
                </div>
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
                                {Object.keys(scores).map((category) => (
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
                                                setScores(auditData.scores);
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
        </div>
    );
};

export default LifeAudit;
