import axios from './config/axiosConfig';

export const reservationService = {
  // 예약 목록 조회
  getReservations: async (params = {}) => {
    try {
      const response = await axios.get('/reservations/reservations/', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 예약 상세 조회
  getReservationById: async (id) => {
    try {
      const response = await axios.get(`/reservations/reservations/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 예약 생성
  createReservation: async (data) => {
    try {
      const response = await axios.post('/reservations/reservations/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 예약 수정
  updateReservation: async (id, data) => {
    try {
      const response = await axios.put(`/reservations/reservations/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 예약 가능 시간 조회
  getAvailableTimes: async (params) => {
    try {
      const response = await axios.get('/reservations/reservations/available-times/', { params });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw error.response.data.error;
      }
      throw new Error('예약 가능 시간 조회 중 오류가 발생했습니다.');
    }
  },

  // 예약 중복 체크
  checkAvailability: async (data) => {
    try {
      const response = await axios.post('/reservations/reservations/check-availability/', {
        memorial_room_id: data.memorial_room_id,
        scheduled_at: data.scheduled_at,
        duration_hours: data.duration_hours || 2
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw error.response.data.error;
      }
      throw new Error('예약 가능 여부 확인 중 오류가 발생했습니다.');
    }
  },

  // 예약 상태 일괄 변경
  bulkUpdateStatus: async (data) => {
    try {
      const response = await axios.post('/reservations/reservations/bulk-status-update/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 예약 삭제
  deleteReservation: async (id) => {
    try {
      const response = await axios.delete(`/reservations/reservations/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 