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
    if (!values.scheduled_at) return;

    try {
      setCheckingAvailability(true);
      setAvailabilityError(null);

      const response = await reservationService.checkAvailability({
        scheduled_at: values.scheduled_at.toISOString(),
        duration_hours: 2
      });

      if (response.is_valid) {
        message.success('선택한 시간에 예약 가능합니다.');
        setAvailabilityError(null);
      }
    } catch (error) {
      console.error('예약 가능 여부 확인 오류:', error);
      setAvailabilityError(error.response?.data?.error || error.message || '예약 가능 여부를 확인하는데 실패했습니다.');
      message.error(error.response?.data?.error || error.message || '예약 가능 여부를 확인하는데 실패했습니다.');
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
        package_id: values.package_id,
        premium_line_id: values.premium_line_id,
        additional_option_ids: values.additional_option_ids,
        assigned_staff_id: values.assigned_staff_id,
        weight_surcharge: values.weight_surcharge,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        total_amount: values.total_amount
      };

      // 디버깅 로그 추가
      console.group('예약 저장 데이터');
      console.log('Form Values:', values);
      console.log('FormData:', formData);
      console.log('Reservation ID:', reservationId);
      console.groupEnd();

      if (reservationId) {
        const response = await reservationService.updateReservation(reservationId, formData);
        console.log('Update Response:', response);
        message.success('예약이 수정되었습니다.');
      } else {
        const response = await reservationService.createReservation(formData);
        console.log('Create Response:', response);
        message.success('예약이 등록되었습니다.');
      }
      
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('예약 저장 오류:', error);
      console.error('에러 상세:', error.response?.data);
      message.error(error.response?.data?.error || error.message || '예약 저장에 실패했습니다.');
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
        weight_surcharge: reservation.weight_surcharge ? Number(reservation.weight_surcharge) : undefined,
        discount_type: reservation.discount_type || null,
        discount_value: reservation.discount_value ? Number(reservation.discount_value) : undefined,
        total_amount: reservation.total_amount ? Number(reservation.total_amount) : undefined
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