import React, { useState, useEffect } from 'react';
import {
  getPremiumLines,
  createPremiumLine,
  updatePremiumLine,
  deletePremiumLine
} from '../../services/funeralService';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';

export const PremiumLineManagementPage = () => {
  const [premiumLines, setPremiumLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [form] = Form.useForm();

  const fetchPremiumLines = async () => {
    try {
      setLoading(true);
      const response = await getPremiumLines();
      setPremiumLines(response.data);
    } catch (error) {
      message.error('프리미엄 라인 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremiumLines();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createPremiumLine(values);
      message.success('프리미엄 라인이 생성되었습니다.');
      setModalVisible(false);
      form.resetFields();
      fetchPremiumLines();
    } catch (error) {
      message.error('프리미엄 라인 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async (values) => {
    try {
      await updatePremiumLine(editingLine.id, values);
      message.success('프리미엄 라인이 수정되었습니다.');
      setModalVisible(false);
      setEditingLine(null);
      form.resetFields();
      fetchPremiumLines();
    } catch (error) {
      message.error('프리미엄 라인 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePremiumLine(id);
      message.success('프리미엄 라인이 삭제되었습니다.');
      fetchPremiumLines();
    } catch (error) {
      message.error('프리미엄 라인 삭제에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: '라인명',
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
      title: '포함 품목',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.map(item => item.name).join(', '),
    },
    {
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingLine(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            수정
          </Button>
          <Popconfirm
            title="이 프리미엄 라인을 삭제하시겠습니까?"
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
        <h1 className="text-2xl font-bold">프리미엄 라인 관리</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingLine(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          새 프리미엄 라인 추가
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={premiumLines}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingLine ? '프리미엄 라인 수정' : '새 프리미엄 라인 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingLine(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={editingLine ? handleUpdate : handleCreate}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="라인명"
            rules={[{ required: true, message: '라인명을 입력해주세요' }]}
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
                setEditingLine(null);
                form.resetFields();
              }}>
                취소
              </Button>
              <Button type="primary" htmlType="submit">
                {editingLine ? '수정' : '추가'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
