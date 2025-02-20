import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Button, message } from 'antd';
import { memorialRoomService } from '../../services/memorialRoomService';
import { reservationService } from '../../services/reservationService';
import { PET_SPECIES } from '../../constants/reservation';
import dayjs from 'dayjs';

export const QuickReservationModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [memorialRooms, setMemorialRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [operatingHours, setOperatingHours] = useState(null);

  // 예약 가능 시간 조회
  const checkAvailability = async (date, memorialRoomId) => {
    if (!date || !memorialRoomId) return;

    try {
      const params = {
        date: date.format('YYYY-MM-DD'),
        memorial_room_id: memorialRoomId,
        selected_time: selectedTime
      };

      const response = await reservationService.getAvailableTimes(params);
      
      if (response.data) {
        const { operating_hours, time_slots, selected_time } = response.data;
        setOperatingHours(operating_hours);
        setTimeSlots(time_slots);
        
        if (selected_time) {
          setSelectedTime(selected_time);
          form.setFieldsValue({
            scheduled_at: dayjs(date.format('YYYY-MM-DD') + ' ' + selected_time)
          });
        }
      }
    } catch (error) {
      console.error('예약 가능 시간 조회 오류:', error);
      if (error.response?.data?.code === 'DATE_REQUIRED') {
        message.error('날짜를 지정해주세요.');
      } else if (error.response?.data?.code === 'PAST_DATE') {
        message.error('과거 날짜는 조회할 수 없습니다.');
      } else {
        message.error('예약 가능 시간을 불러오는데 실패했습니다.');
      }
    }
  };

  // 시간 선택 버튼 생성
  const renderTimeButtons = () => {
    if (!operatingHours) return null;

    const buttons = [];
    const now = dayjs();
    const isToday = selectedDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD');
    const currentHour = now.hour();
    const currentMinute = now.minute();

    timeSlots.forEach((slot) => {
      const [hour, minute] = slot.start_time.split(':').map(Number);
      const timeString = slot.start_time;
      
      // 지난 시간 체크
      const isPastTime = isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute));
      
      // 선택 불가능 조건 체크
      const isDisabled = !slot.is_selectable || isPastTime || slot.status !== 'available' || slot.blocking_reservation;
      
      // 버튼 스타일 결정
      let buttonStyle = '';
      if (slot.is_in_selected_block) {
        buttonStyle = '!bg-blue-100 !border-blue-300 !text-blue-800';
      } else if (isDisabled) {
        buttonStyle = '!bg-gray-50 !border-gray-100 !text-gray-300';
      }

      buttons.push(
        <Button
          key={timeString}
          type={selectedTime === timeString ? 'primary' : 'default'}
          disabled={isDisabled}
          onClick={() => {
            setSelectedTime(timeString);
            form.setFieldsValue({
              scheduled_at: selectedDate.hour(hour).minute(minute)
            });
            checkAvailability(selectedDate, form.getFieldValue('memorial_room_id'));
          }}
          className={`
            w-full h-10
            ${selectedTime === timeString ? '!bg-blue-800 !border-blue-800 !text-white' : buttonStyle}
            ${!isDisabled ? 'hover:!border-blue-800 hover:!text-blue-800' : ''}
            transition-colors duration-200
          `}
        >
          {timeString}
        </Button>
      );
    });

    return (
      <div className="w-full">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {buttons}
        </div>
      </div>
    );
  };

  // 추모실 목록 조회
  const fetchMemorialRooms = async () => {
    try {
      const response = await memorialRoomService.getRooms();
      setMemorialRooms(response.results || []);
    } catch (error) {
      console.error('추모실 목록 조회 오류:', error);
      message.error('추모실 목록을 불러오는데 실패했습니다.');
    }
  };

  // 모달이 열릴 때 추모실 목록 조회
  useEffect(() => {
    if (visible) {
      fetchMemorialRooms();
      // 모달이 열릴 때 오늘 날짜로 설정
      const today = dayjs();
      setSelectedDate(today);
      form.setFieldsValue({ date: today });
    }
  }, [visible, form]);

  // 날짜 선택 변경 시
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    form.setFieldsValue({ scheduled_at: null });
    const memorialRoomId = form.getFieldValue('memorial_room_id');
    if (memorialRoomId) {
      checkAvailability(date, memorialRoomId);
    }
  };

  // 모달이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setSelectedTime(null);
      setTimeSlots([]);
      setOperatingHours(null);
    }
  }, [visible, form]);

  // 빠른 접수 처리
  const handleQuickReservation = async (values) => {
    Modal.confirm({
      title: '예약 접수 확인',
      content: (
        <div className="space-y-2 mt-4">
          <p><strong>예약 정보를 확인해주세요</strong></p>
          <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
            <p>• 예약일시: {values.scheduled_at.format('YYYY-MM-DD HH:mm')}</p>
            <p>• 추모실: {memorialRooms.find(room => room.id === values.memorial_room_id)?.name}</p>
            <p>• 보호자명: {values.customer_name}</p>
            <p>• 연락처: {values.customer_phone}</p>
            <p>• 반려동물: {values.pet_name} ({values.pet_species || '종 미지정'})</p>
          </div>
          <p className="text-red-600">해당 내용으로 예약을 접수하시겠습니까?</p>
        </div>
      ),
      okText: '접수',
      cancelText: '취소',
      okButtonProps: {
        className: "!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900"
      },
      onOk: async () => {
        try {
          setLoading(true);
          const formData = {
            scheduled_at: values.scheduled_at.toISOString(),
            memorial_room_id: values.memorial_room_id,
            customer: {
              name: values.customer_name,
              phone: values.customer_phone,
              address: values.customer_address
            },
            pet: {
              name: values.pet_name,
              species: values.pet_species,
              breed: values.pet_breed,
              weight: values.pet_weight?.toString()
            },
            memo: values.memo || "빠른 접수 예약"
          };

          await reservationService.createReservation(formData);
          message.success('예약이 등록되었습니다.');
          onSuccess?.();
          onCancel?.();
        } catch (error) {
          console.error('예약 등록 오류:', error);
          message.error('예약 등록에 실패했습니다.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedTime(null);
    setTimeSlots([]);
    setOperatingHours(null);
    onCancel?.();
  };

  return (
    <Modal
      title="빠른 접수"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      maskClosable={false}
    >
      <Form
        form={form}
        onFinish={handleQuickReservation}
        layout="vertical"
        className="space-y-6"
        initialValues={{ date: dayjs() }}
      >
        {/* 예약 정보 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            예약 정보
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* 날짜 선택 */}
            <Form.Item
              name="date"
              label="예약일자"
              rules={[{ required: true, message: '예약일자를 선택해주세요' }]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                value={selectedDate}
                onChange={handleDateChange}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf('day');
                }}
              />
            </Form.Item>
            <Form.Item
              name="memorial_room_id"
              label="추모실"
              rules={[{ required: true, message: '추모실을 선택해주세요' }]}
            >
              <Select onChange={(value) => {
                if (selectedDate) {
                  checkAvailability(selectedDate, value);
                }
              }}>
                {memorialRooms.map(room => (
                  <Select.Option key={room.id} value={room.id}>{room.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 시간 선택 그리드 */}
          <Form.Item
            name="scheduled_at"
            label="예약시간"
            rules={[{ required: true, message: '예약시간을 선택해주세요' }]}
          >
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  {selectedTime ? `선택된 시간: ${selectedTime}` : '시간을 선택해주세요'}
                </span>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-100 border border-blue-300 rounded-sm"></span>
                    선택됨
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-50 border border-gray-100 rounded-sm"></span>
                    불가
                  </span>
                </div>
              </div>
              {renderTimeButtons()}
            </div>
          </Form.Item>
        </div>

        {/* 보호자 정보 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            보호자 정보
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="customer_name"
              label="보호자명"
              rules={[{ required: true, message: '보호자명을 입력해주세요' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="customer_phone"
              label="연락처"
              rules={[{ required: true, message: '연락처를 입력해주세요' }]}
            >
              <Input />
            </Form.Item>
          </div>
        </div>

        {/* 반려동물 정보 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            반려동물 정보
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="pet_name"
              label="이름"
              rules={[{ required: true, message: '반려동물의 이름을 입력해주세요' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="pet_species"
              label="종"
            >
              <Select>
                {PET_SPECIES.map(species => (
                  <Select.Option key={species.value} value={species.value}>
                    {species.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="pet_breed"
              label="품종"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="pet_weight"
              label="체중 (kg)"
            >
              <InputNumber min={0} step={0.1} className="w-full" />
            </Form.Item>

            <Form.Item
              name="memo"
              label="메모"
              className="col-span-2"
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={handleCancel}>
            취소
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            접수
          </Button>
        </div>
      </Form>
    </Modal>
  );
}; 