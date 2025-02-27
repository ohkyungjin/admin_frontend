import React, { useEffect, useCallback, useReducer } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Button, message } from 'antd';
import { reservationService } from '../../../services/reservationService';
import { PET_SPECIES } from '../../../constants/reservation';
import dayjs from 'dayjs';

// 액션 타입 정의
const ACTIONS = {
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  SET_SELECTED_TIME: 'SET_SELECTED_TIME',
  SET_TIME_SLOTS: 'SET_TIME_SLOTS',
  RESET_RESERVATION_STATE: 'RESET_RESERVATION_STATE',
  SET_AVAILABILITY_DATA: 'SET_AVAILABILITY_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_LOADING_STATE: 'SET_LOADING_STATE'
};

// 초기 상태
const initialState = {
  selectedDate: dayjs(),
  selectedTime: null,
  timeSlots: [],
  error: null,
  loadingStates: {
    isCheckingAvailability: false,
    isSubmitting: false
  }
};

// 리듀서 함수
const reservationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_SELECTED_DATE:
      return { ...state, selectedDate: action.payload };
    case ACTIONS.SET_SELECTED_TIME:
      return { ...state, selectedTime: action.payload };
    case ACTIONS.SET_TIME_SLOTS:
      return { ...state, timeSlots: action.payload };
    case ACTIONS.RESET_RESERVATION_STATE:
      return initialState;
    case ACTIONS.SET_AVAILABILITY_DATA:
      return {
        ...state,
        timeSlots: action.payload.time_slots,
        selectedTime: action.payload.selected_time || state.selectedTime,
        error: null
      };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_LOADING_STATE:
      return {
        ...state,
        loadingStates: { ...state.loadingStates, ...action.payload }
      };
    default:
      return state;
  }
};

