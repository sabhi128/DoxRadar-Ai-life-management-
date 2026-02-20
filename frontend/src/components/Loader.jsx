import React from 'react';

const Loader = ({ fullScreen = true, text = 'Loading...' }) => {
    const content = (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="h-10 w-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            </div>
            {text && <p className="text-sm text-gray-400 font-medium animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                {content}
            </div>
        );
    }

    return <div className="flex items-center justify-center p-4">{content}</div>;
};

export default Loader;
