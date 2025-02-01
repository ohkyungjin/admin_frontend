import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventoryService';

export const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    order_number: '',
    supplier: '',
    items: [{ item: '', quantity: '', unit_price: '' }],
    expected_delivery_date: '',
    notes: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    search: ''
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getOrders(filters);
      setOrders(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('구매 주문 목록을 불러오는데 실패했습니다.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await inventoryService.getItems();
      setItems(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching items:', err);
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

  useEffect(() => {
    fetchOrders();
    fetchItems();
    fetchSuppliers();
  }, [fetchOrders, fetchItems, fetchSuppliers]);

  useEffect(() => {
    fetchOrders();
  }, [filters, fetchOrders]);

  const generateOrderNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        order_number: formData.order_number || generateOrderNumber()
      };

      if (selectedOrder) {
        await inventoryService.updateOrder(selectedOrder.id, submitData);
      } else {
        await inventoryService.createOrder(submitData);
      }
      await fetchOrders();
      setIsModalOpen(false);
      setSelectedOrder(null);
      setFormData({
        order_number: '',
        supplier: '',
        items: [{ item: '', quantity: '', unit_price: '' }],
        expected_delivery_date: '',
        notes: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || '구매 주문 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '대기';
      case 'approved':
        return '승인';
      case 'received':
        return '수령';
      case 'cancelled':
        return '취소';
      default:
        return '상태 없음';
    }
  };

  const formatDate = (dateString) => {
    console.log(dateString);
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '유효하지 않은 날짜';
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split('.').join('-').slice(0, -1);
    } catch (error) {
      console.error('날짜 포맷 에러:', error);
      return '유효하지 않은 날짜';
    }
  };

  const getDeliveryDateStatus = (dateString) => {
    if (!dateString) return '(날짜 없음)';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deliveryDate = new Date(dateString);
      deliveryDate.setHours(0, 0, 0, 0);
      
      const diffTime = deliveryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (isNaN(diffDays)) return '(유효하지 않은 날짜)';
      if (diffDays < 0) return `(${Math.abs(diffDays)}일 지남)`;
      if (diffDays <= 3) return `(${diffDays}일 남음)`;
      return `(${diffDays}일 남음)`;
    } catch (error) {
      console.error('날짜 계산 에러:', error);
      return '(날짜 확인 필요)';
    }
  };

  const getDeliveryDateClass = (dateString) => {
    if (!dateString) return 'text-gray-500';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deliveryDate = new Date(dateString);
      deliveryDate.setHours(0, 0, 0, 0);
      
      const diffTime = deliveryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (isNaN(diffDays)) return 'text-gray-500';
      if (diffDays < 0) return 'text-red-600 font-semibold';
      if (diffDays <= 3) return 'text-yellow-600 font-semibold';
      return 'text-gray-600';
    } catch (error) {
      console.error('날짜 스타일 에러:', error);
      return 'text-gray-500';
    }
  };

  const handleOrderAction = async (orderId, action) => {
    let confirmMessage = '';
    switch (action) {
      case 'approve':
        confirmMessage = '이 주문을 승인하시겠습니까?';
        break;
      case 'receive':
        confirmMessage = '이 주문의 수령을 확인하시겠습니까?';
        break;
      case 'cancel':
        confirmMessage = '이 주문을 취소하시겠습니까?\n취소된 주문은 복구할 수 없습니다.';
        break;
      default:
        return;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      switch (action) {
        case 'approve':
          await inventoryService.approveOrder(orderId);
          break;
        case 'receive':
          await inventoryService.receiveOrder(orderId);
          break;
        case 'cancel':
          await inventoryService.cancelOrder(orderId);
          break;
      }
      await fetchOrders();
    } catch (err) {
      setError('주문 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item: '', quantity: '', unit_price: '' }]
    }));
  };

  const removeOrderItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleViewDetails = (order) => {
    setSelectedOrderDetails(order);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">구매 주문 관리</h1>
        <button
          onClick={() => {
            setSelectedOrder(null);
            setFormData({
              order_number: '',
              supplier: '',
              items: [{ item: '', quantity: '', unit_price: '' }],
              expected_delivery_date: '',
              notes: ''
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#059669] text-white rounded-md hover:bg-[#047857]"
        >
          구매 주문 생성
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
            <label className="block text-sm mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="approved">승인</option>
              <option value="received">수령</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">공급업체</label>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              placeholder="주문번호 또는 메모로 검색"
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
                주문번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                공급업체
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                예상 납기일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                총액
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  로딩중...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  등록된 구매 주문이 없습니다.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{order.order_number}</td>
                  <td className="px-6 py-4">{order.supplier_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {order.status_display}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${getDeliveryDateClass(order.expected_date)}`}>
                    {formatDate(order.expected_date)}
                    <span className="ml-2 text-sm">
                      {getDeliveryDateStatus(order.expected_date)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {Number(order.total_amount).toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      상세
                    </button>
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleOrderAction(order.id, 'approve')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleOrderAction(order.id, 'cancel')}
                          className="text-red-600 hover:text-red-900"
                        >
                          취소
                        </button>
                      </>
                    )}
                    {order.status === 'approved' && (
                      <button
                        onClick={() => handleOrderAction(order.id, 'receive')}
                        className="text-green-600 hover:text-green-900"
                      >
                        수령
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 구매 주문 생성/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[800px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedOrder ? '구매 주문 수정' : '구매 주문 생성'}
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
                  <label className="block text-sm mb-1">주문번호</label>
                  <input
                    type="text"
                    value={formData.order_number || generateOrderNumber()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">공급업체 *</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplier: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              </div>

              <div>
                <label className="block text-sm mb-1">예상 납기일 *</label>
                <input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expected_delivery_date: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm">주문 품목 *</label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="text-sm text-[#059669] hover:text-[#047857]"
                  >
                    + 품목 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select
                          value={item.item}
                          onChange={(e) =>
                            updateOrderItem(index, 'item', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        >
                          <option value="">품목 선택</option>
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(index, 'quantity', e.target.value)
                          }
                          placeholder="수량"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                          min="1"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateOrderItem(index, 'unit_price', e.target.value)
                          }
                          placeholder="단가"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                          min="0"
                        />
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="px-2 py-2 text-red-600 hover:text-red-900"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  {loading ? '처리중...' : selectedOrder ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 주문 상세 정보 모달 */}
      {isDetailsModalOpen && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[800px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">주문 상세 정보</h2>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">주문번호</label>
                  <p className="mt-1">{selectedOrderDetails.order_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">공급업체</label>
                  <p className="mt-1">{selectedOrderDetails.supplier_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedOrderDetails.status)}`}>
                      {selectedOrderDetails.status_display}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">예상 납기일</label>
                  <p className={`mt-1 ${getDeliveryDateClass(selectedOrderDetails.expected_date)}`}>
                    {formatDate(selectedOrderDetails.expected_date)}
                    <span className="ml-2 text-sm">
                      {getDeliveryDateStatus(selectedOrderDetails.expected_date)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주문 품목</label>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">단가</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrderDetails.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">{item.item_name}</td>
                        <td className="px-6 py-4 text-right">{item.quantity}</td>
                        <td className="px-6 py-4 text-right">{Number(item.unit_price).toLocaleString()}원</td>
                        <td className="px-6 py-4 text-right">{Number(item.quantity * item.unit_price).toLocaleString()}원</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right font-medium">총액</td>
                      <td className="px-6 py-4 text-right font-medium">{Number(selectedOrderDetails.total_amount).toLocaleString()}원</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedOrderDetails.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">메모</label>
                  <p className="mt-1">{selectedOrderDetails.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-6">
                {selectedOrderDetails.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        if (window.confirm('이 주문을 승인하시겠습니까?\n승인 후에는 주문 내용을 수정할 수 없습니다.')) {
                          handleOrderAction(selectedOrderDetails.id, 'approve');
                          setIsDetailsModalOpen(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('이 주문을 취소하시겠습니까?\n취소된 주문은 복구할 수 없습니다.')) {
                          handleOrderAction(selectedOrderDetails.id, 'cancel');
                          setIsDetailsModalOpen(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      취소
                    </button>
                  </>
                )}
                {selectedOrderDetails.status === 'approved' && (
                  <button
                    onClick={() => {
                      if (window.confirm('이 주문의 수령을 확인하시겠습니까?\n수령 확인 후에는 상태를 변경할 수 없습니다.')) {
                        handleOrderAction(selectedOrderDetails.id, 'receive');
                        setIsDetailsModalOpen(false);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    수령
                  </button>
                )}
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
