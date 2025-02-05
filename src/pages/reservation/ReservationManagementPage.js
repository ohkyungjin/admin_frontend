import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, message, Space, Popconfirm, Card, Input, Tag, Select } from 'antd';
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
import { debounce } from 'lodash';

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
  const handleSearch = useCallback(
    debounce((value) => {
      setSearchText(value);
    }, 300),
    []
  );

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
  const handleDelete = async (id) => {
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
  };

  // 예약 상태 변경
  const handleStatusChange = async (id, status) => {
    try {
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
  };

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
      width: 150,
      render: (status, record) => (
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
        </Space>
      ),
      filters: STATUS_CHOICES.map(choice => ({
        text: choice.label,
        value: choice.value
      })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: '관리',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedReservation(record);
              setModalVisible(true);
            }}
            className={BUTTON_STYLES.secondary}
          >
            수정
          </Button>
          <Popconfirm
            title="예약을 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
            okButtonProps={{ className: BUTTON_STYLES.primary }}
            cancelButtonProps={{ className: BUTTON_STYLES.secondary }}
          >
            <Button className={BUTTON_STYLES.danger}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleStatusChange, handleDelete]);

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