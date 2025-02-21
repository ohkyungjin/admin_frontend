import React from 'react';
import { Modal, Form, Button, Spin } from 'antd';
import { ReservationInfoSection } from './sections/ReservationInfoSection';
import { CustomerInfoSection } from './sections/CustomerInfoSection';
import { PetInfoSection } from './sections/PetInfoSection';
import { ServiceInfoSection } from './sections/ServiceInfoSection';
import { useReservationForm } from '../../../hooks/useReservationForm';

export const ReservationFormModal = ({ visible, onCancel, reservationId, reservation, onSuccess }) => {
  const [form] = Form.useForm();
  
  const {
    loading,
    checkingAvailability,
    availabilityError,
    memorialRooms,
    packages,
    premiumLines,
    additionalOptions,
    staffs,
    checkAvailability,
    handleSave
  } = useReservationForm({ form, reservationId, reservation, onSuccess, onCancel });

  // 날짜 또는 추모실 선택 시 예약 가능 여부 체크
  const handleScheduleChange = async () => {
    const values = await form.validateFields(['scheduled_at', 'memorial_room_id'])
      .catch(() => null);
    
    if (values) {
      await checkAvailability(values);
    }
  };

  // 저장 전 확인 메시지 표시
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      Modal.confirm({
        title: reservationId ? '예약 수정' : '새 예약 등록',
        content: reservationId 
          ? `예약을 수정하시겠습니까?\n\n고객명: ${values.customer_name}\n반려동물: ${values.pet_name}\n예약일시: ${values.scheduled_at.format('YYYY-MM-DD HH:mm')}`
          : `새 예약을 등록하시겠습니까?\n\n고객명: ${values.customer_name}\n반려동물: ${values.pet_name}\n예약일시: ${values.scheduled_at.format('YYYY-MM-DD HH:mm')}`,
        okText: '확인',
        cancelText: '취소',
        okButtonProps: {
          className: "!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
        },
        onOk: () => handleSave(values)
      });
    } catch (error) {
      console.error('폼 검증 오류:', error);
    }
  };

  return (
    <Modal
      title={reservationId ? "예약 수정" : "새 예약 등록"}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          취소
        </Button>,
        <Button 
          key="submit" 
          type="primary"
          onClick={handleSubmit}
          loading={loading || checkingAvailability}
          disabled={!!availabilityError}
          className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900"
        >
          저장
        </Button>
      ]}
      width={800}
    >
      <Spin spinning={loading || checkingAvailability}>
        <Form
          form={form}
          layout="vertical"
          className="space-y-6"
        >
          <ReservationInfoSection
            memorialRooms={memorialRooms}
            checkingAvailability={checkingAvailability}
            availabilityError={availabilityError}
            onScheduleChange={handleScheduleChange}
          />
          
          <CustomerInfoSection />
          
          <PetInfoSection />
          
          <ServiceInfoSection
            packages={packages}
            premiumLines={premiumLines}
            additionalOptions={additionalOptions}
            staffs={staffs}
          />
        </Form>
      </Spin>
    </Modal>
  );
}; 