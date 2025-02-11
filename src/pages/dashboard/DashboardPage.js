import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Spin } from 'antd';
import { dashboardService } from '../../services/dashboardService';
import { 
  RESERVATION_STATUS_LABELS, 
  RESERVATION_STATUS_COLORS 
} from '../../constants/reservation';
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
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboard();
      setDashboardData(response);
      setError(null);
    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

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
      {/* 예약 통계 */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <TotalIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">오늘 총 예약</p>
            <p className="text-2xl font-bold text-blue-600">{dashboardData?.reservation_stats.today_total}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <PendingIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">대기 중</p>
            <p className="text-2xl font-bold text-yellow-600">{dashboardData?.reservation_stats.today_pending}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <ConfirmedIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">확정</p>
            <p className="text-2xl font-bold text-green-600">{dashboardData?.reservation_stats.today_confirmed}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <InProgressIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">진행 중</p>
            <p className="text-2xl font-bold text-blue-600">{dashboardData?.reservation_stats.today_in_progress}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <CompletedIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">완료</p>
            <p className="text-2xl font-bold text-gray-600">{dashboardData?.reservation_stats.today_completed}건</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <EmergencyIcon />
          <div className="ml-4">
            <p className="text-sm text-gray-500">긴급 예약</p>
            <p className="text-2xl font-bold text-red-600">{dashboardData?.reservation_stats.emergency_count}건</p>
          </div>
        </div>
      </div>

      {/* 추모실 현황과 직원 배정 현황 */}
      <Row gutter={[16, 16]}>
        {/* 추모실 현황 */}
        <Col span={12}>
          <Card 
            title={
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium">추모실 현황</span>
              </div>
            } 
            className="shadow-md h-full !p-0"
          >
            <Row gutter={[8, 8]}>
              {dashboardData?.memorial_room_status.map(room => (
                <Col span={8} key={room.room_id}>
                  <Card 
                    className={`text-center border ${
                      room.current_status === 'in_use' 
                        ? 'border-red-200 bg-red-50' 
                        : room.next_reservation && dayjs(room.next_reservation.scheduled_at).diff(dayjs(), 'hour') <= 2
                          ? room.next_reservation.status === 'pending'
                            ? 'border-yellow-200 bg-yellow-50'
                            : ['confirmed', 'in_progress', 'completed'].includes(room.next_reservation.status)
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-green-200 bg-green-50'
                          : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <h3 className="text-sm font-medium mb-1">{room.room_name}</h3>
                    <Tag 
                      color={
                        room.current_status === 'in_use' 
                          ? 'red' 
                          : room.next_reservation && dayjs(room.next_reservation.scheduled_at).diff(dayjs(), 'hour') <= 2
                            ? room.next_reservation.status === 'pending'
                              ? 'warning'
                              : ['confirmed', 'in_progress', 'completed'].includes(room.next_reservation.status)
                                ? 'blue'
                                : 'green'
                            : 'green'
                      } 
                      className="px-1.5 py-0 text-xs"
                    >
                      {room.current_status === 'in_use' 
                        ? '사용중' 
                        : room.next_reservation && dayjs(room.next_reservation.scheduled_at).diff(dayjs(), 'hour') <= 2
                          ? room.next_reservation.status === 'pending'
                            ? '대기중'
                            : ['confirmed', 'in_progress', 'completed'].includes(room.next_reservation.status)
                              ? '사용예정'
                              : '사용가능'
                          : '사용가능'}
                    </Tag>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-gray-600 leading-none">
                        <span className="font-medium">오늘 예약:</span> {room.today_reservation_count}건
                      </p>
                      {room.next_reservation && (
                        <p className="text-xs leading-none flex items-center justify-center mt-1.5">
                          <span className="font-medium text-blue-600 mr-1">다음:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded ${
                            room.next_reservation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {dayjs(room.next_reservation.scheduled_at).format('HH:mm')}
                          </span>
                        </p>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 직원 배정 현황 */}
        <Col span={12}>
          <Card 
            title={
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium">직원 배정 현황</span>
              </div>
            } 
            className="shadow-md h-full !p-0"
          >
            <Row gutter={[8, 8]}>
              {dashboardData?.staff_workload.map(staff => (
                <Col span={8} key={staff.staff_id}>
                  <Card 
                    className="bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-center mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-gray-800 leading-none">{staff.staff_name}</h4>
                      <p className="text-base font-bold text-blue-600 mt-0.5">{staff.assigned_count}건</p>
                    </div>
                    <div className="border-t pt-1 space-y-1">
                      {staff.today_assignments
                        .filter(assignment => ['pending', 'confirmed', 'in_progress', 'completed'].includes(assignment.status))
                        .map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between bg-white p-1 rounded text-xs">
                          <span className={`leading-none ${
                            assignment.status === 'pending' 
                              ? 'text-yellow-600' 
                              : 'text-gray-600'
                          }`}>
                            {dayjs(assignment.scheduled_at).format('HH:mm')}
                          </span>
                          <Tag 
                            color={RESERVATION_STATUS_COLORS[assignment.status]}
                            className="ml-1 !text-xs !px-1.5 !py-0 leading-none"
                          >
                            {RESERVATION_STATUS_LABELS[assignment.status]}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 최근 예약 */}
      <Card 
        title={
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-medium">금일 예약</span>
          </div>
        } 
        className="shadow-md"
      >
        <Table
          dataSource={dashboardData?.recent_reservations}
          rowKey="id"
          pagination={false}
          className="border rounded-lg"
          columns={[
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
              title: '예약일시',
              dataIndex: 'scheduled_at',
              key: 'scheduled_at',
              width: 180,
              render: (text) => (
                <span className="text-gray-600">
                  {dayjs(text).format('YYYY-MM-DD HH:mm')}
                </span>
              ),
            },
            {
              title: '상태',
              dataIndex: 'status',
              key: 'status',
              width: 120,
              render: (status) => (
                <Tag color={RESERVATION_STATUS_COLORS[status]} className="px-3 py-1">
                  {RESERVATION_STATUS_LABELS[status]}
                </Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}; 