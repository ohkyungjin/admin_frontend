import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// axios 기본 설정
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// 요청 인터셉터 설정
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 데이터 검증 함수
const validateInventoryItem = (data, isUpdate = false) => {
  const errors = [];
  
  if (!data.name?.trim()) {
    errors.push('품목명은 필수입니다.');
  }
  
  if (!data.unit?.trim()) {
    errors.push('단위는 필수입니다.');
  }

  if (!data.supplier) {
    errors.push('공급업체는 필수입니다.');
  }
  
  // 신규 등록시에만 current_stock 검증
  if (!isUpdate) {
    if (typeof data.current_stock !== 'number' || data.current_stock < 0) {
      errors.push('현재 재고는 0 이상의 숫자여야 합니다.');
    }
  }
  
  if (typeof data.minimum_stock !== 'number' || data.minimum_stock < 0) {
    errors.push('최소 재고는 0 이상의 숫자여야 합니다.');
  }

  if (typeof data.maximum_stock !== 'number' || data.maximum_stock < 0) {
    errors.push('최대 재고는 0 이상의 숫자여야 합니다.');
  }
  
  if (data.minimum_stock > data.maximum_stock) {
    errors.push('최소 재고는 최대 재고보다 작아야 합니다.');
  }
  
  return errors;
};

// 에러 메시지 생성 함수
const createErrorMessage = (error) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    switch (status) {
      case 400:
        return '잘못된 요청입니다. 입력 값을 확인해주세요.';
      case 401:
        return '인증이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 품목을 찾을 수 없습니다.';
      case 409:
        return '동일한 SKU 코드가 이미 존재합니다.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return detail || '재고 관리 중 오류가 발생했습니다.';
    }
  }
  return '네트워크 오류가 발생했습니다.';
};

export const inventoryService = {
  // 카테고리 관리
  getCategories: async (params) => {
    try {
      const response = await axios.get('/inventory/categories/', { params });
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axios.post('/inventory/categories/', data);
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await axios.put(`/inventory/categories/${id}/`, data);
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  deleteCategory: async (id) => {
    try {
      await axios.delete(`/inventory/categories/${id}/`);
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  // 공급업체 관리
  getSuppliers: async (params) => {
    const response = await axios.get('/inventory/suppliers/', { params });
    return response.data;
  },

  createSupplier: async (data) => {
    const response = await axios.post('/inventory/suppliers/', data);
    return response.data;
  },

  updateSupplier: async (id, data) => {
    const response = await axios.put(`/inventory/suppliers/${id}/`, data);
    return response.data;
  },

  deleteSupplier: async (id) => {
    await axios.delete(`/inventory/suppliers/${id}/`);
  },

  // 재고 품목 관리
  getItems: async (params) => {
    try {
      const response = await axios.get('/inventory/items/', { params });
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  getLowStockItems: async () => {
    try {
      const response = await axios.get('/inventory/items/low-stock/');
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  createItem: async (data) => {
    try {
      // 데이터 검증
      const validationErrors = validateInventoryItem(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      const response = await axios.post('/inventory/items/', {
        name: data.name,
        code: data.code,
        category: data.category,
        supplier: data.supplier,
        unit: data.unit,
        unit_price: data.unit_price,
        current_stock: data.current_stock,
        minimum_stock: data.minimum_stock,
        maximum_stock: data.maximum_stock,
        description: data.description
      });
      
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  updateItem: async (id, data) => {
    try {
      // 수정 시에는 isUpdate = true로 전달
      const validationErrors = validateInventoryItem(data, true);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      const response = await axios.put(`/inventory/items/${id}/`, {
        name: data.name,
        code: data.code,
        category: data.category,
        supplier: data.supplier,
        unit: data.unit,
        unit_price: data.unit_price,
        minimum_stock: data.minimum_stock,
        maximum_stock: data.maximum_stock,
        description: data.description
      });
      
      return response.data;
    } catch (error) {
      // 네트워크/서버 에러 처리
      if (!error.response) {
        if (!navigator.onLine) {
          throw new Error('인터넷 연결을 확인해주세요.');
        }
        throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }

      // HTTP 에러 처리
      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        switch (status) {
          case 400:
            throw new Error('잘못된 요청입니다. 입력 값을 확인해주세요.');
          case 401:
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
          case 403:
            throw new Error('해당 작업에 대한 권한이 없습니다.');
          case 404:
            throw new Error('해당 품목을 찾을 수 없습니다.');
          case 500:
            throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          default:
            throw new Error(detail || '재고 품목 수정 중 오류가 발생했습니다.');
        }
      }

      // 기타 에러
      throw new Error('재고 품목 수정 중 오류가 발생했습니다.');
    }
  },

  deleteItem: async (id) => {
    try {
      await axios.delete(`/inventory/items/${id}/`);
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  adjustStock: async (id, data) => {
    try {
      if (typeof data.quantity !== 'number') {
        throw new Error('수량은 숫자여야 합니다.');
      }

      const response = await axios.post(`/inventory/items/${id}/adjust-stock/`, {
        quantity: data.quantity,
        notes: data.notes
      });
      
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  // 재고 이동 관리
  getMovements: async (params) => {
    try {
      const response = await axios.get('/inventory/movements/', { params });
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  createMovement: async (data) => {
    try {
      const response = await axios.post('/inventory/movements/', data);
      return response.data;
    } catch (error) {
      throw new Error(createErrorMessage(error));
    }
  },

  // 구매 주문 관리
  getOrders: async (params) => {
    const response = await axios.get('/inventory/orders/', { params });
    return response.data;
  },

  createOrder: async (data) => {
    const response = await axios.post('/inventory/orders/', data);
    return response.data;
  },

  updateOrder: async (id, data) => {
    const response = await axios.put(`/inventory/orders/${id}/`, data);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    try {
      const response = await axios.post(`/inventory/orders/${id}/${status}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('주문 상태 변경 중 오류 발생:', error);
      throw error;
    }
  },

  orderPurchase: async (id) => {
    try {
      const response = await axios.post(`/inventory/orders/${id}/order/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('발주 처리 중 오류 발생:', error);
      throw error;
    }
  },

  approveOrder: async (id) => {
    const response = await axios.post(`/inventory/orders/${id}/approve/`);
    return response.data;
  },

  receiveOrder: async (id, data) => {
    const response = await axios.post(`/inventory/orders/${id}/receive/`, data);
    return response.data;
  },

  cancelOrder: async (id) => {
    try {
      const response = await axios.post(`/inventory/orders/${id}/cancel/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('주문 취소 중 오류 발생:', error);
      throw error;
    }
  },

  deleteOrder: async (id) => {
    try {
      await axios.delete(`/inventory/orders/${id}/`);
      return { success: true };
    } catch (error) {
      console.error('주문 삭제 중 오류 발생:', error);
      throw error;
    }
  }
};
