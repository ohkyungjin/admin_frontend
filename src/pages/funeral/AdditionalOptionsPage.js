import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, InputNumber, Card, Switch } from 'antd';
import {
  getAdditionalOptions,
  createAdditionalOption,
  updateAdditionalOption,
  deleteAdditionalOption
} from '../../services/funeralService';

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
      const optionsData = response?.data?.results;
      if (Array.isArray(optionsData)) {
        setOptions(optionsData);
      } else {
        setOptions([]);
      }
    } catch (error) {
      console.error('추가 옵션 조회 오류:', error);
      message.error('추가 옵션 목록을 불러오는데 실패했습니다.');
      setOptions([]);
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
      console.error('추가 옵션 생성 오류:', error);
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
      console.error('추가 옵션 수정 오류:', error);
      message.error('추가 옵션 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdditionalOption(id);
      message.success('추가 옵션이 삭제되었습니다.');
      fetchOptions();
    } catch (error) {
      console.error('추가 옵션 삭제 오류:', error);
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
      render: (price) => price != null ? `₩${price.toLocaleString()}` : '-',
    },
    {
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            className="!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
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
            okButtonProps={{ 
              className: "!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white" 
            }}
            cancelButtonProps={{ 
              className: "!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900" 
            }}
          >
            <Button 
              danger 
              type="primary" 
              className="!bg-red-500 !border-red-500 hover:!bg-red-600 hover:!border-red-600 !text-white"
            >
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card className="shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">추가 옵션 관리</h1>
          <Button
            type="primary"
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
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
          className="w-full"
          columns={columns}
          dataSource={options}
          rowKey="id"
          loading={loading}
          components={{
            header: {
              cell: props => (
                <th {...props} className="bg-gray-100 text-blue-800 font-medium" />
              )
            }
          }}
          locale={{
            emptyText: '추가 옵션이 없습니다. 새로운 추가 옵션을 추가해주세요.'
          }}
          pagination={{
            total: options.length,
            pageSize: 10,
            hideOnSinglePage: true,
            showTotal: (total) => `총 ${total}개의 추가 옵션`
          }}
        />

        <Modal
          title={
            <h2 className="text-2xl font-bold text-blue-800">
              {editingOption ? '추가 옵션 수정' : '새 추가 옵션 추가'}
            </h2>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingOption(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
          maskClosable={false}
          className="max-w-2xl"
        >
          <Form
            form={form}
            onFinish={editingOption ? handleUpdate : handleCreate}
            layout="vertical"
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="옵션명"
              rules={[{ required: true, message: '옵션명을 입력해주세요' }]}
              className="mb-4"
            >
              <Input className="w-full rounded-md" />
            </Form.Item>

            <Form.Item
              name="description"
              label="설명"
              rules={[{ required: true, message: '설명을 입력해주세요' }]}
              className="mb-4"
            >
              <Input.TextArea className="w-full rounded-md" rows={4} />
            </Form.Item>

            <Form.Item
              name="price"
              label="가격"
              rules={[{ required: true, message: '가격을 입력해주세요' }]}
              className="mb-4"
            >
              <InputNumber
                prefix="₩"
                className="w-full"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="활성화"
              valuePropName="checked"
              className="mb-4"
            >
              <Switch className="bg-gray-300" />
            </Form.Item>

            <Form.Item className="flex justify-end mb-0">
              <Space>
                <Button
                  className="!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
                  onClick={() => {
                    setModalVisible(false);
                    setEditingOption(null);
                    form.resetFields();
                  }}
                >
                  취소
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
                >
                  {editingOption ? '수정' : '추가'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};
