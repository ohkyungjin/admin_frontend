import React, { useMemo } from 'react';
import format from 'date-fns/format';

const TimeSlot = React.memo(({ events, bgColor, onEventClick }) => (
  <div className={`${bgColor} px-2 py-1`}>
    {events.map((event) => (
      <div 
        key={event.id} 
        className="flex items-center gap-1.5 hover:bg-white/50 rounded cursor-pointer py-[2px]"
        onClick={(e) => {
          e.stopPropagation();
          onEventClick(event);
        }}
      >
        <span className={`w-[4px] h-[4px] rounded-full flex-shrink-0 ${
          event.resource.status === 'pending' ? 'bg-orange-400' :
          event.resource.status === 'confirmed' ? 'bg-green-400' :
          event.resource.status === 'in_progress' ? 'bg-sky-400' :
          'bg-gray-400'
        }`} />
        <span className="text-[11px] text-gray-500">
          {format(new Date(event.start), 'HH:mm')}
        </span>
      </div>
    ))}
  </div>
));

export const CustomDateCell = React.memo(({ value, selectedDate, events, onEventClick }) => {
  const isCurrentMonth = value.getMonth() === selectedDate.getMonth();
  const isSelected = value.toDateString() === selectedDate.toDateString();
  const today = new Date();
  const isToday = value.getDate() === today.getDate() && 
                  value.getMonth() === today.getMonth() &&
                  value.getFullYear() === today.getFullYear();
  const hasEvents = events.length > 0;

  // 시간대별 이벤트 그룹화 메모이제이션
  const timeGroups = useMemo(() => ({
    morning: events.filter(event => {
      const hour = new Date(event.start).getHours();
      return hour >= 9 && hour < 12;
    }),
    afternoon: events.filter(event => {
      const hour = new Date(event.start).getHours();
      return hour >= 12 && hour < 15;
    }),
    evening: events.filter(event => {
      const hour = new Date(event.start).getHours();
      return hour >= 15 && hour < 18;
    }),
    night: events.filter(event => {
      const hour = new Date(event.start).getHours();
      return hour >= 18;
    })
  }), [events]);
  
  return (
    <div className={`relative h-full w-full transition-all duration-200 
      ${!isCurrentMonth ? 'opacity-30' : ''}
      ${isSelected ? 'bg-blue-50/30' : ''}`}>
      <div className={`absolute top-1.5 left-2 text-sm ${
        !isCurrentMonth ? 'text-gray-300' : 
        isToday ? 'text-blue-500 font-medium' : 
        'text-gray-700'
      }`}>
        {format(value, 'd')}
      </div>
      {hasEvents && (
        <div className="absolute top-8 left-0 right-0 flex flex-col gap-[2px]">
          {timeGroups.morning.length > 0 && (
            <TimeSlot events={timeGroups.morning} bgColor="bg-rose-50/50" onEventClick={onEventClick} />
          )}
          {timeGroups.afternoon.length > 0 && (
            <TimeSlot events={timeGroups.afternoon} bgColor="bg-amber-50/50" onEventClick={onEventClick} />
          )}
          {timeGroups.evening.length > 0 && (
            <TimeSlot events={timeGroups.evening} bgColor="bg-emerald-50/50" onEventClick={onEventClick} />
          )}
          {timeGroups.night.length > 0 && (
            <TimeSlot events={timeGroups.night} bgColor="bg-blue-50/50" onEventClick={onEventClick} />
          )}
          {events.length > 3 && (
            <div className="text-[11px] text-gray-400 ml-2">
              +{events.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}); 