import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { ko } from 'date-fns/locale';
import { Card, Button, message } from 'antd';
import { reservationService } from '../../services/reservationService';
import { ReservationFormModal } from '../../components/reservation/ReservationFormModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ko': ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const ReservationCalendarPage = () => {
  const [reservations, setReservations] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 예약 목록 조회
  const fetchReservations = useCallback(async () => {
    try {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const params = {
        start_date: format(startOfMonth, 'yyyy-MM-dd'),
        end_date: format(endOfMonth, 'yyyy-MM-dd')
      };
      
      const response = await reservationService.getReservations(params);
      const events = (response.results || []).map(reservation => {
        return {
          id: reservation.id,
          title: `${reservation.customer?.name} - ${reservation.pet?.name}`,
          start: new Date(reservation.scheduled_at),
          end: new Date(new Date(reservation.scheduled_at).getTime() + 2 * 60 * 60 * 1000),
          resource: reservation,
        };
      });
      
      setReservations(events);
    } catch (error) {
      console.error('예약 목록 조회 오류:', error);
      message.error('예약 목록을 불러오는데 실패했습니다.');
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // 날짜별 이벤트 그룹화 함수
  const getEventsForDate = (date) => {
    return reservations.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // 커스텀 달력 컴포넌트
  const components = {
    dateCellWrapper: (props) => {
      const events = getEventsForDate(props.value);
      const hasEvents = events.length > 0;
      const isCurrentMonth = props.value.getMonth() === selectedDate.getMonth();
      const isSelected = props.value.toDateString() === selectedDate.toDateString();
      const today = new Date();
      const isToday = props.value.getDate() === today.getDate() && 
                     props.value.getMonth() === today.getMonth() &&
                     props.value.getFullYear() === today.getFullYear();
      
      return (
        <div className={`relative h-full w-full ${!isCurrentMonth ? 'opacity-40' : ''} 
          ${isSelected ? 'bg-indigo-50/30' : ''} `}>
          <div className={`p-2 flex justify-start items-start ${
            isSelected ? 'text-indigo-600 font-medium' : 
            isToday ? 'text-blue-600 font-medium' :
            !isCurrentMonth ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span className={`text-sm ${isToday ? 'px-1.5 py-0.5 rounded bg-blue-100' : ''}`}>
              {format(props.value, 'd')}
            </span>
          </div>
          {hasEvents && events.length > 0 && (
            <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex gap-[3px]">
              {Array.from({ length: Math.min(events.length, 3) }).map((_, i) => (
                <div key={i} className="w-[5px] h-[5px] rounded-full bg-indigo-600" />
              ))}
            </div>
          )}
        </div>
      );
    },
    month: {
      dateHeader: ({ date, label }) => {
        return null;
      },
      header: ({ date, label }) => {
        return (
          <div className="text-sm font-medium text-gray-600 py-2">
            {label.slice(0, 1)}
          </div>
        );
      }
    }
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (event) => {
    setSelectedReservation(event.resource);
    setEditModalVisible(true);
  };

  // 선택된 날짜의 예약 목록
  const selectedDateEvents = reservations.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* 캘린더 */}
          <div className="col-span-6">
            <Card className="shadow-sm rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {format(selectedDate, 'yyyy년 MM월')}
                  </h2>
                </div>
                <div className="flex gap-1">
                  <Button 
                    type="text"
                    className="!border !border-gray-200 !rounded-lg"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    ←
                  </Button>
                  <Button 
                    type="text"
                    className="!border !border-gray-200 !rounded-lg"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    →
                  </Button>
                </div>
              </div>
              <Calendar
                localizer={localizer}
                events={reservations}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 480 }}
                onSelectEvent={handleEventClick}
                selectable={true}
                onSelectSlot={({ start }) => {
                  setSelectedDate(start);
                }}
                date={selectedDate}
                onNavigate={(date) => {
                  const newDate = new Date(date);
                  setSelectedDate(newDate);
                  fetchReservations();
                }}
                views={['month']}
                components={components}
                className="reservation-calendar 
                  [&_.rbc-toolbar]:hidden
                  [&_.rbc-month-view]:!border-0 [&_.rbc-month-view]:!rounded-lg
                  [&_.rbc-header]:!border-0 [&_.rbc-header]:!text-center
                  [&_.rbc-month-row]:!border-0
                  [&_.rbc-date-cell]:!text-left
                  [&_.rbc-day-bg]:transition-colors [&_.rbc-day-bg]:duration-200
                  [&_.rbc-off-range-bg]:!bg-transparent
                  [&_.rbc-today]:!bg-transparent
                  [&_.rbc-row-segment]:!h-full
                  [&_.rbc-date-cell]:!h-14
                  [&_.rbc-event]:!hidden
                  [&_.rbc-month-row]:!border-b [&_.rbc-month-row]:!border-gray-200
                  [&_.rbc-day-bg]:!border-r [&_.rbc-day-bg]:!border-gray-200
                  [&_.rbc-header]:!border-b [&_.rbc-header]:!border-gray-200
                  [&_.rbc-month-row:last-child]:!border-b-0
                  [&_.rbc-day-bg:last-child]:!border-r-0
                  [&_.rbc-month-header]:!mb-4
                  [&_.rbc-date-cell]:cursor-pointer
                  [&_.rbc-day-bg]:cursor-pointer
                  hover:[&_.rbc-day-bg]:bg-gray-50"
                messages={{
                  next: "다음",
                  previous: "이전",
                  today: "오늘",
                  month: "월",
                  date: "날짜",
                  noEventsInRange: "예약이 없습니다.",
                }}
                culture="ko"
              />
            </Card>
          </div>

          {/* 선택된 날짜의 예약 목록 */}
          <div className="col-span-6">
            <Card className="shadow-sm rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900">{format(selectedDate, 'yyyy년 MM월 dd일')}</span>
                </div>
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedReservation(null);
                    setEditModalVisible(true);
                  }}
                  className="!bg-indigo-600 !border-indigo-600 hover:!bg-indigo-700 hover:!border-indigo-700 flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  새 예약
                </Button>
              </div>

              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents
                    .sort((a, b) => new Date(a.start) - new Date(b.start))
                    .map(event => (
                      <Card
                        key={event.id}
                        className="!shadow-sm !rounded-xl border !border-gray-100 hover:!border-indigo-200 transition-colors cursor-pointer overflow-hidden"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex flex-col gap-3">
                          {/* 헤더 영역: 시간, 상태, 담당자 */}
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {format(new Date(event.start), 'HH:mm')}
                              </span>
                              <span className={`text-sm px-2 py-1 rounded ${
                                event.resource.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                event.resource.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                                event.resource.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                                event.resource.status === 'completed' ? 'bg-gray-50 text-gray-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {event.resource.status === 'pending' ? '대기중' :
                                 event.resource.status === 'confirmed' ? '확정' :
                                 event.resource.status === 'in_progress' ? '진행중' :
                                 event.resource.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                              </svg>
                              <span>{event.resource.assigned_staff_name || '미배정'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* 왼쪽: 고객 정보 */}
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {event.resource.customer?.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {event.resource.memorial_room_name}
                                </p>
                              </div>
                            </div>

                            {/* 오른쪽: 서비스 정보 */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="flex-shrink-0 px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">패키지</span>
                                <span className="text-gray-600 truncate">{event.resource.package_name || '선택안함'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <span className="flex-shrink-0 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-medium">프리미엄</span>
                                <span className="text-gray-600 truncate">{event.resource.premium_line?.name || '선택안함'}</span>
                              </div>

                              {event.resource.additional_services?.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="flex-shrink-0 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">추가옵션</span>
                                  <span className="text-gray-600 truncate">
                                    {event.resource.additional_services.map(service => service.name).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {event.resource.memo && (
                            <div className="border-t pt-2">
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs font-medium mt-0.5">메모</span>
                                <span className="text-gray-600 text-sm">
                                  {event.resource.memo}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">예약이 없습니다</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <ReservationFormModal
        visible={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedReservation(null);
        }}
        reservationId={selectedReservation?.id}
        reservation={selectedReservation}
        onSuccess={fetchReservations}
      />
    </div>
  );
};
