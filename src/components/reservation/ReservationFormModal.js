import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Checkbox, Divider, message } from 'antd';
import { VISIT_ROUTE_CHOICES, DEATH_REASON_CHOICES, BUTTON_STYLES } from '../../constants/reservation';
import dayjs from 'dayjs';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

export const ReservationFormModal = ({
  visible,
  loading,
  onCancel,
  onSubmit,
  initialData,
  staff
}) => {
  const [form] = Form.useForm();
  const [packages, setPackages] = useState([]);
  const [memorialRooms, setMemorialRooms] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // 패키지와 추모실 데이터 조회 (새 예약일 때만)
  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [packagesResponse, roomsResponse] = await Promise.all([
        axios.get('/funeral/packages/'),
        axios.get('/reservations/memorial-rooms/')
      ]);

      setPackages(packagesResponse.data?.results || []);
      setMemorialRooms(roomsResponse.data?.results || []);
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      message.error('패키지와 추모실 정보를 불러오는데 실패했습니다.');
    } finally {
      setFetchLoading(false);
    }
  };

  // 모달이 열릴 때 데이터 처리
  useEffect(() => {
    if (visible) {
      // 항상 패키지와 추모실 데이터를 불러옴
      fetchData();
      
      if (initialData) {
        console.log(initialData);
        form.setFieldsValue({
          // 고객 정보
          customer_name: initialData.customer.name,
          customer_phone: initialData.customer.phone,
          customer_email: initialData.customer.email,
          customer_address: initialData.customer.address,
          customer_memo: initialData.customer.memo,

          // 반려동물 정보
          pet_name: initialData.pet.name,
          pet_species: initialData.pet.species,
          pet_breed: initialData.pet.breed,
          pet_age: initialData.pet.age,
          pet_weight: initialData.pet.weight,
          pet_gender: initialData.pet.gender,
          death_date: initialData.pet.death_date ? dayjs(initialData.pet.death_date) : null,
          death_reason: initialData.pet.death_reason,
          pet_memo: initialData.pet.memo,

          // 예약 정보
          package: initialData.package_name,
          memorial_room: initialData.memorial_room_name,
          scheduled_at: dayjs(initialData.scheduled_at),
          assigned_staff: initialData.assigned_staff_name,
          is_emergency: initialData.is_emergency,
          visit_route: VISIT_ROUTE_CHOICES.find(
            choice => choice.value === initialData.visit_route
          ),
          referral_hospital: initialData.referral_hospital,
          need_death_certificate: initialData.need_death_certificate,
          custom_requests: initialData.custom_requests
        });
      } else {
        // 새 예약 모드: 폼 초기화
        form.resetFields();
        form.setFieldsValue({
          is_emergency: false,
          need_death_certificate: false,
          scheduled_at: dayjs(),
          visit_route: VISIT_ROUTE_CHOICES.find(choice => choice.value === 'internet'),
          pet_species: 'dog',
          pet_gender: 'male',
          death_date: null,
          death_reason: '',
          pet_weight: 0,
          pet_age: 0
        });
      }
    }
  }, [visible, initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('폼 데이터:', values);
      
      // 서버 형식에 맞게 데이터 변환
      const formattedValues = {
        customer: {
          name: values.customer_name,
          phone: values.customer_phone,
          email: values.customer_email || '',
          address: values.customer_address || '',
          memo: values.customer_memo || ''
        },
        pet: {
          name: values.pet_name,
          species: values.pet_species,
          breed: values.pet_breed,
          age: parseInt(values.pet_age) || 0,
          weight: parseFloat(values.pet_weight) || 0,
          gender: values.pet_gender,
          death_date: values.death_date ? dayjs(values.death_date).format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
          death_reason: values.death_reason,
          memo: values.pet_memo || ''
        },
        package: values.package,
        memorial_room: values.memorial_room,
        scheduled_at: dayjs(values.scheduled_at).format('YYYY-MM-DDTHH:mm:ss[Z]'),
        status: initialData?.status || 'pending',
        assigned_staff: initialData ? initialData.assigned_staff : values.assigned_staff,
        is_emergency: values.is_emergency || false,
        visit_route: values.visit_route?.value || 'internet',
        referral_hospital: values.referral_hospital || '',
        need_death_certificate: values.need_death_certificate || false,
        custom_requests: values.custom_requests || ''
      };

      console.log('서버로 전송될 데이터:', formattedValues);
      await onSubmit(formattedValues);
      
      // 성공적으로 제출된 후에만 폼 초기화 및 모달 닫기
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('폼 제출 오류:', error);
      message.error('필수 항목을 모두 입력해주세요.');
    }
  };

  return (
    <Modal
      title={initialData ? "예약 수정" : "새 예약 등록"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={800}
      confirmLoading={loading || fetchLoading}
      okButtonProps={{ className: BUTTON_STYLES.primary }}
      cancelButtonProps={{ className: BUTTON_STYLES.secondary }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          pet_species: 'dog',
          pet_gender: 'male',
          death_date: null,
          death_reason: '',
          is_emergency: false,
          need_death_certificate: false
        }}
      >
        {/* 고객 정보 섹션 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">고객 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="customer_name"
              label="고객명"
              rules={[{ required: true, message: '고객명을 입력해주세요' }]}
            >
              <Input placeholder="고객명 입력" />
            </Form.Item>

            <Form.Item
              name="customer_phone"
              label="연락처"
              rules={[{ required: true, message: '연락처를 입력해주세요' }]}
            >
              <Input placeholder="연락처 입력" />
            </Form.Item>

            <Form.Item name="customer_email" label="이메일">
              <Input placeholder="이메일 입력" />
            </Form.Item>

            <Form.Item name="customer_address" label="주소">
              <Input placeholder="주소 입력" />
            </Form.Item>

            <Form.Item name="customer_memo" label="메모" className="col-span-2">
              <TextArea rows={2} placeholder="고객 관련 특이사항" />
            </Form.Item>
          </div>
        </div>

        <Divider />

        {/* 반려동물 정보 섹션 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">반려동물 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="pet_name"
              label="반려동물명"
              rules={[{ required: true, message: '반려동물명을 입력해주세요' }]}
            >
              <Input placeholder="반려동물명 입력" />
            </Form.Item>

            <Form.Item
              name="pet_species"
              label="종류"
              rules={[{ required: true, message: '종류를 선택해주세요' }]}
            >
              <Select>
                <Option value="dog">강아지</Option>
                <Option value="cat">고양이</Option>
                <Option value="etc">기타</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="pet_breed"
              label="품종"
              rules={[{ required: true, message: '품종을 입력해주세요' }]}
            >
              <Input placeholder="품종 입력" />
            </Form.Item>

            <Form.Item
              name="pet_gender"
              label="성별"
              rules={[{ required: true, message: '성별을 선택해주세요' }]}
            >
              <Select>
                <Option value="male">수컷</Option>
                <Option value="female">암컷</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="pet_age"
              label="나이"
              rules={[{ required: true, message: '나이를 입력해주세요' }]}
            >
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>

            <Form.Item
              name="pet_weight"
              label="몸무게 (kg)"
              rules={[{ required: true, message: '몸무게를 입력해주세요' }]}
            >
              <InputNumber min={0} max={100} step={0.1} className="w-full" />
            </Form.Item>

            <Form.Item
              name="death_date"
              label="사망일시"
              rules={[{ required: true, message: '사망일시를 선택해주세요' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                className="w-full"
                placeholder="사망일시 선택"
              />
            </Form.Item>

            <Form.Item
              name="death_reason"
              label="사망원인"
              rules={[{ required: true, message: '사망원인을 선택해주세요' }]}
            >
              <Select placeholder="사망원인 선택">
                {DEATH_REASON_CHOICES.map(reason => (
                  <Option key={reason.value} value={reason.value}>
                    {reason.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="pet_memo" label="메모" className="col-span-2">
              <TextArea rows={2} placeholder="반려동물 관련 특이사항" />
            </Form.Item>
          </div>
        </div>

        <Divider />

        {/* 예약 정보 섹션 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">예약 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="package"
              label="패키지"
            >
              <Select 
                placeholder="패키지 선택" 
                allowClear 
                loading={fetchLoading}
                disabled={loading}
              >
                {packages.map(pkg => (
                  <Option key={pkg.name} value={pkg.name}>
                    {pkg.name} ({pkg.price?.toLocaleString()}원)
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="memorial_room"
              label="추모관"
              rules={[{ required: true, message: '추모관을 선택해주세요' }]}
            >
              <Select 
                placeholder="추모관 선택" 
                loading={fetchLoading}
                disabled={loading}
              >
                {memorialRooms.map(room => (
                  <Option key={room.name} value={room.name}>
                    {room.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="scheduled_at"
              label="예약일시"
              rules={[{ required: true, message: '예약일시를 선택해주세요' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                className="w-full"
                placeholder="예약일시 선택"
              />
            </Form.Item>

            <Form.Item
              name="assigned_staff"
              label="담당자"
              rules={[{ required: true, message: '담당자를 선택해주세요' }]}
            >
              <Select placeholder="담당자 선택">
                {staff.map(person => (
                  <Option key={person.id} value={person.id}>{person.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="is_emergency"
              label="긴급여부"
              valuePropName="checked"
            >
              <Checkbox>긴급 여부</Checkbox>
            </Form.Item>

            <Form.Item
              label="방문 경로"
              name="visit_route"
              rules={[{ required: true, message: '방문 경로를 선택해주세요' }]}
            >
              <Select
                placeholder="방문 경로 선택"
                options={VISIT_ROUTE_CHOICES}
                labelInValue
              />
            </Form.Item>

            <Form.Item
              name="referral_hospital"
              label="경유업체"
            >
              <Input placeholder="경유업체명 입력" />
            </Form.Item>

            <Form.Item
              name="need_death_certificate"
              label="장례확인서"
              valuePropName="checked"
            >
              <Checkbox>장례확인서 필요</Checkbox>
            </Form.Item>

            <Form.Item
              name="custom_requests"
              label="요청사항"
              className="col-span-2"
            >
              <TextArea rows={4} placeholder="특별한 요청사항이 있다면 입력해주세요" />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
}; 