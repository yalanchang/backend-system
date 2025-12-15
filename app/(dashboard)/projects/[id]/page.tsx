'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FiEdit, FiTrash2, FiArrowLeft, FiCalendar, FiDollarSign, FiUser, FiAlertCircle } from 'react-icons/fi';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '取得專案失敗');
      }

      setProject(data.data);
    } catch (err) {
      console.error('取得專案錯誤:', err);
      setError(err instanceof Error ? err.message : '取得專案失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除這個專案嗎？此操作無法復原。')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '刪除失敗');
      }

      alert('專案刪除成功');
      router.push('/projects');
    } catch (err) {
      console.error('刪除專案錯誤:', err);
      alert('刪除失敗，請稍後再試');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const calculateProgress = () => {
    if (!project?.start_date || !project?.end_date) return 0;
    
    const start = new Date(project.start_date).getTime();
    const end = new Date(project.end_date).getTime();
    const now = new Date().getTime();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/projects" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FiArrowLeft className="mr-2" /> 返回專案列表
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">無法載入專案</h2>
            <p className="text-gray-600 mb-6">{error || '專案不存在'}</p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/projects" 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                返回專案列表
              </Link>
              <button
                onClick={fetchProject}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題和操作按鈕 */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link 
              href="/projects" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-2"
            >
              <FiArrowLeft className="mr-2" /> 返回專案列表
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">專案 ID: {project.id}</p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              href={`/projects/${projectId}/edit`}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiEdit className="mr-2" /> 編輯專案
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              disabled={deleting}
              className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiTrash2 className="mr-2" /> {deleting ? '刪除中...' : '刪除專案'}
            </button>
          </div>
        </div>

        {/* 刪除確認對話框 */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2">確認刪除</h3>
              <p className="text-gray-600 mb-6">確定要刪除專案 "{project.name}" 嗎？此操作無法復原。</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? '刪除中...' : '確定刪除'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 專案資訊卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 左側主資訊 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">專案概況</h2>
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={project.status} />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                      優先度: {getPriorityText(project.priority)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  建立時間: {project.created_at ? new Date(project.created_at).toLocaleDateString('zh-TW') : 'N/A'}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">專案描述</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-line">{project.description || '無描述'}</p>
                </div>
              </div>

              {/* 時間進度條 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">專案時程</h3>
                  <span className="text-sm font-medium text-blue-600">{calculateProgress()}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>開始: {project.start_date ? new Date(project.start_date).toLocaleDateString('zh-TW') : '未設定'}</span>
                  <span>結束: {project.end_date ? new Date(project.end_date).toLocaleDateString('zh-TW') : '未設定'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側側邊欄 */}
          <div className="space-y-6">
            {/* 專案負責人 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiUser className="mr-2 text-gray-500" /> 專案負責人
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {project.owner_name ? project.owner_name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{project.owner_name || '未指派'}</p>
                  <p className="text-sm text-gray-500">Owner ID: {project.owner_id}</p>
                </div>
              </div>
            </div>

            {/* 預算資訊 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiDollarSign className="mr-2 text-gray-500" /> 預算資訊
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">專案預算</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${formatCurrency(project.budget)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">狀態</span>
                    <span className={`font-medium ${
                      project.budget > 100000 ? 'text-red-600' : 
                      project.budget > 50000 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {project.budget > 100000 ? '高預算' : project.budget > 50000 ? '中預算' : '低預算'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 日期資訊 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiCalendar className="mr-2 text-gray-500" /> 日期資訊
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">開始日期</span>
                  <span className="font-medium text-gray-900">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('zh-TW') : '未設定'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">結束日期</span>
                  <span className="font-medium text-gray-900">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString('zh-TW') : '未設定'}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">總天數</span>
                    <span className="font-medium text-blue-600">
                      {project.start_date && project.end_date 
                        ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 3600 * 24))
                        : 'N/A'
                      } 天
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/projects/${projectId}/edit`}
              className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200">
                  <FiEdit className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">編輯專案</p>
                  <p className="text-sm text-gray-500">修改專案資訊</p>
                </div>
              </div>
            </Link>
            <button
              onClick={() => router.push(`/tasks?project=${projectId}`)}
              className="p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors group text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">管理任務</p>
                  <p className="text-sm text-gray-500">查看專案任務</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push(`/reports?project=${projectId}`)}
              className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors group text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">查看報表</p>
                  <p className="text-sm text-gray-500">專案統計分析</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}