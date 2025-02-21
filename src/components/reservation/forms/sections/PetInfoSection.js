import React from 'react';
import { Form, Input, Select, InputNumber, DatePicker } from 'antd';
import { 
  PET_SPECIES,
  PET_GENDERS,
  DEATH_REASON_CHOICES 
} from '../../../../constants/reservation';

export const PetInfoSection = () => {
  return (
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
          name="pet_gender"
          label="성별"
        >
          <Select>
            {PET_GENDERS.map(gender => (
              <Select.Option key={gender.value} value={gender.value}>
                {gender.label}
              </Select.Option>
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
              <Select.Option key={reason.value} value={reason.value}>
                {reason.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </div>
    </div>
  );
}; 