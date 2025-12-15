'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ActivityLog, PaginatedResponse } from '@/lib/types';
import { formatDate, formatShortDate } from '@/lib/utils';
import { getActivityIcon, formatActivityDescription } from '@/lib/activity';
import { FiFilter, FiRefreshCw, FiSearch, FiCalendar, FiUser, FiArchive, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    entity_type: searchParams.get('entity_type') || '',
    action: searchParams.get('action') || '',
    user_id: searchParams.get('user_id') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    search: searchParams.get('search') || ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [searchParams]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    
    return params.toString();
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const response = await fetch(`/api/activity?${queryString}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '取得活動紀錄失敗');
      }
      
      const result = data.data as PaginatedResponse<ActivityLog>;
      setActivities(result.data);
      setPagination(result.pagination);
      
    } catch (err) {
      console.error('載入活動紀錄錯誤:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    router.push(`/activity?${params.toString()}`);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      entity_type: '',
      action: '',
      user_id: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    
    router.push('/activity');
    setShowFilters(false);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/activity?${params.toString()}`);
  };

  const getEntityBadge = (entityType: string) => {
    const styles = {
      project: 'bg-blue-100 text-blue-800 border-blue-200',
      task: 'bg-green-100 text-green-800 border-green-200',
      user: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    const labels = {
      project: '專案',
      task: '任務',
      user: '使用者'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[entityType as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {labels[entityType as keyof typeof labels] || entityType}
      </span>
    );
  };

  const getActionBadge = (action: string) => {
    const styles = {
      create: 'bg-green-100 text-green-800 border-green-200',
      update: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete: 'bg-red-100 text-red-800 border-red-200',
      login: 'bg-blue-100 text-blue-800 border-blue-200',
      logout: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const labels = {
      create: '建立',
      update: '更新',
      delete: '刪除',
      login: '登入',
      logout: '登出'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[action as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {labels[action as keyof typeof labels] || action}
      </span>
    );
  };

  const renderChangeDetails = (activity: ActivityLog) => {
    if (!activity.old_values || !activity.new_values) return null;
    
    const changes: string[] = [];
    const newValues = activity.new_values || {};
    const oldValues = activity.old_values || {};

    Object.entries(newValues).forEach(([key, newValue]) => {
      const oldValue = oldValues[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
      }
    });
    
    if (changes.length === 0) return null;
    
    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">變更內容：</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {changes.map((change, index) => (
            <li key={index} className="flex">
              <span className="text-gray-400 mr-2">•</span>
              {change}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">活動紀錄</h1>
            <p className="text-gray-600 mt-2">系統操作記錄</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">活動紀錄</h1>
          <p className="text-gray-600 mt-2">系統操作記錄</p>
        </div>

        {/* 篩選器 */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋活動紀錄..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FiFilter className="mr-2" />
                篩選
              </button>
              <button
                onClick={fetchActivities}
                disabled={loading}
                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                重新整理
              </button>
            </div>
          </div>

          {/* 進階篩選 */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">篩選條件</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 實體類型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    實體類型
                  </label>
                  <select
                    value={filters.entity_type}
                    onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  >
                    <option value="">全部</option>
                    <option value="project">專案</option>
                    <option value="task">任務</option>
                    <option value="user">使用者</option>
                  </select>
                </div>

                {/* 操作類型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    操作類型
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  >
                    <option value="">全部</option>
                    <option value="create">建立</option>
                    <option value="update">更新</option>
                    <option value="delete">刪除</option>
                    <option value="login">登入</option>
                    <option value="logout">登出</option>
                  </select>
                </div>

                {/* 使用者 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    操作者 ID
                  </label>
                  <input
                    type="text"
                    value={filters.user_id}
                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                    placeholder="輸入使用者 ID"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  />
                </div>

                {/* 開始日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiCalendar className="mr-2 text-gray-500" /> 開始日期
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  />
                </div>

                {/* 結束日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiCalendar className="mr-2 text-gray-500" /> 結束日期
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  重設篩選
                </button>
                <button
                  onClick={applyFilters}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  套用篩選
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 活動紀錄列表 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                活動紀錄 ({pagination.total} 筆)
              </h2>
              <div className="text-sm text-gray-500">
                第 {pagination.page} 頁，共 {pagination.total_pages} 頁
              </div>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <FiArchive className="text-gray-400 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">暫無活動紀錄</h3>
              <p className="text-gray-500">目前沒有任何系統操作記錄</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    {/* 圖示 */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-lg">
                          {getActivityIcon(activity.action)}
                        </span>
                      </div>
                    </div>

                    {/* 主要內容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-base font-medium text-gray-900">
                            {activity.user_name || '系統'}
                          </h3>
                          {getEntityBadge(activity.entity_type)}
                          {getActionBadge(activity.action)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3">
                        {formatActivityDescription(activity)}
                      </p>

                      {/* 詳細資訊 */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {activity.entity_id && (
                          <span className="inline-flex items-center">
                            <FiArchive className="mr-1" />
                            實體 ID: {activity.entity_id}
                          </span>
                        )}
                        {activity.ip_address && (
                          <span>IP: {activity.ip_address}</span>
                        )}
                      </div>

                      {/* 變更詳細資訊 */}
                      {renderChangeDetails(activity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分頁 */}
          {activities.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  顯示 {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                  筆，共 {pagination.total} 筆
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.has_prev}
                    className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.total_pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.total_pages - 2) {
                        pageNum = pagination.total_pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          } transition-colors`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.has_next}
                    className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}