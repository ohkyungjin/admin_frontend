import axios from './config/axiosConfig';
import dayjs from 'dayjs';

export const dashboardService = {
  // 대시보드 전체 데이터 조회
  getDashboard: async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/dashboard/', {
        params: { date: today }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 예약 통계 데이터 조회
  getReservationStats: async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/dashboard/reservation_stats/', {
        params: { date: today }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 추모실 현황 데이터 조회
  getMemorialRoomStatus: async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/dashboard/memorial_room_status/', {
        params: { date: today }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 직원 배정 현황 데이터 조회
  getStaffWorkload: async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/dashboard/staff_workload/', {
        params: { date: today }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 