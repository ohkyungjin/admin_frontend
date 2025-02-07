import { useState, useMemo } from 'react';
import dayjs from 'dayjs';

export const useReservationFilters = (reservations) => {
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [memorialRoomFilter, setMemorialRoomFilter] = useState(null);

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // 검색어 필터링
      const searchMatch = !searchText || (
        (reservation.customer?.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (reservation.pet?.name || '').toLowerCase().includes(searchText.toLowerCase())
      );

      // 날짜 필터링
      const dateMatch = !dateFilter || dayjs(reservation.scheduled_at).isSame(dateFilter, 'day');

      // 추모실 필터링
      const roomMatch = !memorialRoomFilter || reservation.memorial_room_name === memorialRoomFilter;

      return searchMatch && dateMatch && roomMatch;
    });
  }, [reservations, searchText, dateFilter, memorialRoomFilter]);

  return {
    setSearchText,
    setDateFilter,
    setMemorialRoomFilter,
    filteredReservations
  };
}; 