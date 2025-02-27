import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Tag, message, DatePicker, Input, Modal, Form, Dropdown } from 'antd';
import { reservationService } from '../../services/reservationService';
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '../../constants/reservation';
import { ReservationFormModal } from '../../components/reservation';
import { FuneralCertificateModal } from '../../components/reservation/FuneralCertificateModal';
import locale from 'antd/es/date-picker/locale/ko_KR';
import dayjs from 'dayjs';

const { Search } = Input;

// 필터 초기값 상수 정의
const initialFilters = {
  date: dayjs().format('YYYY-MM-DD'),
  search: ''
};

export const ReservationManagementPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // 폼 초기값 설정
    form.setFieldsValue({
      date: dayjs(initialFilters.date),
      search: initialFilters.search
    });
  }, [form]);

  // 예약 목록 조회
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservationService.getReservations(filters);
      console.log(response);
      const formattedReservations = (response.results || []).map(reservation => ({
        ...reservation,
      formattedDate: dayjs(reservation.scheduled_at).format('YYYY-MM-DD HH:mm')
      }));
      setReservations(formattedReservations);
    } catch (error) {
      console.error('예약 목록 조회 오류:', error);
      message.error('예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // 예약 상태 변경 핸들러 추가
  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await reservationService.bulkUpdateStatus({
        reservation_ids: [reservationId],
        status: newStatus
      });
      message.success('예약 상태가 변경되었습니다.');
      fetchReservations();
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

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '예약일시',
      dataIndex: 'formattedDate',
      key: 'formattedDate',
      width: 150,
    },
    {
      title: '고객명',
      dataIndex: ['customer', 'name'],
      key: 'customer_name',
      width: 120,
    },
    {
      title: '반려동물',
      dataIndex: ['pet', 'name'],
      key: 'pet_name',
      width: 120,
    },
    {
      title: '전화번호',
      dataIndex: ['customer', 'phone'],
      key: 'customer_phone',
      width: 150,
    },
    {
      title: '담당자',
      dataIndex: ['assigned_staff', 'name'],
      key: 'assigned_staff_name',
      width: 120,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => (
        status === 'completed' || status === 'cancelled' ? (
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
    {
      title: '관리',
      key: 'action',
      width: 120,
      render: (_, record) => {
        // 완료 상태인 경우
        if (record.status === 'completed') {
          return (
            <div className="flex gap-2">
              {record.need_death_certificate && (
                <Button
                  type="text"
                  size="small"
                  className="flex items-center p-0 text-green-600"
                  onClick={() => handleOpenCertificate(record)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </Button>
              )}
              <Button
                type="text"
                size="small"
                className="flex items-center p-0 text-blue-600"
                onClick={() => handleEdit(record)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </Button>
            </div>
          );
        }

        // 기본 상태 (수정/삭제)
        return (
          <div className="flex gap-2">
            <Button
              type="text"
              size="small"
              className="flex items-center p-0 text-blue-600"
              onClick={() => handleEdit(record)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </Button>
            <Button
              type="text"
              size="small"
              className="flex items-center p-0 text-red-600"
              onClick={() => handleDelete(record)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </Button>
          </div>
        );
      },
    },
  ];

  // 필터 변경 핸들러
  const handleFilterChange = (name, value) => {
    if (name === 'date' && value) {
      // 날짜를 KST 기준으로 설정 (시작시간 00:00:00)
      const startOfDay = value.startOf('day').format('YYYY-MM-DD');
      setFilters(prev => ({
        ...prev,
        [name]: startOfDay
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 필터 초기화 핸들러 추가
  const handleResetFilters = () => {
    const today = dayjs().format('YYYY-MM-DD');
    setFilters({
      ...initialFilters,
      date: today
    });
    form.setFieldsValue({
      date: dayjs(today),
      search: ''
    });
  };

  // 수정 핸들러
  const handleEdit = (record) => {
    setSelectedReservation(record);
    setEditModalVisible(true);
  };

  // 삭제 핸들러
  const handleDelete = (record) => {
    Modal.confirm({
      title: '예약 삭제',
      content: `정말로 이 예약을 삭제하시겠습니까?\n고객명: ${record.customer?.name}\n반려동물: ${record.pet?.name}`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await reservationService.deleteReservation(record.id);
          message.success('예약이 삭제되었습니다.');
          fetchReservations();
        } catch (error) {
          console.error('예약 삭제 오류:', error);
          message.error('예약 삭제에 실패했습니다.');
        }
      },
    });
  };

  // 장례확인서 모달 열기
  const handleOpenCertificate = (record) => {
    setSelectedReservation(record);
    setCertificateModalVisible(true);
  };

  return (
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">예약 관리</h1>
          <Button
            type="primary"
            onClick={() => handleEdit(null)}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 예약 등록
          </Button>
        </div>

        {/* 필터 영역 */}
        <div className="mb-6">
          <Form form={form} className="flex justify-between items-center">
            <div className="flex gap-4">
              <Form.Item name="date" style={{ marginBottom: 0 }}>
                <DatePicker 
                  placeholder="예약일자"
                  style={{ width: 200 }}
                  format="YYYY-MM-DD"
                  onChange={(date) => handleFilterChange('date', date)}
                  allowClear
                  locale={locale}
                />
              </Form.Item>

              <Form.Item name="search" style={{ marginBottom: 0 }}>
                <Search
                  placeholder="고객명/전화번호 검색"
                  allowClear
                  style={{ width: 300 }}
                  onSearch={(value) => handleFilterChange('search', value)}
                />
              </Form.Item>
            </div>

            <Button onClick={handleResetFilters}>
              필터 초기화
            </Button>
          </Form>
        </div>

        {/* 테이블 */}
        <Table
          columns={columns}
          dataSource={reservations}
          rowKey="id"
          loading={loading}
          pagination={{
            total: reservations.length,
            pageSize: 10,
            showTotal: (total) => `총 ${total}개의 예약`,
          }}
        />
      </Card>

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

      <FuneralCertificateModal
        visible={certificateModalVisible}
        onCancel={() => {
          setCertificateModalVisible(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
      />
    </div>
  );
}; 