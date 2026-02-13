import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    const { signIn } = useAuth();

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
            const { error } = await signIn({ email, password });
            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden relative">
            {/* Left Side - Form */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col justify-center w-full md:w-1/2 p-8 md:p-12 relative z-10"
            >
                <div className="w-full max-w-md mx-auto">
                    {/* Logo Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 mb-10"
                    >
                        <img
                            src={Logo}
                            alt="Logo"
                            className="h-10 w-auto rounded-lg shadow-md"
                        />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            DoxRadar
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-500">Sign in to access your DoxRadar dashboard.</p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 mb-6 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            label="Email"
                            placeholder="name@company.com"
                            required
                        />
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            label="Password"
                            placeholder="••••••••"
                            required
                        />

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full py-3.5 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
                        >
                            Sign In
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500">
                            Don’t have an account?{' '}
                            <Link to="/register" className="text-primary font-semibold hover:underline">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Right Side - Marketing */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative flex-col justify-center items-center p-12 overflow-hidden"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-lg text-left">
                    <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200">
                        Your AI That Fixes Financial and Administrative Problems.
                    </h2>
                    <p className="text-lg text-blue-100/90 leading-relaxed mb-12 font-medium">
                        We monitor, detect, and resolve billing issues, subscriptions, renewals, provider negotiations, and disputes - automatically.
                    </p>

                    {/* Security Status Box */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-sm font-bold tracking-wider uppercase text-emerald-300">System Active</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Real-Time Monitoring Enabled
                            </div>
                            <div className="flex items-center gap-3 text-sm text-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                256‑Bit Encrypted Infrastructure
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
