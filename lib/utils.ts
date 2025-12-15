/**
 * 格式化貨幣金額
 * @param amount 金額數字
 * @param decimals 小數位數（預設0）
 * @returns 格式化後的字串
 */
export const formatCurrency = (amount: number, decimals: number = 0): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0';
    }
    
    return '$' + amount.toLocaleString('zh-TW', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  /**
   * 格式化日期
   * @param dateString 日期字串或Date物件
   * @returns 格式化後的中文日期字串
   */
  export const formatDate = (dateString: string | Date): string => {
    if (!dateString) return '未設定';
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) return '日期格式錯誤';
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };
  
  /**
   * 簡短日期格式 (YYYY/MM/DD)
   */
  export const formatShortDate = (dateString: string | Date): string => {
    if (!dateString) return '未設定';
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) return '日期錯誤';
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  /**
   * 計算剩餘天數
   * @param endDate 結束日期
   * @returns 剩餘天數（負數表示已過期）
   */
  export const calculateDaysLeft = (endDate: string | Date): number => {
    if (!endDate) return 0;
    
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const now = new Date();
    
    if (isNaN(end.getTime())) return 0;
    
    // 清除時間部分，只比較日期
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffInTime = endDateOnly.getTime() - nowDateOnly.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
    
    return diffInDays;
  };
  
  /**
   * 計算專案進度百分比
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 0-100的百分比
   */
  export const calculateProgressPercentage = (
    startDate: string | Date,
    endDate: string | Date
  ): number => {
    if (!startDate || !endDate) return 0;
    
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const now = new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    
    return Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
  };
  
  /**
   * 取得優先級顏色樣式
   */
  export const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  /**
   * 取得優先級中文文字
   */
  export const getPriorityText = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };
  
  /**
   * 取得狀態顏色樣式
   */
  export const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  /**
   * 取得狀態中文文字
   */
  export const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return '待處理';
      case 'in_progress':
        return '進行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };
  
  /**
   * 防抖函數
   */
  export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  
  /**
   * 深拷貝物件
   */
  export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  };
  
  /**
   * 產生隨機ID
   */
  export const generateId = (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  /**
   * 驗證電子郵件格式
   */
  export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * 驗證手機號碼格式 (台灣)
   */
  export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^09[0-9]{8}$/;
    return phoneRegex.test(phone);
  };
  
  /**
   * 計算任務總工時
   */
  export const calculateTotalHours = (
    estimatedHours: number,
    actualHours: number
  ): { estimated: number; actual: number; difference: number } => {
    return {
      estimated: estimatedHours || 0,
      actual: actualHours || 0,
      difference: (actualHours || 0) - (estimatedHours || 0)
    };
  };