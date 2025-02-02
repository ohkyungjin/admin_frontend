import React, { useState, useEffect } from 'react';
import {
  getAdditionalOptions,
  createAdditionalOption,
  updateAdditionalOption,
  deleteAdditionalOption
} from '../../services/funeralService';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, Switch } from 'antd';

export const AdditionalOptionsPage = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [form] = Form.useForm();

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await getAdditionalOptions();
      setOptions(response.data);
    } catch (error) {
      message.error('추가 옵션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createAdditionalOption(values);
      message.success('추가 옵션이 생성되었습니다.');
      setModalVisible(false);
      form.resetFields();
      fetchOptions();
    } catch (error) {
      message.error('추가 옵션 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async (values) => {
    try {
      await updateAdditionalOption(editingOption.id, values);
      message.success('추가 옵션이 수정되었습니다.');
      setModalVisible(false);
      setEditingOption(null);
      form.resetFields();
      fetchOptions();
    } catch (error) {
      message.error('추가 옵션 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdditionalOption(id);
      message.success('추가 옵션이 삭제되었습니다.');
      fetchOptions();
    } catch (error) {
      message.error('추가 옵션 삭제에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: '옵션명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '가격',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `₩${price.toLocaleString()}`,
    },
    {
      title: '활성화',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => <Switch checked={isActive} disabled />,
    },
    {
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingOption(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            수정
          </Button>
          <Popconfirm
            title="이 추가 옵션을 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="예"
            cancelText="아니오"
          >
            <Button danger>삭제</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">추가 옵션 관리</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingOption(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          새 추가 옵션 추가
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={options}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingOption ? '추가 옵션 수정' : '새 추가 옵션 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingOption(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={editingOption ? handleUpdate : handleCreate}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="옵션명"
            rules={[{ required: true, message: '옵션명을 입력해주세요' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="설명"
            rules={[{ required: true, message: '설명을 입력해주세요' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="price"
            label="가격"
            rules={[{ required: true, message: '가격을 입력해주세요' }]}
          >
            <Input type="number" prefix="₩" />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="활성화"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item className="text-right">
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingOption(null);
                form.resetFields();
              }}>
                취소
              </Button>
              <Button type="primary" htmlType="submit">
                {editingOption ? '수정' : '추가'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
