import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Spin, Dropdown, Button, Modal, message, Select, TimePicker } from 'antd';
import { dashboardService } from '../../services/dashboardService';
import { reservationService } from '../../services/reservationService';
import { 
  RESERVATION_STATUS_LABELS, 
  RESERVATION_STATUS_COLORS 
} from '../../constants/reservation';
import { QuickReservationModal } from '../../components/reservation';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

// 아이콘 컴포넌트들
const TotalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ConfirmedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InProgressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CompletedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const EmergencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isQuickReservationModalVisible, setIsQuickReservationModalVisible] = useState(false);
  
  // 필터 상태 추가
  const [filters, setFilters] = useState({
    status: undefined,
    memorial_room_id: undefined,
    time: undefined
  });

  // 필터링된 예약 목록
  const [filteredReservations, setFilteredReservations] = useState([]);

  // 데이터 갱신 함수
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await dashboardService.getDashboard();
      setDashboardData(response);
      setFilteredReservations(response.recent_reservations || []);
      setError(null);
    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 필터 적용 함수
  const applyFilters = useCallback(() => {
    if (!dashboardData?.recent_reservations) return;

    let filtered = [...dashboardData.recent_reservations];

    if (filters.status) {
      filtered = filtered.filter(reservation => reservation.status === filters.status);
    }

    if (filters.memorial_room_id) {
      filtered = filtered.filter(reservation => reservation.memorial_room_id === filters.memorial_room_id);
    }

    if (filters.time) {
      const filterTime = filters.time.format('HH:mm');
      filtered = filtered.filter(reservation => {
        const reservationTime = dayjs(reservation.scheduled_at).format('HH:mm');
        return reservationTime === filterTime;
      });
    }

    setFilteredReservations(filtered);
  }, [dashboardData, filters]);

  // 필터 변경시 적용
  useEffect(() => {
    applyFilters();
  }, [filters, applyFilters]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // 주기적 데이터 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isQuickReservationModalVisible) {
        fetchDashboardData(false);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, isQuickReservationModalVisible]);

  // 필터 초기화 함수
  const handleResetFilters = () => {
    setFilters({
      status: undefined,
      memorial_room_id: undefined,
      time: undefined
    });
  };

  // 예약 상태 변경 핸들러
  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await reservationService.bulkUpdateStatus({
        reservation_ids: [reservationId],
        status: newStatus
      });
      message.success('예약 상태가 변경되었습니다.');
      fetchDashboardData();
    } catch (error) {
      console.error('예약 상태 변경 오류:', error);
      message.error('예약 상태 변경에 실패했습니다.');
    }
  };

  // 상태 변경 드롭다운 메뉴 아이템 생성
  const getStatusMenuItems = (record) => {
    return Object.entries(RESERVATION_STATUS_LABELS).map(([status, label]) => ({
      key: status,
      label: (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${RESERVATION_STATUS_COLORS[status]}`} />
          <span>{label}</span>
        </div>
      ),
      onClick: () => {
        Modal.confirm({
          title: '예약 상태 변경',
          content: `예약 상태를 "${label}"(으)로 변경하시겠습니까?`,
          okText: '변경',
          cancelText: '취소',
          okButtonProps: { 
            className: "!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          },
          cancelButtonProps: { 
            className: "!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
          },
          onOk: () => handleStatusChange(record.id, status)
        });
      }
    }));
  };

  const columns = [
    {
      title: '예약번호',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <span className="font-medium">#{id}</span>
    },
    {
      title: '고객명',
      dataIndex: ['customer', 'name'],
      key: 'customer_name',
      width: 120,
    },
    {
      title: '추모실',
      dataIndex: 'memorial_room_name',
      key: 'memorial_room_name',
      width: 120,
    },
    {
      title: '예약일시',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: 180,
      render: (text) => (
        <span className="text-gray-600">
          {dayjs(text).format('HH:mm')}
        </span>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status, record) => (
        status === 'completed' ? (
          <Tag color={RESERVATION_STATUS_COLORS[status]} className="px-3 py-1">
            {RESERVATION_STATUS_LABELS[status]}
          </Tag>
        ) : (
          <Dropdown
            menu={{ items: getStatusMenuItems(record) }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Tag 
              color={RESERVATION_STATUS_COLORS[status]} 
              className="px-3 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <span>{RESERVATION_STATUS_LABELS[status]}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </Tag>
          </Dropdown>
        )
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="text-red-600">{error}</Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* 금일 예약 */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-medium">금일 예약</span>
            </div>
            <Button
              type="primary"
              onClick={() => setIsQuickReservationModalVisible(true)}
              className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
            >
              빠른 접수
            </Button>
          </div>
        } 
        className="shadow-md"
      >
        {/* 필터 영역 */}
        <div className="mb-4 flex items-center gap-4">
          <Select
            placeholder="예약 상태"
            allowClear
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            {Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => (
              <Select.Option key={value} value={value}>{label}</Select.Option>
            ))}
          </Select>

          <Select
            placeholder="추모실"
            allowClear
            style={{ width: 150 }}
            value={filters.memorial_room_id}
            onChange={(value) => setFilters(prev => ({ ...prev, memorial_room_id: value }))}
          >
            {dashboardData?.memorial_room_status.map(room => (
              <Select.Option key={room.room_id} value={room.room_id}>
                {room.room_name}
              </Select.Option>
            ))}
          </Select>

          <TimePicker
            placeholder="예약 시간"
            format="HH:mm"
            allowClear
            style={{ width: 150 }}
            value={filters.time}
            onChange={(time) => setFilters(prev => ({ ...prev, time }))}
          />

          <Button onClick={handleResetFilters}>
            필터 초기화
          </Button>
        </div>

        <Table
          dataSource={filteredReservations}
          columns={columns}
          rowKey="id"
          pagination={false}
          className="border rounded-lg"
        />
      </Card>

      {/* 추모실 현황 */}
      <Card 
        title={
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-medium">추모실 현황</span>
          </div>
        } 
        className="shadow-md"
      >
        <div className="grid grid-cols-3 gap-4">
          {dashboardData?.memorial_room_status.map((room, index) => (
            <Card 
              key={`room-${room.room_id || index}`}
              className={`text-left border-l-4 shadow-sm hover:shadow-md transition-shadow ${
                room.current_status === 'in_use' 
                  ? 'border-l-blue-500'
                  : room.current_status === 'reserved'
                  ? 'border-l-orange-500'
                  : 'border-l-green-500'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-800">{room.room_name}</h3>
                  <Tag 
                    color={
                      room.current_status === 'in_use' 
                        ? 'blue'
                        : room.current_status === 'reserved'
                        ? 'orange'
                        : 'green'
                    }
                    className="px-2 py-0.5 text-xs font-medium"
                  >
                    {room.current_status === 'in_use' 
                      ? '사용중' 
                      : room.current_status === 'reserved'
                      ? '예약중'
                      : '사용가능'}
                  </Tag>
                </div>

                <div className="flex items-center justify-between mb-2">
                  {room.today_reservations?.[0]?.assigned_staff && (
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-600">{room.today_reservations[0].assigned_staff.name}</span>
                    </div>
                  )}

                  {room.today_reservations?.[0]?.scheduled_at && (
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-600 font-medium">
                        {dayjs(room.today_reservations[0].scheduled_at).format('HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* 예약 통계 */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center">
          <TotalIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">오늘 총 예약</p>
            <p className="text-xl font-bold text-blue-600">{dashboardData?.reservation_stats.today_total}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center">
          <PendingIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">대기 중</p>
            <p className="text-xl font-bold text-yellow-600">{dashboardData?.reservation_stats.today_pending}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center">
          <ConfirmedIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">확정</p>
            <p className="text-xl font-bold text-green-600">{dashboardData?.reservation_stats.today_confirmed}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center">
          <InProgressIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">진행 중</p>
            <p className="text-xl font-bold text-blue-600">{dashboardData?.reservation_stats.today_in_progress}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center">
          <CompletedIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">완료</p>
            <p className="text-xl font-bold text-gray-600">{dashboardData?.reservation_stats.today_completed}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center">
          <EmergencyIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">긴급 예약</p>
            <p className="text-xl font-bold text-red-600">{dashboardData?.reservation_stats.emergency_count}건</p>
          </div>
        </div>
      </div>

      {/* 빠른 접수 모달 */}
      {isQuickReservationModalVisible && (
        <QuickReservationModal
          visible={true}
          onCancel={() => setIsQuickReservationModalVisible(false)}
          onSuccess={() => {
            setIsQuickReservationModalVisible(false);
            fetchDashboardData(true);
          }}
        />
      )}
    </div>
  );
}; 