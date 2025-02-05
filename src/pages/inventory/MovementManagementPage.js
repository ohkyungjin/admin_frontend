import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { Card, Button, Table } from 'antd';

export const MovementManagementPage = () => {
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    movement_type: 'in', // 'in' 또는 'out'
    quantity: '',
    reference_number: '',
    notes: ''
  });
  const [filters, setFilters] = useState({
    item: '',
    movement_type: '',
    item_search: ''
  });

  // 품목 목록 조회
  const fetchItems = useCallback(async () => {
    try {
      const response = await inventoryService.getItems();
      setItems(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('품목 목록 조회 중 오류:', err);
    }
  }, []);

  // 재고 이동 내역 조회
  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getMovements();
      const movementsData = Array.isArray(response.results) ? response.results : [];
      setMovements(movementsData);
      setFilteredMovements(movementsData);
    } catch (err) {
      console.error('재고 이동 내역 조회 중 오류:', err);
      setError('재고 이동 내역을 불러오는데 실패했습니다.');
      setMovements([]);
      setFilteredMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchItems();
    fetchMovements();
  }, [fetchItems, fetchMovements]);

  // 클라이언트 사이드 필터링
  useEffect(() => {
    let result = [...movements];

    // 품목 필터
    if (filters.item) {
      result = result.filter(movement => 
        movement.item === parseInt(filters.item)
      );
    }

    // 이동 유형 필터
    if (filters.movement_type) {
      result = result.filter(movement => {
        if (filters.movement_type === 'in') {
          return movement.quantity > 0;
        } else if (filters.movement_type === 'out') {
          return movement.quantity < 0;
        }
        return true;
      });
    }

    // 품목 검색어 필터
    if (filters.item_search) {
      const searchLower = filters.item_search.toLowerCase();
      result = result.filter(movement => 
        movement.item_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredMovements(result);
  }, [filters, movements]);

  // getMovementType 함수를 메모이제이션
  const getMovementType = useCallback((quantity) => {
    const type = quantity > 0 ? '입고' : '출고';
    return type;
  }, []);

  // 필터 변경 핸들러
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({
      item: '',
      movement_type: '',
      item_search: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('재고 이동 등록 시작 - 폼 데이터:', formData);
      await inventoryService.createMovement(formData);
      console.log('재고 이동 등록 완료');
      await fetchMovements();
      setIsModalOpen(false);
      setFormData({
        item: '',
        movement_type: 'in',
        quantity: '',
        reference_number: '',
        notes: ''
      });
    } catch (err) {
      console.error('재고 이동 등록 중 오류:', err);
      setError(err.response?.data?.message || '재고 이동 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '일시',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '품목',
      dataIndex: 'item_name',
      key: 'item_name',
    },
    {
      title: '유형',
      dataIndex: 'quantity',
      key: 'type',
      render: (quantity) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {getMovementType(quantity)}
        </span>
      ),
    },
    {
      title: '수량',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => record.movement_type === 'out' ? -quantity : quantity,
      align: 'right',
    },
    {
      title: '참조번호',
      dataIndex: 'reference_number',
      key: 'reference_number',
    },
    {
      title: '메모',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: '입고처리자',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (name) => name || '-',
      align: 'center',
    },
  ];

  return (
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">재고 이동 관리</h1>
          {/* <Button
            type="primary"
            onClick={() => {
              setFormData({
                item: '',
                movement_type: 'in',
                quantity: '',
                reference_number: '',
                notes: ''
              });
              setIsModalOpen(true);
            }}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            새 재고 이동 등록
          </Button> */}
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
              <label className="block text-sm mb-1">품목</label>
              <select
                value={filters.item}
                onChange={(e) => handleFilterChange('item', e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
              >
                <option value="">전체</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">이동 유형</label>
              <select
                value={filters.movement_type}
                onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
              >
                <option value="">전체</option>
                <option value="in">입고</option>
                <option value="out">출고</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">품목 검색</label>
              <input
                type="text"
                value={filters.item_search}
                onChange={(e) => handleFilterChange('item_search', e.target.value)}
                placeholder="품목명으로 검색"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredMovements}
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
            emptyText: '재고 이동 내역이 없습니다.'
          }}
        />

        {/* 재고 이동 등록 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[600px] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">재고 이동 등록</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">품목 *</label>
                  <select
                    value={formData.item}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, item: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    required
                  >
                    <option value="">선택하세요</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">이동 유형 *</label>
                  <select
                    value={formData.movement_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        movement_type: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    required
                  >
                    <option value="in">입고</option>
                    <option value="out">출고</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">수량 *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">참조번호</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reference_number: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    placeholder="예: PO-2025-001"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">메모</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    rows="3"
                    placeholder="이동 사유나 특이사항을 입력하세요"
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
                    {loading ? '처리중...' : '등록'}
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
