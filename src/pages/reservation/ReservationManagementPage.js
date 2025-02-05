import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, message, Space, Card, Input, Tag, Select, Dropdown, Modal } from 'antd';
import { ReservationFormModal } from '../../components/reservation/ReservationFormModal';
import { formatToLocal } from '../../utils/dateUtils';
import { 
  STATUS_COLORS,
  BUTTON_STYLES,
  STATUS_CHOICES 
} from '../../constants/reservation';
import { 
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  changeReservationStatus
} from '../../services/reservationService';
import { accountService } from '../../services/accountService';
import dayjs from 'dayjs';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

const { Search } = Input;

export const ReservationManagementPage = () => {
  const [reservations, setReservations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [searchText, setSearchText] = useState('');

  // 데이터 조회
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reservationsData, staffResponse] = await Promise.all([
        getReservations(),
        accountService.getUsers()
      ]);

      setReservations(reservationsData);
      
      // staffData 처리 로직 개선
      const staffData = staffResponse?.data?.results || staffResponse?.data || [];
      const activeStaff = Array.isArray(staffData) 
        ? staffData
          .filter(user => user?.is_active)
          .map(user => ({
            id: user?.id,
            name: user?.name || '이름 없음'
          }))
        : [];

      setStaff(activeStaff);
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      message.error('직원 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 검색 처리
  const handleSearch = useCallback((value) => {
    setSearchText(value);
  }, []);

  // 예약 처리
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (selectedReservation) {
        await updateReservation(selectedReservation.id, values);
        message.success('예약이 수정되었습니다.');
      } else {
        await createReservation(values);
        message.success('예약이 생성되었습니다.');
      }

      setModalVisible(false);
      setSelectedReservation(null);
      fetchData();
    } catch (error) {
      console.error('예약 처리 중 오류:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 예약 삭제
  const handleDelete = useCallback(async (id) => {
    try {
      setLoading(true);
      await deleteReservation(id);
      message.success('예약이 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('예약 삭제 오류:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // 예약 상태 변경
  const handleStatusChange = useCallback(async (id, status) => {
    try {
      // 진행중이나 완료 상태에서 취소로 변경하려는 경우
      if (status === 'cancelled') {
        const reservation = reservations.find(r => r.id === id);
        if (reservation?.status === 'in_progress' || reservation?.status === 'completed') {
          const confirmMessage = reservation.status === 'in_progress' 
            ? '진행중인 예약을 취소하시겠습니까? 이미 진행된 서비스에 대한 처리가 필요할 수 있습니다.'
            : '완료된 예약을 취소하시겠습니까? 이미 제공된 서비스에 대한 처리가 필요할 수 있습니다.';

          if (!window.confirm(confirmMessage)) {
            return;
          }

          // 예약이 실제로 취소되었는지 확인
          const confirmCancellation = window.confirm('예약이 실제로 취소되었음을 확인하셨습니까?');
          if (!confirmCancellation) {
            return;
          }
        }
      }

      setLoading(true);
      await changeReservationStatus(id, status);
      message.success('예약 상태가 변경되었습니다.');
      fetchData();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchData, reservations]);

  // 예약 상태 자동 업데이트
  const updateReservationStatuses = useCallback(async () => {
    const now = dayjs();
    const updatedReservations = [...reservations];
    let hasChanges = false;

    for (const reservation of updatedReservations) {
      const scheduledTime = dayjs(reservation.scheduled_at);
      const timeDiff = now.diff(scheduledTime, 'hour');
      
      // 상태가 '확정'이고 예약 시간이 지난 경우 '진행중'으로 변경
      if (reservation.status === 'confirmed' && now.isAfter(scheduledTime)) {
        try {
          await changeReservationStatus(reservation.id, 'in_progress');
          reservation.status = 'in_progress';
          hasChanges = true;
        } catch (error) {
          console.error('상태 업데이트 실패:', error);
        }
      }
      // 상태가 '진행중'이고 예약 시간으로부터 2시간이 지난 경우 '완료'로 변경
      else if (reservation.status === 'in_progress' && timeDiff >= 2) {
        try {
          await changeReservationStatus(reservation.id, 'completed');
          reservation.status = 'completed';
          hasChanges = true;
        } catch (error) {
          console.error('상태 업데이트 실패:', error);
        }
      }
    }

    if (hasChanges) {
      setReservations(updatedReservations);
    }
  }, [reservations]);

  // 1분마다 상태 체크
  useEffect(() => {
    const timer = setInterval(() => {
      updateReservationStatuses();
    }, 60000); // 60000ms = 1분

    return () => clearInterval(timer);
  }, [updateReservationStatuses]);

  // 컴포넌트 마운트 시 최초 1회 실행
  useEffect(() => {
    updateReservationStatuses();
  }, [updateReservationStatuses]);

  // 테이블 컬럼 정의
  const columns = useMemo(() => [
    {
      title: '고객명',
      dataIndex: ['customer', 'name'],
      key: 'customer_name',
      width: 120,
      sorter: (a, b) => a.customer.name.localeCompare(b.customer.name)
    },
    {
      title: '연락처',
      dataIndex: ['customer', 'phone'],
      key: 'customer_phone',
      width: 150,
    },
    {
      title: '반려동물명',
      dataIndex: ['pet', 'name'],
      key: 'pet_name',
      width: 120,
    },
    {
      title: '예약일시',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: 180,
      render: formatToLocal,
      sorter: (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
    },
    {
      title: '담당자',
      dataIndex: 'assigned_staff_name',
      key: 'assigned_staff',
      width: 120,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      render: (status, record) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '수정',
            onClick: () => {
              setSelectedReservation(record);
              setModalVisible(true);
            }
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '삭제',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '예약 삭제',
                content: '정말로 이 예약을 삭제하시겠습니까?',
                okText: '삭제',
                cancelText: '취소',
                okButtonProps: { className: BUTTON_STYLES.danger },
                cancelButtonProps: { className: BUTTON_STYLES.secondary },
                onOk: () => handleDelete(record.id)
              });
            }
          }
        ];

        return (
          <Space>
            <Tag color={STATUS_COLORS[status]}>
              {STATUS_CHOICES.find(choice => choice.value === status)?.label || status}
            </Tag>
            <Select
              size="small"
              value={status}
              onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
              style={{ width: 100 }}
            >
              {STATUS_CHOICES.map(choice => (
                <Select.Option key={choice.value} value={choice.value}>
                  {choice.label}
                </Select.Option>
              ))}
            </Select>
            <Dropdown
              menu={{ items }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="text-gray-600 hover:text-gray-800"
              />
            </Dropdown>
          </Space>
        );
      },
      filters: STATUS_CHOICES.map(choice => ({
        text: choice.label,
        value: choice.value
      })),
      onFilter: (value, record) => record.status === value
    },
  ], [handleDelete, handleStatusChange]);

  // 필터링된 예약 목록
  const filteredReservations = useMemo(() => {
    if (!searchText) return reservations;
    
    const searchLower = searchText.toLowerCase();
    return reservations.filter(reservation => 
      reservation?.customer?.name?.toLowerCase().includes(searchLower) ||
      reservation?.customer?.phone?.includes(searchText) ||
      reservation?.pet?.name?.toLowerCase().includes(searchLower)
    );
  }, [reservations, searchText]);

  return (
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">예약 관리</h1>
          <Button
            type="primary"
            onClick={() => {
              setSelectedReservation(null);
              setModalVisible(true);
            }}
            className={BUTTON_STYLES.primary}
            disabled={loading || staff.length === 0}
          >
            새 예약 등록
          </Button>
        </div>

        {staff.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded">
            직원 정보를 불러올 수 없습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.
          </div>
        )}

        <div className="mb-6">
          <div className="w-full md:w-96">
            <Search
              placeholder="고객명, 연락처, 반려동물명으로 검색"
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
              allowClear
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredReservations}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
            pageSize: 10
          }}
        />

        <ReservationFormModal
          visible={modalVisible}
          loading={loading}
          onCancel={() => {
            setModalVisible(false);
            setSelectedReservation(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedReservation}
          staff={staff}
        />
      </Card>
    </div>
  );
}; 