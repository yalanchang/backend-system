import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: '待處理' };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', text: '進行中' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800 border-green-200', text: '已完成' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800 border-red-200', text: '已取消' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      {config.text}
    </span>
  );
};

export default StatusBadge;