import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventoryService';

export const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 주문 상세 모달 상태
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    search: ''
  });

  // 구매 주문 생성 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const initialFormData = {
    order_number: '',
    supplier: '',
    expected_date: '',
    total_amount: 0,
    notes: '',
    items: [{
      item: '',
      item_code: '',
      item_name: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0
    }]
  };

  const [formData, setFormData] = useState(initialFormData);

  const [items, setItems] = useState([]);

  // API 호출 함수들
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

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await inventoryService.getSuppliers();
      setSuppliers(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const response = await inventoryService.getItems();
      setItems(Array.isArray(response.results) ? response.results : []);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  }, []);

  // 주문 상세 정보 조회
  const handleViewDetails = async (order) => {
    try {
      const response = await inventoryService.getOrders({
        id: order.id,
        include_details: true
      });
      
      if (response && response.results && response.results.length > 0) {
        const orderDetails = response.results[0];
        console.log('주문 상세 정보:', orderDetails); // 디버깅을 위한 로그 추가
        
        // status가 문자열인지 확인하고 소문자로 변환
        if (orderDetails.status) {
          orderDetails.status = orderDetails.status.toLowerCase();
        }
        
        // status_display가 없는 경우 status 기반으로 표시
        if (!orderDetails.status_display) {
          const statusDisplayMap = {
            draft: '임시저장',
            pending: '승인대기',
            approved: '승인완료',
            ordered: '발주완료',
            received: '입고완료',
            cancelled: '취소'
          };
          orderDetails.status_display = statusDisplayMap[orderDetails.status] || orderDetails.status;
        }
        
        setSelectedOrderDetails(orderDetails);
        setIsDetailsModalOpen(true);
      } else {
        throw new Error('주문 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('주문 상세 정보 조회 중 오류 발생:', error);
      alert(error.message || '주문 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  // 주문 상태 변경 처리
  const handleOrderAction = async (orderId, action) => {
    const actionMessages = {
      pending: '주문을 대기 상태로 변경하시겠습니까?',
      approve: '주문을 승인하시겠습니까?',
      cancel: '주문을 취소하시겠습니까?',
      receive: '물품 수령을 확인하시겠습니까?',
      delete: '주문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      order: '발주를 진행하시겠습니까?'
    };

    try {
      if (!window.confirm(actionMessages[action])) {
        return;
      }

      setLoading(true);
      let response;
      
      if (action === 'delete') {
        response = await inventoryService.deleteOrder(orderId);
        if (response && response.success) {
          setIsDetailsModalOpen(false);
          await fetchOrders();
          alert('주문이 삭제되었습니다.');
        }
      } else {
        // 각 액션별 API 엔드포인트 호출
        try {
          switch (action) {
            case 'pending':
              response = await inventoryService.updateOrderStatus(orderId, 'pending');
              break;
            case 'approve':
              response = await inventoryService.updateOrderStatus(orderId, 'approve');
              break;
            case 'cancel':
              response = await inventoryService.cancelOrder(orderId);
              break;
            case 'receive':
              if (!window.confirm('입고 처리를 진행하시겠습니까?\n입고 처리 후에는 재고가 자동으로 증가됩니다.')) {
                return;
              }
              try {
                response = await inventoryService.updateOrderStatus(orderId, 'receive');
                console.log('입고 처리 응답:', response);
                
                if (response && response.success) {
                  alert('입고 처리가 완료되었습니다. 재고가 자동으로 증가되었습니다.');
                } else {
                  throw new Error('입고 처리 중 오류가 발생했습니다.');
                }
              } catch (error) {
                console.error('입고 처리 중 오류:', error);
                throw error;
              }
              break;
            case 'order':
              response = await inventoryService.orderPurchase(orderId);
              break;
            default:
              throw new Error('지원하지 않는 액션입니다.');
          }
          
          console.log('API 응답:', response);
          
          if (response && response.success) {
            // 주문 상세 정보 업데이트
            const updatedResponse = await inventoryService.getOrders({
              id: orderId,
              include_details: true
            });
            
            if (updatedResponse && updatedResponse.results && updatedResponse.results.length > 0) {
              const updatedOrder = updatedResponse.results[0];
              console.log('업데이트된 주문 정보:', updatedOrder);
              setSelectedOrderDetails(updatedOrder);
            }
            
            await fetchOrders();
            const actionText = 
              action === 'pending' ? '승인대기' :
              action === 'approve' ? '승인완료' :
              action === 'cancel' ? '취소' :
              action === 'receive' ? '입고완료' :
              action === 'order' ? '발주완료' : '';
            alert(`주문이 ${actionText} 상태로 변경되었습니다.`);
          } else {
            throw new Error('주문 상태 변경에 실패했습니다.');
          }
        } catch (error) {
          console.error('주문 처리 중 오류 발생:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('주문 처리 중 오류 발생:', error);
      alert(error.message || '처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 상태별 스타일 클래스
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-green-100 text-green-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusClasses[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // 납기일 관련 함수들
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\./g, '-').slice(0, -1);
    } catch (error) {
      console.error('날짜 형식 변환 에러:', error);
      return '-';
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

  // 주문 번호 생성
  const generateOrderNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${year}${month}${day}-${random}`;
  };

  // 폼 데이터 유효성 검사
  const validateFormData = () => {
    const errors = [];
    
    if (!formData.supplier) {
      errors.push('공급업체를 선택해주세요.');
    }

    if (!formData.expected_date) {
      errors.push('예상 납기일을 입력해주세요.');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deliveryDate = new Date(formData.expected_date);
      if (deliveryDate < today) {
        errors.push('예상 납기일은 오늘 이후여야 합니다.');
      }
    }

    if (formData.items.length === 0) {
      errors.push('최소 1개 이상의 품목을 추가해주세요.');
    }

    const itemIds = new Set();
    formData.items.forEach((item, index) => {
      if (!item.item) {
        errors.push(`${index + 1}번 품목을 선택해주세요.`);
      }
      if (itemIds.has(item.item)) {
        errors.push(`${index + 1}번 품목이 중복되었습니다.`);
      }
      itemIds.add(item.item);

      if (!item.quantity || item.quantity <= 0) {
        errors.push(`${index + 1}번 품목의 수량은 0보다 커야 합니다.`);
      }
      if (!item.unit_price || item.unit_price < 0) {
        errors.push(`${index + 1}번 품목의 단가는 0 이상이어야 합니다.`);
      }
    });

    return errors;
  };

  // 주문 품목 업데이트
  const updateOrderItem = (index, field, value) => {
    console.log('품목 업데이트 시작:', { index, field, value });
    console.log('현재 items 목록:', items);
    
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'item') {
            // value를 숫자로 변환하여 비교
            const selectedItem = items.find(i => i.id === Number(value));
            console.log('선택된 품목 정보:', selectedItem);
            
            if (selectedItem) {
              updatedItem.item_name = selectedItem.name;
              updatedItem.item_code = selectedItem.item_code;
              updatedItem.unit_price = selectedItem.unit_price || 0;
              // 수량이 이미 입력되어 있다면 총액 계산
              if (updatedItem.quantity > 0) {
                updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
              }
              console.log('업데이트된 품목 정보:', updatedItem);
            } else {
              console.log('해당 ID의 품목을 찾을 수 없음:', value);
            }
          }
          
          if (field === 'quantity' || field === 'unit_price') {
            const quantity = field === 'quantity' ? Number(value) || 0 : Number(updatedItem.quantity) || 0;
            const unit_price = field === 'unit_price' ? Number(value) || 0 : Number(updatedItem.unit_price) || 0;
            updatedItem.quantity = quantity;
            updatedItem.unit_price = unit_price;
            updatedItem.total_price = quantity * unit_price;
            console.log('수량/단가 변경 후 품목 정보:', updatedItem);
          }
          
          return updatedItem;
        }
        return item;
      });

      // 총 금액 계산
      const total_amount = updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      console.log('총 금액 계산:', total_amount);

      return {
        ...prev,
        items: updatedItems,
        total_amount
      };
    });
  };

  // 주문 품목 추가
  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        item: '',
        item_code: '',
        item_name: '',
        quantity: 0,
        unit_price: 0,
        total_price: 0
      }]
    }));
  };

  // 주문 품목 제거
  const removeOrderItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('폼 제출 시작 - 폼 데이터:', formData);
    
    const errors = validateFormData();
    if (errors.length > 0) {
      console.log('유효성 검사 실패:', errors);
      setError(errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        order_number: formData.order_number || generateOrderNumber(),
        items: formData.items.map(item => ({
          item: item.item,
          item_code: item.item_code,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price)
        }))
      };
      
      console.log('서버로 전송할 데이터:', submitData);

      if (selectedOrder) {
        console.log('주문 수정 요청:', selectedOrder.id);
        await inventoryService.updateOrder(selectedOrder.id, submitData);
      } else {
        console.log('새 주문 생성 요청');
        await inventoryService.createOrder(submitData);
      }
      
      await fetchOrders();
      setIsModalOpen(false);
      setSelectedOrder(null);
      setFormData(initialFormData);
    } catch (err) {
      console.error('주문 처리 중 오류 발생:', err);
      let errorMessage = '구매 주문 처리 중 오류가 발생했습니다.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchOrders();
    fetchItems();
    fetchSuppliers();
  }, [fetchOrders, fetchItems, fetchSuppliers]);

  // 필터 변경 시 주문 목록 새로고침
  useEffect(() => {
    fetchOrders();
  }, [filters, fetchOrders]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">구매 주문 관리</h1>
        <button
          onClick={() => {
            setSelectedOrder(null);
            setFormData(initialFormData);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
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
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">상태</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">전체</option>
                <option value="draft">임시저장</option>
                <option value="pending">승인대기</option>
                <option value="approved">승인완료</option>
                <option value="ordered">발주완료</option>
                <option value="received">입고완료</option>
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
      </div>

      {/* 주문 목록 테이블 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">공급업체</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">예상 납기일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
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
                    <td className="px-6 py-4">
                      <span className={getDeliveryDateClass(order.expected_date)}>
                        {formatDate(order.expected_date)}
                        <span className="ml-2 text-sm">
                          {getDeliveryDateStatus(order.expected_date)}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">{Number(order.total_amount).toLocaleString()}원</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          상세보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 주문 상세 정보 모달 */}
      {isDetailsModalOpen && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[1000px] max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">주문 상세 정보</h2>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* 주문 기본 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">주문 정보</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">주문번호</span>
                      <span className="font-medium">{selectedOrderDetails.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">주문일자</span>
                      <span className="font-medium">{formatDate(selectedOrderDetails.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">주문자</span>
                      <span className="font-medium">{selectedOrderDetails.created_by_name || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">공급업체 정보</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">업체명</span>
                      <span className="font-medium">{selectedOrderDetails.supplier_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">담당자</span>
                      <span className="font-medium">{selectedOrderDetails.supplier_contact || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">연락처</span>
                      <span className="font-medium">{selectedOrderDetails.supplier_phone || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상태 관리 섹션 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">주문 상태</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedOrderDetails.status)}`}>
                        {selectedOrderDetails.status_display || selectedOrderDetails.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedOrderDetails.status_display === '임시저장' && '임시저장 상태입니다. 승인대기 상태로 변경하여 처리를 시작하세요.'}
                        {selectedOrderDetails.status_display === '승인대기' && '승인대기 상태입니다. 주문을 검토하고 승인하거나 취소할 수 있습니다.'}
                        {selectedOrderDetails.status_display === '승인완료' && '승인완료 상태입니다. 발주를 진행할 수 있습니다.'}
                        {selectedOrderDetails.status_display === '발주완료' && '발주완료 상태입니다. 입고 처리를 진행할 수 있습니다.'}
                        {selectedOrderDetails.status_display === '입고완료' && '입고완료된 주문입니다.'}
                        {selectedOrderDetails.status_display === '취소' && '취소된 주문입니다.'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* 임시저장 상태 */}
                    {selectedOrderDetails.status_display === '임시저장' && (
                      <>
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'pending')}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                        >
                          승인대기로 변경
                        </button>
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'delete')}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          삭제
                        </button>
                      </>
                    )}
                    {/* 승인대기 상태 */}
                    {selectedOrderDetails.status_display === '승인대기' && (
                      <>
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'approve')}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'cancel')}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'delete')}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          삭제
                        </button>
                      </>
                    )}
                    {/* 승인완료 상태 */}
                    {selectedOrderDetails.status_display === '승인완료' && (
                      <button
                        onClick={() => handleOrderAction(selectedOrderDetails.id, 'order')}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        발주
                      </button>
                    )}
                    {/* 발주완료 상태 */}
                    {selectedOrderDetails.status_display === '발주완료' && (
                      <button
                        onClick={() => handleOrderAction(selectedOrderDetails.id, 'receive')}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        입고
                      </button>
                    )}
                    {/* 취소 상태 */}
                    {selectedOrderDetails.status_display === '취소' && (
                      <button
                        onClick={() => handleOrderAction(selectedOrderDetails.id, 'delete')}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 납기일 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">납기 정보</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">예상 납기일:</span>
                    <span className={`ml-2 ${getDeliveryDateClass(selectedOrderDetails.expected_date)}`}>
                      {formatDate(selectedOrderDetails.expected_date)}
                    </span>
                  </div>
                  <span className="text-sm">
                    {getDeliveryDateStatus(selectedOrderDetails.expected_date)}
                  </span>
                </div>
              </div>

              {/* 주문 품목 테이블 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">주문 품목</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목코드</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목명</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">단가</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrderDetails.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.item_code || '-'}</td>
                          <td className="px-6 py-4">{item.name || '-'}</td>
                          <td className="px-6 py-4 text-right">{item.quantity.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">{Number(item.unit_price).toLocaleString()}원</td>
                          <td className="px-6 py-4 text-right">{Number(item.quantity * item.unit_price).toLocaleString()}원</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan="4" className="px-6 py-4 text-right">총액</td>
                        <td className="px-6 py-4 text-right">{Number(selectedOrderDetails.total_amount).toLocaleString()}원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 메모 섹션 */}
              {selectedOrderDetails.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">메모</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{selectedOrderDetails.notes}</p>
                </div>
              )}

              {/* 하단 버튼 */}
              <div className="flex justify-end space-x-2 mt-6">
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

      {/* 구매 주문 생성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {selectedOrder ? '구매 주문 수정' : '구매 주문 생성'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주문 번호
                  </label>
                  <input
                    type="text"
                    value={formData.order_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                    placeholder="자동 생성됩니다"
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    공급업체 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">공급업체 선택</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예상 납기일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    주문 품목 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    + 품목 추가
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                    <div className="col-span-2">
                      <select
                        value={item.item}
                        onChange={(e) => updateOrderItem(index, 'item', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                        required
                      >
                        <option value="">품목 선택</option>
                        {items.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                        placeholder="수량"
                        className="w-full px-2 py-1 border rounded"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateOrderItem(index, 'unit_price', e.target.value)}
                        placeholder="단가"
                        className="w-full px-2 py-1 border rounded"
                        required
                        min="0"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{item.total_price.toLocaleString()}원</span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="text-red-500 hover:text-red-600 ml-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="text-right mt-2">
                  <span className="font-medium">총 금액: </span>
                  <span className="text-lg font-bold">{formData.total_amount.toLocaleString()}원</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비고
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                  disabled={loading}
                >
                  {loading ? '처리중...' : selectedOrder ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
