'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, Event, View, SlotInfo } from 'react-big-calendar';
import CalendarWrapper from '@/components/CalendarWrapper';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent, Project } from '@/lib/types';
import { FiPlus, FiFilter, FiCalendar, FiUsers, FiBriefcase, FiMapPin, FiClock } from 'react-icons/fi';

const localizer = momentLocalizer(moment);

const VIEWS: View[] = ['month', 'week', 'day', 'agenda'];
type CalendarView = 'month' | 'week' | 'day' | 'agenda';

const VIEW_TO_TIME_UNIT: Record<CalendarView, moment.unitOfTime.DurationConstructor> = {
    'month': 'months',
    'week': 'weeks',
    'day': 'days',
    'agenda': 'days'
};

interface CalendarEventExtended extends Event {
    id: string;
    description?: string;
    event_type: string;
    project_id?: string;
    project_name?: string;
    location?: string;
    color?: string;
    participants?: any[];
    all_day: boolean;
}

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEventExtended[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentView, setCurrentView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const [filters, setFilters] = useState({
        project_id: '',
        event_type: '',
        show_all_day: true,
        showFilters: false,
        show_meetings: true,
        show_tasks: true,
        show_milestones: true
    });

    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventExtended | null>(null);
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

    // 取得事件資料
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const viewToUnit: Record<string, moment.unitOfTime.StartOf> = {
                'month': 'month',
                'week': 'week', 
                'day': 'day',
                'agenda': 'day' 
              };
              const unit = viewToUnit[currentView] || 'month';
    
              const startDate = moment(currentDate).startOf(unit).format('YYYY-MM-DD');
              const endDate = moment(currentDate).endOf(unit).format('YYYY-MM-DD');

            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
                ...(filters.project_id && { project_id: filters.project_id }),
                ...(filters.event_type && { event_type: filters.event_type })
            });

            const response = await fetch(`/api/calendar?${params}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || '取得行事曆事件失敗');
            }

            // 轉換為 react-big-calendar 格式
            const formattedEvents: CalendarEventExtended[] = data.data.map((event: CalendarEvent) => ({
                id: event.id,
                title: event.title,
                start: new Date(event.start_time),
                end: new Date(event.end_time),
                description: event.description,
                event_type: event.event_type,
                project_id: event.project_id,
                project_name: event.project_name,
                location: event.location,
                color: event.color || getEventColor(event.event_type),
                participants: event.participants,
                all_day: event.all_day
            }));

            setEvents(formattedEvents);

        } catch (err) {
            console.error('載入行事曆錯誤:', err);
            setError(err instanceof Error ? err.message : '載入失敗');
        } finally {
            setLoading(false);
        }
    }, [currentDate, currentView, filters]);

    // 取得專案列表
    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();

            if (data.success) {
                setProjects(data.data || []);
            }
        } catch (err) {
            console.error('載入專案錯誤:', err);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchProjects();
    }, [fetchEvents]);

    const getEventColor = (eventType: string): string => {
        const colors: Record<string, string> = {
            meeting: '#3B82F6', // 藍色
            task: '#10B981',    // 綠色
            milestone: '#8B5CF6', // 紫色
            reminder: '#F59E0B', // 黃色
            holiday: '#EF4444',  // 紅色
            custom: '#6B7280'    // 灰色
        };
        return colors[eventType] || '#6B7280';
    };

    const getEventTypeText = (eventType: string): string => {
        const texts: Record<string, string> = {
            meeting: '會議',
            task: '任務',
            milestone: '里程碑',
            reminder: '提醒',
            holiday: '假日',
            custom: '自訂'
        };
        return texts[eventType] || eventType;
    };

    const handleSelectEvent = (event: CalendarEventExtended) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        setSelectedSlot(slotInfo);
        setShowNewEventModal(true);
    };

    const handleViewChange = useCallback((view: string) => {
        setCurrentView(view);
    }, []);

    const handleNavigate = useCallback((newDate: Date) => {
        setCurrentDate(newDate);
    }, []);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchEvents();
    };

    const handleResetFilters = () => {
        setFilters({
            project_id: '',
            event_type: '',
            show_all_day: true,
            show_meetings: true,
            showFilters: false,
            show_tasks: true,
            show_milestones: true
        });
    };

    const handleCreateEvent = async (eventData: any) => {
        try {
            const response = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            if (data.success) {
                fetchEvents();
                setShowNewEventModal(false);
                setSelectedSlot(null);
            } else {
                alert(data.error || '建立事件失敗');
            }
        } catch (err) {
            console.error('建立事件錯誤:', err);
            alert('建立事件失敗');
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('確定要刪除這個事件嗎？')) return;

        try {
            const response = await fetch(`/api/calendar/${eventId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                fetchEvents();
                setShowEventModal(false);
                setSelectedEvent(null);
            } else {
                alert(data.error || '刪除事件失敗');
            }
        } catch (err) {
            console.error('刪除事件錯誤:', err);
            alert('刪除事件失敗');
        }
    };

    const eventStyleGetter = (event: CalendarEventExtended) => {
        const backgroundColor = event.color || getEventColor(event.event_type);
        const style = {
            backgroundColor,
            borderRadius: '4px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        };

        return { style };
    };

    const EventComponent = ({ event }: { event: CalendarEventExtended }) => {
        const eventTypeText = getEventTypeText(event.event_type);

        return (
            <div className="p-1">
                <div className="font-medium text-sm truncate">{event.title}</div>
                <div className="text-xs opacity-90 truncate">
                    {event.all_day ? '全天' : moment(event.start).format('HH:mm')}
                    {event.event_type !== 'custom' && ` • ${eventTypeText}`}
                </div>
            </div>
        );
    };

    if (loading && events.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="bg-white rounded-2xl shadow-xl p-6 h-96"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* 頁面標題 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">行事曆</h1>
                    <p className="text-gray-600 mt-2">管理專案時程、會議和重要事件</p>
                </div>

                {/* 控制列 */}
                <div className="mb-6 bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                今天
                            </button>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        const viewToUnit: Record<string, moment.unitOfTime.DurationConstructor> = {
                                            'month': 'months',
                                            'week': 'weeks',
                                            'day': 'days',
                                            'agenda': 'days'
                                        };
                                        const unit = viewToUnit[currentView] || 'days';
                                        handleNavigate(moment(currentDate).subtract(1, unit).toDate());
                                    }}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={() => {
                                        const viewToUnit: Record<string, moment.unitOfTime.DurationConstructor> = {
                                            'month': 'months',
                                            'week': 'weeks',
                                            'day': 'days',
                                            'agenda': 'days'
                                        };
                                        const unit = viewToUnit[currentView] || 'days';
                                        handleNavigate(moment(currentDate).add(1, unit).toDate());
                                    }}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    →
                                </button>
                            </div>

                            <h2 className="text-xl font-semibold text-gray-900">
                                {moment(currentDate).format('YYYY年 M月')}
                            </h2>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowNewEventModal(true)}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <FiPlus className="mr-2" />
                                新增事件
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FiFilter className="mr-2" />
                                {filters.showFilters ? '隱藏篩選' : '顯示篩選'}
                            </button>
                        </div>
                    </div>

                    {/* 檢視切換 */}
                    <div className="flex space-x-2 mt-4">
                        {VIEWS.map((view) => (
                            <button
                                key={view}
                                onClick={() => handleViewChange(view)}
                                className={`px-4 py-2 rounded-lg transition-colors ${currentView === view
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {view === 'month' ? '月' : view === 'week' ? '週' : view === 'day' ? '日' : '列表'}
                            </button>
                        ))}
                    </div>
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

                <div>
                    <CalendarWrapper
                        events={[]}
                        view={currentView}
                        onViewChange={handleViewChange}
                        date={currentDate}
                        onNavigate={handleNavigate}
                    />
                </div>

                {/* 圖例 */}
                <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">圖例</h3>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries({
                            meeting: '會議',
                            task: '任務',
                            milestone: '里程碑',
                            reminder: '提醒',
                            holiday: '假日',
                            custom: '自訂'
                        }).map(([type, label]) => (
                            <div key={type} className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded mr-2"
                                    style={{ backgroundColor: getEventColor(type) }}
                                ></div>
                                <span className="text-sm text-gray-700">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 事件詳細資訊 Modal */}
                {showEventModal && selectedEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {selectedEvent.description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">描述</h4>
                                        <p className="text-gray-600">{selectedEvent.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                            <FiCalendar className="mr-2" /> 時間
                                        </h4>
                                        <p className="text-gray-600">
                                            {selectedEvent.all_day ? '全天' : (
                                                <>
                                                    {moment(selectedEvent.start).format('YYYY年M月D日 HH:mm')}
                                                    <br />
                                                    至 {moment(selectedEvent.end).format('YYYY年M月D日 HH:mm')}
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">類型</h4>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                            style={{ backgroundColor: selectedEvent.color }}>
                                            {getEventTypeText(selectedEvent.event_type)}
                                        </span>
                                    </div>

                                    {selectedEvent.project_name && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                <FiBriefcase className="mr-2" /> 專案
                                            </h4>
                                            <p className="text-gray-600">{selectedEvent.project_name}</p>
                                        </div>
                                    )}

                                    {selectedEvent.location && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                                <FiMapPin className="mr-2" /> 地點
                                            </h4>
                                            <p className="text-gray-600">{selectedEvent.location}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <FiUsers className="mr-2" /> 參與者
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedEvent.participants.map((participant) => (
                                                <div key={participant.id} className="flex items-center justify-between">
                                                    <span className="text-gray-600">{participant.user_name}</span>
                                                    <span className={`px-2 py-1 rounded text-xs ${participant.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                        participant.status === 'declined' ? 'bg-red-100 text-red-800' :
                                                            participant.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {participant.status === 'accepted' ? '已接受' :
                                                            participant.status === 'declined' ? '已拒絕' :
                                                                participant.status === 'tentative' ? '暫定' : '待回覆'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    刪除
                                </button>
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    關閉
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 新增事件 Modal */}
                {showNewEventModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900">新增事件</h3>
                                <button
                                    onClick={() => setShowNewEventModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const eventData = {
                                    title: formData.get('title'),
                                    description: formData.get('description'),
                                    start_time: formData.get('start_time'),
                                    end_time: formData.get('end_time'),
                                    event_type: formData.get('event_type'),
                                    project_id: formData.get('project_id'),
                                    location: formData.get('location')
                                };
                                handleCreateEvent(eventData);
                            }}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            事件標題 *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            描述
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                開始時間 *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="start_time"
                                                required
                                                defaultValue={selectedSlot?.start ? moment(selectedSlot.start).format('YYYY-MM-DDTHH:mm') : ''}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                結束時間 *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="end_time"
                                                required
                                                defaultValue={selectedSlot?.end ? moment(selectedSlot.end).format('YYYY-MM-DDTHH:mm') : ''}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            事件類型 *
                                        </label>
                                        <select
                                            name="event_type"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                        >
                                            <option value="">選擇類型</option>
                                            <option value="meeting">會議</option>
                                            <option value="task">任務</option>
                                            <option value="milestone">里程碑</option>
                                            <option value="reminder">提醒</option>
                                            <option value="custom">自訂</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            關聯專案
                                        </label>
                                        <select
                                            name="project_id"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                        >
                                            <option value="">選擇專案</option>
                                            {projects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            地點
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewEventModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        建立事件
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}