import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventoryService';

export const MovementManagementPage = () => {
  const [movements, setMovements] = useState([]);
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

  // 디바운스된 검색어 상태 추가
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // 검색어 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // 품목 목록 조회
  const fetchItems = useCallback(async () => {
    try {
      console.log('품목 목록 조회 시작');
      const response = await inventoryService.getItems({
        search: debouncedFilters.item_search.trim()
      });
      console.log('품목 목록 조회 결과:', response);
      setItems(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('품목 목록 조회 중 오류:', err);
    }
  }, [debouncedFilters.item_search]);

  // 재고 이동 내역 조회
  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      console.log('재고 이동 내역 조회 시작 - 필터:', debouncedFilters);
      const response = await inventoryService.getMovements({
        ...debouncedFilters,
        item_search: debouncedFilters.item_search.trim()
      });
      console.log('재고 이동 내역 조회 결과:', response);
      setMovements(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('재고 이동 내역 조회 중 오류:', err);
      setError('재고 이동 내역을 불러오는데 실패했습니다.');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters]);

  // 초기 데이터 로드
  useEffect(() => {
    console.log('재고 이동 페이지 마운트 - 초기 데이터 로드');
    fetchItems();
    fetchMovements();
  }, []); // 최초 마운트 시에만 실행

  // 디바운스된 필터 변경 시 데이터 조회
  useEffect(() => {
    if (debouncedFilters.item_search) {
      fetchItems();
    }
  }, [debouncedFilters.item_search, fetchItems]);

  useEffect(() => {
    fetchMovements();
  }, [debouncedFilters, fetchMovements]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">재고 이동 관리</h1>
        <button
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
          className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857]"
        >
          재고 이동 등록
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 필터 섹션 */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">품목</label>
            <select
              value={filters.item}
              onChange={(e) => handleFilterChange('item', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                일시
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                품목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                유형
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                수량
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                참조번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                메모
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">입고처리자</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  로딩중...
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  등록된 재고 이동 내역이 없습니다.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(movement.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{movement.item_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movement.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {getMovementType(movement.quantity)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {movement.movement_type === 'out' ? -movement.quantity : movement.quantity}
                  </td>
                  <td className="px-6 py-4">{movement.reference_number}</td>
                  <td className="px-6 py-4">{movement.notes}</td>
                  <td className="px-6 py-4 text-center">{movement.employee_name || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="이동 사유나 특이사항을 입력하세요"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857]"
                  disabled={loading}
                >
                  {loading ? '처리중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
