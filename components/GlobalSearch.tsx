'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    type: 'project' | 'task' | 'user';
    id: number;
    title: string;
    subtitle?: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const debounce = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.data);
                }
            } catch (error) {
                console.error('搜尋失敗:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        setQuery('');

        switch (result.type) {
            case 'project':
                router.push(`/projects/${result.id}`);
                break;
            case 'task':
                router.push(`/tasks?id=${result.id}`);
                break;
            case 'user':
                router.push(`/users?id=${result.id}`);
                break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'project': return '📁';
            case 'task': return '✅';
            case 'user': return '👤';
            default: return '📄';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'project': return '專案';
            case 'task': return '任務';
            case 'user': return '使用者';
            default: return '';
        }
    };

    return (
        <>
            {/* 搜尋按鈕 */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
                <span className="text-sm">搜尋</span>
                <kbd className="hidden md:inline-block px-2 py-0.5 text-xs bg-gray-700 rounded">⌘K</kbd>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
                        {/* 搜尋輸入 */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b">
                            <span className="text-gray-400">🔍</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="搜尋專案、任務、使用者..."
                                className="flex-1 outline-none text-gray-800 placeholder-gray-400"
                                autoFocus
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
關閉                            </button>
                        </div>

                        {/* 搜尋結果 */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    搜尋中...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    {query.length < 2 ? '輸入至少 2 個字元開始搜尋' : '沒有找到結果'}
                                </div>
                            ) : (
                                results.map((result, index) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <span className="text-xl">{getIcon(result.type)}</span>
                                        <div className="flex-1">
                                            <p className="text-gray-800 font-medium">{result.title}</p>
                                            {result.subtitle && (
                                                <p className="text-gray-500 text-sm">{result.subtitle}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                            {getTypeLabel(result.type)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}