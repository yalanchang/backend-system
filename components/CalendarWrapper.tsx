'use client';

import { Calendar, momentLocalizer, Event, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarWrapperProps {
    events: Event[];
    view: string;
    onViewChange: (view: string) => void;
    date: Date;
    onNavigate: (date: Date) => void;
    onSelectEvent?: (event: Event) => void;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
}

export default function CalendarWrapper({
    events,
    view,
    onViewChange,
    date,
    onNavigate,
    onSelectEvent,
    onSelectSlot
}: CalendarWrapperProps) {
    
    return (
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                view={view as View}
                onView={onViewChange}
                date={date}
                onNavigate={onNavigate}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                selectable={!!onSelectSlot}
                messages={{
                    today: '今天',
                    previous: '上一個',
                    next: '下一個',
                    month: '月',
                    week: '週',
                    day: '日',
                    agenda: '列表',
                    date: '日期',
                    time: '時間',
                    event: '事件'
                }}
            />
        </div>
    );
}