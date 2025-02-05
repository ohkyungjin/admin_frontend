import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { Card, Button, Table, Space, Dropdown, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined, CalculatorOutlined } from '@ant-design/icons';

export const ItemManagementPage = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    supplier: '',
    unit: '',
    unit_price: '',
    current_stock: '',
    minimum_stock: '',
    maximum_stock: '',
    description: ''
  });
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    notes: ''
  });
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    search: ''
  });

  // 품목 코드 자동 생성을 위한 매핑
  const itemCodeMap = {
    '관': 'COF',
    '유골함': 'URN',
    '수의': 'SHR',
    '이불': 'BLK'
  };

  const generateItemCode = (name) => {
    // 품목명에서 매핑된 코드 찾기
    let prefix = 'ETC'; // 기본값
    for (const [key, value] of Object.entries(itemCodeMap)) {
      if (name.includes(key)) {
        prefix = value;
        break;
      }
    }
    
    // 현재 날짜를 이용한 코드 생성
    const date = new Date();
    const dateCode = date.getFullYear().toString().slice(-2) +
                    String(date.getMonth() + 1).padStart(2, '0');
    
    // 같은 종류의 마지막 품목 코드 찾기
    const similarItems = items.filter(item => item.code.startsWith(prefix));
    const lastNumber = similarItems.length > 0 
      ? Math.max(...similarItems.map(item => {
          const num = parseInt(item.code.slice(-3));
          return isNaN(num) ? 0 : num;
        }))
      : 0;
    
    // 새로운 코드 생성 (예: COF2301001)
    const newNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `${prefix}${dateCode}${newNumber}`;
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      code: newName.trim() ? generateItemCode(newName) : ''
    }));
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getItems();
      setItems(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('재고 품목 목록을 불러오는데 실패했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await inventoryService.getCategories();
      setCategories(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await inventoryService.getSuppliers();
      setSuppliers(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  }, []);

  // 필터링 로직
  useEffect(() => {
    let result = [...items];

    // 카테고리 필터
    if (filters.category) {
      result = result.filter(item => 
        item.category === parseInt(filters.category)
      );
    }

    // 공급업체 필터
    if (filters.supplier) {
      result = result.filter(item => 
        item.supplier === parseInt(filters.supplier)
      );
    }

    // 검색어 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.code.toLowerCase().includes(searchLower)
      );
    }

    setFilteredItems(result);
  }, [filters, items]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchSuppliers();
  }, [fetchItems, fetchCategories, fetchSuppliers]);

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({
      category: '',
      supplier: '',
      search: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        name: formData.name,
        code: formData.code,
        category: parseInt(formData.category),
        supplier: parseInt(formData.supplier),
        unit: formData.unit,
        unit_price: parseFloat(formData.unit_price),
        minimum_stock: parseInt(formData.minimum_stock),
        maximum_stock: parseInt(formData.maximum_stock),
        description: formData.description || ''
      };

      // 신규 등록인 경우에만 current_stock 포함
      if (!selectedItem) {
        submitData.current_stock = parseInt(formData.current_stock);
      }

      if (selectedItem) {
        await inventoryService.updateItem(selectedItem.id, submitData);
      } else {
        await inventoryService.createItem(submitData);
      }
      
      await fetchItems();
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({
        name: '',
        code: '',
        category: '',
        supplier: '',
        unit: '',
        unit_price: '',
        current_stock: '',
        minimum_stock: '',
        maximum_stock: '',
        description: ''
      });
    } catch (err) {
      console.error('재고 품목 처리 오류:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('재고 품목 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 재고 품목을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await inventoryService.deleteItem(id);
      await fetchItems();
    } catch (err) {
      setError('재고 품목 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setLoading(true);
      if (stockAdjustment.quantity === '') {
        throw new Error('수량을 입력해주세요.');
      }

      // 출고 시 현재 재고보다 많은 수량을 출고하려는 경우 체크
      if (stockAdjustment.quantity < 0 && Math.abs(stockAdjustment.quantity) > selectedItem.current_stock) {
        throw new Error('출고 수량이 현재 재고보다 많습니다.');
      }

      await inventoryService.adjustStock(selectedItem.id, stockAdjustment);
      await fetchItems();
      setIsStockModalOpen(false);
      setStockAdjustment({ quantity: '', notes: '' });
    } catch (err) {
      setError(err.message || '재고 수량 조정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '코드',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '품목명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '카테고리',
      dataIndex: 'category_name',
      key: 'category',
    },
    {
      title: '공급업체',
      dataIndex: 'supplier_name',
      key: 'supplier',
    },
    {
      title: '단가',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `${Number(price).toLocaleString()}원`,
      align: 'right',
    },
    {
      title: '재고',
      dataIndex: 'current_stock',
      key: 'current_stock',
      render: (stock, record) => (
        <span className="text-right">
          {stock}
          {stock <= record.minimum_stock && (
            <span className="ml-2 text-red-500 text-sm">
              (부족)
            </span>
          )}
        </span>
      ),
      align: 'right',
    },
    {
      title: '관리',
      key: 'action',
      width: 80,
      render: (_, record) => {
        const items = [
          {
            key: 'stock',
            icon: <CalculatorOutlined />,
            label: '수량조정',
            onClick: () => {
              setSelectedItem(record);
              setStockAdjustment({ quantity: 0, notes: '' });
              setIsStockModalOpen(true);
            }
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '수정',
            onClick: () => {
              setSelectedItem(record);
              setFormData({
                name: record.name,
                code: record.code,
                category: record.category,
                supplier: record.supplier,
                unit: record.unit,
                unit_price: record.unit_price,
                current_stock: record.stock_quantity,
                minimum_stock: record.minimum_stock,
                maximum_stock: record.maximum_stock,
                description: record.description
              });
              setIsModalOpen(true);
            }
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '삭제',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '재고 품목 삭제',
                content: '정말로 이 재고 품목을 삭제하시겠습니까?',
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
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">재고 품목 관리</h1>
          <Button
            type="primary"
            onClick={() => {
              setSelectedItem(null);
              setFormData({
                name: '',
                code: '',
                category: '',
                supplier: '',
                unit: '',
                unit_price: '',
                current_stock: '',
                minimum_stock: '',
                maximum_stock: '',
                description: ''
              });
              setIsModalOpen(true);
            }}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 재고 품목 추가
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* 필터 섹션 */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-blue-800">필터</h3>
            <Button
              onClick={handleResetFilters}
              className="!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900"
            >
              필터 초기화
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">카테고리</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
              >
                <option value="">전체</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">공급업체</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
              >
                <option value="">전체</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">검색</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="품목명 또는 코드로 검색"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredItems}
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
            emptyText: '재고 품목이 없습니다.'
          }}
          rowClassName={(record) => 
            record.current_stock <= record.minimum_stock ? 'bg-red-50' : ''
          }
        />

        {/* 품목 추가/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[800px] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedItem ? '재고 품목 수정' : '재고 품목 추가'}
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
                    <label className="block text-sm mb-1">품목명 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">품목 코드 *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, code: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                      placeholder="품목명 입력 시 자동 생성됩니다"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">카테고리 *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    >
                      <option value="">선택하세요</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">공급업체 *</label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, supplier: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    >
                      <option value="">선택하세요</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">단위 *</label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, unit: e.target.value }))
                      }
                      placeholder="예: 개, 박스, kg"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">단가 *</label>
                    <input
                      type="number"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, unit_price: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {selectedItem ? (
                    <div>
                      <label className="block text-sm mb-1">현재 재고 수량</label>
                      <p className="text-lg font-semibold">
                        {selectedItem.current_stock}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm mb-1">초기 재고 수량 *</label>
                      <input
                        type="number"
                        name="current_stock"
                        value={formData.current_stock}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, current_stock: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                        required
                        min="0"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm mb-1">최소 재고 수량 *</label>
                    <input
                      type="number"
                      name="minimum_stock"
                      value={formData.minimum_stock}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, minimum_stock: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">최대 재고 수량 *</label>
                    <input
                      type="number"
                      name="maximum_stock"
                      value={formData.maximum_stock}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maximum_stock: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">설명</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
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
                    {loading ? '처리중...' : selectedItem ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 재고 수량 조정 모달 */}
        {isStockModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[400px] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">재고 수량 조정</h2>
                <button
                  onClick={() => setIsStockModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">현재 재고량</label>
                  <p className="text-lg font-semibold">{selectedItem.current_stock}</p>
                </div>

                <div>
                  <label className="block text-sm mb-1">조정 수량 *</label>
                  <input
                    type="text"
                    pattern="-?[0-9]*"
                    value={stockAdjustment.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
                        setStockAdjustment((prev) => ({
                          ...prev,
                          quantity: value === '' ? '' : value
                        }));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value && value !== '-') {
                        setStockAdjustment((prev) => ({
                          ...prev,
                          quantity: parseInt(value)
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    양수: 입고 (예: 10), 음수: 출고 (예: -10)
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-1">비고</label>
                  <textarea
                    value={stockAdjustment.notes}
                    onChange={(e) =>
                      setStockAdjustment((prev) => ({
                        ...prev,
                        notes: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    rows="2"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsStockModalOpen(false)}
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
                    {loading ? '처리중...' : '저장'}
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
