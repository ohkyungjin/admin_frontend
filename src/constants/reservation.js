// 방문 경로 선택지
export const VISIT_ROUTE_CHOICES = [
  { value: 'internet', label: '인터넷' },
  { value: 'blog', label: '블로그' },
  { value: 'hospital', label: '병원' },
  { value: 'referral', label: '지인소개' }
];

// 사망 원인 선택지
export const DEATH_REASON_CHOICES = [
  { value: 'natural', label: '자연사' },
  { value: 'disease', label: '병사' },
  { value: 'accident', label: '사고사' },
  { value: 'euthanasia', label: '안락사' }
];

// 예약 상태 선택지
export const STATUS_CHOICES = [
  { value: 'pending', label: '대기중' },
  { value: 'confirmed', label: '확정' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' }
];

// 상태별 색상 매핑 (Ant Design Tag 컴포넌트 색상)
export const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'processing',
  in_progress: 'purple',
  completed: 'success',
  cancelled: 'error'
};

// 버튼 스타일
export const BUTTON_STYLES = {
  primary: '!bg-blue-800 !border-blue-800 hover:!bg-blue-900 hover:!border-blue-900 !text-white',
  secondary: '!text-blue-800 !border-blue-800 hover:!text-blue-900 hover:!border-blue-900',
  danger: '!bg-red-500 !border-red-500 hover:!bg-red-600 hover:!border-red-600 !text-white'
};

// 동물 종류
export const PET_SPECIES = [
  { value: 'dog', label: '강아지' },
  { value: 'cat', label: '고양이' },
  { value: 'etc', label: '기타' }
];

// 성별
export const PET_GENDERS = [
  { value: 'male', label: '수컷' },
  { value: 'female', label: '암컷' }
];

// 유틸리티 함수: value로 label 찾기
export const getLabelByValue = (choices, value) => {
  const found = choices.find(choice => choice.value === value);
  return found ? found.label : value;
}; 