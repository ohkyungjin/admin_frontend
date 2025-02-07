import { useState, useCallback } from 'react';
import { message } from 'antd';
import { getReservations } from '../../services/reservationService';
import { accountService } from '../../services/accountService';
import { getPackages } from '../../services/funeralService';
import { getMemorialRooms } from '../../services/reservationService';

export const useReservationData = () => {
  const [reservations, setReservations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [packages, setPackages] = useState([]);
  const [memorialRooms, setMemorialRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    console.log('fetchData 시작');
    setLoading(true);
    try {
      const [
        reservationsResponse,
        staffResponse,
        packagesResponse,
        memorialRoomsResponse
      ] = await Promise.all([
        getReservations(),
        accountService.getUsers(),
        getPackages(),
        getMemorialRooms()
      ]);

      console.log('API 응답 원본:', {
        reservations: reservationsResponse,
        staff: staffResponse,
        packages: packagesResponse,
        memorialRooms: memorialRoomsResponse
      });

      // 패키지 데이터 처리
      const packagesData = packagesResponse?.data?.results || [];
      console.log('패키지 데이터:', packagesData);
      setPackages(packagesData);

      // 추모실 데이터 처리
      const memorialRoomsData = memorialRoomsResponse?.data?.results || [];
      console.log('추모실 데이터:', memorialRoomsData);
      setMemorialRooms(memorialRoomsData);

      // 직원 데이터 처리
      const staffData = staffResponse?.data?.results || [];
      console.log('원본 직원 데이터:', staffData);
      const activeStaff = staffData
        .filter(user => user.is_active)
        .map(user => ({
          id: user.id,
          name: user.name || '이름 없음'
        }));
      console.log('가공된 직원 데이터:', activeStaff);
      setStaff(activeStaff);

      // 예약 데이터 처리
      const reservationsData = reservationsResponse || [];
      console.log('원본 예약 데이터:', reservationsData);

      const processedReservations = reservationsData.map(reservation => {
        // 연관 데이터의 ID 찾기
        const memorialRoom = memorialRoomsData.find(room => room.name === reservation.memorial_room_name);
        const packageItem = packagesData.find(pkg => pkg.name === reservation.package_name);
        const assignedStaff = activeStaff.find(staff => staff.name === reservation.assigned_staff_name);

        const processed = {
          ...reservation,
          key: reservation.id,
          memorial_room_id: memorialRoom?.id,
          package_id: packageItem?.id,
          assigned_staff_id: assignedStaff?.id
        };

        console.log('예약 데이터 처리:', {
          id: processed.id,
          memorial_room: {
            name: processed.memorial_room_name,
            id: processed.memorial_room_id
          },
          package: {
            name: processed.package_name,
            id: processed.package_id
          },
          assigned_staff: {
            name: processed.assigned_staff_name,
            id: processed.assigned_staff_id
          }
        });

        return processed;
      });

      console.log('최종 가공된 예약 데이터:', processedReservations);
      setReservations(processedReservations);

    } catch (error) {
      console.error('데이터 로딩 오류:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      console.log('fetchData 완료');
    }
  }, []);

  return {
    reservations,
    staff,
    loading,
    packages,
    memorialRooms,
    fetchData
  };
}; 