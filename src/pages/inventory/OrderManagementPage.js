import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { Card, Button, Table } from 'antd';

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
      setOrders(response.results || []);
    } catch (error) {
      console.error('주문 목록 조회 중 오류:', error);
      setError('주문 목록을 불러오는데 실패했습니다.');
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
      const orderDetails = await inventoryService.getOrders({
        id: order.id,
        include_details: true,
        include_histories: true
      });
      
      // 응답 데이터 구조 확인 및 처리
      let orderDetailsData;
      if (orderDetails && !Array.isArray(orderDetails)) {
        orderDetailsData = orderDetails;  // 단일 객체로 온 경우
      } else {
        throw new Error('주문 정보를 찾을 수 없습니다.');
      }
      
      // status가 문자열인지 확인하고 소문자로 변환
      if (orderDetailsData.status) {
        orderDetailsData.status = orderDetailsData.status.toLowerCase();
      }
      
      setSelectedOrderDetails(orderDetailsData);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('주문 상세 정보 조회 중 오류 발생:', error);
      alert(error.message || '주문 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  // 주문 상태 변경 처리
  const handleOrderAction = async (orderId, action) => {
    try {
      if (!orderId || !action) {
        throw new Error('필수 파라미터가 누락되었습니다.');
      }

      // 상태 변경 전 사용자 확인
      const confirmMessages = {
        pending: '승인대기 상태로 변경하시겠습니까?',
        approve: '주문을 승인하시겠습니까?',
        order: '발주를 진행하시겠습니까?',
        receive: '입고 처리하시겠습니까?',
        cancel: '주문을 취소하시겠습니까?',
        delete: '주문을 삭제하시겠습니까?'
      };

      if (!window.confirm(confirmMessages[action] || '상태를 변경하시겠습니까?')) {
        return;
      }

      setLoading(true);

      // API 호출
      await inventoryService.updateOrderStatus(orderId, action);

      // 성공 메시지
      const successMessages = {
        pending: '승인대기 상태로 변경되었습니다.',
        approve: '주문이 승인되었습니다.',
        order: '발주가 완료되었습니다.',
        receive: '입고 처리가 완료되었습니다.',
        cancel: '주문이 취소되었습니다.',
        delete: '주문이 삭제되었습니다.'
      };

      alert(successMessages[action] || '상태가 변경되었습니다.');

      // 모달 닫고 목록 새로고침
      setIsDetailsModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('주문 상태 변경 중 오류:', error);
      alert(error.message || '상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상태별 배지 스타일 클래스
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'; // 승인대기: 노란색
      case 'approved':
        return 'bg-blue-100 text-blue-800';     // 승인완료: 파란색
      case 'ordered':
        return 'bg-indigo-100 text-indigo-800'; // 발주완료: 남색
      case 'received':
        return 'bg-green-100 text-green-800';   // 입고완료: 초록색
      case 'canceled':
        return 'bg-red-100 text-red-800';       // 취소: 빨간색
      default:
        return 'bg-gray-100 text-gray-800';     // 기본: 회색
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
    
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'item') {
            // value를 숫자로 변환하여 비교
            const selectedItem = items.find(i => i.id === Number(value));
            
            if (selectedItem) {
              updatedItem.item_name = selectedItem.name;
              updatedItem.item_code = selectedItem.item_code;
              updatedItem.unit_price = selectedItem.unit_price || 0;
              // 수량이 이미 입력되어 있다면 총액 계산
              if (updatedItem.quantity > 0) {
                updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
              }
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
          }
          
          return updatedItem;
        }
        return item;
      });

      // 총 금액 계산
      const total_amount = updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);

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

      if (selectedOrder) {
        await inventoryService.updateOrder(selectedOrder.id, submitData);
      } else {
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
    <div className="p-6">
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">구매 주문 관리</h1>
          <Button
            type="primary"
            onClick={() => {
              setSelectedOrder(null);
              setFormData(initialFormData);
              setIsModalOpen(true);
            }}
            className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white"
          >
            구매 주문 생성
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* 필터 섹션 */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">상태</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
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
                placeholder="주문번호 또는 메모로 검색"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Card>

        {/* 주문 목록 테이블 */}
        <Table
          columns={[
            {
              title: '주문일자',
              dataIndex: 'order_date',
              key: 'order_date',
            },
            {
              title: '품목명',
              dataIndex: 'items_info',
              key: 'items_info',
              render: items => items.map(item => item.name).join(', '),
            },
            {
              title: '공급업체',
              dataIndex: 'supplier_name',
              key: 'supplier_name',
            },
            {
              title: '총 금액',
              dataIndex: 'total_amount',
              key: 'total_amount',
              align: 'right',
              render: amount => `${Number(amount).toLocaleString()}원`,
            },
            {
              title: '상태',
              dataIndex: 'status',
              key: 'status',
              align: 'center',
              render: (status, record) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
                  {record.status_display}
                </span>
              ),
            },
            {
              title: '작성자',
              dataIndex: 'created_by_name',
              key: 'created_by_name',
              align: 'center',
            },
            {
              title: '작업',
              key: 'action',
              align: 'center',
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={() => handleViewDetails(record)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  상세
                </Button>
              ),
            },
          ]}
          dataSource={orders}
          rowKey="id"
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
            emptyText: '등록된 구매 주문이 없습니다.'
          }}
        />

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
                <div className="space-y-6 mb-6">
                  {/* 주문 요약 정보 */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">주문 정보</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">주문 번호</p>
                            <p className="mt-1 text-sm text-gray-900">{selectedOrderDetails.order_number}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">공급업체</p>
                            <p className="mt-1 text-sm text-gray-900">{selectedOrderDetails.supplier.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">주문 일자</p>
                            <p className="mt-1 text-sm text-gray-900">{selectedOrderDetails.order_date}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">입고 예정일</p>
                            <p className="mt-1 text-sm text-gray-900">{selectedOrderDetails.expected_date}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">상태 정보</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">현재 상태</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedOrderDetails.status)}`}>
                              {selectedOrderDetails.status_display}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">총 금액</p>
                            <p className="mt-1 text-sm text-gray-900 font-semibold">{Number(selectedOrderDetails.total_amount).toLocaleString()}원</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">비고</p>
                            <p className="mt-1 text-sm text-gray-900">{selectedOrderDetails.notes || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 상태 관리 버튼 */}
                    <div className="flex justify-end space-x-2 mt-6">
                      {/* 임시저장 상태 */}
                      {selectedOrderDetails.status === 'draft' && (
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
                      {selectedOrderDetails.status === 'pending' && (
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
                      {selectedOrderDetails.status === 'approved' && (
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'order')}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          발주
                        </button>
                      )}
                      {/* 발주완료 상태 */}
                      {selectedOrderDetails.status === 'ordered' && (
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'receive')}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          입고
                        </button>
                      )}
                      {/* 취소 상태 */}
                      {selectedOrderDetails.status === 'cancelled' && (
                        <button
                          onClick={() => handleOrderAction(selectedOrderDetails.id, 'delete')}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 처리 이력 */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">처리 이력</h3>
                    <div className="flow-root">
                      <ul className="relative">
                        {/* 작성 */}
                        <li className="mb-6">
                          <div className="relative flex items-start">
                            <div className="flex-shrink-0">
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              </span>
                            </div>
                            <div className="ml-4 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900">작성</div>
                              <div className="mt-1 text-sm text-gray-500">
                                <span className="font-medium">{selectedOrderDetails.created_by_name}</span>
                                <span className="mx-2">·</span>
                                <span>{selectedOrderDetails.created_at && new Date(selectedOrderDetails.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </li>

                        {/* 승인 */}
                        {selectedOrderDetails.histories?.find(h => h.to_status === 'approved') && (
                          <li className="mb-6">
                            <div className="relative flex items-start">
                              <div className="flex-shrink-0">
                                <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                  </svg>
                                </span>
                              </div>
                              <div className="ml-4 min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">승인</div>
                                <div className="mt-1 text-sm text-gray-500">
                                  <span className="font-medium">{selectedOrderDetails.histories.find(h => h.to_status === 'approved').changed_by_name}</span>
                                  <span className="mx-2">·</span>
                                  <span>{new Date(selectedOrderDetails.histories.find(h => h.to_status === 'approved').created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        )}

                        {/* 발주 */}
                        {selectedOrderDetails.histories?.find(h => h.to_status === 'ordered') && (
                          <li className="mb-6">
                            <div className="relative flex items-start">
                              <div className="flex-shrink-0">
                                <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                                  </svg>
                                </span>
                              </div>
                              <div className="ml-4 min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">발주</div>
                                <div className="mt-1 text-sm text-gray-500">
                                  <span className="font-medium">{selectedOrderDetails.histories.find(h => h.to_status === 'ordered').changed_by_name}</span>
                                  <span className="mx-2">·</span>
                                  <span>{new Date(selectedOrderDetails.histories.find(h => h.to_status === 'ordered').created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        )}

                        {/* 입고 */}
                        {selectedOrderDetails.histories?.find(h => h.to_status === 'received') && (
                          <li>
                            <div className="relative flex items-start">
                              <div className="flex-shrink-0">
                                <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                  </svg>
                                </span>
                              </div>
                              <div className="ml-4 min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">입고</div>
                                <div className="mt-1 text-sm text-gray-500">
                                  <span className="font-medium">{selectedOrderDetails.histories.find(h => h.to_status === 'received').changed_by_name}</span>
                                  <span className="mx-2">·</span>
                                  <span>{new Date(selectedOrderDetails.histories.find(h => h.to_status === 'received').created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        )}

                        {/* 취소 */}
                        {selectedOrderDetails.histories?.find(h => h.to_status === 'cancelled') && (
                          <li>
                            <div className="relative flex items-start">
                              <div className="flex-shrink-0">
                                <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                  </svg>
                                </span>
                              </div>
                              <div className="ml-4 min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">취소</div>
                                <div className="mt-1 text-sm text-gray-500">
                                  <span className="font-medium">{selectedOrderDetails.histories.find(h => h.to_status === 'cancelled').changed_by_name}</span>
                                  <span className="mx-2">·</span>
                                  <span>{new Date(selectedOrderDetails.histories.find(h => h.to_status === 'cancelled').created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* 주문 품목 */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">주문 품목</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목코드</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목명</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">주문수량</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">단가</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">실제 입고수량</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrderDetails.items?.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-sm text-gray-500">{item.item_code}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.item_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{Number(item.unit_price).toLocaleString()}원</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">{Number(item.total_price).toLocaleString()}원</td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                {selectedOrderDetails.status === 'received' ? item.quantity.toLocaleString() : '0'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{item.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                <h2 className="text-xl font-semibold text-blue-800">
                  {selectedOrder ? '구매 주문 수정' : '구매 주문 생성'}
                </h2>
                <Button
                  type="text"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
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
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
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
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
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
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                      required
                    />
                  </div>
                </div>

                <Card className="!border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      주문 품목 <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="link"
                      onClick={addOrderItem}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + 품목 추가
                    </Button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                      <div className="col-span-2">
                        <select
                          value={item.item}
                          onChange={(e) => updateOrderItem(index, 'item', e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
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
                          className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
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
                          className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                          required
                          min="0"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{item.total_price.toLocaleString()}원</span>
                        {formData.items.length > 1 && (
                          <Button
                            type="text"
                            onClick={() => removeOrderItem(index)}
                            className="text-red-500 hover:text-red-600"
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="text-right mt-2">
                    <span className="font-medium">총 금액: </span>
                    <span className="text-lg font-bold text-blue-800">{formData.total_amount.toLocaleString()}원</span>
                  </div>
                </Card>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비고
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-md"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setIsModalOpen(false)}
                    className="!border-gray-300 hover:!bg-gray-50"
                    disabled={loading}
                  >
                    취소
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900"
                    disabled={loading}
                  >
                    {loading ? '처리중...' : selectedOrder ? '수정' : '생성'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
