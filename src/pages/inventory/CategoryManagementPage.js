import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { Card, Button, Table, Space, Dropdown, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

export const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getCategories();
      // response.results가 배열인지 확인하고, 아니면 빈 배열 사용
      setCategories(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('카테고리 목록을 불러오는데 실패했습니다.');
      setCategories([]); // 에러 시 빈 배열로 초기화
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedCategory) {
        await inventoryService.updateCategory(selectedCategory.id, formData);
      } else {
        await inventoryService.createCategory(formData);
      }
      await fetchCategories();
      setIsModalOpen(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.message || '카테고리 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await inventoryService.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      setError('카테고리 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: '카테고리명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
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
            onClick: () => handleOpenEditModal(record)
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '삭제',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '카테고리 삭제',
                content: '정말로 이 카테고리를 삭제하시겠습니까?',
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
    }
  ];

  return (
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">카테고리 관리</h1>
          <Button
            type="primary"
            onClick={handleOpenAddModal}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 카테고리 추가
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          className="w-full"
          loading={loading}
          components={{
            header: {
              cell: props => (
                <th 
                  {...props} 
                  className="bg-gray-100 text-blue-800 font-medium"
                />
              )
            }
          }}
          locale={{
            emptyText: '카테고리가 없습니다.'
          }}
        />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-96 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedCategory ? '카테고리 수정' : '카테고리 추가'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">카테고리명</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">설명</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    rows="3"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 !bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white rounded-md disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '처리중...' : selectedCategory ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
