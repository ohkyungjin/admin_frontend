import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { Card, Button, Table, Space, Popconfirm } from 'antd';

export const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getSuppliers();
      setSuppliers(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('공급업체 목록을 불러오는데 실패했습니다.');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedSupplier) {
        await inventoryService.updateSupplier(selectedSupplier.id, formData);
      } else {
        await inventoryService.createSupplier(formData);
      }
      await fetchSuppliers();
      setIsModalOpen(false);
      setSelectedSupplier(null);
      setFormData({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || '공급업체 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 공급업체를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await inventoryService.deleteSupplier(id);
      await fetchSuppliers();
    } catch (err) {
      setError('공급업체 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '업체명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '담당자',
      dataIndex: 'contact_name',
      key: 'contact_name',
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '관리',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedSupplier(record);
              setFormData({
                name: record.name,
                contact_name: record.contact_name,
                phone: record.phone,
                email: record.email,
                address: record.address,
                notes: record.notes
              });
              setIsModalOpen(true);
            }}
            className="!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
          >
            수정
          </Button>
          <Popconfirm
            title="공급업체를 삭제하시겠습니까?"
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
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">공급업체 관리</h1>
          <Button
            type="primary"
            onClick={() => {
              setSelectedSupplier(null);
              setFormData({
                name: '',
                contact_name: '',
                phone: '',
                email: '',
                address: '',
                notes: ''
              });
              setIsModalOpen(true);
            }}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 공급업체 추가
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <Table
          columns={columns}
          dataSource={suppliers}
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
            emptyText: '공급업체가 없습니다.'
          }}
        />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[600px] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedSupplier ? '공급업체 수정' : '공급업체 추가'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">업체명 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">담당자명 *</label>
                    <input
                      type="text"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">연락처 *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        let formattedValue = value;
                        if (value.length > 3 && value.length <= 7) {
                          formattedValue = value.slice(0, 3) + '-' + value.slice(3);
                        } else if (value.length > 7) {
                          formattedValue = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                        }
                        setFormData((prev) => ({ ...prev, phone: formattedValue }));
                      }}
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      maxLength="13"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">이메일</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">주소</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">비고</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 !bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white rounded-md disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? '처리중...' : selectedSupplier ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
