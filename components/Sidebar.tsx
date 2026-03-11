'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface SidebarProps {
    onClose?: () => void;
}

const menuItems = [
    { href: '/', label: '儀表板'},
    { href: '/projects', label: '專案管理'},
    { href: '/tasks', label: '任務管理'},
    { href: '/users', label: '使用者管理' },
    { href: '/calendar', label: '行事曆'},
    { href: '/reports', label: '報表統計'},
    { href: '/activity', label: '活動日誌' },
];

export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <aside className="w-64 bg-gray-900 text-white h-full p-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 mb-2">
                <h1 className="text-xl font-bold">專案管理</h1>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
                >
                    ✕
                </button>
            </div>

            <nav className="space-y-1 px-4 flex-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800'
                            }`}
                        >
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-700 p-4 mt-auto sticky bottom-0 bg-gray-900">
                {session?.user && (
                    <div className="px-4 py-2 mb-2">
                        <p className="text-sm text-gray-400">登入為</p>
                        <p className="font-medium truncate">{session.user.name}</p>
                    </div>
                )}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                >
                    <span>登出</span>
                </button>
            </div>
        </aside>
    );
}