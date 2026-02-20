
import React from 'react';

const DashboardSkeleton = () => {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Life Balance Skeleton */}
                <div className="card h-80 bg-white/50 border border-gray-100 p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                        <div className="space-y-2">
                            <div className="h-6 w-32 bg-gray-200 rounded" />
                            <div className="h-4 w-48 bg-gray-200 rounded" />
                        </div>
                    </div>
                    <div className="h-48 w-full bg-gray-200 rounded-full opacity-50 mx-auto" style={{ maxWidth: '80%' }} />
                </div>

                {/* Monthly Spend Skeleton */}
                <div className="card h-80 bg-white/50 border border-gray-100 p-6 flex flex-col justify-between">
                    <div className="space-y-2">
                        <div className="h-6 w-32 bg-gray-200 rounded" />
                        <div className="h-8 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-40 w-40 bg-gray-200 rounded-full mx-auto" />
                </div>

                {/* Docs Stats Skeleton */}
                <div className="card h-80 bg-gray-100 border border-gray-200 p-6 flex flex-col">
                    <div className="h-10 w-10 bg-gray-300 rounded-xl mb-6" />
                    <div className="h-16 w-32 bg-gray-300 rounded mb-4" />
                    <div className="h-6 w-40 bg-gray-300 rounded mb-6" />
                    <div className="mt-auto space-y-2">
                        <div className="h-4 w-full bg-gray-300 rounded" />
                        <div className="h-2 w-full bg-gray-300 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Recent Activity Table Skeleton */}
            <div className="card bg-white/50 border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                        <div className="space-y-2">
                            <div className="h-6 w-40 bg-gray-200 rounded" />
                            <div className="h-4 w-64 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                    <div className="h-3 w-20 bg-gray-200 rounded" />
                                </div>
                            </div>
                            <div className="h-6 w-24 bg-gray-200 rounded-full" />
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                            <div className="h-8 w-20 bg-gray-200 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
