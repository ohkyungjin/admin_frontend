import axios from './config/axiosConfig';

const BASE_URL = '/memorial-rooms/rooms';

export const memorialRoomService = {
  // 추모실 목록 조회
  getRooms: async (params = {}) => {
    try {
      const response = await axios.get(`${BASE_URL}/`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 추모실 상세 조회
  getRoomById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 추모실 생성
  createRoom: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, {
        name: data.name,
        capacity: data.capacity || 10,
        notes: data.description,
        is_active: data.is_active ?? true,
        operating_hours: data.operating_hours ? 
          `${data.operating_hours.start_time}-${data.operating_hours.end_time}` : null
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 추모실 수정
  updateRoom: async (id, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}/`, {
        name: data.name,
        capacity: data.capacity || 10,
        notes: data.description,
        is_active: data.is_active ?? true,
        operating_hours: data.operating_hours ? 
          `${data.operating_hours.start_time}-${data.operating_hours.end_time}` : null
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 추모실 삭제
  deleteRoom: async (id) => {
    try {
      await axios.delete(`${BASE_URL}/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // 추모실 상태 변경
  changeRoomStatus: async (id, status) => {
    try {
      const response = await axios.post(`${BASE_URL}/${id}/change-status/`, {
        current_status: status
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 중복된 메서드 제거
  getMemorialRooms: undefined
}; 