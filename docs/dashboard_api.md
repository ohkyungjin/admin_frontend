# 대시보드 API 명세서

## Base URL
```
http://localhost:8000/api/v1
```

## 공통 헤더
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

## 응답 데이터 포맷

### 1. ReservationStats (예약 통계)
```json
{
    "today_total": {
        "type": "integer",
        "description": "오늘 총 예약 수"
    },
    "today_completed": {
        "type": "integer",
        "description": "오늘 완료된 예약 수"
    },
    "today_pending": {
        "type": "integer",
        "description": "오늘 대기 중인 예약 수"
    },
    "today_confirmed": {
        "type": "integer",
        "description": "오늘 확정된 예약 수"
    },
    "today_in_progress": {
        "type": "integer",
        "description": "오늘 진행 중인 예약 수"
    },
    "today_cancelled": {
        "type": "integer",
        "description": "오늘 취소된 예약 수"
    },
    "emergency_count": {
        "type": "integer",
        "description": "긴급 예약 수"
    },
    "weekly_stats": {
        "type": "object",
        "description": "주간 예약 통계",
        "properties": {
            "YYYY-MM-DD": {
                "type": "integer",
                "description": "해당 날짜의 예약 수"
            }
        }
    },
    "monthly_stats": {
        "type": "object",
        "description": "월간 예약 통계",
        "properties": {
            "YYYY-MM-DD": {
                "type": "integer",
                "description": "해당 날짜의 예약 수"
            }
        }
    }
}
```

### 2. MemorialRoomStatus (추모실 현황)
```json
{
    "room_id": {
        "type": "integer",
        "description": "추모실 ID"
    },
    "room_name": {
        "type": "string",
        "description": "추모실 이름"
    },
    "current_status": {
        "type": "string",
        "enum": ["in_use", "available"],
        "description": "현재 사용 상태"
    },
    "next_reservation": {
        "type": "object",
        "description": "다음 예약 정보",
        "nullable": true,
        "properties": "ReservationList 객체 참조"
    },
    "today_reservation_count": {
        "type": "integer",
        "description": "오늘 예약 건수"
    }
}
```

### 3. StaffWorkload (직원 배정 현황)
```json
{
    "staff_id": {
        "type": "integer",
        "description": "직원 ID"
    },
    "staff_name": {
        "type": "string",
        "description": "직원 이름"
    },
    "assigned_count": {
        "type": "integer",
        "description": "배정된 예약 수"
    },
    "today_assignments": {
        "type": "array",
        "description": "오늘의 배정 목록",
        "items": "ReservationList 객체 참조"
    }
}
```

## API 엔드포인트

### 1. 대시보드 전체 데이터 조회
```
GET /dashboard/

[Response 200]
{
    "reservation_stats": {
        "today_total": 10,
        "today_completed": 2,
        "today_pending": 3,
        "today_confirmed": 4,
        "today_in_progress": 1,
        "today_cancelled": 0,
        "emergency_count": 1,
        "weekly_stats": {
            "2024-02-05": 8,
            "2024-02-06": 10,
            "2024-02-07": 12
        },
        "monthly_stats": {
            "2024-02-01": 7,
            "2024-02-02": 9,
            "2024-02-03": 11
        }
    },
    "memorial_room_status": [
        {
            "room_id": 1,
            "room_name": "추모실 1",
            "current_status": "in_use",
            "next_reservation": {
                "id": 123,
                "customer": {...},
                "scheduled_at": "2024-02-07T14:00:00+09:00"
            },
            "today_reservation_count": 3
        }
    ],
    "recent_reservations": [
        {
            "id": 124,
            "customer": {...},
            "scheduled_at": "2024-02-07T15:00:00+09:00",
            "status": "pending"
        }
    ],
    "staff_workload": [
        {
            "staff_id": 1,
            "staff_name": "홍길동",
            "assigned_count": 3,
            "today_assignments": [...]
        }
    ]
}

[Error Responses]
- 401 Unauthorized:
    - 인증 토큰 없음 또는 만료
- 403 Forbidden:
    - 접근 권한 없음
```

### 2. 예약 통계 데이터 조회
```
GET /dashboard/reservation_stats/

[Response 200]
{
    "today_total": 10,
    "today_completed": 2,
    "today_pending": 3,
    "today_confirmed": 4,
    "today_in_progress": 1,
    "today_cancelled": 0,
    "emergency_count": 1,
    "weekly_stats": {
        "2024-02-05": 8,
        "2024-02-06": 10,
        "2024-02-07": 12
    },
    "monthly_stats": {
        "2024-02-01": 7,
        "2024-02-02": 9,
        "2024-02-03": 11
    }
}

[Error Responses]
- 401 Unauthorized:
    - 인증 토큰 없음 또는 만료
- 403 Forbidden:
    - 접근 권한 없음
```

### 3. 추모실 현황 데이터 조회
```
GET /dashboard/memorial_room_status/

[Response 200]
[
    {
        "room_id": 1,
        "room_name": "추모실 1",
        "current_status": "in_use",
        "next_reservation": {
            "id": 123,
            "customer": {...},
            "scheduled_at": "2024-02-07T14:00:00+09:00"
        },
        "today_reservation_count": 3
    }
]

[Error Responses]
- 401 Unauthorized:
    - 인증 토큰 없음 또는 만료
- 403 Forbidden:
    - 접근 권한 없음
```

### 4. 직원 배정 현황 데이터 조회
```
GET /dashboard/staff_workload/

[Response 200]
[
    {
        "staff_id": 1,
        "staff_name": "홍길동",
        "assigned_count": 3,
        "today_assignments": [
            {
                "id": 124,
                "scheduled_at": "2024-02-07T15:00:00+09:00",
                "status": "confirmed"
            }
        ]
    }
]

[Error Responses]
- 401 Unauthorized:
    - 인증 토큰 없음 또는 만료
- 403 Forbidden:
    - 접근 권한 없음
```

## 상태 코드 정의

### 추모실 상태 (current_status)
```
in_use: 사용중
available: 사용가능
```

## 에러 코드 정의

```json
{
    "error_codes": {
        "UNAUTHORIZED": {
            "code": "D001",
            "message": "인증되지 않은 사용자입니다",
            "status": 401
        },
        "FORBIDDEN": {
            "code": "D002",
            "message": "접근 권한이 없습니다",
            "status": 403
        },
        "INTERNAL_SERVER_ERROR": {
            "code": "D003",
            "message": "서버 내부 오류가 발생했습니다",
            "status": 500
        }
    }
}
```

## 캐시 정책

각 엔드포인트의 캐시 정책은 다음과 같습니다:

1. 대시보드 전체 데이터: 1분
2. 예약 통계 데이터: 1분
3. 추모실 현황 데이터: 30초
4. 직원 배정 현황 데이터: 1분

## 시간대 처리

모든 날짜/시간 데이터는 다음 규칙을 따릅니다:

1. 서버 저장: UTC 기준으로 저장
2. API 응답: ISO 8601 형식의 타임스탬프 (기본: KST, +09:00)
3. 통계 데이터:
   - 일간: 00:00:00 ~ 23:59:59 (KST)
   - 주간: 월요일 00:00:00 ~ 일요일 23:59:59 (KST)
   - 월간: 1일 00:00:00 ~ 말일 23:59:59 (KST) 