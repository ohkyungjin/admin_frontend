import React, { useState, useEffect } from 'react';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage
} from '../../services/funeralService';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';

export const PackageManagementPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form] = Form.useForm();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await getPackages();
      setPackages(response.data);
    } catch (error) {
      message.error('패키지 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createPackage(values);
      message.success('패키지가 생성되었습니다.');
      setModalVisible(false);
      form.resetFields();
      fetchPackages();
    } catch (error) {
      message.error('패키지 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async (values) => {
    try {
      await updatePackage(editingPackage.id, values);
      message.success('패키지가 수정되었습니다.');
      setModalVisible(false);
      setEditingPackage(null);
      form.resetFields();
      fetchPackages();
    } catch (error) {
      message.error('패키지 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePackage(id);
      message.success('패키지가 삭제되었습니다.');
      fetchPackages();
    } catch (error) {
      message.error('패키지 삭제에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: '패키지명',
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
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingPackage(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            수정
          </Button>
          <Popconfirm
            title="이 패키지를 삭제하시겠습니까?"
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
        <h1 className="text-2xl font-bold">패키지 관리</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingPackage(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          새 패키지 추가
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={packages}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingPackage ? '패키지 수정' : '새 패키지 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPackage(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={editingPackage ? handleUpdate : handleCreate}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="패키지명"
            rules={[{ required: true, message: '패키지명을 입력해주세요' }]}
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
          <Form.Item className="text-right">
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingPackage(null);
                form.resetFields();
              }}>
                취소
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPackage ? '수정' : '추가'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
