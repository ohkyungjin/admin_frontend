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
      const response = await axios.post(`${BASE_URL}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 추모실 수정
  updateRoom: async (id, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}/`, data);
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

  getMemorialRooms: async () => {
    const response = await axios.get('/funeral/memorial-rooms/');
    return response.data;
  }
}; 