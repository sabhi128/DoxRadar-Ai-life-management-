import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-bg-gray font-sans text-text-main">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </div>
        </div>
    );
};

export default Layout;
