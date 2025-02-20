# 추모실 예약 API 명세서 v1.0

## 공통 사항
Base URL: /api/v1
Content-Type: application/json
Authorization: Bearer {token}

## 1. 예약 가능 시간 조회 API

GET /reservations/available-times

### Request Parameters (Query String)
{
    "date": "YYYY-MM-DD",           // 필수, 조회할 날짜
    "memorial_room_id": 1,          // 선택, 추모실 ID
    "selected_time": "HH:MM"        // 선택, 선택된 시간 (블록 표시용)
}

### Success Response (200 OK)
{
    "status": "success",
    "data": {
        "date": "2024-03-20",
        "memorial_room_id": 1,
        "operating_hours": {
            "start": "09:00",
            "end": "22:00"
        },
        "selected_time": "14:00",
        "time_slots": [
            {
                "start_time": "09:00",
                "end_time": "09:30",
                "status": "available",
                "is_selectable": true,
                "is_in_selected_block": false,
                "block_start": null,
                "block_end": null,
                "blocking_reservation": null
            },
            {
                "start_time": "14:00",
                "end_time": "14:30",
                "status": "blocked",
                "is_selectable": false,
                "is_in_selected_block": true,
                "block_start": "14:00",
                "block_end": "16:00",
                "blocking_reservation": {
                    "id": 123,
                    "scheduled_at": "2024-03-20 14:00",
                    "status": "confirmed"
                }
            }
        ]
    }
}

### Error Responses
1. 날짜 미지정 (400 Bad Request)
{
    "status": "error",
    "message": "날짜를 지정해주세요.",
    "code": "DATE_REQUIRED"
}

2. 과거 날짜 (400 Bad Request)
{
    "status": "error",
    "message": "과거 날짜는 조회할 수 없습니다.",
    "code": "PAST_DATE"
}

3. 서버 오류 (500 Internal Server Error)
{
    "status": "error",
    "message": "시간 슬롯 조회 중 오류가 발생했습니다.",
    "error": "오류 상세 내용"
}

## 2. 예약 가능 여부 확인 API

POST /reservations/check-availability

### Request Body
{
    "memorial_room_id": 1,                    // 필수, 추모실 ID
    "scheduled_at": "2024-03-20 14:00",       // 필수, 예약하고자 하는 시간 (YYYY-MM-DD HH:MM)
    "duration_hours": 2                        // 선택, 예약 시간 (기본값: 2시간)
}

### Success Response (200 OK)
1. 예약 가능한 경우
{
    "is_available": true,
    "conflicting_reservation": null
}

2. 예약 불가능한 경우
{
    "is_available": false,
    "conflicting_reservation": {
        "id": 123,
        "scheduled_at": "2024-03-20 14:00",
        "status": "confirmed",
        "is_blocked": true,
        "block_end_time": "2024-03-20 16:00"
    }
}

### Error Responses
1. 필수 파라미터 누락 (400 Bad Request)
{
    "status": "error",
    "message": "필수 파라미터가 누락되었습니다.",
    "code": "MISSING_PARAMETERS"
}

2. 잘못된 날짜/시간 형식 (400 Bad Request)
{
    "status": "error",
    "message": "잘못된 날짜/시간 형식입니다.",
    "code": "INVALID_DATETIME"
}

3. 과거 시간 (400 Bad Request)
{
    "status": "error",
    "message": "과거 시간으로 예약할 수 없습니다.",
    "code": "PAST_DATETIME"
}

4. 잘못된 시간 단위 (400 Bad Request)
{
    "status": "error",
    "message": "예약은 30분 단위로만 가능합니다.",
    "code": "INVALID_TIME_SLOT"
}

## 상태 정의

### 시간 슬롯 상태
- available: 예약 가능
- blocked: 블록 처리됨
- past: 과거 시간
- pending: 예약 대기중
- confirmed: 예약 확정
- in_progress: 진행중

## 예약 규칙
1. 예약은 30분 단위로만 가능
2. 예약 시간은 2시간 고정
3. 예약 완료 시점부터 2시간 동안 블록 처리
4. 운영 시간: 09:00 ~ 22:00
5. 운영 종료 2시간 전부터 새로운 예약 불가
6. 과거 시간대 예약 불가
7. 동일 시간대 중복 예약 불가

## 보안
- 모든 API 요청에 Bearer 토큰 필요
- 토큰 만료시간: 1시간
- Rate Limiting: 분당 60회 요청 제한