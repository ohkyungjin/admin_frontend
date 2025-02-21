import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { memorialRoomService } from '../services/memorialRoomService';
import { reservationService } from '../services/reservationService';
import { getPackages, getPremiumLines, getAdditionalOptions } from '../services/funeralService';
import { accountService } from '../services/accountService';

export const useReservationForm = ({ form, reservationId, reservation, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [memorialRooms, setMemorialRooms] = useState([]);
  const [packages, setPackages] = useState([]);
  const [premiumLines, setPremiumLines] = useState([]);
  const [additionalOptions, setAdditionalOptions] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  // 예약 가능 여부 체크
  const checkAvailability = async (values) => {
    if (!values.scheduled_at || !values.memorial_room_id) return;

    try {
      setCheckingAvailability(true);
      setAvailabilityError(null);

      const response = await reservationService.checkAvailability({
        memorial_room_id: values.memorial_room_id,
        scheduled_at: values.scheduled_at.toISOString(),
        duration_hours: 2,
        exclude_reservation_id: reservationId
      });

      if (response.is_available) {
        message.success('선택한 시간에 예약 가능합니다.');
        setAvailabilityError(null);
      } else if (response.conflicting_reservation) {
        if (reservationId && response.conflicting_reservation.id === reservationId) {
          setAvailabilityError(null);
          return;
        }
        const conflictTime = dayjs(response.conflicting_reservation.scheduled_at).format('YYYY-MM-DD HH:mm');
        setAvailabilityError(
          `선택한 시간에는 예약할 수 없습니다.\n해당 시간에 이미 예약이 있습니다. (예약번호: #${response.conflicting_reservation.id}, 시작시간: ${conflictTime})`
        );
      }
    } catch (error) {
      setAvailabilityError(error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // 목록 데이터 조회
  const fetchOptions = useCallback(async () => {
    try {
      const [
        roomsResponse, 
        packagesResponse, 
        premiumLinesResponse,
        additionalOptionsResponse,
        staffsResponse
      ] = await Promise.all([
        memorialRoomService.getRooms(),
        getPackages(),
        getPremiumLines(),
        getAdditionalOptions(),
        accountService.getUsers()
      ]);

      setMemorialRooms(roomsResponse.results || []);
      setPackages(packagesResponse.data?.results || []);
      setPremiumLines(premiumLinesResponse.data?.results || []);
      setAdditionalOptions(additionalOptionsResponse.data?.results || []);
      setStaffs(staffsResponse.data?.results || []);
    } catch (error) {
      console.error('옵션 목록 조회 오류:', error);
      message.error('옵션 목록을 불러오는데 실패했습니다.');
    }
  }, []);

  // 예약 저장 처리
  const handleSave = async (values) => {
    try {
      if (availabilityError) {
        message.error(availabilityError);
        return;
      }

      setLoading(true);
      const formData = {
        scheduled_at: values.scheduled_at.toISOString(),
        status: values.status,
        is_emergency: values.is_emergency,
        visit_route: values.visit_route,
        referral_hospital: values.referral_hospital,
        need_death_certificate: values.need_death_certificate,
        memo: values.memo,
        customer: {
          name: values.customer_name,
          phone: values.customer_phone,
          email: values.customer_email,
          address: values.customer_address,
        },
        pet: {
          name: values.pet_name,
          species: values.pet_species,
          breed: values.pet_breed,
          gender: values.pet_gender,
          age: values.pet_age,
          weight: values.pet_weight,
          is_neutered: values.is_neutered,
          death_date: values.death_datetime?.toISOString(),
          death_reason: values.death_reason,
        },
        memorial_room_id: values.memorial_room_id,
        package_id: values.package_id,
        premium_line_id: values.premium_line_id,
        additional_option_ids: values.additional_option_ids,
        assigned_staff_id: values.assigned_staff_id,
      };

      if (reservationId) {
        await reservationService.updateReservation(reservationId, formData);
        message.success('예약이 수정되었습니다.');
      } else {
        await reservationService.createReservation(formData);
        message.success('예약이 등록되었습니다.');
      }
      
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('예약 저장 오류:', error);
      message.error(error.message || '예약 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (reservationId && reservation) {
      form.setFieldsValue({
        scheduled_at: dayjs(reservation.scheduled_at),
        status: reservation.status,
        is_emergency: reservation.is_emergency,
        visit_route: reservation.visit_route,
        referral_hospital: reservation.referral_hospital,
        need_death_certificate: reservation.need_death_certificate,
        memo: reservation.memo,
        memorial_room_id: reservation.memorial_room?.id || reservation.memorial_room_id,
        package_id: reservation.package?.id || reservation.package_id,
        premium_line_id: reservation.premium_line?.id || reservation.premium_line_id,
        additional_option_ids: reservation.additional_options?.map(opt => opt.id) || [],
        assigned_staff_id: reservation.assigned_staff?.id || reservation.assigned_staff_id,
        customer_name: reservation.customer?.name,
        customer_phone: reservation.customer?.phone,
        customer_email: reservation.customer?.email,
        customer_address: reservation.customer?.address,
        pet_name: reservation.pet?.name,
        pet_species: reservation.pet?.species,
        pet_breed: reservation.pet?.breed,
        pet_gender: reservation.pet?.gender,
        pet_age: reservation.pet?.age,
        pet_weight: reservation.pet?.weight,
        is_neutered: reservation.pet?.is_neutered,
        death_datetime: reservation.pet?.death_date ? dayjs(reservation.pet.death_date) : undefined,
        death_reason: reservation.pet?.death_reason,
      });
    } else {
      form.resetFields();
    }
    fetchOptions();
  }, [form, reservationId, reservation, fetchOptions]);

  return {
    loading,
    checkingAvailability,
    availabilityError,
    memorialRooms,
    packages,
    premiumLines,
    additionalOptions,
    staffs,
    checkAvailability,
    handleSave
  };
}; 