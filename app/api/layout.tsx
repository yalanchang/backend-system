'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-900">
            {/* 手機版遮罩 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* 主內容區 */}
            <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
                {/* 手機版 Header */}
                <header className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        <span className="text-2xl">☰</span>
                    </button>
                    <h1 className="font-bold text-lg">專案管理系統</h1>
                    <div className="w-10" /> {/* 佔位 */}
                </header>

                {/* 內容 */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}