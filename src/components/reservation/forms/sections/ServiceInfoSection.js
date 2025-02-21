import React from 'react';
import { Form, Select, Input } from 'antd';

const { TextArea } = Input;

export const ServiceInfoSection = ({ packages, premiumLines, additionalOptions, staffs }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <h3 className="text-lg font-medium mb-4">서비스 정보</h3>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="package_id"
          label="장례 패키지"
        >
          <Select>
            {packages.map(pkg => (
              <Select.Option key={pkg.id} value={pkg.id}>{pkg.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="premium_line_id"
          label="프리미엄 라인"
        >
          <Select>
            <Select.Option value={null}>선택 안함</Select.Option>
            {premiumLines.map(line => (
              <Select.Option key={line.id} value={line.id}>
                {line.name} ({parseInt(line.price).toLocaleString()}원)
              </Select.Option>
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
              <Select.Option key={option.id} value={option.id}>
                {option.name} ({parseInt(option.price).toLocaleString()}원)
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="assigned_staff_id"
          label="담당 직원"
        >
          <Select>
            {staffs.map(staff => (
              <Select.Option key={staff.id} value={staff.id}>{staff.name}</Select.Option>
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
  );
}; 