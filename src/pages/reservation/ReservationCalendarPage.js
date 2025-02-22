import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { ko } from 'date-fns/locale';
import { Button, message, Modal } from 'antd';
import { 
  startOfMonth, 
  endOfMonth, 
  addHours, 
  parseISO, 
  isValid,
  isSameDay
} from 'date-fns';
import { reservationService } from '../../services/reservationService';
import { 
  ReservationFormModal,
  CustomDateCell,
  UpcomingEvents
} from '../../components/reservation';
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

const CACHE_DURATION = 5 * 60 * 1000; // 5분

export const ReservationCalendarPage = () => {
  const [reservations, setReservations] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 캐시 상태 관리
  const cache = useRef({
    data: {},
    timestamp: {},
    lastUpdated: null
  });

  // 캐시 유효성 검사
  const isCacheValid = useCallback((monthKey) => {
    const now = Date.now();
    return (
      cache.current.data[monthKey] &&
      cache.current.timestamp[monthKey] &&
      (now - cache.current.timestamp[monthKey] < CACHE_DURATION)
    );
  }, []);

  // API 호출 및 캐시 업데이트
  const fetchReservations = useCallback(async (targetDate, force = false) => {
    const monthKey = format(targetDate, 'yyyy-MM');
    
    // 강제 갱신이 아니고 캐시가 유효한 경우 캐시된 데이터 사용
    if (!force && isCacheValid(monthKey)) {
      setReservations(cache.current.data[monthKey]);
      return;
    }

    try {
      setIsLoading(true);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);
      
      const params = {
        start_date: format(monthStart, 'yyyy-MM-dd'),
        end_date: format(monthEnd, 'yyyy-MM-dd')
      };
      
      const response = await reservationService.getReservations(params);
      const events = (response?.results || []).map(reservation => {
        const startDate = parseISO(reservation?.scheduled_at);
        if (!isValid(startDate)) {
          console.error('Invalid date:', reservation?.scheduled_at);
          return null;
        }

        return {
          id: reservation?.id,
          title: `${reservation?.customer?.name || '고객명 없음'} - ${reservation?.pet?.name || '반려동물명 없음'}`,
          start: startDate,
          end: addHours(startDate, 2),
          resource: {
            ...reservation,
            customer: {
              name: reservation?.customer?.name || '고객명 없음',
              profile_image: reservation?.customer?.profile_image || null,
              ...reservation?.customer
            },
            pet: {
              name: reservation?.pet?.name || '반려동물명 없음',
              ...reservation?.pet
            },
            memorial_room_name: reservation?.memorial_room_name || '추모실 정보 없음',
            status: reservation?.status || 'pending',
            package_name: reservation?.package_name || null,
            premium_line: reservation?.premium_line || null
          },
        };
      }).filter(Boolean);
      
      // 캐시 업데이트
      cache.current.data[monthKey] = events;
      cache.current.timestamp[monthKey] = Date.now();
      cache.current.lastUpdated = Date.now();
      
      setReservations(events);
    } catch (error) {
      console.error('예약 목록 조회 오류:', error);
      message.error(error.response?.data?.detail || error.message || '예약 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [isCacheValid]);

  // 캐시 무효화 및 데이터 갱신
  const invalidateCache = useCallback(() => {
    const currentMonth = format(selectedDate, 'yyyy-MM');
    cache.current.timestamp[currentMonth] = 0;
    fetchReservations(selectedDate, true); // 강제 갱신
  }, [selectedDate, fetchReservations]);

  // 월 변경 시에만 API 호출
  useEffect(() => {
    const currentMonth = format(selectedDate, 'yyyy-MM');
    const currentCache = cache.current;
    
    if (!isCacheValid(currentMonth)) {
      fetchReservations(selectedDate);
    }
    
    return () => {
      const now = Date.now();
      Object.keys(currentCache.timestamp).forEach(key => {
        if (now - currentCache.timestamp[key] > CACHE_DURATION) {
          delete currentCache.data[key];
          delete currentCache.timestamp[key];
        }
      });
    };
  }, [selectedDate, fetchReservations, isCacheValid]);

  // 날짜별 이벤트 그룹화 함수 메모이제이션
  const getEventsForDate = useCallback((date) => {
    if (!isValid(date)) return [];
    return reservations.filter(event => isSameDay(event.start, date));
  }, [reservations]);

  // 선택된 날짜의 예약 목록 메모이제이션
  const selectedDateEvents = useMemo(() => {
    if (!isValid(selectedDate)) return [];
    return reservations.filter(event => isSameDay(event.start, selectedDate));
  }, [reservations, selectedDate]);

  // 이벤트 클릭 핸들러
  const handleEventClick = useCallback((event) => {
    if (!event?.resource) {
      console.error('Invalid event data');
      return;
    }
    setSelectedReservation(event.resource);
    setEditModalVisible(true);
  }, []);

  // 예약 삭제 핸들러
  const handleDeleteReservation = useCallback(async (event, reservationId) => {
    if (!reservationId) {
      console.error('Invalid reservation ID');
      return;
    }
    
    event.stopPropagation();
    
    Modal.confirm({
      title: '예약 삭제',
      content: '정말로 이 예약을 삭제하시겠습니까?',
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { 
        className: "!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700",
        danger: true 
      },
      onOk: async () => {
        try {
          setIsLoading(true);
          await reservationService.deleteReservation(reservationId);
          message.success('예약이 성공적으로 삭제되었습니다.');
          invalidateCache();
        } catch (error) {
          console.error('예약 삭제 오류:', error);
          message.error(error.response?.data?.detail || error.message || '예약 삭제에 실패했습니다');
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [invalidateCache]);

  // 달력 컴포넌트 메모이제이션
  const components = useMemo(() => ({
    dateCellWrapper: (props) => {
      if (!isValid(props.value)) return null;
      return (
        <CustomDateCell
          value={props.value}
          selectedDate={selectedDate}
          events={getEventsForDate(props.value)}
          onEventClick={handleEventClick}
        />
      );
    },
    month: {
      dateHeader: () => null,
      header: ({ date }) => {
        if (!isValid(date)) return null;
        return (
          <div className="text-[11px] font-medium text-gray-400 py-2 uppercase">
            {format(date, 'EEEEE', { locale: ko })}
          </div>
        );
      }
    },
    event: () => null
  }), [selectedDate, getEventsForDate, handleEventClick]);

  // 달력 네비게이션 핸들러 메모이제이션
  const handleNavigate = useCallback((date) => {
    if (!isValid(date)) {
      console.error('Invalid date in navigation');
      return;
    }
    setSelectedDate(date);
  }, []);

  // 달력 슬롯 선택 핸들러 메모이제이션
  const handleSelectSlot = useCallback(({ start, action }) => {
    if (action === 'click' || action === 'select') {
      if (!isValid(start)) {
        console.error('Invalid date in slot selection');
        return;
      }
      setSelectedDate(start);
    }
  }, []);

  // 월 변경 핸들러
  const handleMonthChange = useCallback((direction) => {
    setSelectedDate(prevDate => {
      if (!isValid(prevDate)) return new Date();
      return addHours(prevDate, direction * 24 * 30); // 약 한 달
    });
  }, []);

  // 모달 닫기 핸들러
  const handleModalClose = useCallback(() => {
    setEditModalVisible(false);
    setSelectedReservation(null);
  }, []);

  return (
    <div className="p-8 sm:p-6 xs:p-4 bg-gray-50/50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-12 gap-8 lg:flex lg:flex-row lg:gap-8 md:flex md:flex-col md:gap-6 sm:gap-4">
          {/* 캘린더 영역 */}
          <div className={`${isExpanded ? 'col-span-12' : 'col-span-7'} 
            transition-all duration-500 ease-in-out transform 
            ${isExpanded ? 'scale-100' : 'scale-[0.99]'} 
            lg:flex-1 md:w-full relative`}>
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-800"></div>
                  <span className="text-sm text-gray-600">로딩 중...</span>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-2xl shadow-sm border-0 p-6 sm:p-4 xs:p-3">
              <div className="flex justify-between items-center mb-6 sm:mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-800 sm:text-lg xs:text-base">
                    {isValid(selectedDate) ? format(selectedDate, 'MMMM yyyy') : 'Invalid Date'}
                  </h2>
                </div>
                <div className="flex items-center gap-3 xs:gap-2">
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="!w-7 !h-7 !rounded-full !border !border-gray-200 hover:!bg-gray-50 flex items-center justify-center !p-0"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                        {isExpanded ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        )}
                      </svg>
                    }
                  />
                  <div className="w-px h-4 bg-gray-200" />
                  <Button
                    onClick={() => handleMonthChange(-1)}
                    className="!w-7 !h-7 !rounded-full !border !border-gray-200 hover:!bg-gray-50 flex items-center justify-center !p-0"
                    icon={<span className="text-gray-400">←</span>}
                  />
                  <Button
                    onClick={() => handleMonthChange(1)}
                    className="!w-7 !h-7 !rounded-full !border !border-gray-200 hover:!bg-gray-50 flex items-center justify-center !p-0"
                    icon={<span className="text-gray-400">→</span>}
                  />
                </div>
              </div>

              <Calendar
                localizer={localizer}
                events={reservations}
                startAccessor="start"
                endAccessor="end"
                style={{ height: isExpanded ? 800 : 680 }}
                onSelectEvent={handleEventClick}
                selectable={true}
                longPressThreshold={1}
                onSelectSlot={handleSelectSlot}
                date={selectedDate}
                onNavigate={handleNavigate}
                view="month"
                views={['month']}
                components={{
                  ...components,
                  toolbar: () => null,
                }}
                className={`reservation-calendar ${isLoading ? 'opacity-50' : ''}
                  [&_.rbc-toolbar]:hidden
                  [&_.rbc-month-view]:!border-none [&_.rbc-month-view]:!rounded-xl [&_.rbc-month-view]:!bg-white [&_.rbc-month-view]:!overflow-hidden
                  [&_.rbc-header]:!border-b [&_.rbc-header]:!border-gray-100 [&_.rbc-header]:!py-2 [&_.rbc-header]:!font-medium [&_.rbc-header]:!text-center
                  [&_.rbc-month-row]:!border-b [&_.rbc-month-row]:!border-gray-100
                  [&_.rbc-month-row:last-child]:!border-none
                  [&_.rbc-day-bg]:!border-r [&_.rbc-day-bg]:!border-gray-100
                  [&_.rbc-day-bg:last-child]:!border-none
                  [&_.rbc-off-range-bg]:!bg-transparent
                  [&_.rbc-today]:!bg-transparent
                  [&_.rbc-date-cell]:!text-left [&_.rbc-date-cell]:!px-0
                  [&_.rbc-day-bg]:hover:!bg-gray-50/30
                  [&_.rbc-row-segment]:!p-0
                  [&_.rbc-row-content]:!min-h-[${isExpanded ? '130' : '110'}px] sm:!min-h-[90px] xs:!min-h-[80px]
                  [&_.rbc-month-row:first-child_.rbc-row-content]:!min-h-[${isExpanded ? '150' : '130'}px] sm:!min-h-[100px] xs:!min-h-[90px]
                  [&_.rbc-row-content]:!mt-0
                  [&_.rbc-row]:hover:!z-10
                  [&_.rbc-month-row]:hover:relative
                  [&_.rbc-event]:!hidden
                  [&_.rbc-header]:sm:!text-[10px]
                  [&_.rbc-date-cell]:sm:!text-xs
                  transition-all duration-300`}
              />
            </div>
          </div>

          {/* Upcoming 영역 */}
          {!isExpanded && (
            <div className={`col-span-5 lg:w-[380px] md:w-full transition-all duration-500 ease-in-out transform hover:scale-[1.01]`}>
              <UpcomingEvents
                events={selectedDateEvents}
                onEventClick={handleEventClick}
                onDeleteEvent={handleDeleteReservation}
                selectedDate={selectedDate}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      <ReservationFormModal
        visible={editModalVisible}
        onCancel={handleModalClose}
        reservationId={selectedReservation?.id}
        reservation={selectedReservation}
        onSuccess={invalidateCache}
      />
    </div>
  );
};
