import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../components/Input';
import { motion } from 'framer-motion';
import Logo from '../assets/Logo.jpeg';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/auth/login', formData);
            if (response.data) {
                localStorage.setItem('user', JSON.stringify(response.data));
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    const floatingShapeVariants = {
        animate: {
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            transition: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden relative">
            {/* Background Texture/Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    variants={floatingShapeVariants}
                    animate="animate"
                    className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
                />
                <motion.div
                    variants={floatingShapeVariants}
                    animate="animate"
                    className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl delay-1000"
                />
            </div>

            {/* Left Side - Form */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col justify-center w-full md:w-1/2 p-8 md:p-12 relative z-10"
            >
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-md mx-auto"
                >
                    <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10">
                        <motion.img
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            src={Logo}
                            alt="Logo"
                            className="h-10 w-auto rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        />
                        <h1 className="text-2xl font-bold text-text-main tracking-tight">DoxRadar</h1>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h2 className="text-3xl font-bold mb-2 text-text-main">Welcome back</h2>
                        <p className="text-text-muted mb-8 text-lg">Enter your credentials to access your LifeOS.</p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 mb-6 bg-red-50 border border-red-100 text-danger rounded-lg text-sm flex items-center gap-2 overflow-hidden"
                        >
                            <span className="w-2 h-2 rounded-full bg-danger inline-block"></span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-5">
                        <motion.div variants={itemVariants}>
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                placeholder="name@example.com"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <Input
                                label="Password"
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                placeholder="••••••••"
                            />
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="btn btn-primary w-full mt-2 py-3"
                        >
                            Sign In
                        </motion.button>
                    </form>

                    <motion.p variants={itemVariants} className="text-center text-text-muted text-sm mt-8">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary hover:text-primary-dark font-semibold hover:underline relative group">
                            Create account
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                    </motion.p>
                </motion.div>
            </motion.div>

            {/* Right Side - Visual */}
            <div className="hidden md:flex w-1/2 relative bg-bg-gray items-center justify-center p-12 overflow-hidden">
                {/* Decorative Elements */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border-2 border-dashed border-gray-200 rounded-full opacity-30"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 max-w-lg text-center"
                >
                    <h2 className="text-4xl font-bold mb-6 text-text-main">
                        Simplifying Life's <span className="text-primary relative inline-block">
                            Complexities
                            <motion.svg
                                className="absolute -bottom-2 left-0 w-full"
                                viewBox="0 0 100 10"
                                preserveAspectRatio="none"
                            >
                                <motion.path
                                    d="M0 5 Q 50 10 100 5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, delay: 1 }}
                                />
                            </motion.svg>
                        </span>
                    </h2>
                    <p className="text-text-muted text-lg leading-relaxed mb-8">
                        Manage documents, renewals, and subscriptions in one secure place.
                    </p>

                    {/* Floating Card Animation */}
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: -10 }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        className="bg-white p-6 rounded-2xl shadow-xl border border-border-light/50 transform rotate-[-2deg] max-w-sm mx-auto"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                            </motion.div>
                            <div className="text-left">
                                <p className="font-bold text-text-main text-lg">System Active</p>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                    </span>
                                    <p className="text-xs text-text-muted font-medium">Monitoring Real-time</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-text-muted">
                                <span>Encryption</span>
                                <span className="text-green-600 font-bold">256-bit</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                    className="h-full bg-green-500 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
