import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, message, Card, Input, Select, DatePicker } from 'antd';
import { ReservationFormModal } from '../../components/reservation/ReservationFormModal';
import { BUTTON_STYLES } from '../../constants/reservation';
import { 
  createReservation,
  updateReservation,
  deleteReservation,
  changeReservationStatus,
} from '../../services/reservationService';
import { useReservationData } from '../../hooks/reservation/useReservationData';
import { useReservationFilters } from '../../hooks/reservation/useReservationFilters';
import { getTableColumns } from '../../utils/reservation/tableColumns';

const { Search } = Input;

// 메인 컴포넌트
export const ReservationManagementPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const {
    reservations,
    staff,
    loading,
    packages,
    memorialRooms,
    fetchData
  } = useReservationData();

  const {
    setSearchText,
    setDateFilter,
    setMemorialRoomFilter,
    filteredReservations
  } = useReservationFilters(reservations);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (values) => {
    try {
      if (selectedReservation) {
        await updateReservation(selectedReservation.id, values);
        message.success('예약이 수정되었습니다.');
      } else {
        await createReservation(values);
        message.success('새 예약이 등록되었습니다.');
      }
      setModalVisible(false);
      setSelectedReservation(null);
      fetchData();
    } catch (error) {
      console.error('예약 처리 오류:', error);
      message.error('예약 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteReservation(id);
      message.success('예약이 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('예약 삭제 오류:', error);
      message.error('예약 삭제 중 오류가 발생했습니다.');
    }
  }, [fetchData]);

  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await changeReservationStatus(id, status);
      message.success('예약 상태가 변경되었습니다.');
      fetchData();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      message.error('상태 변경 중 오류가 발생했습니다.');
    }
  }, [fetchData]);

  const columns = useMemo(() => getTableColumns({
    handleDelete,
    handleStatusChange,
    packages,
    memorialRooms,
    staff,
    setSelectedReservation,
    setModalVisible
  }), [handleDelete, handleStatusChange, packages, memorialRooms, staff, setSelectedReservation, setModalVisible]);

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
          >
            새 예약 등록
          </Button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex space-x-4">
            <DatePicker
              onChange={setDateFilter}
              placeholder="예약일자 선택"
              className="w-48"
            />
            <Select
              allowClear
              placeholder="추모실 선택"
              onChange={setMemorialRoomFilter}
              className="w-48"
            >
              {memorialRooms.map(room => (
                <Select.Option key={room.id} value={room.name}>
                  {room.name}
                </Select.Option>
              ))}
            </Select>
            <Search
              placeholder="고객명/반려동물명 검색"
              allowClear
              onChange={e => setSearchText(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredReservations}
          rowKey="id"
          loading={loading}
          className="w-full"
          components={{
            header: {
              cell: props => (
                <th 
                  {...props} 
                  className="bg-gray-100 text-blue-800 font-medium"
                />
              )
            }
          }}
          locale={{
            emptyText: '예약이 없습니다.'
          }}
        />

        <ReservationFormModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedReservation(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedReservation}
          staff={staff}
          loading={loading}
        />
      </Card>
    </div>
  );
}; 