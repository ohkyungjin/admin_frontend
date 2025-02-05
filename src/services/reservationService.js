import axios from './config/axiosConfig';

const handleResponse = (response) => {
  const { data } = response;
  return Array.isArray(data) ? data : data?.results || [];
};

const handleError = (error) => {
  const message = error.response?.data?.message || error.message || '작업 처리 중 오류가 발생했습니다.';
  throw new Error(message);
};

// 고객 관리 API
export const getCustomers = () => axios.get('/reservations/customers/');
export const createCustomer = (data) => axios.post('/reservations/customers/', data);
export const getCustomerById = (id) => axios.get(`/reservations/customers/${id}/`);
export const updateCustomer = (id, data) => axios.put(`/reservations/customers/${id}/`, data);
export const deleteCustomer = (id) => axios.delete(`/reservations/customers/${id}/`);

// 반려동물 관리 API
export const getPets = () => axios.get('/reservations/pets/');
export const createPet = (data) => axios.post('/reservations/pets/', data);
export const getPetById = (id) => axios.get(`/reservations/pets/${id}/`);
export const updatePet = (id, data) => axios.put(`/reservations/pets/${id}/`, data);
export const deletePet = (id) => axios.delete(`/reservations/pets/${id}/`);

// 추모실 관리 API
export const getMemorialRooms = async () => {
  try {
    const response = await axios.get('/reservations/memorial-rooms/');
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

export const getAvailableMemorialRooms = () => axios.get('/reservations/memorial-rooms/available/');
export const createMemorialRoom = (data) => axios.post('/reservations/memorial-rooms/', data);
export const getMemorialRoomById = (id) => axios.get(`/reservations/memorial-rooms/${id}/`);
export const updateMemorialRoom = (id, data) => axios.put(`/reservations/memorial-rooms/${id}/`, data);
export const deleteMemorialRoom = (id) => axios.delete(`/reservations/memorial-rooms/${id}/`);

// 예약 관리 API
export const getReservations = async (params = {}) => {
  try {
    const response = await axios.get('/reservations/reservations/', { params });
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

export const createReservation = async (data) => {
  try {
    const response = await axios.post('/reservations/reservations/', data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getReservationById = (id) => axios.get(`/reservations/reservations/${id}/`);
export const updateReservation = async (id, data) => {
  try {
    const response = await axios.put(`/reservations/reservations/${id}/`, data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};
export const deleteReservation = async (id) => {
  try {
    await axios.delete(`/reservations/reservations/${id}/`);
    return true;
  } catch (error) {
    handleError(error);
  }
};

// 상태 변경 API
export const changeReservationStatus = async (id, status) => {
  try {
    const response = await axios.post(`/reservations/reservations/${id}/change_status/`, { status });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 일정 변경 API
export const rescheduleReservation = async (id, scheduledAt) => {
  try {
    const response = await axios.post(`/reservations/reservations/${id}/reschedule/`, { scheduled_at: scheduledAt });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}; 