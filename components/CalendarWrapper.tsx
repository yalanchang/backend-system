'use client';

import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarWrapperProps {
  events: any[];
  view: string;
  onViewChange: (view: string) => void;
  date: Date;
  onNavigate: (date: Date) => void;
  onSelectEvent?: (event: any) => void;
  onSelectSlot?: (slotInfo: any) => void;
  [key: string]: any;
}

export default function CalendarWrapper({
  events,
  view,
  onViewChange,
  date,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
  ...props
}: CalendarWrapperProps) {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
      view={view as View}
      onView={onViewChange as any}
      date={date}
      onNavigate={onNavigate}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      selectable
      {...props}
    />
  );
}