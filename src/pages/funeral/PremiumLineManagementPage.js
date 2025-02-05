import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, InputNumber, Card, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import {
  getPremiumLines,
  createPremiumLine,
  updatePremiumLine,
  deletePremiumLine
} from '../../services/funeralService';

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
      const linesData = response?.data?.results;
      if (Array.isArray(linesData)) {
        setPremiumLines(linesData);
      } else {
        setPremiumLines([]);
      }
    } catch (error) {
      console.error('프리미엄 라인 조회 오류:', error);
      message.error('프리미엄 라인 목록을 불러오는데 실패했습니다.');
      setPremiumLines([]);
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
      console.error('프리미엄 라인 생성 오류:', error);
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
      console.error('프리미엄 라인 수정 오류:', error);
      message.error('프리미엄 라인 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePremiumLine(id);
      message.success('프리미엄 라인이 삭제되었습니다.');
      fetchPremiumLines();
    } catch (error) {
      console.error('프리미엄 라인 삭제 오류:', error);
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
      ellipsis: true,
      width: 300,
      render: (text) => (
        <div title={text}>
          {text}
        </div>
      ),
    },
    {
      title: '가격',
      dataIndex: 'price',
      key: 'price',
      render: (price) => price != null ? `${price.toLocaleString()} 원` : '-',
    },
    {
      title: '관리',
      key: 'action',
      width: 80,
      render: (_, record) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '수정',
            onClick: () => {
              setEditingLine(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '삭제',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '프리미엄 라인 삭제',
                content: '정말로 이 프리미엄 라인을 삭제하시겠습니까?',
                okText: '삭제',
                cancelText: '취소',
                okButtonProps: { 
                  className: "!bg-red-500 !border-red-500 hover:!bg-red-600 hover:!border-red-600 !text-white"
                },
                cancelButtonProps: { 
                  className: "!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
                },
                onOk: () => handleDelete(record.id)
              });
            }
          }
        ];

        return (
          <Space>
            <Dropdown
              menu={{ items }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="text-gray-600 hover:text-gray-800"
              />
            </Dropdown>
          </Space>
        );
      }
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card className="shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">프리미엄 라인 관리</h1>
          <Button
            type="primary"
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
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
          className="w-full"
          columns={columns}
          dataSource={premiumLines}
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
            emptyText: '프리미엄 라인이 없습니다. 새로운 프리미엄 라인을 추가해주세요.'
          }}
          pagination={{
            total: premiumLines.length,
            pageSize: 10,
            hideOnSinglePage: true,
            showTotal: (total) => `총 ${total}개의 프리미엄 라인`
          }}
        />

        <Modal
          title={
            <h2 className="text-2xl font-bold text-blue-800">
              {editingLine ? '프리미엄 라인 수정' : '새 프리미엄 라인 추가'}
            </h2>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingLine(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
          maskClosable={false}
          className="max-w-2xl"
        >
          <Form
            form={form}
            onFinish={editingLine ? handleUpdate : handleCreate}
            layout="vertical"
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="라인명"
              rules={[{ required: true, message: '라인명을 입력해주세요' }]}
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

            <Form.Item className="flex justify-end mb-0">
              <Space>
                <Button
                  className="!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
                  onClick={() => {
                    setModalVisible(false);
                    setEditingLine(null);
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
                  {editingLine ? '수정' : '추가'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};
