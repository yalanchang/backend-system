'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Project, ProjectFormData, User } from '@/lib/types';
import { FiArrowLeft, FiSave, FiX, FiAlertCircle, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';

// 表單驗證規則
const projectSchema = z.object({
  name: z.string().min(1, '專案名稱不能為空').max(100, '專案名稱不能超過100字'),
  description: z.string().max(500, '描述不能超過500字').optional().or(z.literal('')),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  budget: z.number().min(0, '預算不能為負數').optional().or(z.literal(0)),
  owner_id: z.string().min(1, '必須選擇負責人')
}).refine(
  (data) => {
    if (!data.start_date || !data.end_date) return true;
    return new Date(data.start_date) <= new Date(data.end_date);
  },
  {
    message: '結束日期不能早於開始日期',
    path: ['end_date']
  }
);

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'pending',
      priority: 'medium',
      budget: 0
    }
  });

  // 監聽表單值變化
  const watchStartDate = watch('start_date');
  const watchEndDate = watch('end_date');

  useEffect(() => {
    fetchProjectAndUsers();
  }, [projectId]);

  const fetchProjectAndUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // 同時取得專案資料和使用者列表
      const [projectResponse, usersResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch('/api/users') // 假設你有這個 API
      ]);

      const projectData = await projectResponse.json();
      const usersData = await usersResponse.json();

      if (!projectData.success) {
        throw new Error(projectData.error || '取得專案失敗');
      }

      if (!usersData.success) {
        console.warn('取得使用者列表失敗:', usersData.error);
      }

      const project = projectData.data;
      setProject(project);
      setUsers(usersData.data || []);

      // 重置表單值
      reset({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'pending',
        priority: project.priority || 'medium',
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
        budget: project.budget || 0,
        owner_id: project.owner_id || ''
      });

    } catch (err) {
      console.error('載入資料錯誤:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit: SubmitHandler<ProjectFormValues> = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      // 格式化資料
      const formattedData = {
        ...data,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        budget: data.budget || 0
      };

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '更新失敗');
      }

      setSuccessMessage('專案更新成功！');
      
      // 更新本地資料
      setProject(result.data);
      
      // 3秒後跳轉回詳情頁
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 3000);

    } catch (err) {
      console.error('更新專案錯誤:', err);
      setError(err instanceof Error ? err.message : '更新失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('確定要放棄編輯嗎？未儲存的變更將會遺失。')) {
      router.push(`/projects/${projectId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="animate-pulse space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href={`/projects/${projectId}`} 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FiArrowLeft className="mr-2" /> 返回專案詳情
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">無法載入專案</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/projects" 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                返回專案列表
              </Link>
              <button
                onClick={fetchProjectAndUsers}
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
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <Link 
            href={`/projects/${projectId}`} 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <FiArrowLeft className="mr-2" /> 返回專案詳情
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">編輯專案</h1>
          <p className="text-gray-600 mt-2">編輯專案 ID: {projectId} 的資訊</p>
        </div>

        {/* 成功訊息 */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center text-green-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{successMessage} 即將跳轉...</span>
            </div>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-700">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 編輯表單 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 md:p-8">
              {/* 基本資訊 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  基本資訊
                </h2>
                
                <div className="space-y-6">
                  {/* 專案名稱 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      專案名稱 *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-2 focus:ring-opacity-50 transition-colors`}
                      placeholder="輸入專案名稱"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* 專案描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      專案描述
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.description 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-2 focus:ring-opacity-50 transition-colors`}
                      placeholder="描述專案內容、目標等..."
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 狀態與設定 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  狀態與設定
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 狀態 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      狀態 *
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    >
                      <option value="pending">待處理</option>
                      <option value="in_progress">進行中</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                    {errors.status && (
                      <p className="mt-2 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>

                  {/* 優先級 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      優先級 *
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                    {errors.priority && (
                      <p className="mt-2 text-sm text-red-600">{errors.priority.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 時間與預算 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  時間與預算
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 開始日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiCalendar className="mr-2 text-gray-500" /> 開始日期
                    </label>
                    <input
                      type="date"
                      {...register('start_date')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    />
                  </div>

                  {/* 結束日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiCalendar className="mr-2 text-gray-500" /> 結束日期
                    </label>
                    <input
                      type="date"
                      {...register('end_date')}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.end_date 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-2 focus:ring-opacity-50 transition-colors`}
                      min={watchStartDate || undefined}
                    />
                    {errors.end_date && (
                      <p className="mt-2 text-sm text-red-600">{errors.end_date.message}</p>
                    )}
                  </div>

                  {/* 預算 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiDollarSign className="mr-2 text-gray-500" /> 預算
                    </label>
                    <input
                      type="number"
                      {...register('budget', { valueAsNumber: true })}
                      min="0"
                      step="1000"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.budget 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:ring-2 focus:ring-opacity-50 transition-colors`}
                      placeholder="0"
                    />
                    {errors.budget && (
                      <p className="mt-2 text-sm text-red-600">{errors.budget.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 負責人 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                  負責人
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiUser className="mr-2 text-gray-500" /> 專案負責人 *
                  </label>
                  <select
                    {...register('owner_id')}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.owner_id 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } focus:ring-2 focus:ring-opacity-50 transition-colors`}
                  >
                    <option value="">選擇負責人</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.department ? `(${user.department})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.owner_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.owner_id.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 按鈕區 */}
            <div className="px-6 md:px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-500">
                帶 * 的欄位為必填
              </div>
              <div className="flex space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <FiX className="inline mr-2" /> 取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      儲存中...
                    </>
                  ) : (
                    <>
                      <FiSave className="inline mr-2" /> 儲存變更
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}