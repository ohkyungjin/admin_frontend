import React from 'react';
import { Form, DatePicker, Select, Input, Checkbox, Alert } from 'antd';
import { VISIT_ROUTE_CHOICES } from '../../../../constants/reservation';

export const ReservationInfoSection = ({ 
  memorialRooms, 
  availabilityError,
  onScheduleChange 
}) => {
  return (
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
            onChange={onScheduleChange}
          />
        </Form.Item>

        <Form.Item
          name="memorial_room_id"
          label="추모실"
          rules={[{ required: true, message: '추모실을 선택해주세요' }]}
        >
          <Select onChange={onScheduleChange}>
            {memorialRooms.map(room => (
              <Select.Option key={room.id} value={room.id}>{room.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="visit_route"
          label="방문경로"
          rules={[{ message: '방문경로를 선택해주세요' }]}
        >
          <Select>
            {VISIT_ROUTE_CHOICES.map(choice => (
              <Select.Option key={choice.value} value={choice.value}>
                {choice.label}
              </Select.Option>
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
  );
}; 