export const QuickReservationModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [reservationState, dispatch] = useReducer(reservationReducer, initialState);

  // 예약 가능 시간 조회
  const fetchAvailableTimes = useCallback(async (date) => {
    try {
      const response = await reservationService.getAvailableTimes({
        date: date.format('YYYY-MM-DD')
      });
      
      console.log('Available times response:', response.data);
      
      dispatch({ 
        type: ACTIONS.SET_TIME_SLOTS, 
        payload: response.data.available_times 
      });
    } catch (error) {
      console.error('예약 가능 시간 조회 오류:', error);
      message.error('예약 가능 시간을 불러오는데 실패했습니다.');
    }
  }, []);

  // 모달이 열릴 때 시간 가져오기
  useEffect(() => {
    if (visible && form.getFieldValue('date')) {
      fetchAvailableTimes(form.getFieldValue('date'));
    }
  }, [visible, form, fetchAvailableTimes]);

  // 에러 메시지 표시 컴포넌트
  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-600">{error}</span>
        </div>
      </div>
    );
  };

  // 상태 초기화 함수
  const resetFormAndState = useCallback(() => {
    form.resetFields();
    dispatch({ type: ACTIONS.RESET_RESERVATION_STATE });
  }, [form]);

  // 초기 데이터 로드 함수
  const initializeFormData = useCallback(async () => {
    try {
      const today = dayjs();
      dispatch({ type: ACTIONS.SET_SELECTED_DATE, payload: today });
      form.setFieldsValue({ date: today });
      await fetchAvailableTimes(today);
    } catch (error) {
      console.error('초기 데이터 로드 오류:', error);
      const errorMessage = error.response?.data?.detail || '초기 데이터를 불러오는데 실패했습니다.';
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
      message.error(errorMessage);
    }
  }, [form, fetchAvailableTimes]);

  // 모달 상태 변경 처리
  useEffect(() => {
    if (visible) {
      initializeFormData();
    } else {
      resetFormAndState();
    }
  }, [visible, initializeFormData, resetFormAndState]);

  // 날짜 선택 변경 시
  const handleDateChange = (date) => {
    dispatch({ type: ACTIONS.SET_SELECTED_DATE, payload: date });
    dispatch({ type: ACTIONS.SET_SELECTED_TIME, payload: null });
    form.setFieldsValue({ scheduled_at: null });
    if (date) {
      fetchAvailableTimes(date);
    }
  };

  // 빠른 접수 처리
  const handleQuickReservation = async (values) => {
    Modal.confirm({
      title: '예약 접수 확인',
      content: (
        <div className="space-y-2 mt-4">
          <p><strong>예약 정보를 확인해주세요</strong></p>
          <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
            <p>• 예약일시: {values.scheduled_at.format('YYYY-MM-DD HH:mm')}</p>
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
          dispatch({ 
            type: ACTIONS.SET_LOADING_STATE, 
            payload: { isSubmitting: true } 
          });
          dispatch({ type: ACTIONS.SET_ERROR, payload: null });

          const formData = {
            scheduled_at: values.scheduled_at.toISOString(),
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
          const errorMessage = error.response?.data?.error || '예약 등록에 실패했습니다.';
          dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
          message.error(errorMessage);
        } finally {
          dispatch({ 
            type: ACTIONS.SET_LOADING_STATE, 
            payload: { isSubmitting: false } 
          });
        }
      }
    });
  };

  // 취소 핸들러
  const handleCancel = () => {
    resetFormAndState();
    onCancel?.();
  };

  // 시간 선택 버튼 생성
  const renderTimeButtons = () => {
    if (!reservationState.timeSlots) return null;

    return (
      <div className="w-full">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {reservationState.timeSlots.map(({ time, current_bookings, is_available }) => {
            const isSelected = reservationState.selectedTime === time;
            
            return (
              <Button
                key={time}
                type={isSelected ? 'primary' : 'default'}
                disabled={!is_available || current_bookings >= 3}
                onClick={() => {
                  dispatch({ type: ACTIONS.SET_SELECTED_TIME, payload: time });
                  const [hours, minutes] = time.split(':');
                  const dateTime = reservationState.selectedDate
                    .hour(parseInt(hours))
                    .minute(parseInt(minutes));
                  form.setFieldsValue({
                    scheduled_at: dateTime
                  });
                }}
                className={`
                  relative w-full h-10
                  ${isSelected ? '!bg-blue-800 !border-blue-800 !text-white' : ''}
                  ${!is_available ? '!bg-gray-50 !border-gray-100 !text-gray-300' : 'hover:!border-blue-800 hover:!text-blue-800'}
                  transition-colors duration-200
                `}
              >
                {time}
                {current_bookings > 0 && (
                  <span className={`
                    absolute -top-2 -right-2 
                    min-w-[20px] h-5 
                    flex items-center justify-center 
                    px-1.5
                    text-[11px] font-medium
                    rounded-full
                    ${isSelected 
                      ? 'bg-blue-700 text-white' 
                      : current_bookings >= 3 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-100 text-blue-800'
                    }
                    border-2 border-white
                    shadow-sm
                  `}>
                    {current_bookings}/3
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
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
      {/* 에러 메시지 표시 */}
      <ErrorMessage error={reservationState.error} />

      <Form
        form={form}
        onFinish={handleQuickReservation}
        layout="vertical"
        className="space-y-6"
        initialValues={{ date: dayjs() }}
      >
        {/* 예약 정보 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg relative">
          {/* 로딩 오버레이 */}
          {reservationState.loadingStates.isCheckingAvailability && (
            <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-800"></div>
                <span className="text-sm text-gray-600">예약 가능 시간 확인 중...</span>
              </div>
            </div>
          )}

          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            예약 정보
          </h3>

          <div className="space-y-4">
            {/* 날짜 선택 */}
            <Form.Item
              name="date"
              label="예약일자"
              rules={[{ required: true, message: '예약일자를 선택해주세요' }]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                value={reservationState.selectedDate}
                onChange={handleDateChange}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf('day');
                }}
              />
            </Form.Item>

            {/* 시간 선택 */}
            <Form.Item
              name="scheduled_at"
              label="예약시간"
              rules={[{ required: true, message: '예약시간을 선택해주세요' }]}
            >
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    {reservationState.selectedTime ? `선택된 시간: ${reservationState.selectedTime}` : '시간을 선택해주세요'}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-800 rounded-sm"></span>
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
            loading={reservationState.loadingStates.isSubmitting}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            접수
          </Button>
        </div>
      </Form>
    </Modal>
  );
}; 