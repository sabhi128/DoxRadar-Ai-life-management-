import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import { motion } from 'framer-motion';
import Logo from '../assets/Logo.jpeg';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signUp } = useAuth();

    const { name, email, password } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await signUp({
                email,
                password,
                options: {
                    data: { name }
                }
            });
            if (error) throw error;
            // Supabase auto-confirms or sends email. For now assume success.
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed');
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
        hidden: { x: 50, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    const featureListVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const featureItemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden relative">
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            {/* Right Side - Visual (Swapped for variety) */}
            <div className="hidden md:flex w-1/2 relative bg-bg-gray items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10"
                >
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-border-light max-w-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <h3 className="text-xl font-bold text-text-main mb-2 relative z-10">Start your journey</h3>
                        <p className="text-text-muted text-sm mb-6 relative z-10">Join thousands of users organizing their life with AI.</p>

                        <motion.div
                            variants={featureListVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-3 relative z-10"
                        >
                            <motion.div variants={featureItemVariants} whileHover={{ x: 5 }} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl transition-colors hover:bg-white hover:shadow-md cursor-default">
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                                <span className="text-sm font-medium text-text-main">AI Document Analysis</span>
                            </motion.div>
                            <motion.div variants={featureItemVariants} whileHover={{ x: 5 }} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl transition-colors hover:bg-white hover:shadow-md cursor-default">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">✓</div>
                                <span className="text-sm font-medium text-text-main">Smart Notifications</span>
                            </motion.div>
                            <motion.div variants={featureItemVariants} whileHover={{ x: 5 }} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl transition-colors hover:bg-white hover:shadow-md cursor-default">
                                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">✓</div>
                                <span className="text-sm font-medium text-text-main">Secure Storage</span>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Left Side - Form */}
            <div className="flex flex-col justify-center w-full md:w-1/2 p-8 md:p-12 relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-md mx-auto"
                >
                    <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10 justify-end">
                        <h1 className="text-xl font-bold text-text-main tracking-tight">DoxRadar</h1>
                        <motion.img
                            whileHover={{ rotate: -5 }}
                            src={Logo}
                            alt="Logo"
                            className="h-8 w-auto rounded-lg shadow-sm"
                        />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h2 className="text-3xl font-bold mb-2 text-text-main">Create Account</h2>
                        <p className="text-text-muted mb-8 text-lg">Get started with your free account.</p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 mb-6 bg-red-50 border border-red-100 text-danger rounded-lg text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <motion.div variants={itemVariants} custom={0}>
                            <Input
                                label="Full Name"
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                placeholder="John Doe"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants} custom={1}>
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                placeholder="name@example.com"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants} custom={2}>
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
                            className="btn btn-primary w-full mt-4 py-3"
                        >
                            Register
                        </motion.button>
                    </form>

                    <motion.p variants={itemVariants} className="text-center text-text-muted text-sm mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:text-primary-dark font-semibold hover:underline relative group">
                            Sign in
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </Link>
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
