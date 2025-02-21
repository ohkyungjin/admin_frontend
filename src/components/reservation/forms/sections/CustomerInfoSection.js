import React from 'react';
import { Form, Input } from 'antd';

export const CustomerInfoSection = () => {
  return (
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
  );
}; 