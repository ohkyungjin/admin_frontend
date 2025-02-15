import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Spin, message, Button, InputNumber, Checkbox, Alert } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { 
  VISIT_ROUTE_CHOICES,
  DEATH_REASON_CHOICES,
  PET_SPECIES,
  PET_GENDERS,
} from '../../constants/reservation';
import { reservationService } from '../../services/reservationService';
import { memorialRoomService } from '../../services/memorialRoomService';
import { getPackages, getPremiumLines, getAdditionalOptions } from '../../services/funeralService';
import { accountService } from '../../services/accountService';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { TextArea } = Input;

export const ReservationFormModal = ({ visible, onCancel, reservationId, reservation, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [memorialRooms, setMemorialRooms] = useState([]);
  const [packages, setPackages] = useState([]);
  const [premiumLines, setPremiumLines] = useState([]);
  const [additionalOptions, setAdditionalOptions] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  // 예약 가능 여부 체크
  const checkAvailability = async (values) => {
    if (!values.scheduled_at || !values.memorial_room_id) return;

    try {
      setCheckingAvailability(true);
      setAvailabilityError(null);

      const response = await reservationService.checkAvailability({
        memorial_room_id: values.memorial_room_id,
        scheduled_at: values.scheduled_at.toISOString(),
        duration_hours: 2,
        exclude_reservation_id: reservationId
      });

      if (response.is_available) {
        message.success('선택한 시간에 예약 가능합니다.');
        setAvailabilityError(null);
      } else if (response.conflicting_reservation) {
        if (reservationId && response.conflicting_reservation.id === reservationId) {
          setAvailabilityError(null);
          return;
        }
        const conflictTime = dayjs(response.conflicting_reservation.scheduled_at).format('YYYY-MM-DD HH:mm');
        setAvailabilityError(
          `선택한 시간에는 예약할 수 없습니다.\n해당 시간에 이미 예약이 있습니다. (예약번호: #${response.conflicting_reservation.id}, 시작시간: ${conflictTime})`
        );
      }
    } catch (error) {
      setAvailabilityError(error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // 날짜 또는 추모실 선택 시 예약 가능 여부 체크
  const handleScheduleChange = async () => {
    const values = await form.validateFields(['scheduled_at', 'memorial_room_id'])
      .catch(() => null);
    
    if (values) {
      await checkAvailability(values);
    }
  };

  // 시간 선택 제한
  const getDisabledTime = () => {
    return {};
  };

  // 목록 데이터 조회
  const fetchOptions = async () => {
    try {
      const [
        roomsResponse, 
        packagesResponse, 
        premiumLinesResponse,
        additionalOptionsResponse,
        staffsResponse
      ] = await Promise.all([
        memorialRoomService.getRooms(),
        getPackages(),
        getPremiumLines(),
        getAdditionalOptions(),
        accountService.getUsers()
      ]);

      setMemorialRooms(roomsResponse.results || []);
      setPackages(packagesResponse.data?.results || []);
      setPremiumLines(premiumLinesResponse.data?.results || []);
      setAdditionalOptions(additionalOptionsResponse.data?.results || []);
      setStaffs(staffsResponse.data?.results || []);
    } catch (error) {
      console.error('옵션 목록 조회 오류:', error);
      message.error('옵션 목록을 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    if (visible) {
      fetchOptions();
      if (reservationId && reservation) {
        form.setFieldsValue({
          // 예약 정보
          scheduled_at: dayjs(reservation.scheduled_at),
          status: reservation.status,
          is_emergency: reservation.is_emergency,
          visit_route: reservation.visit_route,
          referral_hospital: reservation.referral_hospital,
          need_death_certificate: reservation.need_death_certificate,
          memo: reservation.memo,
          memorial_room_id: reservation.memorial_room?.id || reservation.memorial_room_id,
          package_id: reservation.package?.id || reservation.package_id,
          premium_line_id: reservation.premium_line?.id || reservation.premium_line_id,
          additional_option_ids: reservation.additional_options?.map(opt => opt.id) || [],
          assigned_staff_id: reservation.assigned_staff?.id || reservation.assigned_staff_id,
          
          // 고객 정보
          customer_name: reservation.customer?.name,
          customer_phone: reservation.customer?.phone,
          customer_email: reservation.customer?.email,
          customer_address: reservation.customer?.address,
          
          // 반려동물 정보
          pet_name: reservation.pet?.name,
          pet_species: reservation.pet?.species,
          pet_breed: reservation.pet?.breed,
          pet_gender: reservation.pet?.gender,
          pet_age: reservation.pet?.age,
          pet_weight: reservation.pet?.weight,
          is_neutered: reservation.pet?.is_neutered,
          death_datetime: reservation.pet?.death_date ? dayjs(reservation.pet.death_date) : undefined,
          death_reason: reservation.pet?.death_reason,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, reservationId, reservation, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 이미 체크된 예약 가능 여부 확인
      if (availabilityError) {
        message.error(availabilityError);
        return;
      }

      // 확인 메시지 표시
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
        onOk: async () => {
          setLoading(true);
          const formData = {
            scheduled_at: values.scheduled_at.toISOString(),
            status: values.status,
            is_emergency: values.is_emergency,
            visit_route: values.visit_route,
            referral_hospital: values.referral_hospital,
            need_death_certificate: values.need_death_certificate,
            memo: values.memo,
            
            customer: {
              name: values.customer_name,
              phone: values.customer_phone,
              email: values.customer_email,
              address: values.customer_address,
            },
            
            pet: {
              name: values.pet_name,
              species: values.pet_species,
              breed: values.pet_breed,
              gender: values.pet_gender,
              age: values.pet_age,
              weight: values.pet_weight,
              is_neutered: values.is_neutered,
              death_date: values.death_datetime?.toISOString(),
              death_reason: values.death_reason,
            },
            
            memorial_room_id: values.memorial_room_id,
            package_id: values.package_id,
            premium_line_id: values.premium_line_id,
            additional_option_ids: values.additional_option_ids,
            assigned_staff_id: values.assigned_staff_id,
          };

          try {
            if (reservationId) {
              await reservationService.updateReservation(reservationId, formData);
              message.success('예약이 수정되었습니다.');
            } else {
              await reservationService.createReservation(formData);
              message.success('예약이 등록되었습니다.');
            }
            
            onSuccess?.();
            onCancel();
          } catch (error) {
            console.error('예약 저장 오류:', error);
            message.error(error.message || '예약 저장에 실패했습니다.');
          } finally {
            setLoading(false);
          }
        },
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
          onClick={handleSave}
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
          {/* 예약 정보 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">예약 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="scheduled_at"
                label="예약일시"
                rules={[{ required: true, message: '예약일시를 선택해주세요' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm', minuteStep: 10 }}
                  format="YYYY-MM-DD HH:mm"
                  className="w-full"
                  onChange={handleScheduleChange}
                  disabledTime={getDisabledTime}
                />
              </Form.Item>

              <Form.Item
                name="memorial_room_id"
                label="추모실"
                rules={[{ required: true, message: '추모실을 선택해주세요' }]}
              >
                <Select onChange={handleScheduleChange}>
                  {memorialRooms.map(room => (
                    <Option key={room.id} value={room.id}>{room.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="is_emergency"
                label="긴급여부"
                valuePropName="checked"
              >
                <Select>
                  <Option value={true}>긴급</Option>
                  <Option value={false}>일반</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="visit_route"
                label="방문경로"
                rules={[{ required: true, message: '방문경로를 선택해주세요' }]}
              >
                <Select>
                  {VISIT_ROUTE_CHOICES.map(choice => (
                    <Option key={choice.value} value={choice.value}>
                      {choice.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="referral_hospital"
                label="의뢰 병원명"
                dependencies={['visit_route']}
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue('visit_route') === 'hospital',
                    message: '의뢰 병원명을 입력해주세요',
                  }),
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="need_death_certificate"
                label="장례확인서 필요여부"
                valuePropName="checked"
              >
                <Checkbox>장례확인서 필요</Checkbox>
              </Form.Item>

              {availabilityError && (
                <div className="col-span-2">
                  <Alert
                    message={availabilityError}
                    type="error"
                    showIcon
                  />
                </div>
              )}
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">고객 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="customer_name"
                label="고객명"
                rules={[{ required: true, message: '고객명을 입력해주세요' }]}
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

              <Form.Item
                name="customer_email"
                label="이메일"
                rules={[
                  {
                    type: 'email',
                    message: '올바른 이메일 형식이 아닙니다',
                  }
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="customer_address"
                label="주소"
              >
                <Input />
              </Form.Item>
            </div>
          </div>

          {/* 반려동물 정보 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">반려동물 정보</h3>
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
                    <Option key={species.value} value={species.value}>
                      {species.label}
                    </Option>
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
                name="pet_gender"
                label="성별"
              >
                <Select>
                  {PET_GENDERS.map(gender => (
                    <Option key={gender.value} value={gender.value}>
                      {gender.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="pet_age"
                label="나이"
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>

              <Form.Item
                name="pet_weight"
                label="체중 (kg)"
              >
                <InputNumber min={0} step={0.1} className="w-full" />
              </Form.Item>

              <Form.Item
                name="death_datetime"
                label="사망일시"
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="death_reason"
                label="사망사유"
              >
                <Select>
                  {DEATH_REASON_CHOICES.map(reason => (
                    <Option key={reason.value} value={reason.value}>
                      {reason.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* 서비스 정보 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">서비스 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="package_id"
                label="장례 패키지"
              >
                <Select>
                  {packages.map(pkg => (
                    <Option key={pkg.id} value={pkg.id}>{pkg.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="premium_line_id"
                label="프리미엄 라인"
              >
                <Select>
                  <Option value={null}>선택 안함</Option>
                  {premiumLines.map(line => (
                    <Option key={line.id} value={line.id}>
                      {line.name} ({parseInt(line.price).toLocaleString()}원)
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="additional_option_ids"
                label="추가 서비스"
              >
                <Select
                  mode="multiple"
                  placeholder="추가 서비스를 선택해주세요"
                  allowClear
                >
                  {additionalOptions.map(option => (
                    <Option key={option.id} value={option.id}>
                      {option.name} ({parseInt(option.price).toLocaleString()}원)
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="assigned_staff_id"
                label="담당 직원"
              >
                <Select>
                  {staffs.map(staff => (
                    <Option key={staff.id} value={staff.id}>{staff.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="memo"
                label="메모"
                className="col-span-2"
              >
                <TextArea rows={4} />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
}; 